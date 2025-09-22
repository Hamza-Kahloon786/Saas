# backend/app/api/v1/endpoints/auth.py

from bson import ObjectId
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



# # backend/app/api/v1/endpoints/auth.py
import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError
from fastapi import Query
# Add this after your existing endpoints

@router.get("/google/url")
async def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"response_type=code&"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
            f"scope=openid email profile&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        return {"auth_url": auth_url}
        
    except Exception as e:
        logger.error(f"❌ Failed to generate Google auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate Google auth URL")

from fastapi.responses import RedirectResponse
import urllib.parse

@router.get("/google/callback")
async def google_oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(None, description="State parameter for CSRF protection"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Handle Google OAuth callback and redirect to frontend"""
    try:
        logger.info(f"🔐 Processing Google OAuth callback with code: {code[:10]}...")
        
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
            "code": code,
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
        
        # Verify and decode the ID token
        try:
            id_info = id_token.verify_oauth2_token(
                tokens["id_token"],
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
        except GoogleAuthError as e:
            logger.error(f"❌ Google token verification failed: {str(e)}")
            error_url = f"{settings.FRONTEND_URL}/auth/callback?error=token_verification_failed"
            return RedirectResponse(url=error_url)
        
        email = id_info.get("email")
        name = id_info.get("name", "")
        google_id = id_info.get("sub")
        avatar_url = id_info.get("picture")
        
        if not email:
            error_url = f"{settings.FRONTEND_URL}/auth/callback?error=no_email"
            return RedirectResponse(url=error_url)
        
        logger.info(f"🔐 Google user info: {email}, {name}")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email.lower().strip()})
        
        if existing_user:
            # User exists, update Google info and login
            update_data = {
                "google_id": google_id,
                "avatar_url": avatar_url,
                "updated_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            }
            
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_data}
            )
            
            user_id = str(existing_user["_id"])
            user = existing_user
            logger.info(f"✅ Existing user logged in via Google: {email}")
            
        else:
            # Create new user account
            name_parts = name.strip().split(' ', 1)
            first_name = name_parts[0] if name_parts else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            # Create company for the new user
            company_id = ObjectId()
            company_doc = {
                "_id": company_id,
                "name": f"{first_name}'s Company",
                "industry": "Other",
                "size": "1-10",
                "phone": "",
                "address": {},
                "settings": {
                    "timezone": "UTC",
                    "currency": "USD",
                    "date_format": "MM/DD/YYYY",
                    "business_hours": {
                        "monday": {"start": "09:00", "end": "17:00"},
                        "tuesday": {"start": "09:00", "end": "17:00"},
                        "wednesday": {"start": "09:00", "end": "17:00"},
                        "thursday": {"start": "09:00", "end": "17:00"},
                        "friday": {"start": "09:00", "end": "17:00"}
                    }
                },
                "subscription": {
                    "plan": "basic",
                    "status": "trial",
                    "trial_ends_at": datetime.utcnow() + timedelta(days=14)
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.companies.insert_one(company_doc)
            
            # Create user document
            user_id = ObjectId()
            user_doc = {
                "_id": user_id,
                "company_id": company_id,
                "email": email.lower().strip(),
                "first_name": first_name,
                "last_name": last_name,
                "hashed_password": "",
                "role": "customer",  # Default role for OAuth users
                "status": "active",
                "permissions": ["read", "customer_portal"],
                "google_id": google_id,
                "avatar_url": avatar_url,
                "is_email_verified": True,
                "is_phone_verified": False,
                "preferences": {
                    "language": "en",
                    "timezone": "UTC",
                    "notifications": {
                        "email": True,
                        "sms": False,
                        "push": True
                    }
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            }
            
            await db.users.insert_one(user_doc)
            user_id = str(user_id)
            user = user_doc
            
            logger.info(f"✅ New user created via Google OAuth: {email}")
        
        # Generate tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(user_id, expires_delta=access_token_expires)
        refresh_token = security.create_refresh_token(user_id, expires_delta=access_token_expires)
        
        # Serialize user data
        user_data = serialize_user(user)
        
        # Base64 encode user data to pass in URL (secure for this use case)
        import base64
        import json
        user_data_json = json.dumps(user_data)
        user_data_encoded = base64.b64encode(user_data_json.encode()).decode()
        
        # Redirect to frontend with all necessary data
        success_url = (
            f"{settings.FRONTEND_URL}/auth/callback?"
            f"success=true&"
            f"token={access_token}&"
            f"refresh_token={refresh_token}&"
            f"user_data={user_data_encoded}"
        )
        
        logger.info(f"🎉 Google OAuth successful for {email}, redirecting to frontend")
        return RedirectResponse(url=success_url)
        
    except HTTPException:
        error_url = f"{settings.FRONTEND_URL}/auth/callback?error=http_exception"
        return RedirectResponse(url=error_url)
    except Exception as e:
        logger.error(f"❌ Google OAuth callback failed: {str(e)}")
        error_url = f"{settings.FRONTEND_URL}/auth/callback?error=server_error"
        return RedirectResponse(url=error_url)