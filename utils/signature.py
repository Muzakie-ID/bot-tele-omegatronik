import hashlib
import base64


def generate_signature(member_id: str, pin: str, password: str) -> str:
    """
    Generate signature for Omega Tronik API authentication (Check Balance).
    
    Format: OtomaX|CheckBalance|{memberId}|{pin}|{password}
    
    Args:
        member_id: Your Omega Tronik member ID
        pin: Your transaction PIN
        password: Your API password
        
    Returns:
        str: Base64 encoded SHA1 signature
    """
    signature_string = f"OtomaX|CheckBalance|{member_id}|{pin}|{password}"
    
    # Generate SHA1 hash
    sha1_hash = hashlib.sha1(signature_string.encode()).digest()
    
    # Base64 encode
    signature = base64.b64encode(sha1_hash).decode()
    
    # Remove trailing '='
    signature = signature.rstrip('=')
    
    # Replace '/' with '_' and '+' with '-'
    signature = signature.replace('/', '_').replace('+', '-')
    
    return signature


def generate_order_signature(member_id: str, pin: str, password: str, 
                            destination: str, product_code: str) -> str:
    """
    Generate signature for order transaction.
    
    Format: OtomaX|{memberId}|{product}|{dest}|{ref}|pin|{password}
    
    Args:
        member_id: Your Omega Tronik member ID
        pin: Your transaction PIN
        password: Your API password
        destination: Destination number
        product_code: Product code to order
        
    Returns:
        str: Base64 encoded SHA1 signature
    """
    # Generate reference ID (can be timestamp or random)
    import time
    ref_id = str(int(time.time()))
    
    signature_string = f"OtomaX|{member_id}|{product_code}|{destination}|{ref_id}|{pin}|{password}"
    
    # Generate SHA1 hash
    sha1_hash = hashlib.sha1(signature_string.encode()).digest()
    
    # Base64 encode
    signature = base64.b64encode(sha1_hash).decode()
    
    # Remove trailing '='
    signature = signature.rstrip('=')
    
    # Replace '/' with '_' and '+' with '-'
    signature = signature.replace('/', '_').replace('+', '-')
    
    return signature
