# backend/app/services/customer_notification_service.py - FIX DATABASE CHECK

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import asyncio
import hashlib
import base64
from typing import Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class CustomerNotificationService:
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        self.db = db
        self.smtp_server = (
            os.getenv("EMAIL_HOST") or 
            os.getenv("SMTP_HOST") or 
            "smtp.gmail.com"
        )
        self.smtp_port = int(
            os.getenv("EMAIL_PORT") or 
            os.getenv("SMTP_PORT") or 
            "587"
        )
        self.email_user = (
            os.getenv("EMAIL_USER") or 
            os.getenv("SMTP_USER") or
            "hpraza8@gmail.com"
        )
        self.email_password = (
            os.getenv("EMAIL_PASSWORD") or 
            os.getenv("SMTP_PASSWORD") or
            "vtvfxcgknmrmqncu"
        )
        
        # Base URL for unsubscribe links
        self.base_url = os.getenv("BASE_URL", "http://localhost:8000")
        
        if not self.email_user or not self.email_password:
            logger.warning("⚠️ Email credentials not configured - email features disabled")
        else:
            logger.info("✅ Email credentials configured successfully")
    
    async def is_email_unsubscribed(self, email: str, email_type: str = "booking") -> bool:
        """Check if email is unsubscribed from specific email type"""
        # ✅ FIX: Compare with None instead of using bool()
        if self.db is None:
            return False
            
        try:
            unsubscribe_record = await self.db.email_unsubscribes.find_one({
                "email": email,
                "email_type": email_type
            })
            return unsubscribe_record is not None
        except Exception as e:
            logger.error(f"❌ Error checking unsubscribe status: {e}")
            return False
    
    def _generate_unsubscribe_token(self, email: str, booking_id: str = None) -> str:
        """Generate a secure unsubscribe token"""
        secret = os.getenv("SECRET_KEY", "default_secret_key")
        data = f"{email}:general:{secret}"
        token = hashlib.sha256(data.encode()).hexdigest()[:32]
        return base64.urlsafe_b64encode(f"{email}:{token}".encode()).decode()
    
    def _create_unsubscribe_url(self, email: str, booking_id: str = None, email_type: str = "booking") -> str:
        """Create unsubscribe URL"""
        token = self._generate_unsubscribe_token(email, booking_id)
        return f"{self.base_url}/api/v1/email/unsubscribe?token={token}&type={email_type}"
        
    async def send_booking_confirmation(self, booking_data: Dict[str, Any]) -> bool:
        """Send booking confirmation email to customer"""
        try:
            customer_email = booking_data.get("customer_email")
            customer_name = booking_data.get("customer_name", "Customer")
            booking_id = booking_data.get("booking_id", "")
            
            if not customer_email:
                logger.error("❌ No customer email provided")
                return False
            
            if not self.email_user or not self.email_password:
                logger.error("❌ Email credentials not configured")
                return False
            
            # ✅ FIX: Check if user has unsubscribed (only if database is available)
            if self.db is not None:
                is_unsubscribed = await self.is_email_unsubscribed(customer_email, "booking")
                if is_unsubscribed:
                    logger.info(f"📧 Email {customer_email} is unsubscribed from booking emails - skipping")
                    return True  # Return True since it's not an error, just a preference
            
            # Create unsubscribe URL
            unsubscribe_url = self._create_unsubscribe_url(customer_email, booking_id, "booking")
            
            # Create email content with unsubscribe button
            subject = f"🎉 Booking Confirmed - {booking_data.get('service_type', 'Service')}"
            
            html_content = self._create_confirmation_email_html(booking_data, unsubscribe_url)
            text_content = self._create_confirmation_email_text(booking_data, unsubscribe_url)
            
            # Send email
            success = await self._send_email(
                to_email=customer_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
            if success:
                logger.info(f"✅ Booking confirmation sent to {customer_email}")
                
                # ✅ FIX: Log email sent (only if database is available)
                if self.db is not None:
                    try:
                        await self.db.email_logs.insert_one({
                            "email": customer_email,
                            "email_type": "booking_confirmation",
                            "booking_id": booking_id,
                            "subject": subject,
                            "sent_at": datetime.utcnow(),
                            "status": "sent"
                        })
                    except Exception as log_error:
                        logger.warning(f"⚠️ Could not log email: {log_error}")
            else:
                logger.error(f"❌ Failed to send confirmation to {customer_email}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error sending booking confirmation: {e}")
            return False
    
    def _create_confirmation_email_html(self, booking_data: Dict[str, Any], unsubscribe_url: str) -> str:
        """Create HTML email content with unsubscribe button"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmed</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }}
                .content {{ padding: 30px; background: #f8f9fa; }}
                .booking-card {{ background: white; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #28a745; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
                .detail-label {{ font-weight: bold; color: #666; }}
                .detail-value {{ color: #333; }}
                .highlight-box {{ background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }}
                .footer {{ background: #333; padding: 20px; text-align: center; color: white; font-size: 12px; }}
                .unsubscribe-section {{ background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd; }}
                .unsubscribe-btn {{ 
                    display: inline-block; 
                    padding: 10px 20px; 
                    background: #dc3545; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-size: 12px;
                    margin: 10px 0;
                }}
                .unsubscribe-btn:hover {{ background: #c82333; }}
                .unsubscribe-text {{ font-size: 11px; color: #666; margin-top: 10px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
                <p>Your service has been scheduled successfully</p>
            </div>
            
            <div class="content">
                <h2>Hi {booking_data.get('customer_name', 'Customer')},</h2>
                
                <p>Great news! Your booking has been <strong>confirmed</strong> by our team. We're all set to provide you with excellent service.</p>
                
                <div class="booking-card">
                    <h3>📋 Your Booking Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span class="detail-value">{booking_data.get('service_type', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">{booking_data.get('location', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Scheduled Time:</span>
                        <span class="detail-value">{booking_data.get('scheduled_time', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Frequency:</span>
                        <span class="detail-value">{booking_data.get('frequency', 'one-time').title()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estimated Price:</span>
                        <span class="detail-value">PKR {booking_data.get('estimated_price', 0):,}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Booking ID:</span>
                        <span class="detail-value">{booking_data.get('booking_id', 'N/A')}</span>
                    </div>
                </div>
                
                <div class="highlight-box">
                    <h4>📱 What Happens Next?</h4>
                    <ul>
                        <li><strong>Our team will arrive</strong> at the scheduled time</li>
                        <li><strong>We'll call you</strong> 30 minutes before arrival</li>
                        <li><strong>All equipment included</strong> - no extra charges</li>
                        <li><strong>Quality guaranteed</strong> - 100% satisfaction promise</li>
                    </ul>
                </div>
                
                <div class="highlight-box" style="border-left-color: #ff9800; background: #fff3e0;">
                    <h4>⚠️ Need to Make Changes?</h4>
                    <p>If you need to reschedule or cancel, please contact us at least 2 hours in advance:</p>
                    <p><strong>📞 Phone:</strong> +92 300 123 4567<br>
                    <strong>📧 Email:</strong> support@stormai.com</p>
                </div>
                
                <p>Thank you for choosing our services! We look forward to serving you.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p><strong>Best regards,</strong><br>Your Storm AI Service Team</p>
                </div>
            </div>
            
            <!-- Unsubscribe Section -->
            <div class="unsubscribe-section">
                <h4>📧 Email Preferences</h4>
                <p style="font-size: 12px; color: #666; margin: 10px 0;">
                    Don't want to receive booking confirmations and updates?
                </p>
                <a href="{unsubscribe_url}" class="unsubscribe-btn">
                    🚫 Unsubscribe from Email Notifications
                </a>
                <div class="unsubscribe-text">
                    Note: You'll still receive important service-related communications.<br>
                    You can manage your preferences or resubscribe anytime.
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated confirmation email for booking #{booking_data.get('booking_id', 'N/A')}</p>
                <p>Powered by Storm AI - Your AI-Enhanced Service Platform</p>
                <p style="font-size: 10px; margin-top: 10px;">
                    Storm AI Services | Lahore, Pakistan<br>
                    <a href="mailto:support@stormai.com" style="color: #ccc;">support@stormai.com</a>
                </p>
            </div>
        </body>
        </html>
        """
    
    def _create_confirmation_email_text(self, booking_data: Dict[str, Any], unsubscribe_url: str) -> str:
        """Create plain text email content with unsubscribe link"""
        return f"""
        🎉 BOOKING CONFIRMED!
        
        Hi {booking_data.get('customer_name', 'Customer')},
        
        Great news! Your booking has been confirmed by our team.
        
        📋 YOUR BOOKING DETAILS:
        ----------------------------------------
        Service: {booking_data.get('service_type', 'N/A')}
        Location: {booking_data.get('location', 'N/A')}
        Scheduled Time: {booking_data.get('scheduled_time', 'N/A')}
        Frequency: {booking_data.get('frequency', 'one-time').title()}
        Estimated Price: PKR {booking_data.get('estimated_price', 0):,}
        Booking ID: {booking_data.get('booking_id', 'N/A')}
        
        📱 WHAT HAPPENS NEXT?
        ----------------------------------------
        - Our team will arrive at the scheduled time
        - We'll call you 30 minutes before arrival
        - All equipment included - no extra charges
        - Quality guaranteed - 100% satisfaction promise
        
        ⚠️ NEED TO MAKE CHANGES?
        ----------------------------------------
        Phone: +92 300 123 4567
        Email: support@stormai.com
        
        Thank you for choosing our services!
        
        Best regards,
        Your Storm AI Service Team
        
        ----------------------------------------
        📧 EMAIL PREFERENCES:
        Don't want to receive these emails? Unsubscribe here:
        {unsubscribe_url}
        
        Note: You'll still receive important service-related communications.
        ----------------------------------------
        
        Powered by Storm AI - Your AI-Enhanced Service Platform
        """
    
    async def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send email using SMTP with proper async handling"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add unsubscribe headers (RFC compliance)
            unsubscribe_url = self._create_unsubscribe_url(to_email, None, "booking")
            msg['List-Unsubscribe'] = f"<{unsubscribe_url}>"
            msg['List-Unsubscribe-Post'] = "List-Unsubscribe=One-Click"
            
            # Create text and HTML parts
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email in thread pool to avoid blocking
            def send_sync():
                try:
                    with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                        server.starttls()
                        server.login(self.email_user, self.email_password)
                        server.send_message(msg)
                    return True
                except Exception as e:
                    logger.error(f"❌ SMTP Error: {e}")
                    return False
            
            # Run in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, send_sync)
            return result
            
        except Exception as e:
            logger.error(f"❌ Email sending failed: {e}")
            return False











# # backend/app/services/customer_notification_service.py - WITH DEBUG

# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# import os
# import logging
# import asyncio
# from typing import Dict, Any, Optional
# from datetime import datetime

# logger = logging.getLogger(__name__)

# class CustomerNotificationService:
#     def __init__(self):
#         # Debug environment variables
#         logger.info(f"🔍 DEBUG - EMAIL_HOST: {os.getenv('EMAIL_HOST')}")
#         logger.info(f"🔍 DEBUG - EMAIL_PORT: {os.getenv('EMAIL_PORT')}")
#         logger.info(f"🔍 DEBUG - EMAIL_USER: {os.getenv('EMAIL_USER')}")
#         logger.info(f"🔍 DEBUG - EMAIL_PASSWORD exists: {bool(os.getenv('EMAIL_PASSWORD'))}")
#         logger.info(f"🔍 DEBUG - SMTP_HOST: {os.getenv('SMTP_HOST')}")
#         logger.info(f"🔍 DEBUG - SMTP_USER: {os.getenv('SMTP_USER')}")
#         logger.info(f"🔍 DEBUG - SMTP_PASSWORD exists: {bool(os.getenv('SMTP_PASSWORD'))}")
        
#         # Try multiple environment variable names
#         self.smtp_server = (
#             os.getenv("EMAIL_HOST") or 
#             os.getenv("SMTP_HOST") or 
#             "smtp.gmail.com"
#         )
#         self.smtp_port = int(
#             os.getenv("EMAIL_PORT") or 
#             os.getenv("SMTP_PORT") or 
#             "587"
#         )
#         self.email_user = (
#             os.getenv("EMAIL_USER") or 
#             os.getenv("SMTP_USER") or
#             "hpraza8@gmail.com"  # Fallback to your new email
#         )
#         self.email_password = (
#             os.getenv("EMAIL_PASSWORD") or 
#             os.getenv("SMTP_PASSWORD") or
#             "vtvfxcgknmrmqncu"  # Fallback to your new password
#         )
        
#         logger.info(f"✅ Final config - Server: {self.smtp_server}, Port: {self.smtp_port}")
#         logger.info(f"✅ Final config - User: {self.email_user}, Password exists: {bool(self.email_password)}")
        
#         # Validate configuration on initialization
#         if not self.email_user or not self.email_password:
#             logger.warning("⚠️ Email credentials not configured - email features disabled")
#         else:
#             logger.info("✅ Email credentials configured successfully")
        
#     async def send_booking_confirmation(self, booking_data: Dict[str, Any]) -> bool:
#         """Send booking confirmation email to customer"""
#         try:
#             customer_email = booking_data.get("customer_email")
#             customer_name = booking_data.get("customer_name", "Customer")
            
#             if not customer_email:
#                 logger.error("❌ No customer email provided")
#                 return False
            
#             if not self.email_user or not self.email_password:
#                 logger.error("❌ Email credentials not configured")
#                 logger.error(f"❌ EMAIL_USER: {self.email_user}")
#                 logger.error(f"❌ EMAIL_PASSWORD: {'***' if self.email_password else 'None'}")
#                 return False
            
#             # Create email content
#             subject = f"🎉 Booking Confirmed - {booking_data.get('service_type', 'Service')}"
            
#             html_content = self._create_confirmation_email_html(booking_data)
#             text_content = self._create_confirmation_email_text(booking_data)
            
#             # Send email
#             success = await self._send_email(
#                 to_email=customer_email,
#                 subject=subject,
#                 html_content=html_content,
#                 text_content=text_content
#             )
            
#             if success:
#                 logger.info(f"✅ Booking confirmation sent to {customer_email}")
#             else:
#                 logger.error(f"❌ Failed to send confirmation to {customer_email}")
                
#             return success
            
#         except Exception as e:
#             logger.error(f"❌ Error sending booking confirmation: {e}")
#             return False
    
#     def _create_confirmation_email_html(self, booking_data: Dict[str, Any]) -> str:
#         """Create HTML email content"""
#         return f"""
#         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
#             <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
#                 <h1>🎉 Booking Confirmed!</h1>
#                 <p>Your service has been scheduled successfully</p>
#             </div>
            
#             <div style="padding: 30px; background: #f8f9fa;">
#                 <h2>Hi {booking_data.get('customer_name', 'Customer')},</h2>
#                 <p>Great news! Your booking has been <strong>confirmed</strong> by our team.</p>
                
#                 <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #28a745;">
#                     <h3>📋 Your Booking Details</h3>
#                     <p><strong>Service:</strong> {booking_data.get('service_type', 'N/A')}</p>
#                     <p><strong>Location:</strong> {booking_data.get('location', 'N/A')}</p>
#                     <p><strong>Time:</strong> {booking_data.get('scheduled_time', 'N/A')}</p>
#                     <p><strong>Price:</strong> PKR {booking_data.get('estimated_price', 0):,}</p>
#                     <p><strong>Booking ID:</strong> {booking_data.get('booking_id', 'N/A')}</p>
#                 </div>
                
#                 <p>Thank you for choosing our services!</p>
#             </div>
#         </div>
#         """
    
#     def _create_confirmation_email_text(self, booking_data: Dict[str, Any]) -> str:
#         """Create plain text email content"""
#         return f"""
#         🎉 BOOKING CONFIRMED!
        
#         Hi {booking_data.get('customer_name', 'Customer')},
        
#         Your booking has been confirmed:
        
#         Service: {booking_data.get('service_type', 'N/A')}
#         Location: {booking_data.get('location', 'N/A')}
#         Time: {booking_data.get('scheduled_time', 'N/A')}
#         Price: PKR {booking_data.get('estimated_price', 0):,}
#         Booking ID: {booking_data.get('booking_id', 'N/A')}
        
#         Thank you for choosing our services!
#         """
    
#     async def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
#         """Send email using SMTP with proper async handling"""
#         try:
#             logger.info(f"📧 Attempting to send email to {to_email}")
#             logger.info(f"📧 Using SMTP server: {self.smtp_server}:{self.smtp_port}")
#             logger.info(f"📧 Using credentials: {self.email_user}")
            
#             # Create message
#             msg = MIMEMultipart('alternative')
#             msg['From'] = self.email_user
#             msg['To'] = to_email
#             msg['Subject'] = subject
            
#             # Create text and HTML parts
#             text_part = MIMEText(text_content, 'plain', 'utf-8')
#             html_part = MIMEText(html_content, 'html', 'utf-8')
            
#             msg.attach(text_part)
#             msg.attach(html_part)
            
#             # Send email in thread pool to avoid blocking
#             def send_sync():
#                 try:
#                     logger.info(f"🔗 Connecting to {self.smtp_server}:{self.smtp_port}")
#                     with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
#                         logger.info("✅ Connected to SMTP server")
                        
#                         server.starttls()  # Enable TLS
#                         logger.info("✅ TLS enabled")
                        
#                         server.login(self.email_user, self.email_password)
#                         logger.info("✅ SMTP authentication successful")
                        
#                         server.send_message(msg)
#                         logger.info("✅ Email sent successfully")
                        
#                     return True
#                 except smtplib.SMTPAuthenticationError as e:
#                     logger.error(f"❌ SMTP Authentication Error: {e}")
#                     return False
#                 except smtplib.SMTPException as e:
#                     logger.error(f"❌ SMTP Error: {e}")
#                     return False
#                 except Exception as e:
#                     logger.error(f"❌ General SMTP Error: {e}")
#                     return False
            
#             # Run in thread pool
#             loop = asyncio.get_event_loop()
#             result = await loop.run_in_executor(None, send_sync)
#             return result
            
#         except Exception as e:
#             logger.error(f"❌ Email sending failed: {e}")
#             return False