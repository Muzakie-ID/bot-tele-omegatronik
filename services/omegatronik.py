import requests
import time
from utils.signature import SignatureGenerator

class OmegatronikService:
    """Service for Omega Tronik H2H API integration"""
    
    def __init__(self, member_id, pin, password):
        self.endpoint = "https://gateway.omegatronik.com/api/"
        self.endpoint_backup = "https://gtw.omegatronik.com/api/"
        self.member_id = member_id
        self.pin = pin
        self.password = password
        self.timeout = 30
        self.use_backup = False
    
    def _get_endpoint(self):
        """Get current endpoint"""
        return self.endpoint_backup if self.use_backup else self.endpoint
    
    def _make_request(self, params, retry=True):
        """Make request to Omega Tronik API"""
        try:
            url = self._get_endpoint() + 'trx'
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.text
        except Exception as e:
            if retry and not self.use_backup:
                print(f"Primary endpoint failed, trying backup... Error: {str(e)}")
                self.use_backup = True
                return self._make_request(params, retry=False)
            raise e
    
    async def check_balance(self):
        """Check account balance"""
        try:
            sign = SignatureGenerator.for_check_balance(
                self.member_id,
                self.pin,
                self.password
            )
            
            params = {
                'product': 'SALDO',
                'memberID': self.member_id,
                'sign': sign
            }
            
            response = self._make_request(params)
            
            # Parse response (format: status|saldo|message)
            parts = response.split('|')
            if len(parts) >= 2:
                return {
                    'success': True,
                    'data': {
                        'status': parts[0],
                        'saldo': parts[1] if len(parts) > 1 else '0',
                        'message': parts[2] if len(parts) > 2 else ''
                    }
                }
            else:
                return {
                    'success': False,
                    'error': response
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def list_products(self, product_code, dest):
        """List available products (Cuanku System)"""
        try:
            ref_id = f"LIST{int(time.time() * 1000)}"
            sign = SignatureGenerator.for_transaction(
                self.member_id,
                product_code,
                dest,
                ref_id,
                self.pin,
                self.password
            )
            
            params = {
                'product': product_code,
                'dest': dest,
                'refID': ref_id,
                'memberID': self.member_id,
                'sign': sign
            }
            
            response = self._make_request(params)
            
            # Parse product list
            products = []
            lines = response.strip().split('\n')
            
            for line in lines:
                parts = line.split('|')
                if len(parts) >= 3:
                    products.append({
                        'id': parts[0],
                        'nama': parts[1],
                        'harga': int(parts[2]) if parts[2].isdigit() else 0
                    })
            
            return {
                'success': True,
                'products': products
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def transaction(self, product_code, dest, product_id=None):
        """Execute transaction"""
        try:
            ref_id = f"TRX{int(time.time() * 1000)}"
            sign = SignatureGenerator.for_transaction(
                self.member_id,
                product_code,
                dest,
                ref_id,
                self.pin,
                self.password
            )
            
            params = {
                'product': product_code,
                'dest': dest,
                'refID': ref_id,
                'memberID': self.member_id,
                'sign': sign
            }
            
            if product_id:
                params['idproduk'] = product_id
            
            response = self._make_request(params)
            
            # Parse response
            parts = response.split('|')
            if len(parts) >= 2 and parts[0].upper() in ['SUCCESS', 'SUKSES']:
                return {
                    'success': True,
                    'data': {
                        'status': parts[0],
                        'refid': parts[1] if len(parts) > 1 else ref_id,
                        'produk': parts[2] if len(parts) > 2 else '',
                        'tujuan': dest,
                        'harga': parts[3] if len(parts) > 3 else '0',
                        'sn': parts[4] if len(parts) > 4 else '',
                        'saldo': parts[5] if len(parts) > 5 else '0'
                    }
                }
            else:
                return {
                    'success': False,
                    'error': response
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
