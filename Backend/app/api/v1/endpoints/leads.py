# app/api/v1/endpoints/leads.py - ROBUST FIXED VERSION
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.dependencies.auth import get_current_user

router = APIRouter()

# Helper functions
def oid(i: Any) -> ObjectId:
    """Convert string to ObjectId safely"""
    if i is None:
        return None
    if isinstance(i, ObjectId):
        return i
    try:
        return ObjectId(str(i))
    except Exception:
        return None

def serialize_document(doc: Dict) -> Dict:
    """Convert MongoDB document ObjectIds to strings for JSON serialization"""
    if not doc:
        return doc
    
    # Create a copy to avoid modifying the original
    serialized = dict(doc)
    
    # Convert _id to id and string
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    
    # Convert other ObjectId fields to strings
    objectid_fields = [
        "company_id", "contact_id", "assigned_to", "created_by", 
        "updated_by", "converted_by", "owner_id", "service_request_id"
    ]
    
    for field in objectid_fields:
        if field in serialized and serialized[field]:
            if isinstance(serialized[field], ObjectId):
                serialized[field] = str(serialized[field])
            else:
                serialized[field] = str(serialized[field])
    
    # Handle nested ObjectIds in arrays
    if "notes" in serialized and isinstance(serialized["notes"], list):
        for note in serialized["notes"]:
            if isinstance(note, dict) and "created_by" in note:
                if isinstance(note["created_by"], ObjectId):
                    note["created_by"] = str(note["created_by"])
    
    if "interactions" in serialized and isinstance(serialized["interactions"], list):
        for interaction in serialized["interactions"]:
            if isinstance(interaction, dict):
                if "created_by" in interaction and isinstance(interaction["created_by"], ObjectId):
                    interaction["created_by"] = str(interaction["created_by"])
                if "attended_by" in interaction and isinstance(interaction["attended_by"], list):
                    interaction["attended_by"] = [
                        str(oid_val) if isinstance(oid_val, ObjectId) else str(oid_val) 
                        for oid_val in interaction["attended_by"]
                    ]
    
    # Convert datetime objects to ISO strings
    for field in ["created_at", "updated_at", "last_contacted", "next_follow_up"]:
        if field in serialized and serialized[field]:
            if hasattr(serialized[field], "isoformat"):
                serialized[field] = serialized[field].isoformat()
    
    return serialized

# Frontend data schema
class FrontendLeadCreate(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: Optional[str] = None
    phone: str = Field(..., min_length=10)
    secondary_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    source: str = "website"
    status: str = "new"
    priority: int = Field(default=3, ge=1, le=5)
    estimated_value: Optional[float] = None
    service_interest: Optional[str] = None
    urgency: str = "medium"
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    preferred_contact_method: str = "any"
    best_time_to_contact: Optional[str] = None
    referral_source: Optional[str] = None
    how_did_you_hear: Optional[str] = None

@router.get("/")
async def read_leads(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    source: Optional[str] = None,
    sort_by: Optional[str] = Query(default="created_at"),
    sort_order: Optional[str] = Query(default="desc")
) -> List[Dict[str, Any]]:
    """Retrieve leads with pagination"""
    try:
        print(f"Getting leads for user: {current_user}")
        
        # Validate and get company ID
        company_id = oid(current_user.get("company_id"))
        if not company_id:
            raise HTTPException(status_code=400, detail="Invalid company ID")
        
        # Build query
        query = {"company_id": company_id}
        
        # Add filters only if they have values
        if status and status.strip():
            query["status"] = status.strip()
        if assigned_to and assigned_to.strip():
            assigned_oid = oid(assigned_to)
            if assigned_oid:
                query["assigned_to"] = assigned_oid
        if source and source.strip():
            query["source"] = source.strip()
        
        print(f"Query: {query}")
        
        # Get total count first
        try:
            total = await db.leads.count_documents(query)
            print(f"Total leads found: {total}")
        except Exception as e:
            print(f"Error counting documents: {e}")
            return []
        
        if total == 0:
            return []
        
        # Build sort
        sort_direction = -1 if sort_order == "desc" else 1
        
        # Get leads with error handling
        try:
            leads = await db.leads.find(query)\
                .sort(sort_by, sort_direction)\
                .skip(skip)\
                .limit(limit)\
                .to_list(length=limit)
            print(f"Retrieved {len(leads)} leads from database")
        except Exception as e:
            print(f"Error fetching leads: {e}")
            return []
        
        # Process each lead safely
        serialized_leads = []
        for lead in leads:
            try:
                # Start with basic serialization
                serialized_lead = serialize_document(lead)
                
                # Add contact information if available
                if lead.get("contact_id"):
                    try:
                        contact_id = lead["contact_id"]
                        # Handle both ObjectId and string contact IDs
                        if isinstance(contact_id, str):
                            contact_obj_id = oid(contact_id)
                        else:
                            contact_obj_id = contact_id
                        
                        if contact_obj_id:
                            contact = await db.contacts.find_one({"_id": contact_obj_id})
                            if contact:
                                serialized_lead["contact_name"] = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
                                serialized_lead["contact_email"] = contact.get("email")
                                serialized_lead["contact_phone"] = contact.get("phone")
                                serialized_lead["first_name"] = contact.get("first_name", "")
                                serialized_lead["last_name"] = contact.get("last_name", "")
                                serialized_lead["email"] = contact.get("email")
                                serialized_lead["phone"] = contact.get("phone")
                                
                                # Add address info if available
                                if contact.get("addresses") and len(contact["addresses"]) > 0:
                                    primary_addr = contact["addresses"][0]
                                    serialized_lead["address"] = primary_addr.get("street", "")
                                    serialized_lead["city"] = primary_addr.get("city", "")
                                    serialized_lead["state"] = primary_addr.get("state", "")
                            else:
                                # Contact not found, set defaults
                                serialized_lead["contact_name"] = "Unknown Contact"
                                serialized_lead["first_name"] = "Unknown"
                                serialized_lead["last_name"] = "Contact"
                    except Exception as contact_error:
                        print(f"Error fetching contact for lead {lead.get('_id')}: {contact_error}")
                        serialized_lead["contact_name"] = "Unknown Contact"
                        serialized_lead["first_name"] = "Unknown"
                        serialized_lead["last_name"] = "Contact"
                
                # Add computed fields with safe defaults
                serialized_lead["is_active"] = serialized_lead.get("status", "new") not in ["won", "lost"]
                
                # Calculate days in pipeline safely
                created_at = lead.get("created_at")
                if created_at and hasattr(created_at, "date"):
                    serialized_lead["days_in_pipeline"] = (datetime.utcnow() - created_at).days
                else:
                    serialized_lead["days_in_pipeline"] = 0
                
                # Add AI score safely
                scoring = lead.get("scoring", {})
                if isinstance(scoring, dict):
                    serialized_lead["total_score"] = scoring.get("ai_score", 0) or 0
                else:
                    serialized_lead["total_score"] = 0
                
                # Ensure required fields exist with defaults
                serialized_lead.setdefault("status", "new")
                serialized_lead.setdefault("priority", 3)
                serialized_lead.setdefault("source", "unknown")
                serialized_lead.setdefault("estimated_value", None)
                
                serialized_leads.append(serialized_lead)
                
            except Exception as lead_error:
                print(f"Error processing lead {lead.get('_id')}: {lead_error}")
                # Still try to include a minimal version of the lead
                try:
                    minimal_lead = {
                        "id": str(lead.get("_id", "")),
                        "contact_name": "Error Loading Contact",
                        "first_name": "Error",
                        "last_name": "Loading",
                        "status": lead.get("status", "new"),
                        "priority": lead.get("priority", 3),
                        "source": lead.get("source", "unknown"),
                        "created_at": lead.get("created_at", datetime.utcnow()).isoformat() if hasattr(lead.get("created_at"), "isoformat") else datetime.utcnow().isoformat(),
                        "is_active": True,
                        "days_in_pipeline": 0,
                        "total_score": 0
                    }
                    serialized_leads.append(minimal_lead)
                except Exception:
                    # If even minimal processing fails, skip this lead
                    continue
        
        print(f"Successfully processed {len(serialized_leads)} leads")
        return serialized_leads
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Critical error in read_leads: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve leads: {str(e)}")

# Handle both with and without trailing slash
@router.get("")
async def read_leads_no_slash(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    source: Optional[str] = None,
    sort_by: Optional[str] = Query(default="created_at"),
    sort_order: Optional[str] = Query(default="desc")
) -> List[Dict[str, Any]]:
    """Retrieve leads with pagination - no trailing slash version"""
    return await read_leads(db, current_user, skip, limit, status, assigned_to, source, sort_by, sort_order)

@router.post("/")
async def create_lead(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    lead_data: FrontendLeadCreate,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """Create new lead from frontend form data"""
    try:
        print(f"Creating lead with data: {lead_data.model_dump()}")
        
        company_id = oid(current_user.get("company_id"))
        user_id = oid(current_user.get("_id"))
        
        if not company_id or not user_id:
            raise HTTPException(status_code=400, detail="Invalid user session data")
        
        # Create contact first
        contact_doc = {
            "company_id": company_id,
            "first_name": lead_data.first_name,
            "last_name": lead_data.last_name,
            "email": lead_data.email if lead_data.email else None,
            "phone": lead_data.phone,
            "phone_mobile": lead_data.secondary_phone if lead_data.secondary_phone else None,
            "type": "lead",
            "status": "active",
            "preferred_contact_method": lead_data.preferred_contact_method,
            "addresses": [{
                "type": "service",
                "street": lead_data.address or "",
                "city": lead_data.city or "",
                "state": lead_data.state or "",
                "zip_code": lead_data.zip_code or "",
                "is_primary": True
            }] if lead_data.address else [],
            "tags": [],
            "custom_fields": {
                "best_time_to_contact": lead_data.best_time_to_contact,
                "how_did_you_hear": lead_data.how_did_you_hear,
                "referral_source": lead_data.referral_source
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        contact_result = await db.contacts.insert_one(contact_doc)
        contact_id = contact_result.inserted_id
        print(f"Contact created with ID: {contact_id}")
        
        # Create lead document
        lead_number = f"LEAD-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[-4:]}"
        
        lead_doc = {
            "company_id": company_id,
            "contact_id": contact_id,
            "lead_number": lead_number,
            "status": lead_data.status,
            "priority": lead_data.priority,
            "source": lead_data.source,
            "estimated_value": lead_data.estimated_value,
            "service_type": "other",
            "service_details": lead_data.service_interest,
            "urgency_level": lead_data.urgency,
            "tags": lead_data.tags or [],
            "notes": [
                {
                    "id": str(ObjectId()),
                    "content": lead_data.notes,
                    "note_type": "general",
                    "is_important": False,
                    "is_private": False,
                    "created_by": user_id,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ] if lead_data.notes else [],
            "scoring": {
                "ai_score": None,
                "ai_confidence": None,
                "total_score": None,
                "quality_grade": None,
                "last_calculated": None
            },
            "interactions": [],
            "custom_fields": {
                "urgency": lead_data.urgency,
                "service_interest": lead_data.service_interest,
                "best_time_to_contact": lead_data.best_time_to_contact,
                "preferred_contact_method": lead_data.preferred_contact_method
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": user_id
        }
        
        lead_result = await db.leads.insert_one(lead_doc)
        lead_id = lead_result.inserted_id
        print(f"Lead created with ID: {lead_id}")
        
        # Format response for frontend
        response_data = {
            "id": str(lead_id),
            "contact_id": str(contact_id),
            "lead_number": lead_number,
            "first_name": lead_data.first_name,
            "last_name": lead_data.last_name,
            "email": lead_data.email,
            "phone": lead_data.phone,
            "address": lead_data.address,
            "city": lead_data.city,
            "state": lead_data.state,
            "source": lead_data.source,
            "status": lead_data.status,
            "priority": lead_data.priority,
            "estimated_value": lead_data.estimated_value,
            "notes": lead_data.notes,
            "tags": lead_data.tags or [],
            "created_at": datetime.utcnow().isoformat(),
            "ai_score": None
        }
        
        # Schedule AI scoring in background
        background_tasks.add_task(score_lead_background, db, str(lead_id), response_data)
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating lead: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create lead: {str(e)}")

@router.post("")
async def create_lead_no_slash(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    lead_data: FrontendLeadCreate,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """Create new lead - no trailing slash version"""
    return await create_lead(db=db, lead_data=lead_data, current_user=current_user, background_tasks=background_tasks)

async def score_lead_background(db: AsyncIOMotorDatabase, lead_id: str, lead_data: dict):
    """Background task to score lead with AI"""
    try:
        print(f"Scoring lead {lead_id} in background")
        
        # Mock AI scoring
        import random
        score = round(random.uniform(5.0, 9.5), 1)
        
        # Update lead with AI score
        await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {
                "$set": {
                    "scoring.ai_score": score,
                    "scoring.ai_last_scored": datetime.utcnow(),
                    "scoring.quality_grade": "A" if score >= 8 else "B" if score >= 6 else "C",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"Updated lead {lead_id} with AI score: {score}")
        
    except Exception as e:
        print(f"Error scoring lead {lead_id}: {e}")

@router.get("/{lead_id}")
async def read_lead(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    lead_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get lead by ID"""
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    try:
        company_id = oid(current_user.get("company_id"))
        if not company_id:
            raise HTTPException(status_code=400, detail="Invalid company ID")
        
        lead = await db.leads.find_one({
            "_id": ObjectId(lead_id),
            "company_id": company_id
        })
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return serialize_document(lead)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting lead {lead_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve lead: {str(e)}")

@router.patch("/{lead_id}")
async def patch_lead(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    lead_id: str,
    update_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update lead with PATCH method (partial updates)"""
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    try:
        company_id = oid(current_user.get("company_id"))
        if not company_id:
            raise HTTPException(status_code=400, detail="Invalid company ID")
        
        print(f"Updating lead {lead_id} with data: {update_data}")
        
        # Prepare update document
        update_doc = {"updated_at": datetime.utcnow()}
        
        # Handle common update fields
        allowed_fields = [
            "status", "priority", "source", "estimated_value", 
            "service_details", "notes", "tags", "urgency_level"
        ]
        
        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                update_doc[field] = value
        
        # Special handling for ObjectId fields
        if "assigned_to" in update_data and update_data["assigned_to"]:
            assigned_oid = oid(update_data["assigned_to"])
            if assigned_oid:
                update_doc["assigned_to"] = assigned_oid
        
        # Update the lead
        result = await db.leads.update_one(
            {"_id": ObjectId(lead_id), "company_id": company_id},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Get updated lead
        updated_lead = await db.leads.find_one({
            "_id": ObjectId(lead_id),
            "company_id": company_id
        })
        
        if not updated_lead:
            raise HTTPException(status_code=404, detail="Lead not found after update")
        
        # Get contact information
        if updated_lead.get("contact_id"):
            try:
                contact = await db.contacts.find_one({"_id": updated_lead["contact_id"]})
                if contact:
                    updated_lead["first_name"] = contact.get("first_name", "")
                    updated_lead["last_name"] = contact.get("last_name", "")
                    updated_lead["email"] = contact.get("email")
                    updated_lead["phone"] = contact.get("phone")
                    updated_lead["contact_name"] = f"{contact.get('first_name', '')} {contact.get('last_name', '')}"
            except Exception:
                pass
        
        return serialize_document(updated_lead)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating lead {lead_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update lead: {str(e)}")

@router.delete("/{lead_id}")
async def delete_lead(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    lead_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete lead"""
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    try:
        company_id = oid(current_user.get("company_id"))
        if not company_id:
            raise HTTPException(status_code=400, detail="Invalid company ID")
        
        result = await db.leads.delete_one({
            "_id": ObjectId(lead_id),
            "company_id": company_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {"message": "Lead deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting lead {lead_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete lead: {str(e)}")

# Debug endpoint
@router.get("/debug/test")
async def debug_leads(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Debug endpoint to check leads data"""
    try:
        company_id = oid(current_user.get("company_id"))
        
        if not company_id:
            return {"error": "No company_id found", "user": current_user}
        
        total = await db.leads.count_documents({"company_id": company_id})
        all_total = await db.leads.count_documents({})
        
        sample_leads = await db.leads.find({}).limit(3).to_list(length=3)
        
        return {
            "current_user_company_id": str(company_id),
            "total_for_company": total,
            "total_all_companies": all_total,
            "collections_available": await db.list_collection_names(),
            "sample_leads": [
                {
                    "id": str(lead["_id"]),
                    "company_id": str(lead.get("company_id", "None")),
                    "status": lead.get("status", "No status"),
                    "created_at": str(lead.get("created_at", "No date"))
                } for lead in sample_leads
            ]
        }
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}























# # app/api/v1/endpoints/leads.py - FIXED ObjectId serialization
# from typing import Any, List, Optional, Dict
# from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Body
# from motor.motor_asyncio import AsyncIOMotorDatabase
# from bson import ObjectId
# from datetime import datetime
# from pydantic import BaseModel, Field

# from app.core.database import get_database
# from app.schemas.lead import Lead, LeadCreate, LeadUpdate, LeadSearch
# from app.services.crm_service import CRMService
# from app.dependencies.auth import get_current_user

# router = APIRouter()

# # ✅ Helper function to convert ObjectIds to strings
# def serialize_document(doc: Dict) -> Dict:
#     """Convert MongoDB document ObjectIds to strings for JSON serialization"""
#     if not doc:
#         return doc
    
#     # Convert _id to id and string
#     if "_id" in doc:
#         doc["id"] = str(doc["_id"])
#         del doc["_id"]
    
#     # Convert other ObjectId fields to strings
#     objectid_fields = [
#         "company_id", "contact_id", "assigned_to", "created_by", 
#         "updated_by", "converted_by", "owner_id"
#     ]
    
#     for field in objectid_fields:
#         if field in doc and isinstance(doc[field], ObjectId):
#             doc[field] = str(doc[field])
    
#     # Handle nested ObjectIds in arrays
#     if "notes" in doc and isinstance(doc["notes"], list):
#         for note in doc["notes"]:
#             if isinstance(note, dict) and "created_by" in note and isinstance(note["created_by"], ObjectId):
#                 note["created_by"] = str(note["created_by"])
    
#     if "interactions" in doc and isinstance(doc["interactions"], list):
#         for interaction in doc["interactions"]:
#             if isinstance(interaction, dict):
#                 if "created_by" in interaction and isinstance(interaction["created_by"], ObjectId):
#                     interaction["created_by"] = str(interaction["created_by"])
#                 if "attended_by" in interaction and isinstance(interaction["attended_by"], list):
#                     interaction["attended_by"] = [str(oid) if isinstance(oid, ObjectId) else oid for oid in interaction["attended_by"]]
    
#     return doc

# # Frontend data schema that matches your LeadForm.tsx
# class FrontendLeadCreate(BaseModel):
#     first_name: str = Field(..., min_length=1)
#     last_name: str = Field(..., min_length=1)
#     email: Optional[str] = None
#     phone: str = Field(..., min_length=10)
#     secondary_phone: Optional[str] = None
#     address: Optional[str] = None
#     city: Optional[str] = None
#     state: Optional[str] = None
#     zip_code: Optional[str] = None
#     source: str = "website"
#     status: str = "new"
#     priority: int = Field(default=3, ge=1, le=5)
#     estimated_value: Optional[float] = None
#     service_interest: Optional[str] = None
#     urgency: str = "medium"
#     notes: Optional[str] = None
#     tags: Optional[List[str]] = []
#     preferred_contact_method: str = "any"
#     best_time_to_contact: Optional[str] = None
#     referral_source: Optional[str] = None
#     how_did_you_hear: Optional[str] = None

# @router.get("/")
# async def read_leads(
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     current_user: dict = Depends(get_current_user),
#     skip: int = 0,
#     limit: int = Query(default=100, le=100),
#     status: Optional[str] = None,
#     assigned_to: Optional[str] = None,
#     source: Optional[str] = None,
#     sort_by: Optional[str] = Query(default="created_at"),
#     sort_order: Optional[str] = Query(default="desc")
# ) -> List[Dict[str, Any]]:  # ✅ Explicit return type
#     """Retrieve leads with pagination"""
#     try:
#         from app.core.logger import get_logger
#         logger = get_logger("endpoints.leads.read")
        
#         logger.info(f"🔍 Getting leads for company: {current_user.get('company_id')}")
        
#         # Build query
#         query = {"company_id": ObjectId(current_user["company_id"])}
        
#         # Add filters
#         if status:
#             query["status"] = status
#         if assigned_to:
#             query["assigned_to"] = ObjectId(assigned_to)
#         if source:
#             query["source"] = source
        
#         logger.info(f"🔍 Query: {query}")
        
#         # Get total count
#         total = await db.leads.count_documents(query)
#         logger.info(f"🔍 Total leads found: {total}")
        
#         # Build sort
#         sort_direction = -1 if sort_order == "desc" else 1
        
#         # Get leads
#         cursor = db.leads.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
#         leads = await cursor.to_list(length=limit)
        
#         logger.info(f"🔍 Retrieved {len(leads)} leads")
        
#         # ✅ Convert ObjectIds to strings for each lead
#         serialized_leads = []
#         for lead in leads:
#             try:
#                 # Get contact information
#                 if lead.get("contact_id"):
#                     contact = await db.contacts.find_one({"_id": lead["contact_id"]})
#                     if contact:
#                         lead["contact_name"] = f"{contact.get('first_name', '')} {contact.get('last_name', '')}"
#                         lead["contact_email"] = contact.get("email")
#                         lead["contact_phone"] = contact.get("phone")
#                         lead["first_name"] = contact.get("first_name", "")
#                         lead["last_name"] = contact.get("last_name", "")
#                         lead["email"] = contact.get("email")
#                         lead["phone"] = contact.get("phone")
#                         # Add address info
#                         if contact.get("addresses") and len(contact["addresses"]) > 0:
#                             primary_addr = contact["addresses"][0]
#                             lead["address"] = primary_addr.get("street", "")
#                             lead["city"] = primary_addr.get("city", "")
#                             lead["state"] = primary_addr.get("state", "")
                
#                 # Add computed fields
#                 lead["is_active"] = lead.get("status", "new") not in ["won", "lost"]
#                 lead["days_in_pipeline"] = (datetime.utcnow() - lead.get("created_at", datetime.utcnow())).days
#                 lead["total_score"] = lead.get("scoring", {}).get("ai_score", 0) or 0
                
#                 # ✅ Serialize the document (convert ObjectIds to strings)
#                 serialized_lead = serialize_document(lead)
#                 serialized_leads.append(serialized_lead)
                
#             except Exception as e:
#                 logger.error(f"❌ Error processing lead {lead.get('_id')}: {e}")
#                 continue
        
#         logger.info(f"✅ Successfully serialized {len(serialized_leads)} leads")
#         return serialized_leads
        
#     except Exception as e:
#         from app.core.logger import get_logger
#         logger = get_logger("endpoints.leads.read")
#         logger.error(f"❌ Error getting leads: {e}")
#         import traceback
#         logger.error(f"❌ Traceback: {traceback.format_exc()}")
#         raise HTTPException(status_code=500, detail=f"Failed to retrieve leads: {str(e)}")

# # ✅ Handle both with and without trailing slash
# @router.get("")
# async def read_leads_no_slash(
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     current_user: dict = Depends(get_current_user),
#     skip: int = 0,
#     limit: int = Query(default=100, le=100),
#     status: Optional[str] = None,
#     assigned_to: Optional[str] = None,
#     source: Optional[str] = None,
#     sort_by: Optional[str] = Query(default="created_at"),
#     sort_order: Optional[str] = Query(default="desc")
# ) -> List[Dict[str, Any]]:
#     """Retrieve leads with pagination - no trailing slash version"""
#     return await read_leads(db, current_user, skip, limit, status, assigned_to, source, sort_by, sort_order)

# @router.post("/")
# async def create_lead(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     lead_data: FrontendLeadCreate,
#     current_user: dict = Depends(get_current_user),
#     background_tasks: BackgroundTasks,
# ) -> Dict[str, Any]:  # ✅ Explicit return type
#     """Create new lead from frontend form data"""
#     from app.core.logger import get_logger
#     logger = get_logger("endpoints.leads.create")
    
#     try:
#         logger.info(f"🔧 Creating lead with frontend data: {lead_data.model_dump()}")
        
#         # ✅ STEP 1: Create contact first
#         contact_doc = {
#             "company_id": ObjectId(current_user["company_id"]),
#             "first_name": lead_data.first_name,
#             "last_name": lead_data.last_name,
#             "email": lead_data.email if lead_data.email else None,
#             "phone": lead_data.phone,
#             "phone_mobile": lead_data.secondary_phone if lead_data.secondary_phone else None,
#             "type": "lead",
#             "status": "active",
#             "preferred_contact_method": lead_data.preferred_contact_method,
#             "addresses": [{
#                 "type": "service",
#                 "street": lead_data.address or "",
#                 "city": lead_data.city or "",
#                 "state": lead_data.state or "",
#                 "zip_code": lead_data.zip_code or "",
#                 "is_primary": True
#             }] if lead_data.address else [],
#             "tags": [],
#             "custom_fields": {
#                 "best_time_to_contact": lead_data.best_time_to_contact,
#                 "how_did_you_hear": lead_data.how_did_you_hear,
#                 "referral_source": lead_data.referral_source
#             },
#             "created_at": datetime.utcnow(),
#             "updated_at": datetime.utcnow()
#         }
        
#         contact_result = await db.contacts.insert_one(contact_doc)
#         contact_id = contact_result.inserted_id
#         logger.info(f"✅ Contact created with ID: {contact_id}")
        
#         # ✅ STEP 2: Create lead document
#         lead_number = f"LEAD-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[-4:]}"
        
#         lead_doc = {
#             "company_id": ObjectId(current_user["company_id"]),
#             "contact_id": contact_id,
#             "lead_number": lead_number,
#             "status": lead_data.status,
#             "priority": lead_data.priority,
#             "source": lead_data.source,
#             "estimated_value": lead_data.estimated_value,
#             "service_type": "other",
#             "service_details": lead_data.service_interest,
#             "urgency_level": lead_data.urgency,
#             "tags": lead_data.tags or [],
#             "notes": [
#                 {
#                     "id": str(ObjectId()),
#                     "content": lead_data.notes,
#                     "note_type": "general",
#                     "is_important": False,
#                     "is_private": False,
#                     "created_by": ObjectId(current_user["_id"]),
#                     "created_at": datetime.utcnow(),
#                     "updated_at": datetime.utcnow()
#                 }
#             ] if lead_data.notes else [],
#             "scoring": {
#                 "ai_score": None,
#                 "ai_confidence": None,
#                 "total_score": None,
#                 "quality_grade": None,
#                 "last_calculated": None
#             },
#             "interactions": [],
#             "custom_fields": {
#                 "urgency": lead_data.urgency,
#                 "service_interest": lead_data.service_interest,
#                 "best_time_to_contact": lead_data.best_time_to_contact,
#                 "preferred_contact_method": lead_data.preferred_contact_method
#             },
#             "created_at": datetime.utcnow(),
#             "updated_at": datetime.utcnow(),
#             "created_by": ObjectId(current_user["_id"])
#         }
        
#         lead_result = await db.leads.insert_one(lead_doc)
#         lead_id = lead_result.inserted_id
#         logger.info(f"✅ Lead created with ID: {lead_id}")
        
#         # ✅ STEP 3: Format response for frontend (convert ObjectIds to strings)
#         response_data = {
#             "id": str(lead_id),
#             "contact_id": str(contact_id),
#             "lead_number": lead_number,
#             "first_name": lead_data.first_name,
#             "last_name": lead_data.last_name,
#             "email": lead_data.email,
#             "phone": lead_data.phone,
#             "address": lead_data.address,
#             "city": lead_data.city,
#             "state": lead_data.state,
#             "source": lead_data.source,
#             "status": lead_data.status,
#             "priority": lead_data.priority,
#             "estimated_value": lead_data.estimated_value,
#             "notes": lead_data.notes,
#             "tags": lead_data.tags or [],
#             "created_at": datetime.utcnow().isoformat(),
#             "ai_score": None
#         }
        
#         # ✅ STEP 4: Schedule AI scoring in background
#         background_tasks.add_task(
#             score_lead_background,
#             db,
#             str(lead_id),
#             response_data
#         )
        
#         logger.info(f"✅ Lead creation completed successfully")
#         return response_data
        
#     except Exception as e:
#         logger.error(f"❌ Error creating lead: {e}")
#         import traceback
#         logger.error(f"❌ Full traceback: {traceback.format_exc()}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to create lead: {str(e)}"
#         )

# @router.post("")
# async def create_lead_no_slash(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     lead_data: FrontendLeadCreate,
#     current_user: dict = Depends(get_current_user),
#     background_tasks: BackgroundTasks,
# ) -> Dict[str, Any]:
#     """Create new lead - no trailing slash version"""
#     return await create_lead(db=db, lead_data=lead_data, current_user=current_user, background_tasks=background_tasks)

# async def score_lead_background(db: AsyncIOMotorDatabase, lead_id: str, lead_data: dict):
#     """Background task to score lead with AI"""
#     try:
#         from app.core.logger import get_logger
#         logger = get_logger("endpoints.leads.scoring")
        
#         logger.info(f"🤖 Scoring lead {lead_id} in background")
        
#         # Mock AI scoring for now
#         import random
#         score = round(random.uniform(5.0, 9.5), 1)
        
#         # Update lead with AI score
#         await db.leads.update_one(
#             {"_id": ObjectId(lead_id)},
#             {
#                 "$set": {
#                     "scoring.ai_score": score,
#                     "scoring.ai_last_scored": datetime.utcnow(),
#                     "scoring.quality_grade": "A" if score >= 8 else "B" if score >= 6 else "C",
#                     "updated_at": datetime.utcnow()
#                 }
#             }
#         )
        
#         logger.info(f"✅ Updated lead {lead_id} with AI score: {score}")
        
#     except Exception as e:
#         from app.core.logger import get_logger
#         logger = get_logger("endpoints.leads.scoring")
#         logger.error(f"❌ Error scoring lead {lead_id}: {e}")


# # ✅ Add PATCH method for status updates (what your frontend is using)
# @router.patch("/{lead_id}")
# async def patch_lead(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     lead_id: str,
#     update_data: Dict[str, Any] = Body(...),
#     current_user: dict = Depends(get_current_user),
# ) -> Dict[str, Any]:
#     """Update lead with PATCH method (partial updates)"""
#     from app.core.logger import get_logger
#     logger = get_logger("endpoints.leads.patch")
    
#     try:
#         if not ObjectId.is_valid(lead_id):
#             raise HTTPException(status_code=400, detail="Invalid lead ID")
        
#         logger.info(f"🔧 Updating lead {lead_id} with data: {update_data}")
        
#         # Prepare update document
#         update_doc = {"updated_at": datetime.utcnow()}
        
#         # Handle common update fields
#         allowed_fields = [
#             "status", "priority", "source", "estimated_value", 
#             "service_details", "notes", "tags", "urgency_level"
#         ]
        
#         for field, value in update_data.items():
#             if field in allowed_fields and value is not None:
#                 update_doc[field] = value
        
#         # Special handling for ObjectId fields
#         if "assigned_to" in update_data and update_data["assigned_to"]:
#             if ObjectId.is_valid(update_data["assigned_to"]):
#                 update_doc["assigned_to"] = ObjectId(update_data["assigned_to"])
        
#         logger.info(f"🔧 Update document: {update_doc}")
        
#         # Update the lead
#         result = await db.leads.update_one(
#             {
#                 "_id": ObjectId(lead_id),
#                 "company_id": ObjectId(current_user["company_id"])
#             },
#             {"$set": update_doc}
#         )
        
#         if result.matched_count == 0:
#             raise HTTPException(status_code=404, detail="Lead not found")
        
#         if result.modified_count == 0:
#             logger.warning(f"⚠️ No changes made to lead {lead_id}")
        
#         # Get updated lead
#         updated_lead = await db.leads.find_one({
#             "_id": ObjectId(lead_id),
#             "company_id": ObjectId(current_user["company_id"])
#         })
        
#         if not updated_lead:
#             raise HTTPException(status_code=404, detail="Lead not found after update")
        
#         # Get contact information to populate response
#         if updated_lead.get("contact_id"):
#             contact = await db.contacts.find_one({"_id": updated_lead["contact_id"]})
#             if contact:
#                 updated_lead["first_name"] = contact.get("first_name", "")
#                 updated_lead["last_name"] = contact.get("last_name", "")
#                 updated_lead["email"] = contact.get("email")
#                 updated_lead["phone"] = contact.get("phone")
#                 updated_lead["contact_name"] = f"{contact.get('first_name', '')} {contact.get('last_name', '')}"
        
#         logger.info(f"✅ Successfully updated lead {lead_id}")
        
#         # ✅ Serialize and return
#         return serialize_document(updated_lead)
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Error updating lead {lead_id}: {e}")
#         import traceback
#         logger.error(f"❌ Traceback: {traceback.format_exc()}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to update lead: {str(e)}"
#         )

# # ✅ Keep PUT method for full updates (for compatibility)
# @router.put("/{lead_id}")
# async def update_lead(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     lead_id: str,
#     lead_in: LeadUpdate,
#     current_user: dict = Depends(get_current_user),
# ) -> Dict[str, Any]:
#     """Update lead with PUT method (full updates)"""
#     # Convert LeadUpdate to dict and use patch_lead
#     update_data = lead_in.model_dump(exclude_unset=True)
#     return await patch_lead(
#         db=db, 
#         lead_id=lead_id, 
#         update_data=update_data, 
#         current_user=current_user
#     )

# @router.delete("/{lead_id}")
# async def delete_lead(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     lead_id: str,
#     current_user: dict = Depends(get_current_user),
# ) -> Dict[str, Any]:
#     """Delete lead"""
#     if not ObjectId.is_valid(lead_id):
#         raise HTTPException(status_code=400, detail="Invalid lead ID")
    
#     result = await db.leads.delete_one({
#         "_id": ObjectId(lead_id),
#         "company_id": ObjectId(current_user["company_id"])
#     })
    
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Lead not found")
    
#     return {"message": "Lead deleted successfully"}

# # ✅ Pipeline endpoint for drag-and-drop view - SIMPLIFIED VERSION
# @router.get("/pipeline")
# async def get_pipeline(
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     current_user: dict = Depends(get_current_user),
#     period: str = Query(default="this_month", description="Time period filter")
# ) -> Dict[str, Any]:
#     """Get leads organized by pipeline stages for drag-and-drop view"""
#     from app.core.logger import get_logger
#     logger = get_logger("endpoints.leads.pipeline")
    
#     try:
#         logger.info(f"🔍 Pipeline request - Period: {period}, User: {current_user.get('email', 'unknown')}")
        
#         # ✅ Better user validation with multiple field name support
#         company_id = None
#         user_id = None
        
#         # Try different field names for company_id
#         for field in ['company_id', '_company_id', 'companyId']:
#             if field in current_user and current_user[field]:
#                 company_id = current_user[field]
#                 break
        
#         # Try different field names for user_id  
#         for field in ['_id', 'id', 'user_id']:
#             if field in current_user and current_user[field]:
#                 user_id = current_user[field]
#                 break
        
#         logger.info(f"🔍 Extracted company_id: {company_id} (type: {type(company_id)})")
#         logger.info(f"🔍 Extracted user_id: {user_id} (type: {type(user_id)})")
        
#         if not company_id:
#             logger.error(f"❌ No company_id found in user object: {current_user}")
#             raise HTTPException(status_code=400, detail="Missing company ID in user session")
        
#         if not user_id:
#             logger.error(f"❌ No user_id found in user object: {current_user}")
#             raise HTTPException(status_code=400, detail="Missing user ID in user session")
        
#         # ✅ Convert to ObjectId safely
#         try:
#             if isinstance(company_id, str):
#                 company_obj_id = ObjectId(company_id)
#             else:
#                 company_obj_id = company_id
#         except Exception as e:
#             logger.error(f"❌ Invalid company_id: {company_id}")
#             raise HTTPException(status_code=400, detail="Invalid company ID format")
        
#         # ✅ Get ALL leads first (without date filter to test)
#         try:
#             all_leads = await db.leads.find({"company_id": company_obj_id}).to_list(length=None)
#             logger.info(f"🔍 Total leads in database: {len(all_leads)}")
#         except Exception as e:
#             logger.error(f"❌ Database query failed: {e}")
#             raise HTTPException(status_code=500, detail="Database query failed")
        
#         # ✅ Define stages
#         pipeline_stages = [
#             {"id": "new", "name": "New Leads", "color": "bg-blue-500"},
#             {"id": "contacted", "name": "Contacted", "color": "bg-yellow-500"},
#             {"id": "qualified", "name": "Qualified", "color": "bg-purple-500"},
#             {"id": "proposal", "name": "Proposal Sent", "color": "bg-orange-500"},
#             {"id": "won", "name": "Won", "color": "bg-green-500"},
#             {"id": "lost", "name": "Lost", "color": "bg-red-500"}
#         ]
        
#         # ✅ Process stages
#         stages_data = []
        
#         for stage in pipeline_stages:
#             stage_leads = []
#             stage_value = 0.0
            
#             # Get leads for this stage
#             stage_leads_raw = [lead for lead in all_leads if lead.get("status", "new") == stage["id"]]
#             logger.info(f"🔍 Stage '{stage['id']}': {len(stage_leads_raw)} leads")
            
#             for lead in stage_leads_raw:
#                 try:
#                     # ✅ Safe lead processing
#                     lead_id = str(lead.get("_id", "unknown"))
                    
#                     # Default contact info
#                     first_name = "Unknown"
#                     last_name = "Lead"
#                     email = None
#                     phone = None
                    
#                     # Try to get contact info
#                     contact_id = lead.get("contact_id")
#                     if contact_id:
#                         try:
#                             contact = await db.contacts.find_one({"_id": contact_id})
#                             if contact:
#                                 first_name = contact.get("first_name", "Unknown")
#                                 last_name = contact.get("last_name", "Lead")
#                                 email = contact.get("email")
#                                 phone = contact.get("phone")
#                         except Exception as contact_err:
#                             logger.warning(f"⚠️ Contact lookup failed for {contact_id}: {contact_err}")
                    
#                     # ✅ Safe date handling
#                     created_at = lead.get("created_at")
#                     if hasattr(created_at, 'isoformat'):
#                         created_at_str = created_at.isoformat()
#                     else:
#                         created_at_str = datetime.utcnow().isoformat()
                    
#                     # ✅ Safe value handling
#                     estimated_value = lead.get("estimated_value")
#                     if estimated_value and isinstance(estimated_value, (int, float)) and estimated_value > 0:
#                         stage_value += float(estimated_value)
#                     else:
#                         estimated_value = None
                    
#                     # ✅ Safe AI score
#                     ai_score = None
#                     scoring = lead.get("scoring")
#                     if scoring and isinstance(scoring, dict):
#                         ai_score = scoring.get("ai_score")
#                         if ai_score and not isinstance(ai_score, (int, float)):
#                             ai_score = None
                    
#                     # Create pipeline lead object
#                     pipeline_lead = {
#                         "id": lead_id,
#                         "first_name": first_name,
#                         "last_name": last_name,
#                         "email": email,
#                         "phone": phone,
#                         "estimated_value": estimated_value,
#                         "ai_score": ai_score,
#                         "created_at": created_at_str,
#                         "last_contact": None,
#                         "priority": lead.get("priority", 3)
#                     }
                    
#                     stage_leads.append(pipeline_lead)
                    
#                 except Exception as lead_err:
#                     logger.error(f"❌ Error processing lead {lead.get('_id')}: {lead_err}")
#                     continue
            
#             # Add stage data
#             stages_data.append({
#                 "id": stage["id"],
#                 "name": stage["name"],
#                 "color": stage["color"],
#                 "leads": stage_leads,
#                 "total_value": stage_value,
#                 "count": len(stage_leads)
#             })
        
#         # ✅ Calculate totals
#         total_value = sum(float(stage["total_value"]) for stage in stages_data)
#         total_leads = sum(int(stage["count"]) for stage in stages_data)
        
#         response = {
#             "stages": stages_data,
#             "summary": {
#                 "total_value": total_value,
#                 "total_leads": total_leads,
#                 "average_deal_size": total_value / total_leads if total_leads > 0 else 0.0,
#                 "period": period
#             }
#         }
        
#         logger.info(f"✅ Pipeline response ready: {total_leads} leads, ${total_value:,.2f} total value")
#         return response
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Pipeline error: {e}")
#         import traceback
#         logger.error(f"❌ Full traceback: {traceback.format_exc()}")
#         # ✅ Return empty pipeline instead of error
#         return {
#             "stages": [
#                 {"id": "new", "name": "New Leads", "color": "bg-blue-500", "leads": [], "total_value": 0, "count": 0},
#                 {"id": "contacted", "name": "Contacted", "color": "bg-yellow-500", "leads": [], "total_value": 0, "count": 0},
#                 {"id": "qualified", "name": "Qualified", "color": "bg-purple-500", "leads": [], "total_value": 0, "count": 0},
#                 {"id": "proposal", "name": "Proposal Sent", "color": "bg-orange-500", "leads": [], "total_value": 0, "count": 0},
#                 {"id": "won", "name": "Won", "color": "bg-green-500", "leads": [], "total_value": 0, "count": 0},
#                 {"id": "lost", "name": "Lost", "color": "bg-red-500", "leads": [], "total_value": 0, "count": 0}
#             ],
#             "summary": {"total_value": 0, "total_leads": 0, "average_deal_size": 0, "period": period}
#         }

# # ✅ Add trailing slash version for pipeline
# @router.get("/pipeline/")
# async def get_pipeline_with_slash(
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     current_user: dict = Depends(get_current_user),
#     period: str = Query(default="this_month", description="Time period filter")
# ) -> Dict[str, Any]:
#     """Get leads organized by pipeline stages - with trailing slash"""
#     return await get_pipeline(db, current_user, period)

# # Other endpoints...
# @router.get("/{lead_id}")
# async def read_lead(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     lead_id: str,
#     current_user: dict = Depends(get_current_user),
# ) -> Dict[str, Any]:
#     """Get lead by ID"""
#     if not ObjectId.is_valid(lead_id):
#         raise HTTPException(status_code=400, detail="Invalid lead ID")
    
#     lead = await db.leads.find_one({
#         "_id": ObjectId(lead_id),
#         "company_id": ObjectId(current_user["company_id"])
#     })
    
#     if not lead:
#         raise HTTPException(status_code=404, detail="Lead not found")
    
#     # ✅ Serialize ObjectIds
#     return serialize_document(lead)


# # ✅ Simple test endpoint to check if pipeline routing works
# @router.get("/pipeline/test")
# async def test_pipeline():
#     """Test pipeline endpoint"""
#     return {
#         "status": "success",
#         "message": "Pipeline endpoint is working",
#         "endpoint": "/api/v1/leads/pipeline"
#     }