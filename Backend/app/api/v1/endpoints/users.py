# backend/app/api/v1/endpoints/users.py - FIXED ROUTE ORDER

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel, EmailStr

from app.core.database import get_database
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_user, require_role
from app.models.user import UserRole

# Define schemas directly here to avoid import issues
class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str = None
    role: str = "technician"

class UserUpdateRequest(BaseModel):
    first_name: str = None
    last_name: str = None
    email: EmailStr = None
    phone: str = None
    role: str = None

router = APIRouter()

# ✅ ROUTE ORDER: SPECIFIC ROUTES FIRST, GENERIC ROUTES LAST

# Test endpoints (no auth required)
@router.get("/test")
async def test_endpoint():
    return {"message": "Users router is working"}



# List endpoint (previously called read_users)
@router.get("/list")
async def read_users_list(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    role: Optional[str] = Query(None, description="Filter users by role")
) -> Any:
    """Retrieve users with optional role filter"""
    try:
        # Build query
        query = {"company_id": ObjectId(current_user["company_id"])}
        
        # Add role filter if provided
        if role:
            query["role"] = role
        
        users_collection = db.users
        users = await users_collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        
        # Convert ObjectIds to strings and remove sensitive data
        result = []
        for user in users:
            user_data = {
                "id": str(user["_id"]),
                "company_id": str(user["company_id"]),
                "email": user.get("email"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "phone": user.get("phone"),
                "role": user.get("role"),
                "status": user.get("status", "active"),
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at")
            }
            result.append(user_data)
        
        return result
        
    except Exception as e:
        from app.core.logger import get_logger
        logger = get_logger("endpoints.users.read")
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

# Replace the main GET endpoint in your users.py file:

# QUICK FIX for your existing users.py
@router.get("/")
async def read_users(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),  # <-- PUT THIS BACK!
    skip: int = 0,
    limit: int = Query(default=100, le=100),
    role: Optional[str] = Query(None, description="Filter users by role")
) -> Any:
    """Retrieve users with optional role filter - FIXED for Jobs.tsx"""
    try:
        from app.core.logger import get_logger
        logger = get_logger("endpoints.users.read")
        
        # Build query
        query = {"company_id": ObjectId(current_user["company_id"])}
        
        # Add role filter if provided (this is what Jobs.tsx needs)
        if role:
            query["role"] = role
            logger.info(f"👥 Filtering users by role: {role}")
        
        users_collection = db.users
        users = await users_collection.find(query).skip(skip).limit(limit).to_list(length=limit)
        
        # Format for Jobs.tsx dropdown (it expects 'name' field)
        result = []
        for user in users:
            user_data = {
                "id": str(user["_id"]),
                "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('email', 'Unknown'),
                "email": user.get("email"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "phone": user.get("phone"),
                "role": user.get("role"),
                "status": user.get("status", "active"),
                "company_id": str(user["company_id"]) if user.get("company_id") else None,
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at")
            }
            result.append(user_data)
        
        logger.info(f"👥 Returning {len(result)} users")
        return result
        
    except Exception as e:
        from app.core.logger import get_logger
        logger = get_logger("endpoints.users.read")
        logger.error(f"❌ Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.post("/")
async def create_user(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_in: UserCreateRequest,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Create new user"""
    auth_service = AuthService(db)
    
    # Convert to the format auth_service expects
    from app.schemas.user import UserCreate
    user_data = UserCreate(
        email=user_in.email,
        password=user_in.password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        role=user_in.role
    )
    
    user = await auth_service.create_user(user_data, str(current_user["company_id"]))
    
    # Format response
    if user:
        user["id"] = str(user["_id"])
        user["company_id"] = str(user["company_id"])
        user.pop("hashed_password", None)
    
    return user
@router.get("/locations")
async def get_technician_locations(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Get technician locations for GPS tracking"""
    try:
        from datetime import datetime
        
        # Get all technicians
        technicians = await db.users.find({
            "company_id": ObjectId(current_user["company_id"]),
            "role": "technician",
            "status": "active"
        }).to_list(length=None)
        
        # Realistic location data for your area (Lahore, Pakistan)
        # These coordinates are around Lahore
        lahore_locations = [
            {"lat": 31.5497, "lng": 74.3436, "address": "Liberty Market, Lahore"},
            {"lat": 31.5204, "lng": 74.3587, "address": "Mall Road, Lahore"}, 
            {"lat": 31.4504, "lng": 74.2669, "address": "DHA Phase 5, Lahore"},
            {"lat": 31.6340, "lng": 74.8723, "address": "Sheikhupura Road, Lahore"}
        ]
        
        locations = []
        for i, tech in enumerate(technicians):
            # Use different Lahore locations for different technicians
            location_data = lahore_locations[i % len(lahore_locations)]
            
            locations.append({
                "id": str(tech["_id"]),
                "name": f"{tech.get('first_name', '')} {tech.get('last_name', '')}".strip(),
                "phone": tech.get("phone", ""),
                "employee_id": str(tech["_id"])[-6:],
                "current_location": {
                    "lat": location_data["lat"],
                    "lng": location_data["lng"], 
                    "address": location_data["address"],
                    "accuracy": 5,  # Good GPS accuracy
                    "last_updated": datetime.utcnow().isoformat(),
                    "speed": 45,  # Driving speed
                    "heading": 180
                },
                "status": "driving",
                "todays_route": [],
                "performance": {
                    "jobs_completed": 3,
                    "miles_driven": 45,
                    "hours_worked": 6,
                    "on_time_percentage": 85,
                    "avg_speed": 35
                }
            })
        
        return locations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get technician locations: {str(e)}")
    










@router.post("/create-test-technicians")
async def create_test_technicians(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Create test technician users - REMOVE IN PRODUCTION"""
    try:
        from datetime import datetime
        import bcrypt
        
        def hash_password(password: str) -> str:
            salt = bcrypt.gensalt()
            return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        test_technicians = [
            {
                "email": "john.tech@company.com",
                "first_name": "John",
                "last_name": "Smith",
                "phone": "555-0101",
                "role": "technician",
                "status": "active",
                "company_id": ObjectId(current_user["company_id"]),
                "hashed_password": hash_password("password123"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "email": "mike.tech@company.com", 
                "first_name": "Mike",
                "last_name": "Johnson",
                "phone": "555-0102",
                "role": "technician", 
                "status": "active",
                "company_id": ObjectId(current_user["company_id"]),
                "hashed_password": hash_password("password123"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "email": "sarah.tech@company.com",
                "first_name": "Sarah", 
                "last_name": "Davis",
                "phone": "555-0103",
                "role": "technician",
                "status": "active", 
                "company_id": ObjectId(current_user["company_id"]),
                "hashed_password": hash_password("password123"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        result = await db.users.insert_many(test_technicians)
        
        return {
            "message": f"Created {len(result.inserted_ids)} test technicians",
            "technician_ids": [str(id) for id in result.inserted_ids]
        }
        
    except Exception as e:
        return {"error": str(e)}





















# ✅ PATH PARAMETER ROUTES - MUST COME LAST
@router.get("/{user_id}")
async def read_user(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_id: str,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Get user by ID"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user can access this data
    if (str(user["company_id"]) != str(current_user["company_id"]) and 
        current_user["role"] not in ["admin", "manager"]):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Format response
    user["id"] = str(user["_id"])
    user["company_id"] = str(user["company_id"])
    user.pop("hashed_password", None)
    
    return user








@router.patch("/update-role/{user_id}")
async def update_user_role(
    user_id: str,
    new_role: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Update user role - admin only"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id), "company_id": ObjectId(current_user["company_id"])},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {new_role}"}























@router.put("/{user_id}")
async def update_user(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_id: str,
    user_in: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Update user"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Check permissions
    if (user_id != str(current_user["_id"]) and 
        current_user["role"] not in ["admin", "manager"]):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    auth_service = AuthService(db)
    
    # Convert to the format auth_service expects
    from app.schemas.user import UserUpdate
    user_data = UserUpdate(**user_in.model_dump(exclude_unset=True))
    
    user = await auth_service.update_user(user_id, user_data)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Format response
    user["id"] = str(user["_id"])
    user["company_id"] = str(user["company_id"])
    user.pop("hashed_password", None)
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_id: str,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Delete user"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if user_id == str(current_user["_id"]):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({
        "_id": ObjectId(user_id),
        "company_id": ObjectId(current_user["company_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


