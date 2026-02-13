import hashlib
import base64

class SignatureGenerator:
    """Generate signature for Omega Tronik API"""
    
    @staticmethod
    def generate(string):
        """
        Core function to generate signature
        Based on: str_replace('/', '_', str_replace('+', '-', rtrim(base64_encode(sha1($str, true)), '=')))
        """
        # SHA1 hash (binary)
        hash_obj = hashlib.sha1(string.encode('utf-8'))
        hash_binary = hash_obj.digest()
        
        # Base64 encode
        base64_str = base64.b64encode(hash_binary).decode('utf-8')
        
        # Remove trailing '='
        base64_str = base64_str.rstrip('=')
        
        # Replace '+' with '-' and '/' with '_'
        signature = base64_str.replace('+', '-').replace('/', '_')
        
        return signature
    
    @staticmethod
    def for_transaction(member_id, product, dest, ref_id, pin, password):
        """Generate signature for transaction"""
        string = f"OtomaX|{member_id}|{product}|{dest}|{ref_id}|{pin}|{password}"
        return SignatureGenerator.generate(string)
    
    @staticmethod
    def for_check_balance(member_id, pin, password):
        """Generate signature for check balance (Empty format)"""
        # Format: OtomaX|memberID||||pin|password
        string = f"OtomaX|{member_id}||||{pin}|{password}"
        return SignatureGenerator.generate(string)
    
    @staticmethod
    def for_deposit(member_id, pin, password, amount):
        """Generate signature for deposit"""
        string = f"OtomaX|ticket|{member_id}|{pin}|{password}|{amount}"
        return SignatureGenerator.generate(string)
