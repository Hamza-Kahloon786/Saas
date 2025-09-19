from datetime import datetime
from bson import ObjectId

def serialize_user(user: dict) -> dict:
    """Convert MongoDB user doc to safe JSON response."""
    if not user:
        return {}

    serialized = {}

    for key, value in user.items():
        # Convert ObjectId → string
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        # Convert datetime → isoformat
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value

    # Remove sensitive fields
    serialized.pop("hashed_password", None)
    serialized.pop("password_hash", None)

    # Add convenient fields
    serialized["id"] = str(user.get("_id")) if "_id" in user else None
    serialized["company_id"] = str(user.get("company_id")) if user.get("company_id") else None
    serialized["full_name"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    serialized["display_name"] = user.get("first_name") or user.get("email")
    serialized["is_active"] = user.get("status") == "active"
    serialized["is_admin"] = user.get("role") == "admin"

    return serialized
