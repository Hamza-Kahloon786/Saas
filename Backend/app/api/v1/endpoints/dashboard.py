from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_stats():
    # mock data — replace with real service/db calls
    now = datetime.utcnow()
    revenue_data = [
        {"date": (now - timedelta(days=i)).date().isoformat(), "value": 10000 + i * 150}
        for i in range(12)
    ]
    return {
        "monthly_revenue": 45230,
        "revenue_change": 12.4,
        "active_leads": 38,
        "leads_change": -3.1,
        "total_customers": 812,
        "customers_change": 1.8,
        "weekly_jobs": 27,
        "jobs_change": 4.2,
        "revenue_data": list(reversed(revenue_data)),
    }

@router.get("/recent-activity")
async def recent_activity():
    now = datetime.utcnow()
    return [
        {"description": "New lead created: John Doe", "time": (now).isoformat()},
        {"description": "Invoice #INV-102 paid", "time": (now - timedelta(minutes=15)).isoformat()},
        {"description": "Job scheduled for tomorrow", "time": (now - timedelta(hours=2)).isoformat()},
    ]
