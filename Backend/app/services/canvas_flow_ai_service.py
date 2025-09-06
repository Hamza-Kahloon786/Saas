# backend/app/services/canvas_flow_ai_service.py - NEW FILE
import openai
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.config import settings

logger = logging.getLogger(__name__)

class CanvasFlowAIService:
    """AI Service that reads from Canvas Flow data"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        
    async def get_company_flows(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch active flows for a company"""
        try:
            flows = await self.db.conversation_flows.find({
                "company_id": ObjectId(company_id),
                "active": True
            }).to_list(length=100)
            
            logger.info(f"Found {len(flows)} active flows for company {company_id}")
            return flows
            
        except Exception as e:
            logger.error(f"Error fetching company flows: {e}")
            return []
    
    async def parse_services_from_flows(self, company_id: str) -> Dict[str, List[str]]:
        """Parse services and their categories from flow nodes"""
        try:
            flows = await self.get_company_flows(company_id)
            services_map = {}
            
            for flow in flows:
                nodes = flow.get("nodes", [])
                
                for node in nodes:
                    node_data = node.get("data", {})
                    node_type = node.get("type", "")
                    
                    # Look for conversation nodes that contain services
                    if node_type == "conversation" and "transitions" in node_data:
                        transitions = node_data.get("transitions", [])
                        node_title = node_data.get("title", "")
                        
                        # If this node represents a main service category
                        if transitions:
                            services_map[node_title.lower()] = transitions
                            logger.info(f"Found service category '{node_title}' with services: {transitions}")
            
            logger.info(f"Parsed services map: {services_map}")
            return services_map
            
        except Exception as e:
            logger.error(f"Error parsing services from flows: {e}")
            return {}
    
    async def find_service_path(self, company_id: str, user_message: str) -> Dict[str, Any]:
        """Find the appropriate service path based on user message"""
        try:
            services_map = await self.parse_services_from_flows(company_id)
            message_lower = user_message.lower()
            
            # Check for service matches
            for main_service, sub_services in services_map.items():
                # Check if main service is mentioned
                if main_service in message_lower:
                    # Check for specific sub-service
                    for sub_service in sub_services:
                        if sub_service.lower() in message_lower:
                            return {
                                "matched": True,
                                "main_service": main_service.title(),
                                "sub_service": sub_service.title(),
                                "service_path": f"{main_service.title()} > {sub_service.title()}",
                                "available_sub_services": sub_services
                            }
                    
                    # Main service found but no specific sub-service
                    return {
                        "matched": True,
                        "main_service": main_service.title(),
                        "sub_service": None,
                        "service_path": main_service.title(),
                        "available_sub_services": sub_services
                    }
                
                # Check if any sub-service is mentioned directly
                for sub_service in sub_services:
                    if sub_service.lower() in message_lower:
                        return {
                            "matched": True,
                            "main_service": main_service.title(),
                            "sub_service": sub_service.title(),
                            "service_path": f"{main_service.title()} > {sub_service.title()}",
                            "available_sub_services": sub_services
                        }
            
            # No match found
            all_services = []
            for main_service, sub_services in services_map.items():
                all_services.append(f"{main_service.title()}: {', '.join(sub_services)}")
            
            return {
                "matched": False,
                "main_service": None,
                "sub_service": None,
                "service_path": None,
                "available_services": all_services
            }
            
        except Exception as e:
            logger.error(f"Error finding service path: {e}")
            return {"matched": False, "error": str(e)}
    
    async def generate_canvas_response(
        self, 
        company_id: str, 
        message: str, 
        conversation_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """Generate AI response based on canvas flow data"""
        try:
            # Find service path from canvas flows
            service_match = await self.find_service_path(company_id, message)
            
            if service_match.get("matched"):
                main_service = service_match.get("main_service")
                sub_service = service_match.get("sub_service")
                available_sub_services = service_match.get("available_sub_services", [])
                
                if sub_service:
                    # Specific service found
                    response_message = f"✅ Great! We do provide {sub_service} services under our {main_service} category. "
                    
                    if sub_service.lower() == "mobile":
                        response_message += "We offer mobile repair services including screen replacement, battery replacement, software troubleshooting, and hardware repairs. Would you like to know more about our mobile repair pricing or schedule a service?"
                    elif sub_service.lower() == "laptop":
                        response_message += "We offer laptop repair services including hardware diagnostics, software troubleshooting, screen replacement, and performance optimization. Would you like to schedule a laptop repair service?"
                    elif sub_service.lower() == "cleaning":
                        response_message += "We offer comprehensive cleaning services for homes and offices. Would you like to know about our cleaning packages and pricing?"
                    else:
                        response_message += f"Our {sub_service} service is available. Would you like more information or to schedule an appointment?"
                    
                    return {
                        "message": response_message,
                        "intent": "service_found",
                        "matched_service": {
                            "main": main_service,
                            "sub": sub_service,
                            "path": service_match.get("service_path")
                        },
                        "requires_human": False
                    }
                
                elif main_service and available_sub_services:
                    # Main service found, show sub-options
                    sub_services_list = ", ".join(available_sub_services)
                    response_message = f"We offer {main_service} services! Specifically, we provide: {sub_services_list}. Which of these {main_service.lower()} services are you interested in?"
                    
                    return {
                        "message": response_message,
                        "intent": "service_category_found",
                        "matched_service": {
                            "main": main_service,
                            "sub": None,
                            "options": available_sub_services
                        },
                        "requires_human": False
                    }
            
            else:
                # No service found - show available services from canvas
                available_services = service_match.get("available_services", [])
                
                if available_services:
                    services_text = "\n".join([f"• {service}" for service in available_services])
                    response_message = f"I apologize, but we don't currently offer that specific service. However, we do provide the following services:\n\n{services_text}\n\nWhich of these services interests you?"
                else:
                    response_message = "I'm sorry, but I couldn't find information about our available services at the moment. Please contact our support team for assistance."
                
                return {
                    "message": response_message,
                    "intent": "service_not_found",
                    "matched_service": None,
                    "available_services": available_services,
                    "requires_human": False
                }
                
        except Exception as e:
            logger.error(f"Error generating canvas response: {e}")
            return {
                "message": "I'm experiencing technical difficulties. Please try again or contact our support team.",
                "intent": "error",
                "matched_service": None,
                "requires_human": True
            }
    
    async def get_flow_statistics(self, company_id: str) -> Dict[str, Any]:
        """Get statistics about flows and their usage"""
        try:
            # Count flows
            total_flows = await self.db.conversation_flows.count_documents({
                "company_id": ObjectId(company_id)
            })
            
            active_flows = await self.db.conversation_flows.count_documents({
                "company_id": ObjectId(company_id),
                "active": True
            })
            
            # Get services from flows
            services_map = await self.parse_services_from_flows(company_id)
            total_services = sum(len(sub_services) for sub_services in services_map.values())
            
            return {
                "total_flows": total_flows,
                "active_flows": active_flows,
                "service_categories": len(services_map),
                "total_services": total_services,
                "services_breakdown": services_map
            }
            
        except Exception as e:
            logger.error(f"Error getting flow statistics: {e}")
            return {
                "total_flows": 0,
                "active_flows": 0,
                "service_categories": 0,
                "total_services": 0,
                "services_breakdown": {}
            }
