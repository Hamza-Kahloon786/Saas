# backend/app/api/v1/endpoints/estimates.py
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_database
from app.dependencies.auth import get_current_user

router = APIRouter()


def _json_ok(payload: Any, status_code: int = 200) -> JSONResponse:
    """Encode payload safely (ObjectId, datetime) and return JSONResponse."""
    safe = jsonable_encoder(payload, custom_encoder={ObjectId: str})
    return JSONResponse(content=safe, status_code=status_code)


@router.get("/", response_model=Dict[str, Any])
async def get_estimates(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    skip: int = Query(default=0, ge=0),                 # kept for backward-compat
    limit: int = Query(default=100, le=100, ge=1),      # kept for backward-compat
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=25, ge=1, le=100),
) -> Dict[str, Any]:
    """Get estimates with pagination and filtering."""
    try:
        query: Dict[str, Any] = {"company_id": ObjectId(current_user["company_id"])}

        if status and status != "all":
            query["status"] = status

        if search:
            query["$or"] = [
                {"estimate_number": {"$regex": search, "$options": "i"}},
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"service_type": {"$regex": search, "$options": "i"}},
            ]

        total = await db.estimates.count_documents(query)

        skip_items = (page - 1) * size
        pages = (total + size - 1) // size if total > 0 else 1

        cursor = (
            db.estimates.find(query)
            .sort("created_at", -1)
            .skip(skip_items)
            .limit(size)
        )
        estimates = await cursor.to_list(length=size)

        formatted: List[Dict[str, Any]] = []
        for est in estimates:
            # lookup customer
            customer_name = "Unknown Customer"
            customer_email = ""
            customer_phone = ""

            if est.get("customer_id") or est.get("contact_id"):
                cust_id = est.get("customer_id") or est.get("contact_id")
                if ObjectId.is_valid(str(cust_id)):
                    contact = await db.contacts.find_one({"_id": ObjectId(cust_id)})
                    if contact:
                        customer_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
                        customer_email = contact.get("email", "")
                        customer_phone = contact.get("phone", "")

            formatted.append(
                {
                    "id": str(est["_id"]),
                    "estimate_number": est.get("estimate_number", f"EST-{str(est['_id'])[-6:]}"),
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "customer_phone": customer_phone,
                    "contact_id": str(est.get("customer_id") or est.get("contact_id", "")),
                    "service_type": est.get("service_type", "Service"),
                    "description": est.get("description", ""),
                    "status": est.get("status", "draft"),
                    "subtotal": float(est.get("subtotal", 0)),
                    "tax_amount": float(est.get("tax_amount", 0)),
                    "discount_amount": float(est.get("discount_amount", 0)),
                    "total_amount": float(est.get("total_amount", 0)),
                    "valid_until": (
                        est.get("valid_until", (datetime.utcnow() + timedelta(days=30))).isoformat()
                        if isinstance(est.get("valid_until"), datetime)
                        else est.get("valid_until", (datetime.utcnow() + timedelta(days=30)).isoformat())
                    ),
                    "created_at": (
                        est.get("created_at", datetime.utcnow()).isoformat()
                        if isinstance(est.get("created_at"), datetime)
                        else est.get("created_at", datetime.utcnow()).isoformat()
                    ),
                    "updated_at": (
                        est.get("updated_at", datetime.utcnow()).isoformat()
                        if isinstance(est.get("updated_at"), datetime)
                        else est.get("updated_at", datetime.utcnow()).isoformat()
                    ),
                    "line_items": est.get("line_items", []),
                    "terms_and_conditions": est.get("terms_and_conditions", ""),
                    "notes": est.get("notes", ""),
                }
            )

        return _json_ok(
            {
                "estimates": formatted,
                "total": total,
                "page": page,
                "size": size,
                "pages": pages,
                "has_next": page < pages,
                "has_prev": page > 1,
            }
        )

    except Exception as e:
        print(f"Error in get_estimates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve estimates: {e}")


@router.post("/", response_model=Dict[str, Any])
async def create_estimate(
    estimate_data: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create new estimate."""
    try:
        if not estimate_data.get("contact_id"):
            raise HTTPException(status_code=400, detail="contact_id is required")

        estimate_number = f"EST-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[-4:]}"

        line_items = estimate_data.get("line_items", [])
        subtotal = sum(
            (item.get("quantity", 0) or 0) * (item.get("unit_price", 0) or 0)
            for item in line_items
        )
        discount_amount = estimate_data.get("discount_amount", 0) or 0
        discounted_subtotal = subtotal - discount_amount
        tax_rate = estimate_data.get("tax_rate", 0) or 0
        tax_amount = (discounted_subtotal * tax_rate) / 100
        total_amount = discounted_subtotal + tax_amount

        valid_days = estimate_data.get("valid_days", 30) or 30

        estimate_doc: Dict[str, Any] = {
            "company_id": ObjectId(current_user["company_id"]),
            "customer_id": ObjectId(estimate_data["contact_id"]),
            "contact_id": ObjectId(estimate_data["contact_id"]),
            "estimate_number": estimate_number,
            "service_type": estimate_data.get("service_type", "Service"),
            "title": estimate_data.get("service_type", "Service Estimate"),
            "description": estimate_data.get("description", ""),
            "status": "draft",
            "line_items": line_items,
            "subtotal": float(subtotal),
            "discount_amount": float(discount_amount),
            "tax_rate": float(tax_rate),
            "tax_amount": float(tax_amount),
            "total_amount": float(total_amount),
            "valid_days": int(valid_days),
            "valid_until": datetime.utcnow() + timedelta(days=int(valid_days)),
            "terms_and_conditions": estimate_data.get("terms_and_conditions", ""),
            "notes": estimate_data.get("notes", ""),
            "created_by": ObjectId(current_user["_id"]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await db.estimates.insert_one(estimate_doc)

        # Build clean response dict (stringify IDs & datetimes)
        resp = {
            "id": str(result.inserted_id),
            "company_id": str(estimate_doc["company_id"]),
            "customer_id": str(estimate_doc["customer_id"]),
            "contact_id": str(estimate_doc["contact_id"]),
            "estimate_number": estimate_doc["estimate_number"],
            "service_type": estimate_doc["service_type"],
            "title": estimate_doc["title"],
            "description": estimate_doc["description"],
            "status": estimate_doc["status"],
            "line_items": estimate_doc["line_items"],
            "subtotal": estimate_doc["subtotal"],
            "discount_amount": estimate_doc["discount_amount"],
            "tax_rate": estimate_doc["tax_rate"],
            "tax_amount": estimate_doc["tax_amount"],
            "total_amount": estimate_doc["total_amount"],
            "valid_days": estimate_doc["valid_days"],
            "valid_until": estimate_doc["valid_until"],
            "terms_and_conditions": estimate_doc["terms_and_conditions"],
            "notes": estimate_doc["notes"],
            "created_by": str(estimate_doc["created_by"]),
            "created_at": estimate_doc["created_at"],
            "updated_at": estimate_doc["updated_at"],
        }

        return _json_ok(resp, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create estimate: {e}")


@router.get("/{estimate_id}", response_model=Dict[str, Any])
async def get_estimate(
    estimate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get estimate by ID."""
    try:
        if not ObjectId.is_valid(estimate_id):
            raise HTTPException(status_code=400, detail="Invalid estimate ID")

        est = await db.estimates.find_one(
            {"_id": ObjectId(estimate_id), "company_id": ObjectId(current_user["company_id"])}
        )
        if not est:
            raise HTTPException(status_code=404, detail="Estimate not found")

        customer_name = "Unknown Customer"
        customer_email = ""

        if est.get("customer_id") or est.get("contact_id"):
            cust_id = est.get("customer_id") or est.get("contact_id")
            contact = await db.contacts.find_one({"_id": cust_id})
            if contact:
                customer_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
                customer_email = contact.get("email", "")

        resp = {
            "id": str(est["_id"]),
            "company_id": str(est["company_id"]),
            "customer_id": str(est.get("customer_id", "")),
            "contact_id": str(est.get("contact_id", "")),
            "customer_name": customer_name,
            "customer_email": customer_email,
            "estimate_number": est.get("estimate_number"),
            "service_type": est.get("service_type", ""),
            "title": est.get("title", ""),
            "description": est.get("description", ""),
            "status": est.get("status", "draft"),
            "line_items": est.get("line_items", []),
            "subtotal": float(est.get("subtotal", 0)),
            "tax_amount": float(est.get("tax_amount", 0)),
            "discount_amount": float(est.get("discount_amount", 0)),
            "total_amount": float(est.get("total_amount", 0)),
            "terms_and_conditions": est.get("terms_and_conditions", ""),
            "notes": est.get("notes", ""),
            "created_at": est.get("created_at", datetime.utcnow()),
            "updated_at": est.get("updated_at", datetime.utcnow()),
            "valid_until": est.get("valid_until", datetime.utcnow()),
        }
        return _json_ok(resp)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get estimate: {e}")


@router.put("/{estimate_id}", response_model=Dict[str, Any])
async def update_estimate(
    estimate_id: str,
    estimate_data: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update estimate."""
    try:
        if not ObjectId.is_valid(estimate_id):
            raise HTTPException(status_code=400, detail="Invalid estimate ID")

        existing = await db.estimates.find_one(
            {"_id": ObjectId(estimate_id), "company_id": ObjectId(current_user["company_id"])}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Estimate not found")

        line_items = estimate_data.get("line_items", existing.get("line_items", []))
        subtotal = sum(
            (i.get("quantity", 0) or 0) * (i.get("unit_price", 0) or 0) for i in line_items
        )
        discount_amount = estimate_data.get("discount_amount", existing.get("discount_amount", 0)) or 0
        discounted_subtotal = subtotal - discount_amount
        tax_rate = estimate_data.get("tax_rate", existing.get("tax_rate", 0)) or 0
        tax_amount = (discounted_subtotal * tax_rate) / 100
        total_amount = discounted_subtotal + tax_amount

        update_doc = {
            "service_type": estimate_data.get("service_type", existing.get("service_type")),
            "description": estimate_data.get("description", existing.get("description")),
            "line_items": line_items,
            "subtotal": float(subtotal),
            "discount_amount": float(discount_amount),
            "tax_rate": float(tax_rate),
            "tax_amount": float(tax_amount),
            "total_amount": float(total_amount),
            "terms_and_conditions": estimate_data.get(
                "terms_and_conditions", existing.get("terms_and_conditions")
            ),
            "notes": estimate_data.get("notes", existing.get("notes")),
            "updated_at": datetime.utcnow(),
        }

        result = await db.estimates.update_one(
            {"_id": ObjectId(estimate_id), "company_id": ObjectId(current_user["company_id"])},
            {"$set": update_doc},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Estimate not found")

        # Return the fresh doc
        return await get_estimate(estimate_id, db, current_user)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update estimate: {e}")


@router.delete("/{estimate_id}")
async def delete_estimate(
    estimate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, str]:
    """Delete estimate."""
    try:
        if not ObjectId.is_valid(estimate_id):
            raise HTTPException(status_code=400, detail="Invalid estimate ID")

        result = await db.estimates.delete_one(
            {"_id": ObjectId(estimate_id), "company_id": ObjectId(current_user["company_id"])}
        )
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Estimate not found")

        return _json_ok({"message": "Estimate deleted successfully"})

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete estimate: {e}")

from app.utils.emailer import send_email

@router.post("/{estimate_id}/send")
async def send_estimate(
    estimate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, str]:
    if not ObjectId.is_valid(estimate_id):
        raise HTTPException(status_code=400, detail="Invalid estimate ID")

    estimate = await db.estimates.find_one({
        "_id": ObjectId(estimate_id),
        "company_id": ObjectId(current_user["company_id"])
    })
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    cid = estimate.get("customer_id") or estimate.get("contact_id")
    if not cid:
        raise HTTPException(status_code=400, detail="Estimate missing contact_id")

    contact = await db.contacts.find_one({"_id": ObjectId(cid)})
    if not contact or not contact.get("email"):
        raise HTTPException(status_code=400, detail="Customer has no email on file")

    customer_name = f"{contact.get('first_name','').strip()} {contact.get('last_name','').strip()}".strip() or "there"
    estimate_number = estimate.get("estimate_number", f"EST-{str(estimate['_id'])[-6:]}")
    total = float(estimate.get("total_amount", 0.0))

    subject = f"Your Estimate {estimate_number}"
    html = f"""
    <div style="font-family:Arial,sans-serif">
      <p>Hi {customer_name},</p>
      <p>Here is your estimate <b>{estimate_number}</b>.</p>
      <p><b>Total:</b> ${total:,.2f}</p>
      <p>{estimate.get('description','')}</p>
      <p>Thank you!</p>
    </div>
    """

    try:
        send_email(contact["email"], subject, html)
    except Exception as e:
        # surface real SMTP issues to you during dev
        raise HTTPException(status_code=500, detail=f"Email send failed: {e}")

    await db.estimates.update_one(
        {"_id": ObjectId(estimate_id)},
        {"$set": {"status": "sent", "sent_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )
    return {"message": "Estimate sent successfully"}



@router.post("/{estimate_id}/duplicate")
async def duplicate_estimate(
    estimate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Duplicate an existing estimate."""
    try:
        if not ObjectId.is_valid(estimate_id):
            raise HTTPException(status_code=400, detail="Invalid estimate ID")

        original = await db.estimates.find_one(
            {"_id": ObjectId(estimate_id), "company_id": ObjectId(current_user["company_id"])}
        )
        if not original:
            raise HTTPException(status_code=404, detail="Estimate not found")

        dup = original.copy()
        dup.pop("_id", None)
        dup["estimate_number"] = f"EST-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[-4:]}"
        dup["status"] = "draft"
        dup["created_at"] = datetime.utcnow()
        dup["updated_at"] = datetime.utcnow()
        dup["sent_at"] = None
        dup["viewed_at"] = None
        dup["accepted_at"] = None

        result = await db.estimates.insert_one(dup)
        return _json_ok({"message": "Estimate duplicated successfully", "id": str(result.inserted_id)})

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in duplicate_estimate: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to duplicate estimate: {e}")




























# # =============================================================================
# # app/api/v1/endpoints/estimates.py
# # =============================================================================
# from typing import Any, List, Optional
# from fastapi import APIRouter, Depends, HTTPException, Query
# from motor.motor_asyncio import AsyncIOMotorDatabase
# from bson import ObjectId
# from datetime import datetime

# from app.core.database import get_database
# from app.schemas.estimate import Estimate, EstimateCreate, EstimateUpdate
# from app.services.estimate_service import EstimateService
# from app.dependencies.auth import get_current_user

# router = APIRouter()

# @router.get("/", response_model=List[Estimate])
# async def read_estimates(
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     current_user: dict = Depends(get_current_user),
#     skip: int = 0,
#     limit: int = Query(default=100, le=100),
#     status: Optional[str] = None,
#     customer_id: Optional[str] = None
# ) -> Any:
#     """Retrieve estimates"""
#     estimate_service = EstimateService(db)
#     estimates = await estimate_service.get_estimates(
#         company_id=str(current_user["company_id"]),
#         skip=skip,
#         limit=limit,
#         status=status,
#         customer_id=customer_id
#     )
#     return estimates

# @router.post("/", response_model=Estimate)
# async def create_estimate(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_in: EstimateCreate,
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """Create new estimate"""
#     estimate_service = EstimateService(db)
#     estimate = await estimate_service.create_estimate(
#         estimate_in=estimate_in,
#         company_id=str(current_user["company_id"]),
#         created_by=str(current_user["_id"])
#     )
#     return estimate

# @router.get("/{estimate_id}", response_model=Estimate)
# async def read_estimate(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_id: str,
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """Get estimate by ID"""
#     if not ObjectId.is_valid(estimate_id):
#         raise HTTPException(status_code=400, detail="Invalid estimate ID")
    
#     estimate_service = EstimateService(db)
#     estimate = await estimate_service.get_estimate(
#         estimate_id=estimate_id,
#         company_id=str(current_user["company_id"])
#     )
#     if not estimate:
#         raise HTTPException(status_code=404, detail="Estimate not found")
#     return estimate

# @router.put("/{estimate_id}", response_model=Estimate)
# async def update_estimate(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_id: str,
#     estimate_in: EstimateUpdate,
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """Update estimate"""
#     if not ObjectId.is_valid(estimate_id):
#         raise HTTPException(status_code=400, detail="Invalid estimate ID")
    
#     estimate_service = EstimateService(db)
#     estimate = await estimate_service.update_estimate(
#         estimate_id=estimate_id,
#         estimate_in=estimate_in,
#         company_id=str(current_user["company_id"])
#     )
#     if not estimate:
#         raise HTTPException(status_code=404, detail="Estimate not found")
#     return estimate

# @router.delete("/{estimate_id}")
# async def delete_estimate(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_id: str,
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """Delete estimate"""
#     if not ObjectId.is_valid(estimate_id):
#         raise HTTPException(status_code=400, detail="Invalid estimate ID")
    
#     result = await db.estimates.delete_one({
#         "_id": ObjectId(estimate_id),
#         "company_id": ObjectId(current_user["company_id"])
#     })
    
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Estimate not found")
    
#     return {"message": "Estimate deleted successfully"}

# @router.post("/{estimate_id}/send")
# async def send_estimate(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_id: str,
#     current_user: dict = Depends(get_current_user),
#     email_template: Optional[str] = None
# ) -> Any:
#     """Send estimate to customer"""
#     if not ObjectId.is_valid(estimate_id):
#         raise HTTPException(status_code=400, detail="Invalid estimate ID")
    
#     estimate_service = EstimateService(db)
#     success = await estimate_service.send_estimate(
#         estimate_id=estimate_id,
#         company_id=str(current_user["company_id"]),
#         email_template=email_template
#     )
    
#     if not success:
#         raise HTTPException(status_code=404, detail="Estimate not found or failed to send")
    
#     return {"message": "Estimate sent successfully"}

# @router.post("/{estimate_id}/accept")
# async def accept_estimate(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_id: str,
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """Accept estimate (convert to job)"""
#     if not ObjectId.is_valid(estimate_id):
#         raise HTTPException(status_code=400, detail="Invalid estimate ID")
    
#     estimate_service = EstimateService(db)
#     job = await estimate_service.accept_estimate(
#         estimate_id=estimate_id,
#         company_id=str(current_user["company_id"])
#     )
    
#     if not job:
#         raise HTTPException(status_code=404, detail="Estimate not found")
    
#     return {"message": "Estimate accepted and job created", "job_id": job["id"]}

# @router.get("/{estimate_id}/pdf")
# async def generate_estimate_pdf(
#     *,
#     db: AsyncIOMotorDatabase = Depends(get_database),
#     estimate_id: str,
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """Generate PDF for estimate"""
#     if not ObjectId.is_valid(estimate_id):
#         raise HTTPException(status_code=400, detail="Invalid estimate ID")
    
#     estimate_service = EstimateService(db)
#     pdf_url = await estimate_service.generate_pdf(
#         estimate_id=estimate_id,
#         company_id=str(current_user["company_id"])
#     )
    
#     if not pdf_url:
#         raise HTTPException(status_code=404, detail="Estimate not found")
    
#     return {"pdf_url": pdf_url}





















