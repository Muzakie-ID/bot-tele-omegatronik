import requests
import time
import urllib3
import ssl
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
from utils.signature import SignatureGenerator

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class LegacyAdapter(HTTPAdapter):
    """Adapter to handle legacy SSL/TLS servers with unsafe renegotiation support"""
    def init_poolmanager(self, connections, maxsize, block=False):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        # Downgrade security level to allow legacy server handshakes
        ctx.set_ciphers('DEFAULT@SECLEVEL=1')
        self.poolmanager = PoolManager(
            num_pools=connections,
            maxsize=maxsize,
            block=block,
            ssl_context=ctx
        )

class OmegatronikService:
    """Service for Omega Tronik H2H API integration"""
    
    def __init__(self, member_id, pin, password):
        self.endpoint = "https://apiomega.id/api/"
        self.endpoint_backup = "http://188.166.178.169:6969/"
        self.member_id = member_id
        self.pin = pin
        self.password = password
        self.timeout = 30
        self.use_backup = False
        
        # Initialize session with legacy adapter
        self.session = requests.Session()
        self.session.mount('https://', LegacyAdapter())
    
    def _get_endpoint(self):
        """Get current endpoint"""
        return self.endpoint_backup if self.use_backup else self.endpoint
    
    def _make_request(self, params, retry=True):
        """Make request to Omega Tronik API"""
        try:
            url = self._get_endpoint() + 'trx'
            # Use session instead of direct requests
            response = self.session.get(url, params=params, timeout=self.timeout)
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
                'dest': '',
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
