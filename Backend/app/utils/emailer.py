# app/utils/emailer.py
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from app.core.config import settings  # must expose EMAIL_* in settings

def send_email(to_email: str, subject: str, html_body: str):
    msg = MIMEText(html_body, "html", "utf-8")
    # From name is optional — change “StormAI” to your brand
    msg["From"] = formataddr(("StormAI", settings.EMAIL_USER))
    msg["To"] = to_email
    msg["Subject"] = subject

    with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=20) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.sendmail(settings.EMAIL_USER, [to_email], msg.as_string())
