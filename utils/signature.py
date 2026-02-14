import hashlib
import time


def generate_signature(member_id: str, pin: str, password: str) -> str:
    """
    Generate signature for Omega Tronik API authentication.
    
    The signature is typically generated using MD5 hash of:
    member_id + pin + password + timestamp
    
    Args:
        member_id: Your Omega Tronik member ID
        pin: Your transaction PIN
        password: Your API password
        
    Returns:
        str: MD5 signature hash
    """
    timestamp = str(int(time.time()))
    signature_string = f"{member_id}{pin}{password}{timestamp}"
    signature = hashlib.md5(signature_string.encode()).hexdigest()
    return signature


def generate_order_signature(member_id: str, pin: str, password: str, 
                            destination: str, product_code: str) -> str:
    """
    Generate signature for order transaction.
    
    Args:
        member_id: Your Omega Tronik member ID
        pin: Your transaction PIN
        password: Your API password
        destination: Destination number
        product_code: Product code to order
        
    Returns:
        str: MD5 signature hash
    """
    timestamp = str(int(time.time()))
    signature_string = f"{member_id}{pin}{password}{destination}{product_code}{timestamp}"
    signature = hashlib.md5(signature_string.encode()).hexdigest()
    return signature
