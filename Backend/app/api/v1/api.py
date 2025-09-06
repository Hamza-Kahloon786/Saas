# # backend/app/api/v1/api.py - UPDATED VERSION WITH TECHNICIAN PORTAL
# backend/app/api/v1/api.py - FIXED VERSION

from fastapi import APIRouter
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints import (
    auth, users, contacts, leads, jobs,
    scheduling, estimates, invoices,
    ai_automation, analytics, integrations,
    dashboard, notifications, ws, email, 
    mobile, customer_portal, realtime, technician_portal, service_requests, technicians   
)
from app.api.v1.endpoints.ai_chatbot import router as ai_chatbot_router
from app.api.v1.endpoints import service_management 

api_router = APIRouter()

# Core business endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(scheduling.router, prefix="/scheduling", tags=["scheduling"])
api_router.include_router(estimates.router, prefix="/estimates", tags=["estimates"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(ai_automation.router, prefix="/ai", tags=["ai-automation"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])

# Dashboard
api_router.include_router(dashboard.router, tags=["dashboard"])

# Customer & Technician portals
api_router.include_router(customer_portal.router, prefix="/customer-portal", tags=["customer-portal"])
api_router.include_router(technician_portal.router, prefix="/technician-portal", tags=["technician-portal"])

# Realtime features
api_router.include_router(realtime.router)
api_router.include_router(ws.router, tags=["websocket"])

# Notifications
api_router.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])

# Mobile API
api_router.include_router(mobile.router, prefix="/mobile", tags=["mobile"])

# Service Requests Management for Admin
api_router.include_router(service_requests.router, prefix="/service-requests", tags=["service-requests"])

# Technician Management for Admin
api_router.include_router(technicians.router, prefix="/technicians", tags=["technicians"])

# AI Chatbot
api_router.include_router(ai_chatbot_router, prefix="/ai-chatbot", tags=["ai-chatbot"])

# Email Management
api_router.include_router(email.router, prefix="/email", tags=["Email Management"])

# ✅ FIXED: Service Management Router - Remove the extra /v1 prefix
api_router.include_router(service_management.router, tags=["service-management"])














# from fastapi import APIRouter
# from app.api.v1.endpoints.notifications import router as notifications_router
# from app.api.v1.endpoints import (
#     auth, users, contacts, leads, jobs,
#     scheduling, estimates, invoices,
#     ai_automation, analytics, integrations,
#     dashboard, notifications, ws,email, 
#     mobile, customer_portal, realtime, technician_portal,service_requests,technicians   # Added technician_portal
# )
# from app.api.v1.endpoints.ai_chatbot import router as ai_chatbot_router
# from app.api.v1.endpoints import service_management 
# api_router = APIRouter()

# # Core business endpoints
# api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
# api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
# api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
# api_router.include_router(scheduling.router, prefix="/scheduling", tags=["scheduling"])
# api_router.include_router(estimates.router, prefix="/estimates", tags=["estimates"])
# api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
# api_router.include_router(ai_automation.router, prefix="/ai", tags=["ai-automation"])
# api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
# api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])

# # Dashboard
# api_router.include_router(dashboard.router, tags=["dashboard"])

# # Customer & Technician portals
# api_router.include_router(customer_portal.router, prefix="/customer-portal", tags=["customer-portal"])
# api_router.include_router(technician_portal.router, prefix="/technician-portal", tags=["technician-portal"])

# # Realtime features
# api_router.include_router(realtime.router)
# api_router.include_router(ws.router, tags=["websocket"])



# # In your main router file
# # from app.api.v1.endpoints.notifications import router as notifications_router

# api_router.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
# # Notifications
# # api_router.include_router(notifications.router, tags=["notifications"])

# # Mobile API
# api_router.include_router(mobile.router, prefix="/mobile", tags=["mobile"])
# # api_router.include_router(ai_assistant.router)

# # ✅ NEW: Service Requests Management for Admin
# api_router.include_router(service_requests.router, prefix="/service-requests", tags=["service-requests"])

# # Technician Management for Admin
# api_router.include_router(technicians.router, prefix="/technicians", tags=["technicians"])

# # Add this line with your other router includes:
# api_router.include_router(ai_chatbot_router, prefix="/ai-chatbot", tags=["ai-chatbot"])

# # ✅ ADD EMAIL ROUTER
# api_router.include_router(email.router, prefix="/email", tags=["Email Management"])

# # In your existing api_router includes, add:
# api_router.include_router(service_management.router, prefix="/v1", tags=["service-management"])

# # # app/api/v1/api.py
# # from fastapi import APIRouter

# # # ---- Core v1 endpoints (import routers, not modules) ----
# # from app.api.v1.endpoints.auth import router as auth_router
# # from app.api.v1.endpoints.users import router as users_router
# # from app.api.v1.endpoints.contacts import router as contacts_router
# # from app.api.v1.endpoints.leads import router as leads_router
# # from app.api.v1.endpoints.jobs import router as jobs_router
# # from app.api.v1.endpoints.scheduling import router as scheduling_router
# # from app.api.v1.endpoints.estimates import router as estimates_router
# # from app.api.v1.endpoints.invoices import router as invoices_router
# # from app.api.v1.endpoints.ai_automation import router as ai_automation_router
# # from app.api.v1.endpoints.analytics import router as analytics_router
# # from app.api.v1.endpoints.integrations import router as integrations_router

# # # ---- New portals (import the router symbol explicitly) ----
# # from app.api.v1.endpoints import router as customer_portal
# # # from app.api.v1.endpoints.technician_portal import router as technician_portal_router

# # api_router = APIRouter()

# # # Public/Auth
# # api_router.include_router(auth_router, prefix="/auth", tags=["auth"])

# # # Admin/Staff feature routers
# # api_router.include_router(users_router, prefix="/users", tags=["users"])
# # api_router.include_router(contacts_router, prefix="/contacts", tags=["contacts"])
# # api_router.include_router(leads_router, prefix="/leads", tags=["leads"])
# # api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
# # api_router.include_router(scheduling_router, prefix="/scheduling", tags=["scheduling"])
# # api_router.include_router(estimates_router, prefix="/estimates", tags=["estimates"])
# # api_router.include_router(invoices_router, prefix="/invoices", tags=["invoices"])
# # api_router.include_router(ai_automation_router, prefix="/ai", tags=["ai_automation"])
# # api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
# # api_router.include_router(integrations_router, prefix="/integrations", tags=["integrations"])
# # # In your backend/app/api/v1/api.py, make sure you have:
# # api_router.include_router(customer_portal.router, prefix="/customer-portal", tags=["customer-portal"])
# # # Customer & Technician portals (auth-required; each file enforces roles)
# # # api_router.include_router(customer_portal_router, tags=["customer-portal"])
# # # api_router.include_router(technician_portal_router, prefix="/technician-portal", tags=["technician-portal"])

# # # NOTE:
# # # main.py should do:
# # #   app.include_router(api_router, prefix="/api/v1")
# # #
# # # Each endpoint file should expose a variable named `router = APIRouter(...)`.
# # # You DON'T need to create customer_portal_router = router if you import as above.
