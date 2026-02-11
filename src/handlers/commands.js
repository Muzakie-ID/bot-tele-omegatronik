const db = require('../database/db');
const menus = require('../keyboards/menus');
const Formatter = require('../utils/formatter');

/**
 * Handler untuk command /start
 */
async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  // Save/update user to database
  db.getOrCreateUser(user);
  
  // Clear any existing session
  db.clearSession(user.id);
  
  const welcomeMessage = `
🤖 *Selamat Datang di Bot Auto Order!*

Halo ${user.first_name}! 👋

Bot ini membantu Anda untuk:
✅ Beli pulsa & paket data
✅ Bayar token listrik
✅ Beli voucher game & digital
✅ Cek saldo & riwayat transaksi

Silakan pilih menu di bawah:
  `.trim();
  
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: menus.mainMenu()
  });
}

/**
 * Handler untuk command /help
 */
async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📖 *Panduan Penggunaan Bot*

*Cara Order:*
1️⃣ Pilih kategori produk
2️⃣ Pilih provider & paket
3️⃣ Masukkan nomor tujuan
4️⃣ Konfirmasi pembelian
5️⃣ Tunggu proses transaksi

*Fitur Bot:*
• 📱 Pulsa & Paket Data
• ⚡ Token Listrik
• 🎮 Voucher Game
• 📺 Voucher Digital
• 💰 Cek Saldo
• 📊 Riwayat Transaksi

*Format Nomor:*
• 08123456789 atau 628123456789
• Tanpa spasi atau karakter lain

*Status Transaksi:*
✅ SUKSES - Transaksi berhasil
⏳ PENDING - Sedang diproses
❌ GAGAL - Transaksi gagal

*Butuh Bantuan?*
Hubungi admin: @OmegaTronikSupport
WhatsApp: +62 838-5289-9848
  `.trim();
  
  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: menus.backToMainButton()
  });
}

/**
 * Handler untuk command /saldo
 */
async function handleSaldo(bot, msg) {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '⏳ Mengecek saldo...', { parse_mode: 'Markdown' });
  
  const omegatronik = require('../services/omegatronik');
  const result = await omegatronik.checkBalance();
  
  if (result.success) {
    await bot.sendMessage(chatId, `✅ Saldo Anda:\n\n${result.data}`, {
      parse_mode: 'Markdown',
      reply_markup: menus.backToMainButton()
    });
  } else {
    await bot.sendMessage(chatId, `❌ Gagal cek saldo:\n${result.error}`, {
      parse_mode: 'Markdown',
      reply_markup: menus.backToMainButton()
    });
  }
}

/**
 * Handler untuk command /history
 */
async function handleHistory(bot, msg) {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  // Get user from database
  const dbUser = db.getOrCreateUser(user);
  
  // Get transactions
  const transactions = db.getUserTransactions(dbUser.id, 10);
  
  if (transactions.length === 0) {
    await bot.sendMessage(chatId, '📊 Belum ada riwayat transaksi.', {
      reply_markup: menus.backToMainButton()
    });
    return;
  }
  
  let message = '📊 *Riwayat Transaksi Terakhir:*\n\n';
  
  transactions.forEach((trx, index) => {
    const status = trx.status === 'SUKSES' ? '✅' : trx.status === 'PENDING' ? '⏳' : '❌';
    const date = new Date(trx.created_at).toLocaleString('id-ID');
    
    message += `${index + 1}. ${status} *${trx.product_code}*\n`;
    message += `   Tujuan: ${trx.destination}\n`;
    message += `   Status: ${trx.status}\n`;
    if (trx.sn) {
      message += `   SN: ${trx.sn}\n`;
    }
    message += `   Waktu: ${date}\n\n`;
  });
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: menus.backToMainButton()
  });
}

/**
 * Handler untuk command /cancel
 */
async function handleCancel(bot, msg) {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  // Clear session
  db.clearSession(user.id);
  
  await bot.sendMessage(chatId, '❌ Transaksi dibatalkan.', {
    reply_markup: menus.mainMenu()
  });
}

module.exports = {
  handleStart,
  handleHelp,
  handleSaldo,
  handleHistory,
  handleCancel
};
