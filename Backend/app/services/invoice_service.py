# app/services/invoice_service.py
from __future__ import annotations
from typing import Any, Dict, List, Union
from datetime import datetime, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# If you have a Pydantic schema, import it; otherwise we treat input as dict
try:
    from app.schemas.invoice import InvoiceCreate  # optional
except Exception:  # pragma: no cover
    InvoiceCreate = BaseModel  # fallback so typing still works


def _as_objid(value: Any) -> ObjectId | None:
    """Convert a string to ObjectId if valid; pass through ObjectId; else None."""
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, str) and ObjectId.is_valid(value):
        return ObjectId(value)
    return None


def _money(n: Any) -> float:
    try:
        return float(n or 0)
    except Exception:
        return 0.0


def _serialize_id(v: Any) -> str | None:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, (str, type(None))):
        return v
    return str(v)


def _serialize_invoice(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Make a Mongo document safe for JSON (strings for ObjectIds & datetimes)."""
    out = dict(doc)
    # ids
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    for k in ("company_id", "customer_id", "contact_id", "created_by"):
        if k in out:
            out[k] = _serialize_id(out[k])
    # datetimes
    for k in ("created_at", "updated_at", "due_date", "valid_until", "paid_at", "sent_at"):
        if k in out and isinstance(out[k], datetime):
            out[k] = out[k].isoformat()
    # line items: ensure numeric totals
    items = []
    for it in out.get("line_items", []) or []:
        items.append({
            "description": it.get("description", ""),
            "quantity": _money(it.get("quantity")),
            "unit_price": _money(it.get("unit_price")),
            "total": _money(it.get("quantity")) * _money(it.get("unit_price")),
        })
    out["line_items"] = items
    # numeric fields
    for k in ("subtotal", "tax_amount", "discount_amount", "total_amount", "tax_rate"):
        if k in out:
            out[k] = _money(out[k])
    return out


async def create_invoice(
    db: AsyncIOMotorDatabase,
    current_user: Dict[str, Any],
    invoice_in: Union[InvoiceCreate, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Create an invoice from either a Pydantic model or a plain dict and return a JSON-safe dict.
    """
    # Normalize input to a dict
    if isinstance(invoice_in, BaseModel):
        data: Dict[str, Any] = invoice_in.model_dump()
    elif isinstance(invoice_in, dict):
        data = dict(invoice_in)
    else:
        # Defensive: unsupported type
        raise TypeError("invoice_in must be a pydantic model or dict")

    # Required: a contact/customer id
    contact_id = data.get("contact_id") or data.get("customer_id")
    oid_contact = _as_objid(contact_id)
    if oid_contact is None:
        raise ValueError("contact_id is required and must be a valid ObjectId string")

    # Company & creator
    company_oid = _as_objid(current_user.get("company_id"))
    if company_oid is None:
        raise ValueError("Invalid company_id on current_user")

    created_by_oid = _as_objid(current_user.get("_id"))

    # Line items & totals
    raw_items = data.get("line_items") or data.get("items") or []
    items: List[Dict[str, Any]] = []
    subtotal = 0.0
    for it in raw_items:
        desc = (it.get("description") or "").strip()
        qty = _money(it.get("quantity"))
        price = _money(it.get("unit_price"))
        total = qty * price
        items.append({"description": desc, "quantity": qty, "unit_price": price, "total": total})
        subtotal += total

    discount = _money(data.get("discount_amount"))
    tax_rate = _money(data.get("tax_rate"))
    taxable_base = max(0.0, subtotal - discount)
    tax_amount = (taxable_base * tax_rate) / 100.0
    total_amount = max(0.0, taxable_base + tax_amount)

    # Dates
    issue_date = datetime.utcnow()
    payment_terms_days = int(data.get("payment_terms_days") or 30)
    due_date = issue_date + timedelta(days=payment_terms_days)

    invoice_number = data.get("invoice_number")
    if not invoice_number:
        # Simple sequential-ish number; adapt to your needs
        invoice_number = f"INV-{issue_date.strftime('%Y%m%d')}-{str(ObjectId())[-4:]}"

    doc: Dict[str, Any] = {
        "company_id": company_oid,
        "customer_id": oid_contact,
        "contact_id": oid_contact,
        "created_by": created_by_oid,
        "invoice_number": invoice_number,
        "title": data.get("title") or data.get("service_type") or "Service Invoice",
        "description": data.get("description", ""),
        "status": data.get("status") or "draft",
        "line_items": items,
        "subtotal": subtotal,
        "discount_amount": discount,
        "tax_rate": tax_rate,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "issue_date": issue_date,
        "due_date": due_date,
        "notes": data.get("notes", ""),
        "terms_and_conditions": data.get("terms_and_conditions", ""),
        "created_at": issue_date,
        "updated_at": issue_date,
        # Optional lifecycle fields
        "paid_at": None,
        "sent_at": None,
    }

    result = await db.invoices.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_invoice(doc)
