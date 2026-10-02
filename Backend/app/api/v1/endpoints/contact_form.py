# backend/app/api/v1/endpoints/contact_form.py
import asyncio
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
import logging

from app.utils.emailer import send_email

router = APIRouter()
logger = logging.getLogger(__name__)

class ContactFormSubmission(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    businessName: str = Field(..., min_length=1, max_length=200, alias="businessName")
    phone: str = Field(..., min_length=1, max_length=20)
    email: EmailStr
    inquiry: str = Field(..., min_length=1, max_length=2000)

    class Config:
        populate_by_name = True

@router.post("/")
async def submit_contact_form(
    contact_data: ContactFormSubmission
) -> Any:
    """
    Public endpoint to handle contact form submissions
    No authentication required - sends email to Renato@stormai.net
    """
    try:
        logger.info(f"📧 Received contact form submission from {contact_data.email}")
        
        # Create HTML email body
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #0038FF; border-bottom: 2px solid #0038FF; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="margin: 20px 0;">
                        <p style="margin: 10px 0;">
                            <strong style="color: #0F1724;">Name:</strong> {contact_data.name}
                        </p>
                        <p style="margin: 10px 0;">
                            <strong style="color: #0F1724;">Business Name:</strong> {contact_data.businessName}
                        </p>
                        <p style="margin: 10px 0;">
                            <strong style="color: #0F1724;">Phone:</strong> {contact_data.phone}
                        </p>
                        <p style="margin: 10px 0;">
                            <strong style="color: #0F1724;">Email:</strong> 
                            <a href="mailto:{contact_data.email}" style="color: #0038FF;">{contact_data.email}</a>
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                        <p style="margin: 0 0 10px 0;">
                            <strong style="color: #0F1724;">Inquiry:</strong>
                        </p>
                        <p style="margin: 0; white-space: pre-wrap;">{contact_data.inquiry}</p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                        <p>This email was sent from the Storm AI contact form.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Send email using your existing emailer utility
        # smtplib is blocking; run it in a thread so it doesn't freeze the event loop
        await asyncio.to_thread(
            send_email,
            to_email="Renato@stormai.net",
            subject=f"New Contact Form Submission from {contact_data.name}",
            html_body=html_body
        )
        
        logger.info(f"✉️ Contact form email sent successfully to Renato@stormai.net")
        
        return {
            "message": "Contact form submitted successfully",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please try again or email us directly at Renato@stormai.net"
        )