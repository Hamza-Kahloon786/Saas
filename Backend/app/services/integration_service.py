# app/services/integration_service.py
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import json
import logging
import httpx
import hmac
import hashlib
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

class IntegrationService:
    """Service for handling third-party integrations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def get_integrations(self, company_id: str) -> List[Dict[str, Any]]:
        """Get all integrations for a company"""
        try:
            integrations = await self.db.integrations.find({
                "company_id": ObjectId(company_id)
            }).to_list(length=None)
            
            # Convert ObjectIds to strings
            for integration in integrations:
                integration["id"] = str(integration["_id"])
                integration["company_id"] = str(integration["company_id"])
                
                # Remove sensitive data
                if "config" in integration:
                    config = integration["config"].copy()
                    # Mask sensitive fields
                    sensitive_fields = ["api_key", "secret", "token", "password"]
                    for field in sensitive_fields:
                        if field in config:
                            config[field] = "***HIDDEN***"
                    integration["config"] = config
            
            return integrations
            
        except Exception as e:
            logger.error(f"Error getting integrations for company {company_id}: {e}")
            return []
    
    async def create_integration(
        self, 
        company_id: str, 
        name: str, 
        integration_type: str,
        config: Dict[str, Any],
        is_active: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Create a new integration"""
        try:
            integration_data = {
                "company_id": ObjectId(company_id),
                "name": name,
                "type": integration_type,
                "config": config,
                "is_active": is_active,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_sync": None,
                "sync_count": 0,
                "error_count": 0,
                "last_error": None
            }
            
            result = await self.db.integrations.insert_one(integration_data)
            integration_data["id"] = str(result.inserted_id)
            integration_data["company_id"] = str(integration_data["company_id"])
            
            logger.info(f"Created integration {name} for company {company_id}")
            return integration_data
            
        except Exception as e:
            logger.error(f"Error creating integration: {e}")
            return None
    
    async def update_integration(
        self,
        integration_id: str,
        company_id: str,
        name: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an integration"""
        try:
            update_data = {"updated_at": datetime.utcnow()}
            
            if name is not None:
                update_data["name"] = name
            if config is not None:
                update_data["config"] = config
            if is_active is not None:
                update_data["is_active"] = is_active
            
            result = await self.db.integrations.update_one(
                {"_id": ObjectId(integration_id), "company_id": ObjectId(company_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                # Get updated integration
                integration = await self.db.integrations.find_one({
                    "_id": ObjectId(integration_id),
                    "company_id": ObjectId(company_id)
                })
                
                if integration:
                    integration["id"] = str(integration["_id"])
                    integration["company_id"] = str(integration["company_id"])
                    return integration
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating integration {integration_id}: {e}")
            return None
    
    async def test_integration(
        self, 
        integration_id: str, 
        company_id: str
    ) -> Dict[str, Any]:
        """Test an integration connection"""
        try:
            integration = await self.db.integrations.find_one({
                "_id": ObjectId(integration_id),
                "company_id": ObjectId(company_id)
            })
            
            if not integration:
                return {"status": "error", "message": "Integration not found"}
            
            integration_type = integration["type"]
            config = integration["config"]
            
            # Test based on integration type
            if integration_type == "quickbooks":
                return await self._test_quickbooks_connection(config)
            elif integration_type == "stripe":
                return await self._test_stripe_connection(config)
            elif integration_type == "google_calendar":
                return await self._test_google_calendar_connection(config)
            elif integration_type == "twilio":
                return await self._test_twilio_connection(config)
            elif integration_type == "sendgrid":
                return await self._test_sendgrid_connection(config)
            else:
                return {"status": "error", "message": f"Unknown integration type: {integration_type}"}
                
        except Exception as e:
            logger.error(f"Error testing integration {integration_id}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _test_quickbooks_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test QuickBooks connection"""
        try:
            # QuickBooks API test
            if not all(key in config for key in ["client_id", "client_secret", "access_token"]):
                return {"status": "error", "message": "Missing QuickBooks credentials"}
            
            # Test API call to get company info
            headers = {
                "Authorization": f"Bearer {config['access_token']}",
                "Accept": "application/json"
            }
            
            base_url = "https://sandbox-quickbooks.api.intuit.com" if settings.QUICKBOOKS_SANDBOX else "https://quickbooks.api.intuit.com"
            url = f"{base_url}/v3/company/{config.get('company_id', 'test')}/companyinfo/1"
            
            response = await self.http_client.get(url, headers=headers)
            
            if response.status_code == 200:
                return {"status": "success", "message": "QuickBooks connection successful"}
            else:
                return {"status": "error", "message": f"QuickBooks API error: {response.status_code}"}
                
        except Exception as e:
            return {"status": "error", "message": f"QuickBooks connection failed: {str(e)}"}
    
    async def _test_stripe_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test Stripe connection"""
        try:
            if "secret_key" not in config:
                return {"status": "error", "message": "Missing Stripe secret key"}
            
            # Test Stripe API
            headers = {
                "Authorization": f"Bearer {config['secret_key']}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            response = await self.http_client.get(
                "https://api.stripe.com/v1/account",
                headers=headers
            )
            
            if response.status_code == 200:
                account_data = response.json()
                return {
                    "status": "success", 
                    "message": f"Stripe connection successful for account: {account_data.get('display_name', 'Unknown')}"
                }
            else:
                return {"status": "error", "message": f"Stripe API error: {response.status_code}"}
                
        except Exception as e:
            return {"status": "error", "message": f"Stripe connection failed: {str(e)}"}
    
    async def _test_google_calendar_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test Google Calendar connection"""
        try:
            if "access_token" not in config:
                return {"status": "error", "message": "Missing Google access token"}
            
            # Test Google Calendar API
            headers = {
                "Authorization": f"Bearer {config['access_token']}",
                "Accept": "application/json"
            }
            
            response = await self.http_client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary",
                headers=headers
            )
            
            if response.status_code == 200:
                calendar_data = response.json()
                return {
                    "status": "success", 
                    "message": f"Google Calendar connection successful: {calendar_data.get('summary', 'Primary Calendar')}"
                }
            else:
                return {"status": "error", "message": f"Google Calendar API error: {response.status_code}"}
                
        except Exception as e:
            return {"status": "error", "message": f"Google Calendar connection failed: {str(e)}"}
    
    async def _test_twilio_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test Twilio connection"""
        try:
            if not all(key in config for key in ["account_sid", "auth_token"]):
                return {"status": "error", "message": "Missing Twilio credentials"}
            
            # Test Twilio API
            import base64
            auth_string = base64.b64encode(f"{config['account_sid']}:{config['auth_token']}".encode()).decode()
            
            headers = {
                "Authorization": f"Basic {auth_string}",
                "Accept": "application/json"
            }
            
            response = await self.http_client.get(
                f"https://api.twilio.com/2010-04-01/Accounts/{config['account_sid']}.json",
                headers=headers
            )
            
            if response.status_code == 200:
                account_data = response.json()
                return {
                    "status": "success", 
                    "message": f"Twilio connection successful for account: {account_data.get('friendly_name', 'Unknown')}"
                }
            else:
                return {"status": "error", "message": f"Twilio API error: {response.status_code}"}
                
        except Exception as e:
            return {"status": "error", "message": f"Twilio connection failed: {str(e)}"}
    
    async def _test_sendgrid_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test SendGrid connection"""
        try:
            if "api_key" not in config:
                return {"status": "error", "message": "Missing SendGrid API key"}
            
            # Test SendGrid API
            headers = {
                "Authorization": f"Bearer {config['api_key']}",
                "Content-Type": "application/json"
            }
            
            response = await self.http_client.get(
                "https://api.sendgrid.com/v3/user/account",
                headers=headers
            )
            
            if response.status_code == 200:
                account_data = response.json()
                return {
                    "status": "success", 
                    "message": f"SendGrid connection successful for account: {account_data.get('email', 'Unknown')}"
                }
            else:
                return {"status": "error", "message": f"SendGrid API error: {response.status_code}"}
                
        except Exception as e:
            return {"status": "error", "message": f"SendGrid connection failed: {str(e)}"}
    
    async def sync_quickbooks(self, company_id: str) -> Dict[str, Any]:
        """Sync data with QuickBooks"""
        try:
            integration = await self.db.integrations.find_one({
                "company_id": ObjectId(company_id),
                "type": "quickbooks",
                "is_active": True
            })
            
            if not integration:
                return {"status": "error", "message": "QuickBooks integration not found or inactive"}
            
            config = integration["config"]
            
            # Sync customers
            customers_synced = await self._sync_quickbooks_customers(company_id, config)
            
            # Sync items/services
            items_synced = await self._sync_quickbooks_items(company_id, config)
            
            # Update last sync timestamp
            await self.db.integrations.update_one(
                {"_id": integration["_id"]},
                {
                    "$set": {
                        "last_sync": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    "$inc": {"sync_count": 1}
                }
            )
            
            return {
                "status": "success",
                "message": "QuickBooks sync completed",
                "data": {
                    "customers_synced": customers_synced,
                    "items_synced": items_synced
                }
            }
            
        except Exception as e:
            logger.error(f"QuickBooks sync error for company {company_id}: {e}")
            
            # Log error in integration
            if 'integration' in locals():
                await self.db.integrations.update_one(
                    {"_id": integration["_id"]},
                    {
                        "$set": {
                            "last_error": str(e),
                            "updated_at": datetime.utcnow()
                        },
                        "$inc": {"error_count": 1}
                    }
                )
            
            return {"status": "error", "message": f"QuickBooks sync failed: {str(e)}"}
    
    async def _sync_quickbooks_customers(self, company_id: str, config: Dict[str, Any]) -> int:
        """Sync customers from QuickBooks"""
        try:
            headers = {
                "Authorization": f"Bearer {config['access_token']}",
                "Accept": "application/json"
            }
            
            base_url = "https://sandbox-quickbooks.api.intuit.com" if settings.QUICKBOOKS_SANDBOX else "https://quickbooks.api.intuit.com"
            url = f"{base_url}/v3/company/{config.get('company_id')}/query"
            
            # Query customers
            params = {"query": "SELECT * FROM Customer"}
            response = await self.http_client.get(url, headers=headers, params=params)
            
            if response.status_code != 200:
                raise Exception(f"QuickBooks API error: {response.status_code}")
            
            data = response.json()
            customers = data.get("QueryResponse", {}).get("Customer", [])
            
            synced_count = 0
            
            for qb_customer in customers:
                # Check if customer already exists
                existing_contact = await self.db.contacts.find_one({
                    "company_id": ObjectId(company_id),
                    "external_id": str(qb_customer["Id"])
                })
                
                if not existing_contact:
                    # Create new contact
                    contact_data = {
                        "company_id": ObjectId(company_id),
                        "external_id": str(qb_customer["Id"]),
                        "import_source": "quickbooks",
                        "type": "customer",
                        "status": "active",
                        "first_name": qb_customer.get("GivenName", ""),
                        "last_name": qb_customer.get("FamilyName", ""),
                        "company": qb_customer.get("CompanyName", ""),
                        "email": qb_customer.get("PrimaryEmailAddr", {}).get("Address"),
                        "phone": qb_customer.get("PrimaryPhone", {}).get("FreeFormNumber"),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "last_sync": datetime.utcnow()
                    }
                    
                    await self.db.contacts.insert_one(contact_data)
                    synced_count += 1
                else:
                    # Update existing contact
                    update_data = {
                        "company": qb_customer.get("CompanyName", ""),
                        "email": qb_customer.get("PrimaryEmailAddr", {}).get("Address"),
                        "phone": qb_customer.get("PrimaryPhone", {}).get("FreeFormNumber"),
                        "updated_at": datetime.utcnow(),
                        "last_sync": datetime.utcnow()
                    }
                    
                    await self.db.contacts.update_one(
                        {"_id": existing_contact["_id"]},
                        {"$set": update_data}
                    )
                    synced_count += 1
            
            return synced_count
            
        except Exception as e:
            logger.error(f"Error syncing QuickBooks customers: {e}")
            return 0
    
    async def _sync_quickbooks_items(self, company_id: str, config: Dict[str, Any]) -> int:
        """Sync items/services from QuickBooks"""
        try:
            headers = {
                "Authorization": f"Bearer {config['access_token']}",
                "Accept": "application/json"
            }
            
            base_url = "https://sandbox-quickbooks.api.intuit.com" if settings.QUICKBOOKS_SANDBOX else "https://quickbooks.api.intuit.com"
            url = f"{base_url}/v3/company/{config.get('company_id')}/query"
            
            # Query items
            params = {"query": "SELECT * FROM Item"}
            response = await self.http_client.get(url, headers=headers, params=params)
            
            if response.status_code != 200:
                raise Exception(f"QuickBooks API error: {response.status_code}")
            
            data = response.json()
            items = data.get("QueryResponse", {}).get("Item", [])
            
            synced_count = 0
            
            for qb_item in items:
                # Store in services/products collection
                existing_item = await self.db.services.find_one({
                    "company_id": ObjectId(company_id),
                    "external_id": str(qb_item["Id"])
                })
                
                if not existing_item:
                    item_data = {
                        "company_id": ObjectId(company_id),
                        "external_id": str(qb_item["Id"]),
                        "import_source": "quickbooks",
                        "name": qb_item.get("Name", ""),
                        "description": qb_item.get("Description", ""),
                        "type": qb_item.get("Type", ""),
                        "unit_price": float(qb_item.get("UnitPrice", 0)),
                        "is_active": qb_item.get("Active", True),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "last_sync": datetime.utcnow()
                    }
                    
                    await self.db.services.insert_one(item_data)
                    synced_count += 1
            
            return synced_count
            
        except Exception as e:
            logger.error(f"Error syncing QuickBooks items: {e}")
            return 0
    
    async def sync_google_calendar(self, company_id: str) -> Dict[str, Any]:
        """Sync jobs with Google Calendar"""
        try:
            integration = await self.db.integrations.find_one({
                "company_id": ObjectId(company_id),
                "type": "google_calendar",
                "is_active": True
            })
            
            if not integration:
                return {"status": "error", "message": "Google Calendar integration not found or inactive"}
            
            config = integration["config"]
            
            # Get recent jobs
            recent_jobs = await self.db.jobs.find({
                "company_id": ObjectId(company_id),
                "created_at": {"$gte": datetime.utcnow() - timedelta(days=7)}
            }).to_list(length=100)
            
            synced_count = 0
            
            for job in recent_jobs:
                # Create calendar event
                event_created = await self._create_calendar_event(job, config)
                if event_created:
                    synced_count += 1
            
            # Update last sync timestamp
            await self.db.integrations.update_one(
                {"_id": integration["_id"]},
                {
                    "$set": {
                        "last_sync": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    "$inc": {"sync_count": 1}
                }
            )
            
            return {
                "status": "success",
                "message": "Google Calendar sync completed",
                "data": {"events_synced": synced_count}
            }
            
        except Exception as e:
            logger.error(f"Google Calendar sync error for company {company_id}: {e}")
            return {"status": "error", "message": f"Google Calendar sync failed: {str(e)}"}
    
    async def _create_calendar_event(self, job: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Create a Google Calendar event for a job"""
        try:
            headers = {
                "Authorization": f"Bearer {config['access_token']}",
                "Content-Type": "application/json"
            }
            
            # Create event data
            event_data = {
                "summary": job["title"],
                "description": job.get("description", ""),
                "start": {
                    "dateTime": job["time_tracking"]["scheduled_start"].isoformat(),
                    "timeZone": "America/New_York"  # Should be configurable
                },
                "end": {
                    "dateTime": job["time_tracking"]["scheduled_end"].isoformat(),
                    "timeZone": "America/New_York"
                },
                "location": f"{job['address']['street']}, {job['address']['city']}, {job['address']['state']}"
            }
            
            calendar_id = config.get("calendar_id", "primary")
            response = await self.http_client.post(
                f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events",
                headers=headers,
                json=event_data
            )
            
            if response.status_code == 200:
                event = response.json()
                
                # Update job with calendar event ID
                await self.db.jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"calendar_event_id": event["id"]}}
                )
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error creating calendar event for job {job['_id']}: {e}")
            return False
    
    async def handle_zapier_webhook(
        self, 
        company_id: str, 
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle incoming Zapier webhook"""
        try:
            webhook_type = webhook_data.get("type", "unknown")
            
            if webhook_type == "new_lead":
                return await self._handle_zapier_new_lead(company_id, webhook_data)
            elif webhook_type == "form_submission":
                return await self._handle_zapier_form_submission(company_id, webhook_data)
            elif webhook_type == "customer_update":
                return await self._handle_zapier_customer_update(company_id, webhook_data)
            else:
                return {"status": "error", "message": f"Unknown webhook type: {webhook_type}"}
                
        except Exception as e:
            logger.error(f"Error handling Zapier webhook for company {company_id}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _handle_zapier_new_lead(
        self, 
        company_id: str, 
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle new lead from Zapier"""
        try:
            lead_data = webhook_data.get("data", {})
            
            # Create contact first
            contact_data = {
                "company_id": ObjectId(company_id),
                "type": "lead",
                "status": "active",
                "first_name": lead_data.get("first_name", ""),
                "last_name": lead_data.get("last_name", ""),
                "email": lead_data.get("email"),
                "phone": lead_data.get("phone"),
                "lead_source": "zapier",
                "lead_source_detail": webhook_data.get("source", ""),
                "import_source": "zapier",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            contact_result = await self.db.contacts.insert_one(contact_data)
            
            # Create lead
            lead_data_db = {
                "company_id": ObjectId(company_id),
                "contact_id": contact_result.inserted_id,
                "status": "new",
                "priority": "medium",
                "quality": "warm",
                "stage": "awareness",
                "source": "zapier",
                "source_detail": webhook_data.get("source", ""),
                "service_type": lead_data.get("service_type", "other"),
                "estimated_value": lead_data.get("estimated_value"),
                "import_source": "zapier",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            lead_result = await self.db.leads.insert_one(lead_data_db)
            
            return {
                "status": "success",
                "message": "Lead created successfully",
                "data": {
                    "contact_id": str(contact_result.inserted_id),
                    "lead_id": str(lead_result.inserted_id)
                }
            }
            
        except Exception as e:
            logger.error(f"Error handling Zapier new lead: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _handle_zapier_form_submission(
        self, 
        company_id: str, 
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle form submission from Zapier"""
        try:
            form_data = webhook_data.get("data", {})
            
            # Similar to new lead handling but with form-specific logic
            return await self._handle_zapier_new_lead(company_id, {
                "type": "new_lead",
                "source": "form_submission",
                "data": form_data
            })
            
        except Exception as e:
            logger.error(f"Error handling Zapier form submission: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _handle_zapier_customer_update(
        self, 
        company_id: str, 
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle customer update from Zapier"""
        try:
            update_data = webhook_data.get("data", {})
            customer_id = update_data.get("customer_id")
            
            if not customer_id:
                return {"status": "error", "message": "Customer ID not provided"}
            
            # Update contact
            contact_updates = {
                "updated_at": datetime.utcnow(),
                "last_sync": datetime.utcnow()
            }
            
            # Add any provided updates
            if "email" in update_data:
                contact_updates["email"] = update_data["email"]
            if "phone" in update_data:
                contact_updates["phone"] = update_data["phone"]
            if "address" in update_data:
                contact_updates["address"] = update_data["address"]
            
            result = await self.db.contacts.update_one(
                {
                    "company_id": ObjectId(company_id),
                    "external_id": customer_id
                },
                {"$set": contact_updates}
            )
            
            if result.modified_count:
                return {"status": "success", "message": "Customer updated successfully"}
            else:
                return {"status": "error", "message": "Customer not found or no changes made"}
                
        except Exception as e:
            logger.error(f"Error handling Zapier customer update: {e}")
            return {"status": "error", "message": str(e)}
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            await self.http_client.aclose()
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

# Export the service
__all__ = ["IntegrationService"]