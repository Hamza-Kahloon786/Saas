# backend/app/api/v1/endpoints/auth.py - FIXED VERSION
from datetime import timedelta, datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import bcrypt
import logging

from app.core import security
from app.core.config import settings
from app.core.database import get_database
from app.dependencies.auth import get_current_user

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Simple request models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    logger.info(f"🔐 Hashing password for storage")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    logger.info(f"🔐 Password hashed successfully")
    return hashed

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        logger.info(f"🔍 Verifying password")
        logger.info(f"🔍 Plain password length: {len(plain_password)}")
        logger.info(f"🔍 Hashed password starts with: {hashed_password[:10]}...")
        
        # Handle bcrypt hash formats
        if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
            result = bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
            logger.info(f"🔍 Bcrypt verification result: {result}")
            return result
        else:
            logger.warning(f"⚠️ Non-standard hash format detected")
            return False
            
    except Exception as e:
        logger.error(f"❌ Password verification error: {e}")
        return False

def get_password_from_user(user_doc: dict) -> str:
    """Get password hash from user document - handles different field names"""
    # Handle different password field names
    password_hash = user_doc.get("hashed_password") or user_doc.get("password_hash")
    
    if not password_hash:
        logger.warning(f"⚠️ No password hash found in user document")
        logger.info(f"🔍 Available fields: {list(user_doc.keys())}")
    
    return password_hash or ""

@router.post("/register")
async def register(
    user_data: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """Register new user"""
    
    logger.info(f"📝 Registering user: {user_data.email}")
    
    try:
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="User with this email already exists"
            )
        
        # Create company first
        company_doc = {
            "name": f"{user_data.first_name} {user_data.last_name}'s Company",
            "industry": "service",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        company_result = await db.companies.insert_one(company_doc)
        company_id = company_result.inserted_id
        
        logger.info(f"✅ Created company: {company_id}")
        
        # Create user with proper password hashing
        user_doc = {
            "email": user_data.email.lower(),
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "hashed_password": hash_password(user_data.password),
            "role": "admin",
            "status": "active",
            "company_id": company_id,
            "permissions": [],
            "is_superuser": True,
            "is_email_verified": False,
            "is_phone_verified": False,
            "login_count": 0,
            "failed_login_attempts": 0,
            "profile": {},
            "preferences": {
                "theme": "light",
                "language": "en",
                "timezone": "UTC",
                "notifications": {
                    "email": True,
                    "sms": True,
                    "push": True
                }
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        user_result = await db.users.insert_one(user_doc)
        user_id = user_result.inserted_id
        
        logger.info(f"✅ Created user: {user_id}")
        
        # Generate tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # User response
        user_response = {
            "id": str(user_id),
            "company_id": str(company_id),
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": "admin",
            "status": "active",
            "permissions": [],
            "is_email_verified": False,
            "is_phone_verified": False,
            "created_at": user_doc["created_at"].isoformat(),
            "updated_at": user_doc["updated_at"].isoformat(),
            "full_name": f"{user_data.first_name} {user_data.last_name}",
            "display_name": user_data.first_name,
            "is_active": True,
            "is_admin": True
        }
        
        response = {
            "user": user_response,
            "access_token": security.create_access_token(str(user_id), expires_delta=access_token_expires),
            "refresh_token": security.create_refresh_token(str(user_id), expires_delta=access_token_expires),
            "token_type": "bearer",
            "expires_in": int(access_token_expires.total_seconds())
        }
        
        logger.info(f"🎉 Registration successful for {user_data.email}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """Login user - FIXED VERSION"""
    
    logger.info(f"🔑 Login attempt for: {form_data.username}")
    
    try:
        # Find user (case-insensitive email search)
        user = await db.users.find_one({"email": form_data.username.lower()})
        
        if not user:
            logger.warning(f"❌ User not found: {form_data.username}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"✅ User found: {user['email']}, role: {user.get('role', 'unknown')}")
        
        # Check user status
        if user.get("status") != "active":
            logger.warning(f"❌ User account not active: {user['email']}")
            raise HTTPException(status_code=401, detail="Account is not active")
        
        # FIXED: Get password hash using helper function
        password_hash = get_password_from_user(user)
        
        if not password_hash:
            logger.error(f"❌ No password found for user: {user['email']}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        password_valid = verify_password(form_data.password, password_hash)
        
        if not password_valid:
            logger.warning(f"❌ Invalid password for user: {user['email']}")
            # Increment failed login attempts
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$inc": {"failed_login_attempts": 1}}
            )
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"✅ Password verified for user: {user['email']}")
        
        # Update login info
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "last_login": datetime.utcnow(),
                    "failed_login_attempts": 0  # Reset on successful login
                },
                "$inc": {"login_count": 1}
            }
        )
        
        # Generate tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # User response with all required fields
        user_response = {
            "id": str(user["_id"]),
            "company_id": str(user.get("company_id", "")),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "role": user.get("role", "user"),
            "status": user.get("status", "active"),
            "permissions": user.get("permissions", []),
            "is_email_verified": user.get("is_email_verified", False),
            "is_phone_verified": user.get("is_phone_verified", False),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
            "updated_at": user.get("updated_at", datetime.utcnow()).isoformat(),
            "full_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "display_name": user.get("first_name", user["email"]),
            "is_active": user.get("status") == "active",
            "is_admin": user.get("role") == "admin",
            "phone": user.get("phone", ""),
            "avatar_url": user.get("avatar_url", ""),
            "last_login": user.get("last_login"),
            "login_count": user.get("login_count", 0)
        }
        
        response = {
            "user": user_response,
            "access_token": security.create_access_token(str(user["_id"]), expires_delta=access_token_expires),
            "refresh_token": security.create_refresh_token(str(user["_id"]), expires_delta=access_token_expires),
            "token_type": "bearer",
            "expires_in": int(access_token_expires.total_seconds())
        }
        
        logger.info(f"🎉 Login successful for {user['email']} (role: {user.get('role')})")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
) -> Any:
    """Get current user info"""
    return {
        "id": str(current_user["_id"]),
        "company_id": str(current_user.get("company_id", "")),
        "email": current_user["email"],
        "first_name": current_user.get("first_name", ""),
        "last_name": current_user.get("last_name", ""),
        "role": current_user.get("role", "user"),
        "status": current_user.get("status", "active"),
        "permissions": current_user.get("permissions", []),
        "full_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip(),
        "display_name": current_user.get("first_name", current_user["email"]),
        "is_active": current_user.get("status") == "active",
        "is_admin": current_user.get("role") == "admin"
    }

@router.post("/logout")
async def logout() -> Any:
    """Logout user"""
    return {"message": "Successfully logged out"}













# # backend/app/api/v1/endpoints/auth.py - REPLACE COMPLETELY
# from datetime import timedelta, datetime
# from typing import Any
# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordRequestForm
# from motor.motor_asyncio import AsyncIOMotorDatabase
# from pydantic import BaseModel, EmailStr
# from bson import ObjectId
# import bcrypt

# from app.core import security
# from app.core.config import settings
# from app.core.database import get_database
# from app.dependencies.auth import get_current_user

# router = APIRouter()

# # Simple request models
# class RegisterRequest(BaseModel):
#     email: EmailStr
#     password: str
#     first_name: str
#     last_name: str

# def hash_password(password: str) -> str:
#     """Hash password using bcrypt"""
#     salt = bcrypt.gensalt()
#     return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# def verify_password(password: str, hashed: str) -> bool:
#     """Verify password against hash"""
#     return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# @router.post("/register")
# async def register(
#     user_data: RegisterRequest,
#     db: AsyncIOMotorDatabase = Depends(get_database)
# ) -> Any:
#     """Register new user - DIRECT IMPLEMENTATION"""
    
#     print(f"📝 Registering user: {user_data.email}")
    
#     try:
#         # Check if user exists
#         existing_user = await db.users.find_one({"email": user_data.email.lower()})
#         if existing_user:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="User with this email already exists"
#             )
        
#         # Create company first
#         company_doc = {
#             "name": f"{user_data.first_name} {user_data.last_name}'s Company",
#             "industry": "service",
#             "status": "active",
#             "created_at": datetime.utcnow(),
#             "updated_at": datetime.utcnow()
#         }
        
#         company_result = await db.companies.insert_one(company_doc)
#         company_id = company_result.inserted_id
        
#         print(f"✅ Created company: {company_id}")
        
#         # Create user
#         user_doc = {
#             "email": user_data.email.lower(),
#             "first_name": user_data.first_name,
#             "last_name": user_data.last_name,
#             "hashed_password": hash_password(user_data.password),
#             "role": "admin",
#             "status": "active",
#             "company_id": company_id,
#             "permissions": [],
#             "is_superuser": True,
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
        
#         print(f"✅ Created user: {user_id}")
        
#         # Generate tokens
#         access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
#         # User response
#         user_response = {
#             "id": str(user_id),
#             "company_id": str(company_id),
#             "email": user_data.email,
#             "first_name": user_data.first_name,
#             "last_name": user_data.last_name,
#             "role": "admin",
#             "status": "active",
#             "permissions": [],
#             "is_email_verified": False,
#             "is_phone_verified": False,
#             "created_at": user_doc["created_at"].isoformat(),
#             "updated_at": user_doc["updated_at"].isoformat(),
#             "full_name": f"{user_data.first_name} {user_data.last_name}",
#             "display_name": user_data.first_name,
#             "is_active": True,
#             "is_admin": True
#         }
        
#         response = {
#             "user": user_response,
#             "access_token": security.create_access_token(str(user_id), expires_delta=access_token_expires),
#             "refresh_token": security.create_refresh_token(str(user_id), expires_delta=access_token_expires),
#             "token_type": "bearer",
#             "expires_in": int(access_token_expires.total_seconds())
#         }
        
#         print(f"🎉 Registration successful for {user_data.email}")
#         return response
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Registration failed: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

# @router.post("/login")
# async def login(
#     form_data: OAuth2PasswordRequestForm = Depends(),
#     db: AsyncIOMotorDatabase = Depends(get_database)
# ) -> Any:
#     """Login user"""
    
#     try:
#         # Find user
#         user = await db.users.find_one({"email": form_data.username.lower()})
#         if not user:
#             raise HTTPException(status_code=401, detail="Invalid credentials")
        
#         # Verify password
#         if not verify_password(form_data.password, user["hashed_password"]):
#             raise HTTPException(status_code=401, detail="Invalid credentials")
        
#         # Update login info
#         await db.users.update_one(
#             {"_id": user["_id"]},
#             {
#                 "$set": {"last_login": datetime.utcnow()},
#                 "$inc": {"login_count": 1}
#             }
#         )
        
#         # Generate tokens
#         access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
#         # User response
#         user_response = {
#             "id": str(user["_id"]),
#             "company_id": str(user["company_id"]),
#             "email": user["email"],
#             "first_name": user["first_name"],
#             "last_name": user["last_name"],
#             "role": user["role"],
#             "status": user["status"],
#             "permissions": user.get("permissions", []),
#             "is_email_verified": user.get("is_email_verified", False),
#             "is_phone_verified": user.get("is_phone_verified", False),
#             "created_at": user["created_at"].isoformat(),
#             "updated_at": user["updated_at"].isoformat(),
#             "full_name": f"{user['first_name']} {user['last_name']}",
#             "display_name": user["first_name"],
#             "is_active": user["status"] == "active",
#             "is_admin": user["role"] == "admin"
#         }
        
#         return {
#             "user": user_response,
#             "access_token": security.create_access_token(str(user["_id"]), expires_delta=access_token_expires),
#             "refresh_token": security.create_refresh_token(str(user["_id"]), expires_delta=access_token_expires),
#             "token_type": "bearer",
#             "expires_in": int(access_token_expires.total_seconds())
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Login failed: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# @router.get("/me")
# async def get_current_user_info(
#     current_user: dict = Depends(get_current_user)
# ) -> Any:
#     """Get current user info"""
#     return {
#         "id": str(current_user["_id"]),
#         "email": current_user["email"],
#         "first_name": current_user["first_name"],
#         "last_name": current_user["last_name"],
#         "role": current_user["role"]
#     }

# @router.post("/logout")
# async def logout() -> Any:
#     """Logout user"""
#     return {"message": "Successfully logged out"}