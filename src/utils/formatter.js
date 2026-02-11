/**
 * Utility untuk format pesan dan angka
 */
class Formatter {
  
  /**
   * Format number menjadi Rupiah
   * @param {number|string} number 
   */
  static rupiah(number) {
    const num = typeof number === 'string' ? parseInt(number) : number;
    if (isNaN(num)) return 'Rp 0';
    
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  /**
   * Format nomor HP untuk display
   * @param {string} phone 
   */
  static phone(phone) {
    if (!phone) return '';
    
    // Remove leading 0 and add 62
    let formatted = phone.trim();
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.substring(1);
    } else if (!formatted.startsWith('62')) {
      formatted = '62' + formatted;
    }
    
    return formatted;
  }
  
  /**
   * Format tanggal untuk display
   * @param {Date} date 
   */
  static date(date = new Date()) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  
  /**
   * Generate transaction ID yang unique
   */
  static generateTrxId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TRX${timestamp}${random}`;
  }
  
  /**
   * Escape markdown characters untuk Telegram
   * @param {string} text 
   */
  static escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }
  
  /**
   * Truncate text jika terlalu panjang
   * @param {string} text 
   * @param {number} maxLength 
   */
  static truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

module.exports = Formatter;
