

"""
AI-Enhanced SaaS CRM - Main Application Entry Point
"""
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import ORJSONResponse, RedirectResponse, Response
from fastapi.encoders import jsonable_encoder
from fastapi.exception_handlers import (
    http_exception_handler as default_http_exception_handler,
    request_validation_exception_handler as default_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
from typing import Optional, List, Dict, Any
from app.core.database import connect_to_mongo, close_mongo_connection 
from fastapi.responses import JSONResponse
from app.core.utils import custom_jsonable_encoder
from bson import ObjectId
import datetime
# Import core components
from app.core import (
    settings,
    initialize_core,
    connect_to_mongo,
    close_mongo_connection,
    health_check,
    shutdown_core,
    get_logger,
)

# Import API routes
from app.api.v1.api import api_router

# Import middleware
from app.middleware.auth_middleware import AuthMiddleware
from app.middleware.logging_middleware import LoggingMiddleware

# Import dependencies
from app.dependencies.auth import get_current_user

# Import schemas for error responses
from app.schemas import ErrorResponse, MessageResponse

# Get logger
logger = get_logger(__name__)

class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        import uuid
        request_id = str(uuid.uuid4())
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        if process_time > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s",
                extra={"request_id": request_id, "process_time": process_time},
            )
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if settings.SECURITY_HEADERS_ENABLED:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = settings.FRAME_OPTIONS
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            if request.url.scheme == "https":
                response.headers["Strict-Transport-Security"] = f"max-age={settings.HSTS_MAX_AGE}; includeSubDomains"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting AI-Enhanced SaaS CRM...")
    try:
        initialize_core()
        await connect_to_mongo()
        logger.info("✅ Application startup completed successfully")
        yield
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    finally:
        logger.info("🔄 Shutting down AI-Enhanced SaaS CRM...")
        try:
            await close_mongo_connection()
            await shutdown_core()
            logger.info("✅ Application shutdown completed successfully")
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}")



def serialize_object_id(obj: Any) -> Any:
    """
    Recursively serialize MongoDB ObjectId to string in a nested structure.
    Works with dictionaries, lists, and individual ObjectId values.
    """
    if isinstance(obj, dict):
        return {k: serialize_object_id(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_object_id(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime.datetime):
        return obj.isoformat()
    elif isinstance(obj, datetime.date):
        return obj.isoformat()
    else:
        return obj

class CustomJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        serialized_content = serialize_object_id(content)
        return super().render(serialized_content)

# ✅ CREATE APP
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Enhanced SaaS CRM for Service Companies",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.OPENAPI_URL else None,
    docs_url="/docs" if settings.DOCS_URL else None,
    redoc_url="/redoc" if settings.REDOC_URL else None,
    lifespan=lifespan,
    default_response_class=CustomJSONResponse,
    contact={
        "name": "CRM Support Team",
        "url": "https://yourcompany.com/support", 
        "email": "support@yourcompany.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# ---- CORS (before include_router) ----
origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://localhost:3000",  # Add any other origins you need
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://*.railway.app",
]

# Or get from environment:
raw = getattr(settings, "BACKEND_CORS_ORIGINS", "")
if isinstance(raw, str):
    origins = [o.strip() for o in raw.split(",") if o.strip()]
elif isinstance(raw, (list, tuple)):
    origins = list(raw)

# ✅ CORS MIDDLEWARE (MUST BE FIRST MIDDLEWARE)
print("CORS origins:", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # DO NOT use "*"
    allow_credentials=True,         # you send auth headers/cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ✅ OTHER MIDDLEWARE
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestTimingMiddleware)
app.add_middleware(LoggingMiddleware)

@app.on_event("startup")
async def startup():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()
# ✅ EXCEPTION HANDLERS
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    if "ObjectId" in str(exc):
        logger.error(f"ObjectId serialization error: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error with data serialization"},
        )
    raise exc

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={"validation_errors": errors}
    )
    content = ErrorResponse(
        error="validation_error",
        message="Request validation failed",
        details={"errors": errors, "path": str(request.url.path), "method": request.method}
    ).model_dump()
    return JSONResponse(status_code=422, content=jsonable_encoder(content))

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        extra={"path": request.url.path, "method": request.method, "exception_type": type(exc).__name__}
    )
    error_message = str(exc) if settings.DEBUG else "Internal server error"
    content = ErrorResponse(
        error="internal_error",
        message=error_message,
        details={"path": str(request.url.path), "method": request.method} if settings.DEBUG else None
    ).model_dump()
    return JSONResponse(status_code=500, content=jsonable_encoder(content))

# ✅ INCLUDE API ROUTER
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api/v1")
# ✅ ESSENTIAL ENDPOINTS
@app.get("/", response_model=MessageResponse, tags=["Root"])
async def root():
    return MessageResponse(
        message=f"Welcome to {settings.PROJECT_NAME} API",
        data={
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "docs_url": "/docs" if settings.DOCS_URL else None,
            "api_prefix": settings.API_V1_STR,
            "features": {
                "ai_features": settings.ENABLE_AI_FEATURES,
                "sms_automation": settings.ENABLE_SMS_AUTOMATION,
                "email_automation": settings.ENABLE_EMAIL_AUTOMATION,
                "integrations": settings.ENABLE_INTEGRATIONS,
                "analytics": settings.ENABLE_ANALYTICS,
            },
        },
    )


# In backend/app/main.py, add this function

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        extra={"path": request.url.path, "method": request.method, "exception_type": type(exc).__name__}
    )
    error_message = str(exc) if settings.DEBUG else "Internal server error"
    content = ErrorResponse(
        error="internal_error",
        message=error_message,
        details={"path": str(request.url.path), "method": request.method} if settings.DEBUG else None
    ).model_dump()
    return JSONResponse(status_code=500, content=custom_jsonable_encoder(content))


@app.get("/health", tags=["Health"])
async def health_check_endpoint():
    health_status = await health_check()
    status_code = 200 if health_status.get("status") == "healthy" else 503
    return ORJSONResponse(status_code=status_code, content=jsonable_encoder(health_status))

@app.get("/health/liveness", tags=["Health"])
async def liveness_check():
    return {"status": "alive", "timestamp": time.time()}

@app.get("/health/readiness", tags=["Health"])
async def readiness_check():
    try:
        from app.core.database import ping_database
        db_healthy = await ping_database()
        if db_healthy:
            return {"status": "ready", "timestamp": time.time()}
        else:
            return ORJSONResponse(status_code=503, content=jsonable_encoder({"status": "not_ready", "reason": "database_unavailable"}))
    except Exception as e:
        return ORJSONResponse(status_code=503, content=jsonable_encoder({"status": "not_ready", "reason": str(e)}))

# ✅ DEBUG ENDPOINT (SINGLE VERSION)
@app.get("/debug/routes", tags=["Debug"])
async def debug_routes():
    """Debug endpoint to see all routes"""
    routes_info = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = list(route.methods) if route.methods else []
            routes_info.append({
                "path": route.path,
                "methods": methods,
                "name": getattr(route, 'name', 'Unknown')
            })
    
    return {
        "total_routes": len(routes_info),
        "routes": routes_info,
        "api_routes": [r for r in routes_info if '/api/v1/' in r['path']],
        "users_routes": [r for r in routes_info if 'users' in r['path']],
        "contacts_routes": [r for r in routes_info if 'contacts' in r['path']]
    }

# backend/app/main.py - ADD THIS SIMPLE TEST ENDPOINT
# Add this to your main.py file temporarily for testing

from fastapi import WebSocket, WebSocketDisconnect



# Also add this regular endpoint to test if API is working
@app.get("/test-api")
async def test_api():
    """Test if API is working"""
    return {"message": "API is working!", "timestamp": "2025-01-01"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        workers=1 if settings.DEBUG else 4,
        loop="uvloop" if not settings.DEBUG else "asyncio",
    )

