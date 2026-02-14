import requests
import logging
from typing import Dict, Any
from utils.signature import generate_signature, generate_order_signature


logger = logging.getLogger(__name__)


class OmegatronikService:
    """Service for interacting with Omega Tronik H2H API"""
    
    def __init__(self, member_id: str, pin: str, password: str):
        """
        Initialize Omega Tronik service
        
        Args:
            member_id: Your Omega Tronik member ID
            pin: Your transaction PIN
            password: Your API password
        """
        self.member_id = member_id
        self.pin = pin
        self.password = password
        
        # API endpoints
        self.base_url = "https://apiomega.id"
        self.balance_endpoint = f"{self.base_url}/balance"
        self.order_endpoint = f"{self.base_url}/order"
        
        # Backup endpoints for failover
        self.backup_base_url = "http://188.166.178.169:6969"
        self.backup_balance_endpoint = f"{self.backup_base_url}/balance"
        self.backup_order_endpoint = f"{self.backup_base_url}/order"
    
    async def check_balance(self) -> Dict[str, Any]:
        """
        Check account balance
        
        Returns:
            Dict with 'success' (bool) and either 'data' or 'error'
        """
        try:
            signature = generate_signature(self.member_id, self.pin, self.password)
            
            # Try with form data first (common for PHP APIs)
            payload_form = {
                "member_id": self.member_id,
                "pin": self.pin,
                "password": self.password,
                "signature": signature
            }
            
            # Debug logging
            logger.info(f"=== BALANCE REQUEST DEBUG ===")
            logger.info(f"Endpoint: {self.balance_endpoint}")
            logger.info(f"Payload (Form): {payload_form}")
            logger.info(f"Signature: {signature}")
            
            response = requests.post(self.balance_endpoint, data=payload_form, timeout=30)
            
            logger.info(f"=== BALANCE RESPONSE DEBUG ===")
            logger.info(f"Status Code: {response.status_code}")
            logger.info(f"Headers: {dict(response.headers)}")
            logger.info(f"Response Content: {response.text}")
            
            if response.status_code == 200:
                # Check if response is plain text error
                if "Invalid" in response.text or "Error" in response.text:
                    return {
                        "success": False,
                        "error": response.text.strip()
                    }
                
                # Try to parse as JSON
                try:
                    data = response.json()
                except ValueError as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    return {
                        "success": False,
                        "error": f"Invalid API response: {response.text[:200]}"
                    }
                
                if data.get("status") == "success":
                    return {
                        "success": True,
                        "data": {
                            "saldo": data.get("balance", 0),
                            "status": data.get("account_status", "active")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Unknown error")
                    }
            else:
                # Try backup endpoint
                logger.warning("Primary endpoint failed, trying backup...")
                response = requests.post(self.backup_balance_endpoint, json=payload, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        return {
                            "success": True,
                            "data": {
                                "saldo": data.get("balance", 0),
                                "status": data.get("account_status", "active")
                            }
                        }
                
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout. Please try again."
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Connection error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error checking balance: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def order_product(self, destination: str, product_code: str) -> Dict[str, Any]:
        """
        Order a product
        
        Args:
            destination: Destination number (phone number, meter ID, etc.)
            product_code: Product code to order
            
        Returns:
            Dict with 'success' (bool) and either 'data' or 'error'
        """
        try:
            signature = generate_order_signature(
                self.member_id, self.pin, self.password, destination, product_code
            )
            
            # Try with form data first (common for PHP APIs)
            payload_form = {
                "member_id": self.member_id,
                "pin": self.pin,
                "password": self.password,
                "destination": destination,
                "product_code": product_code,
                "signature": signature
            }
            
            # Debug logging
            logger.info(f"=== ORDER REQUEST DEBUG ===")
            logger.info(f"Endpoint: {self.order_endpoint}")
            logger.info(f"Payload (Form): {payload_form}")
            logger.info(f"Signature: {signature}")
            
            response = requests.post(self.order_endpoint, data=payload_form, timeout=60)
            
            logger.info(f"=== ORDER RESPONSE DEBUG ===")
            logger.info(f"Status Code: {response.status_code}")
            logger.info(f"Headers: {dict(response.headers)}")
            logger.info(f"Response Content: {response.text}")
            
            if response.status_code == 200:
                # Check if response is plain text error
                if "Invalid" in response.text or "Error" in response.text:
                    return {
                        "success": False,
                        "error": response.text.strip()
                    }
                
                # Try to parse as JSON
                try:
                    data = response.json()
                except ValueError as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    return {
                        "success": False,
                        "error": f"Invalid API response: {response.text[:200]}"
                    }
                
                if data.get("status") == "success":
                    return {
                        "success": True,
                        "data": {
                            "trx_id": data.get("trx_id"),
                            "destination": data.get("destination"),
                            "product_code": data.get("product_code"),
                            "product_name": data.get("product_name"),
                            "price": data.get("price"),
                            "status": data.get("status"),
                            "message": data.get("message")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Unknown error")
                    }
            else:
                # Try backup endpoint
                logger.warning("Primary endpoint failed, trying backup...")
                response = requests.post(self.backup_order_endpoint, json=payload, timeout=60)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        return {
                            "success": True,
                            "data": {
                                "trx_id": data.get("trx_id"),
                                "destination": data.get("destination"),
                                "product_code": data.get("product_code"),
                                "product_name": data.get("product_name"),
                                "price": data.get("price"),
                                "status": data.get("status"),
                                "message": data.get("message")
                            }
                        }
                
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout. Please try again."
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Connection error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error ordering product: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
