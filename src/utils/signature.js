const crypto = require('crypto');

/**
 * Generate signature untuk Omega Tronik API
 * Berdasarkan dokumentasi: 
 * $sign = str_replace('/', '_', str_replace('+', '-' , rtrim(base64_encode(sha1($str, true)), '=')));
 */
class SignatureGenerator {
  
  /**
   * Generate signature untuk transaksi
   * @param {string} memberId - Member ID Omega Tronik
   * @param {string} product - Kode produk
   * @param {string} dest - Nomor tujuan
   * @param {string} refID - Reference/Transaction ID
   * @param {string} pin - PIN transaksi
   * @param {string} password - Password transaksi
   * @returns {string} Signature yang sudah di-encode
   */
  static forTransaction(memberId, product, dest, refID, pin, password) {
    const str = `OtomaX|${memberId}|${product}|${dest}|${refID}|${pin}|${password}`;
    return this.generate(str);
  }
  
  /**
   * Generate signature untuk cek balance
   * @param {string} memberId - Member ID Omega Tronik
   * @param {string} pin - PIN transaksi
   * @param {string} password - Password transaksi
   * @returns {string} Signature yang sudah di-encode
   */
  static forCheckBalance(memberId, pin, password) {
    const str = `OtomaX|CheckBalance|${memberId}|${pin}|${password}`;
    return this.generate(str);
  }
  
  /**
   * Generate signature untuk deposit ticket
   * @param {string} memberId - Member ID Omega Tronik
   * @param {string} pin - PIN transaksi
   * @param {string} password - Password transaksi
   * @param {number} amount - Jumlah deposit
   * @returns {string} Signature yang sudah di-encode
   */
  static forDeposit(memberId, pin, password, amount) {
    const str = `OtomaX|ticket|${memberId}|${pin}|${password}|${amount}`;
    return this.generate(str);
  }
  
  /**
   * Core function untuk generate signature
   * @param {string} str - String yang akan di-hash
   * @returns {string} Signature hasil encoding
   */
  static generate(str) {
    // SHA1 hash (binary)
    const hash = crypto.createHash('sha1').update(str).digest();
    
    // Base64 encode
    let base64 = hash.toString('base64');
    
    // Remove trailing '='
    base64 = base64.replace(/=+$/, '');
    
    // Replace '+' with '-' and '/' with '_'
    const sign = base64.replace(/\+/g, '-').replace(/\//g, '_');
    
    return sign;
  }
}

module.exports = SignatureGenerator;
