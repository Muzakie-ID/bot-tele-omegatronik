const axios = require('axios');
const config = require('../config/config');
const SignatureGenerator = require('../utils/signature');
const ResponseParser = require('../utils/parser');

/**
 * Service untuk integrasi dengan Omega Tronik H2H API
 */
class OmegatronikService {
  
  constructor() {
    this.endpoint = config.omega.endpoint;
    this.endpointBackup = config.omega.endpointBackup;
    this.memberId = config.omega.memberId;
    this.pin = config.omega.pin;
    this.password = config.omega.password;
    this.useBackup = false;
  }
  
  /**
   * Get current endpoint
   */
  getEndpoint() {
    return this.useBackup ? this.endpointBackup : this.endpoint;
  }
  
  /**
   * Switch to backup endpoint
   */
  switchToBackup() {
    this.useBackup = true;
    console.log('Switched to backup endpoint:', this.endpointBackup);
  }
  
  /**
   * Make request to Omega Tronik API
   */
  async makeRequest(params, retry = true) {
    try {
      const url = this.getEndpoint() + 'trx';
      const response = await axios.get(url, {
        params,
        timeout: config.omega.timeout
      });
      
      return response.data;
    } catch (error) {
      // Jika gagal dan belum pakai backup, coba backup endpoint
      if (retry && !this.useBackup) {
        console.log('Primary endpoint failed, trying backup...');
        this.switchToBackup();
        return this.makeRequest(params, false);
      }
      
      throw error;
    }
  }
  
  /**
   * Cek saldo
   */
  async checkBalance() {
    try {
      const sign = SignatureGenerator.forCheckBalance(
        this.memberId,
        this.pin,
        this.password
      );
      
      const params = {
        product: 'SALDO',
        memberID: this.memberId,
        sign: sign
      };
      
      const response = await this.makeRequest(params);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Check balance error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * List produk (untuk Cuanku System)
   * @param {string} productCode - Kode produk (LISTDX, LISTSAKTI, dll)
   * @param {string} dest - Nomor tujuan
   */
  async listProducts(productCode, dest) {
    try {
      const refID = 'LIST' + Date.now();
      const sign = SignatureGenerator.forTransaction(
        this.memberId,
        productCode,
        dest,
        refID,
        this.pin,
        this.password
      );
      
      const params = {
        product: productCode,
        dest: dest,
        refID: refID,
        memberID: this.memberId,
        sign: sign
      };
      
      const response = await this.makeRequest(params);
      const parsed = ResponseParser.parseProductList(response);
      
      return {
        success: true,
        products: parsed,
        raw: response
      };
    } catch (error) {
      console.error('List products error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Cek harga produk spesifik (untuk Cuanku System)
   * @param {string} productCode - Kode produk (CEKDX, CEKSAKTI, dll)
   * @param {string} dest - Nomor tujuan
   * @param {string} idproduk - ID produk dari list
   */
  async checkPrice(productCode, dest, idproduk) {
    try {
      const refID = 'CEK' + Date.now();
      const sign = SignatureGenerator.forTransaction(
        this.memberId,
        productCode,
        dest,
        refID,
        this.pin,
        this.password
      );
      
      const params = {
        product: productCode,
        dest: dest,
        refID: refID,
        memberID: this.memberId,
        sign: sign,
        idproduk: idproduk
      };
      
      const response = await this.makeRequest(params);
      const parsed = ResponseParser.parseCheckPrice(response);
      
      return {
        success: parsed.success,
        price: parsed.price,
        description: parsed.description,
        raw: response
      };
    } catch (error) {
      console.error('Check price error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Transaksi/Order produk
   * @param {string} productCode - Kode produk
   * @param {string} dest - Nomor tujuan
   * @param {string} refID - Reference ID (unique)
   * @param {string} idproduk - ID produk (untuk Cuanku System)
   */
  async transaction(productCode, dest, refID, idproduk = null) {
    try {
      const sign = SignatureGenerator.forTransaction(
        this.memberId,
        productCode,
        dest,
        refID,
        this.pin,
        this.password
      );
      
      const params = {
        product: productCode,
        dest: dest,
        refID: refID,
        memberID: this.memberId,
        sign: sign
      };
      
      // Tambahkan idproduk jika ada (untuk Cuanku System)
      if (idproduk) {
        params.idproduk = idproduk;
      }
      
      const response = await this.makeRequest(params);
      const parsed = ResponseParser.parseTransaction(response);
      
      return {
        success: parsed.success,
        status: parsed.status,
        sn: parsed.sn,
        refId: parsed.refId,
        saldo: parsed.saldo,
        hargaBeli: parsed.hargaBeli,
        message: parsed.message,
        raw: response
      };
    } catch (error) {
      console.error('Transaction error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Fetch list harga dari JSON endpoint
   */
  async fetchPriceList() {
    try {
      const response = await axios.get(config.omega.listHargaUrl, {
        timeout: 10000
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Fetch price list error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new OmegatronikService();
