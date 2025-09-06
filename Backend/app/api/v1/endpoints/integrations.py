# =============================================================================
# app/api/v1/endpoints/integrations.py
# =============================================================================
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.core.database import get_database
from app.services.integration_service import IntegrationService
from app.dependencies.auth import get_current_user, require_role

router = APIRouter()

@router.get("/")
async def get_integrations(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Get all available integrations"""
    integrations = await db.integrations.find({
        "company_id": ObjectId(current_user["company_id"])
    }).to_list(length=None)
    
    # Convert ObjectIds to strings
    for integration in integrations:
        integration["id"] = str(integration["_id"])
        integration["company_id"] = str(integration["company_id"])
    
    return integrations

@router.post("/")
async def create_integration(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_role("admin")),
    name: str,
    type: str,
    config: Dict[str, Any],
    is_active: bool = True
) -> Any:
    """Create new integration (admin only)"""
    integration_service = IntegrationService(db)
    
    integration = await integration_service.create_integration(
        company_id=str(current_user["company_id"]),
        name=name,
        integration_type=type,
        config=config,
        is_active=is_active
    )
    
    return integration

@router.put("/{integration_id}")
async def update_integration(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    integration_id: str,
    current_user: dict = Depends(require_role("admin")),
    name: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    is_active: Optional[bool] = None
) -> Any:
    """Update integration (admin only)"""
    if not ObjectId.is_valid(integration_id):
        raise HTTPException(status_code=400, detail="Invalid integration ID")
    
    integration_service = IntegrationService(db)
    
    integration = await integration_service.update_integration(
        integration_id=integration_id,
        company_id=str(current_user["company_id"]),
        name=name,
        config=config,
        is_active=is_active
    )
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return integration

@router.delete("/{integration_id}")
async def delete_integration(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    integration_id: str,
    current_user: dict = Depends(require_role("admin")),
) -> Any:
    """Delete integration (admin only)"""
    if not ObjectId.is_valid(integration_id):
        raise HTTPException(status_code=400, detail="Invalid integration ID")
    
    result = await db.integrations.delete_one({
        "_id": ObjectId(integration_id),
        "company_id": ObjectId(current_user["company_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return {"message": "Integration deleted successfully"}

@router.post("/{integration_id}/test")
async def test_integration(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    integration_id: str,
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Test integration connection"""
    if not ObjectId.is_valid(integration_id):
        raise HTTPException(status_code=400, detail="Invalid integration ID")
    
    integration_service = IntegrationService(db)
    
    result = await integration_service.test_integration(
        integration_id=integration_id,
        company_id=str(current_user["company_id"])
    )
    
    return result

@router.post("/quickbooks/sync")
async def sync_quickbooks(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Sync with QuickBooks"""
    integration_service = IntegrationService(db)
    
    result = await integration_service.sync_quickbooks(
        company_id=str(current_user["company_id"])
    )
    
    return result

@router.post("/google-calendar/sync")
async def sync_google_calendar(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Sync with Google Calendar"""
    integration_service = IntegrationService(db)
    
    result = await integration_service.sync_google_calendar(
        company_id=str(current_user["company_id"])
    )
    
    return result

@router.post("/zapier/webhook")
async def zapier_webhook(
    *,
    db: AsyncIOMotorDatabase = Depends(get_database),
    webhook_data: Dict[str, Any],
    api_key: str = None
) -> Any:
    """Handle Zapier webhook"""
    # Verify API key
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    # Find company by API key
    company = await db.companies.find_one({"api_key": api_key})
    if not company:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    integration_service = IntegrationService(db)
    
    result = await integration_service.handle_zapier_webhook(
        company_id=str(company["_id"]),
        webhook_data=webhook_data
    )
    
    return result

@router.get("/available")
async def get_available_integrations(
    current_user: dict = Depends(get_current_user),
) -> Any:
    """Get list of available integrations"""
    available_integrations = [
        {
            "name": "QuickBooks",
            "type": "accounting",
            "description": "Sync customers, invoices, and payments",
            "icon": "quickbooks-icon.png",
            "features": ["Customer sync", "Invoice sync", "Payment tracking"]
        },
        {
            "name": "Google Calendar",
            "type": "calendar",
            "description": "Sync job schedules with Google Calendar",
            "icon": "google-calendar-icon.png",
            "features": ["Two-way sync", "Real-time updates", "Team calendars"]
        },
        {
            "name": "Stripe",
            "type": "payment",
            "description": "Accept online payments and track transactions",
            "icon": "stripe-icon.png",
            "features": ["Online payments", "Recurring billing", "Payment tracking"]
        },
        {
            "name": "Zapier",
            "type": "automation",
            "description": "Connect with 5000+ apps through Zapier",
            "icon": "zapier-icon.png",
            "features": ["Custom workflows", "Trigger actions", "Data sync"]
        },
        {
            "name": "Mailchimp",
            "type": "marketing",
            "description": "Email marketing and customer communication",
            "icon": "mailchimp-icon.png",
            "features": ["Email campaigns", "Customer segmentation", "Automation"]
        },
        {
            "name": "Google Maps",
            "type": "mapping",
            "description": "Route optimization and location services",
            "icon": "google-maps-icon.png",
            "features": ["Route optimization", "GPS tracking", "Address validation"]
        }
    ]
    
    return available_integrations
