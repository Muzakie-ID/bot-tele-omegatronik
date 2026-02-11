/**
 * Parser untuk response dari Omega Tronik
 */
class ResponseParser {
  
  /**
   * Parse response transaksi sukses
   * Format: R#987654321 HSF5.088123456789 SUKSES. SN/Ref: 123456789. Saldo 99.999.999-4.880=99.995.119 @17/11 04.19.18
   */
  static parseTransaction(response) {
    const result = {
      raw: response,
      success: false,
      refId: null,
      product: null,
      destination: null,
      status: null,
      sn: null,
      message: null,
      saldo: null,
      hargaBeli: null,
      statusCode: null
    };
    
    // Extract status code if exists
    const statusMatch = response.match(/status=(\d+)/);
    if (statusMatch) {
      result.statusCode = parseInt(statusMatch[1]);
    }
    
    // Extract ref ID
    const refMatch = response.match(/R#(\S+)/);
    if (refMatch) {
      result.refId = refMatch[1];
    }
    
    // Check if success
    if (response.includes('SUKSES')) {
      result.success = true;
      result.status = 'SUKSES';
      
      // Extract SN
      const snMatch = response.match(/SN\/Ref:\s*([^.]+)/);
      if (snMatch) {
        result.sn = snMatch[1].trim();
      }
      
      // Extract saldo
      const saldoMatch = response.match(/Saldo\s+([\d.,]+)(?:-([\d.,]+))?\s*=\s*([\d.,]+)/);
      if (saldoMatch) {
        result.saldo = saldoMatch[3].replace(/\./g, '');
        if (saldoMatch[2]) {
          result.hargaBeli = saldoMatch[2].replace(/\./g, '');
        }
      }
    } else if (response.includes('GAGAL')) {
      result.status = 'GAGAL';
      
      // Extract reason
      const reasonMatch = response.match(/GAGAL\.\s*([^.]+)/);
      if (reasonMatch) {
        result.message = reasonMatch[1].trim();
      }
    } else if (response.includes('PENDING') || response.includes('Menunggu')) {
      result.status = 'PENDING';
    }
    
    return result;
  }
  
  /**
   * Parse response list produk Cuanku
   * Format: 906752#AIGO 75GB + Kuota di Kota-mu, 60hr, 180rb#Rp156275;905897#AIGO Mini 1.5GB...
   */
  static parseProductList(response) {
    const products = [];
    
    // Extract SN/Ref content
    const snMatch = response.match(/SN\/Ref:\s*([^.]+)\./);
    if (!snMatch) return products;
    
    const productsStr = snMatch[1];
    const items = productsStr.split(';');
    
    items.forEach(item => {
      const parts = item.split('#');
      if (parts.length === 3) {
        products.push({
          id: parts[0].trim(),
          name: parts[1].trim(),
          price: parts[2].trim().replace('Rp', '').replace(/\./g, '')
        });
      }
    });
    
    return products;
  }
  
  /**
   * Parse response cek harga
   * Format: R#CEK22222 CEKSAKTI.083896959466 SUKSES. SN/Ref: Rp3.775/AIGO Mini 1.5GB...
   */
  static parseCheckPrice(response) {
    const result = {
      success: false,
      price: null,
      description: null,
      raw: response
    };
    
    if (!response.includes('SUKSES')) {
      return result;
    }
    
    const match = response.match(/SN\/Ref:\s*Rp([\d.,]+)\/([^.]+)\./);
    if (match) {
      result.success = true;
      result.price = match[1].replace(/\./g, '');
      result.description = match[2].trim();
    }
    
    return result;
  }
  
  /**
   * Get status code description
   */
  static getStatusDescription(code) {
    const statusMap = {
      20: 'Sukses',
      52: 'Tujuan Salah',
      40: 'Gagal',
      2: 'Menunggu Jawaban',
      69: 'CutOff',
      50: 'Dibatalkan',
      56: 'Nomor Blacklist',
      47: 'Produk Gangguan',
      45: 'Stok Kosong',
      55: 'TimeOut',
      53: 'Tujuan Diluar Wilayah'
    };
    
    return statusMap[code] || 'Unknown';
  }
}

module.exports = ResponseParser;
