# # backend/app/api/v1/endpoints/auth.py - Customer Registration Only

# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordRequestForm
# from motor.motor_asyncio import AsyncIOMotorDatabase
# from datetime import datetime, timedelta
# from typing import Any, Dict
# import bcrypt
# from pydantic import BaseModel, EmailStr

# from app.core.database import get_database
# from app.core.config import settings
# from app.core import security
# from app.core.logger import get_logger
# from app.dependencies.auth import get_current_user

# router = APIRouter()
# logger = get_logger(__name__)

# # Simplified RegisterRequest schema - customer only
# class RegisterRequest(BaseModel):
#     email: EmailStr
#     password: str
#     first_name: str
#     last_name: str
#     # role and company_name removed - always customer

# def hash_password(password: str) -> str:
#     """Hash password using bcrypt"""
#     salt = bcrypt.gensalt()
#     return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# def verify_password(password: str, hashed: str) -> bool:
#     """Verify password against hash"""
#     return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# def get_password_from_user(user_doc: dict) -> str:
#     """Extract password hash from user document"""
#     return user_doc.get("hashed_password") or user_doc.get("password_hash") or ""

# @router.post("/register")
# async def register(
#     user_data: RegisterRequest,
#     db: AsyncIOMotorDatabase = Depends(get_database)
# ) -> Any:
#     """Register new customer user - simplified"""
    
#     logger.info(f"🔥 Registering new customer: {user_data.email}")
    
#     try:
#         # Check if user exists
#         existing_user = await db.users.find_one({"email": user_data.email.lower()})
#         if existing_user:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="User with this email already exists"
#             )
        
#         # Always create customer company
#         company_doc = {
#             "name": f"{user_data.first_name} {user_data.last_name} - Customer",
#             "industry": "customer",
#             "status": "active",
#             "created_at": datetime.utcnow(),
#             "updated_at": datetime.utcnow()
#         }
        
#         company_result = await db.companies.insert_one(company_doc)
#         company_id = company_result.inserted_id
        
#         logger.info(f"✅ Created customer company: {company_id}")

#         # Create customer user - ALWAYS customer role
#         user_doc = {
#             "email": user_data.email.lower(),
#             "first_name": user_data.first_name,
#             "last_name": user_data.last_name,
#             "hashed_password": hash_password(user_data.password),
#             "role": "customer",  # 🔥 ALWAYS CUSTOMER
#             "status": "active",
#             "company_id": company_id,
#             "permissions": ["read", "customer_portal"],
#             "is_superuser": False,
#             "is_email_verified": False,
#             "is_phone_verified": False,
#             "login_count": 0,
#             "failed_login_attempts": 0,
#             "profile": {},
#             "preferences": {
#                 "theme": "light",
#                 "language": "en",
#                 "timezone": "UTC",
#                 "notifications": {
#                     "email": True,
#                     "sms": True,
#                     "push": True
#                 }
#             },
#             "created_at": datetime.utcnow(),
#             "updated_at": datetime.utcnow(),
#             "last_login": None
#         }
        
#         user_result = await db.users.insert_one(user_doc)
#         user_id = user_result.inserted_id
        
#         logger.info(f"✅ Created customer user: {user_id}")
        
#         # Generate tokens
#         access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
#         # User response - ALWAYS customer
#         user_response = {
#             "id": str(user_id),
#             "company_id": str(company_id),
#             "email": user_data.email,
#             "first_name": user_data.first_name,
#             "last_name": user_data.last_name,
#             "role": "customer",  # 🔥 ALWAYS CUSTOMER
#             "status": "active",
#             "permissions": ["read", "customer_portal"],
#             "is_email_verified": False,
#             "is_phone_verified": False,
#             "created_at": user_doc["created_at"].isoformat(),
#             "updated_at": user_doc["updated_at"].isoformat(),
#             "full_name": f"{user_data.first_name} {user_data.last_name}",
#             "display_name": user_data.first_name,
#             "is_active": True,
#             "is_admin": False  # 🔥 ALWAYS FALSE FOR CUSTOMERS
#         }
        
#         response = {
#             "user": user_response,
#             "access_token": security.create_access_token(str(user_id), expires_delta=access_token_expires),
#             "refresh_token": security.create_refresh_token(str(user_id), expires_delta=access_token_expires),
#             "token_type": "bearer",
#             "expires_in": int(access_token_expires.total_seconds())
#         }
        
#         logger.info(f"🎉 Customer registration successful for {user_data.email}")
#         return response
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Registration failed: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

# @router.post("/login")
# async def login(
#     form_data: OAuth2PasswordRequestForm = Depends(),
#     db: AsyncIOMotorDatabase = Depends(get_database)
# ) -> Any:
#     """Login user - supports ALL roles (admin, customer, technician, etc.)"""
    
#     logger.info(f"🔐 Login attempt for: {form_data.username}")
    
#     try:
#         # Find user (case-insensitive email search)
#         user = await db.users.find_one({"email": form_data.username.lower()})
        
#         if not user:
#             logger.warning(f"❌ User not found: {form_data.username}")
#             raise HTTPException(status_code=401, detail="Invalid email or password")
        
#         logger.info(f"✅ User found: {user['email']}, role: {user.get('role', 'unknown')}")
        
#         # Check user status
#         if user.get("status") != "active":
#             logger.warning(f"❌ User account not active: {user['email']}")
#             raise HTTPException(status_code=401, detail="Account is not active")
        
#         # Get password hash
#         password_hash = get_password_from_user(user)
        
#         if not password_hash:
#             logger.error(f"❌ No password found for user: {user['email']}")
#             raise HTTPException(status_code=401, detail="Invalid email or password")
        
#         # Verify password
#         if not verify_password(form_data.password, password_hash):
#             logger.warning(f"❌ Invalid password for user: {user['email']}")
#             raise HTTPException(status_code=401, detail="Invalid email or password")
        
#         # Update login information
#         await db.users.update_one(
#             {"_id": user["_id"]},
#             {
#                 "$set": {"last_login": datetime.utcnow()},
#                 "$inc": {"login_count": 1}
#             }
#         )
        
#         # Generate tokens
#         access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
#         # User response - RETURN ACTUAL ROLE FROM DATABASE
#         user_response = {
#             "id": str(user["_id"]),
#             "company_id": str(user.get("company_id", "")),
#             "email": user["email"],
#             "first_name": user.get("first_name", ""),
#             "last_name": user.get("last_name", ""),
#             "role": user.get("role", "customer"),  # 🔥 USE ACTUAL ROLE FROM DB
#             "status": user.get("status", "active"),
#             "permissions": user.get("permissions", []),
#             "is_email_verified": user.get("is_email_verified", False),
#             "is_phone_verified": user.get("is_phone_verified", False),
#             "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
#             "updated_at": user.get("updated_at", datetime.utcnow()).isoformat(),
#             "full_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
#             "display_name": user.get("first_name", user["email"]),
#             "is_active": user.get("status") == "active",
#             "is_admin": user.get("role") == "admin"
#         }
        
#         response = {
#             "user": user_response,
#             "access_token": security.create_access_token(str(user["_id"]), expires_delta=access_token_expires),
#             "refresh_token": security.create_refresh_token(str(user["_id"]), expires_delta=access_token_expires),
#             "token_type": "bearer",
#             "expires_in": int(access_token_expires.total_seconds())
#         }
        
#         logger.info(f"🎉 Login successful for {user['email']} (role: {user.get('role')})")
#         return response
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Login failed: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# @router.get("/me")
# async def get_current_user_info(
#     current_user: dict = Depends(get_current_user)
# ) -> Any:
#     """Get current user info"""
#     return {
#         "id": str(current_user["_id"]),
#         "company_id": str(current_user.get("company_id", "")),
#         "email": current_user["email"],
#         "first_name": current_user.get("first_name", ""),
#         "last_name": current_user.get("last_name", ""),
#         "role": current_user.get("role", "user"),
#         "status": current_user.get("status", "active"),
#         "permissions": current_user.get("permissions", []),
#         "full_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip(),
#         "display_name": current_user.get("first_name", current_user["email"]),
#         "is_active": current_user.get("status") == "active",
#         "is_admin": current_user.get("role") == "admin"
#     }

# @router.post("/logout")
# async def logout() -> Any:
#     """Logout user"""
#     return {"message": "Successfully logged out"}










































# backend/app/api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Any
import bcrypt
from pydantic import BaseModel, EmailStr

from app.core.database import get_database
from app.core.config import settings
from app.core import security
from app.core.logger import get_logger
from app.dependencies.auth import get_current_user
from app.utils.user_serializer import serialize_user  # ✅ central serializer

router = APIRouter()
logger = get_logger(__name__)

# -------------------------------
# Schemas
# -------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

# -------------------------------
# Password utils
# -------------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def get_password_from_user(user_doc: dict) -> str:
    return user_doc.get("hashed_password") or user_doc.get("password_hash") or ""

# -------------------------------
# Register (customer only)
# -------------------------------
@router.post("/register")
async def register(
    user_data: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    logger.info(f"🔥 Registering new customer: {user_data.email}")

    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Always create a company
    company_doc = {
        "name": f"{user_data.first_name} {user_data.last_name} - Customer",
        "industry": "customer",
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    company_result = await db.companies.insert_one(company_doc)
    company_id = company_result.inserted_id

    # Create user
    user_doc = {
        "email": user_data.email.lower(),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "hashed_password": hash_password(user_data.password),
        "role": "customer",
        "status": "active",
        "company_id": company_id,
        "permissions": ["read", "customer_portal"],
        "is_superuser": False,
        "is_email_verified": False,
        "is_phone_verified": False,
        "login_count": 0,
        "failed_login_attempts": 0,
        "profile": {},
        "preferences": {
            "theme": "light",
            "language": "en",
            "timezone": "UTC",
            "notifications": {"email": True, "sms": True, "push": True},
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None,
    }
    user_result = await db.users.insert_one(user_doc)
    user_id = user_result.inserted_id

    # Serialize
    user_response = serialize_user({**user_doc, "_id": user_id, "company_id": company_id})

    # Tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    response = {
        "user": user_response,
        "access_token": security.create_access_token(str(user_id), expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(str(user_id), expires_delta=access_token_expires),
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds()),
    }

    logger.info(f"🎉 Customer registration successful for {user_data.email}")
    return response

# -------------------------------
# Login (all roles)
# -------------------------------
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    logger.info(f"🔐 Login attempt for: {form_data.username}")

    user = await db.users.find_one({"email": form_data.username.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("status") != "active":
        raise HTTPException(status_code=401, detail="Account is not active")

    password_hash = get_password_from_user(user)
    if not password_hash or not verify_password(form_data.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update login stats
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}, "$inc": {"login_count": 1}},
    )

    # Serialize
    user_response = serialize_user(user)

    # Tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    response = {
        "user": user_response,
        "access_token": security.create_access_token(str(user["_id"]), expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(str(user["_id"]), expires_delta=access_token_expires),
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds()),
    }

    logger.info(f"🎉 Login successful for {user['email']} (role: {user.get('role')})")
    return response

# -------------------------------
# Current user
# -------------------------------
@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)) -> Any:
    return serialize_user(current_user)

# -------------------------------
# Logout
# -------------------------------
@router.post("/logout")
async def logout() -> Any:
    return {"message": "Successfully logged out"}

