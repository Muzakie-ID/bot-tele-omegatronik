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
        self.balance_endpoint = f"{self.base_url}/cek"
        self.order_endpoint = f"{self.base_url}/trx"
        
        # Backup endpoints for failover
        self.backup_base_url = "http://188.166.178.169:6969"
        self.backup_balance_endpoint = f"{self.backup_base_url}/cek"
        self.backup_order_endpoint = f"{self.backup_base_url}/trx"
    
    async def check_balance(self) -> Dict[str, Any]:
        """
        Check account balance
        
        Returns:
            Dict with 'success' (bool) and either 'data' or 'error'
        """
        try:
            # DIAGNOSTIC: Test multiple signature formats and endpoints
            logger.info("=== DIAGNOSTIC: Testing multiple balance check methods ===")
            
            # Method 1: Current implementation
            logger.info("\n--- Method 1: Current signature format ---")
            signature1 = generate_signature(self.member_id, self.pin, self.password)
            params1 = {
                "memberID": self.member_id,
                "pin": self.pin,
                "password": self.password,
                "sign": signature1
            }
            logger.info(f"Signature: {signature1}")
            logger.info(f"Params: {params1}")
            response1 = requests.get(self.balance_endpoint, params=params1, timeout=1)
            logger.info(f"Response: {response1.text[:200]}")
            
            # Method 2: Try without password in params
            logger.info("\n--- Method 2: Without password in params ---")
            params2 = {
                "memberID": self.member_id,
                "pin": self.pin,
                "sign": signature1
            }
            logger.info(f"Params: {params2}")
            response2 = requests.get(self.balance_endpoint, params=params2, timeout=1)
            logger.info(f"Response: {response2.text[:200]}")
            
            # Method 3: Try different signature format (without "CheckBalance")
            logger.info("\n--- Method 3: Different signature format ---")
            import hashlib
            import base64
            sig_string3 = f"OtomaX|{self.member_id}|{self.pin}|{self.password}"
            sha1_hash3 = hashlib.sha1(sig_string3.encode()).digest()
            signature3 = base64.b64encode(sha1_hash3).decode().rstrip('=').replace('/', '_').replace('+', '-')
            params3 = {
                "memberID": self.member_id,
                "pin": self.pin,
                "password": self.password,
                "sign": signature3
            }
            logger.info(f"Signature string: {sig_string3}")
            logger.info(f"Signature: {signature3}")
            response3 = requests.get(self.balance_endpoint, params=params3, timeout=1)
            logger.info(f"Response: {response3.text[:200]}")
            
            # Method 4: Try backup endpoint
            logger.info("\n--- Method 4: Backup endpoint ---")
            response4 = requests.get(self.backup_balance_endpoint, params=params1, timeout=1)
            logger.info(f"Response: {response4.text[:200]}")
            
            # Method 5: Try POST method
            logger.info("\n--- Method 5: POST method ---")
            response5 = requests.post(self.balance_endpoint, data=params1, timeout=1)
            logger.info(f"Response: {response5.text[:200]}")
            
            # Method 6: Try with different endpoint paths
            logger.info("\n--- Method 6: Different endpoint paths ---")
            test_endpoints = [
                f"{self.base_url}/balance",
                f"{self.base_url}/saldo",
                f"{self.base_url}/cek_saldo",
                f"{self.base_url}/api/cek",
            ]
            for endpoint in test_endpoints:
                try:
                    resp = requests.get(endpoint, params=params1, timeout=1)
                    logger.info(f"{endpoint}: {resp.text[:100]}")
                except:
                    logger.info(f"{endpoint}: Failed")
            
            logger.info("\n=== DIAGNOSTIC COMPLETE ===")
            logger.info("Please review the logs above to identify the correct method")
            
            # Return error with diagnostic info
            return {
                "success": False,
                "error": "Balance check diagnostic complete. Please check logs for details."
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
            import time
            ref_id = str(int(time.time()))
            
            signature = generate_order_signature(
                self.member_id, self.pin, self.password, destination, product_code
            )
            
            # Build query string for GET request
            params = {
                "memberID": self.member_id,
                "pin": self.pin,
                "password": self.password,
                "dest": destination,
                "product": product_code,
                "qty": "1",
                "refID": ref_id,
                "sign": signature
            }
            
            # Debug logging
            logger.info(f"=== ORDER REQUEST DEBUG ===")
            logger.info(f"Endpoint: {self.order_endpoint}")
            logger.info(f"Params: {params}")
            logger.info(f"Signature: {signature}")
            
            response = requests.get(self.order_endpoint, params=params, timeout=60)
            
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
                            "destination": data.get("dest"),
                            "product_code": data.get("product"),
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
                response = requests.get(self.backup_order_endpoint, params=params, timeout=60)
                
                logger.info(f"=== BACKUP ORDER RESPONSE DEBUG ===")
                logger.info(f"Status Code: {response.status_code}")
                logger.info(f"Response Content: {response.text}")
                
                if response.status_code == 200:
                    # Check if response is plain text success
                    if response.text.strip() == "OK":
                        return {
                            "success": True,
                            "data": {
                                "message": "Success"
                            }
                        }
                    
                    if "Invalid" in response.text or "Error" in response.text:
                        return {
                            "success": False,
                            "error": response.text.strip()
                        }
                    
                    try:
                        data = response.json()
                    except ValueError as e:
                        return {
                            "success": False,
                            "error": f"Invalid API response: {response.text[:200]}"
                        }
                    
                    if data.get("status") == "success":
                        return {
                            "success": True,
                            "data": {
                                "trx_id": data.get("trx_id"),
                                "destination": data.get("dest"),
                                "product_code": data.get("product"),
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
