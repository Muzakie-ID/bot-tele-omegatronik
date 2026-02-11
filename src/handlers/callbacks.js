const db = require('../database/db');
const menus = require('../keyboards/menus');
const omegatronik = require('../services/omegatronik');
const Formatter = require('../utils/formatter');

/**
 * Handler untuk callback query (button clicks)
 */
async function handleCallbackQuery(bot, callbackQuery) {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  // Answer callback query to remove loading state
  await bot.answerCallbackQuery(callbackQuery.id);
  
  try {
    // Route berdasarkan callback data
    if (data === 'back_main') {
      await handleBackMain(bot, chatId, msg.message_id);
    } else if (data === 'menu_pulsa') {
      await handleMenuPulsa(bot, chatId, msg.message_id);
    } else if (data === 'menu_token') {
      await handleMenuToken(bot, chatId, msg.message_id);
    } else if (data === 'menu_game') {
      await handleMenuGame(bot, chatId, msg.message_id);
    } else if (data === 'menu_voucher') {
      await handleMenuVoucher(bot, chatId, msg.message_id);
    } else if (data === 'check_balance') {
      await handleCheckBalance(bot, chatId, userId);
    } else if (data === 'history') {
      await handleHistory(bot, chatId, userId);
    } else if (data === 'help') {
      await handleHelp(bot, chatId, msg.message_id);
    } else if (data.startsWith('provider_')) {
      await handleProviderSelect(bot, chatId, msg.message_id, data);
    } else if (data.startsWith('tsel_') || data.startsWith('isat_') || data.startsWith('xl_') || data.startsWith('tri_') || data.startsWith('byu_')) {
      await handlePackageType(bot, chatId, userId, data);
    } else if (data === 'cancel') {
      await handleCancel(bot, chatId, userId, msg.message_id);
    }
  } catch (error) {
    console.error('Callback query error:', error);
    await bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

/**
 * Back to main menu
 */
async function handleBackMain(bot, chatId, messageId) {
  const message = `
🏠 *Menu Utama*

Silakan pilih kategori produk:
  `.trim();
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: menus.mainMenu()
  });
}

/**
 * Menu Pulsa & Paket Data
 */
async function handleMenuPulsa(bot, chatId, messageId) {
  const message = `
📱 *Pulsa & Paket Data*

Pilih provider yang Anda inginkan:
  `.trim();
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: menus.pulsaMenu()
  });
}

/**
 * Menu Token Listrik
 */
async function handleMenuToken(bot, chatId, messageId) {
  await bot.editMessageText('⚡ Menu Token Listrik\n\n🚧 Fitur dalam pengembangan...', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: menus.backToMainButton()
  });
}

/**
 * Menu Voucher Game
 */
async function handleMenuGame(bot, chatId, messageId) {
  await bot.editMessageText('🎮 Menu Voucher Game\n\n🚧 Fitur dalam pengembangan...', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: menus.backToMainButton()
  });
}

/**
 * Menu Voucher Digital
 */
async function handleMenuVoucher(bot, chatId, messageId) {
  await bot.editMessageText('📺 Menu Voucher Digital\n\n🚧 Fitur dalam pengembangan...', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: menus.backToMainButton()
  });
}

/**
 * Check Balance
 */
async function handleCheckBalance(bot, chatId, userId) {
  await bot.sendMessage(chatId, '⏳ Mengecek saldo...', { parse_mode: 'Markdown' });
  
  const result = await omegatronik.checkBalance();
  
  if (result.success) {
    await bot.sendMessage(chatId, `💰 *Informasi Saldo*\n\n${result.data}`, {
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
 * History
 */
async function handleHistory(bot, chatId, userId) {
  const dbUser = db.getOrCreateUser({ id: userId });
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
 * Help
 */
async function handleHelp(bot, chatId, messageId) {
  const helpMessage = `
ℹ️ *Bantuan & Informasi*

*Cara Order:*
1️⃣ Pilih kategori produk
2️⃣ Pilih provider & paket
3️⃣ Masukkan nomor tujuan
4️⃣ Konfirmasi pembelian
5️⃣ Tunggu proses transaksi

*Format Nomor:*
• 08123456789 atau 628123456789
• Tanpa spasi atau karakter lain

*Kontak Support:*
Telegram: @OmegaTronikSupport
WhatsApp: +62 838-5289-9848
  `.trim();
  
  await bot.editMessageText(helpMessage, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: menus.backToMainButton()
  });
}

/**
 * Handle provider selection
 */
async function handleProviderSelect(bot, chatId, messageId, data) {
  const provider = data.replace('provider_', '');
  
  let menu, message;
  
  switch (provider) {
    case 'telkomsel':
      menu = menus.telkomselMenu();
      message = '📱 *Telkomsel*\n\nPilih jenis paket:';
      break;
    case 'indosat':
      menu = menus.indosatMenu();
      message = '📱 *Indosat*\n\nPilih jenis paket:';
      break;
    case 'xl':
      menu = menus.xlMenu();
      message = '📱 *XL / AXIS*\n\nPilih jenis paket:';
      break;
    case 'tri':
      menu = menus.triMenu();
      message = '📱 *Tri*\n\nPilih jenis paket:';
      break;
    case 'byu':
      menu = menus.byuMenu();
      message = '📱 *By.U*\n\nPilih jenis paket:';
      break;
    default:
      return;
  }
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: menu
  });
}

/**
 * Handle package type selection
 */
async function handlePackageType(bot, chatId, userId, data) {
  // Parse product code
  const productMap = {
    'tsel_dh': { code: 'LISTDH', name: 'Paket Data Harian Telkomsel' },
    'tsel_dm': { code: 'LISTDM', name: 'Paket Data Mingguan Telkomsel' },
    'tsel_db': { code: 'LISTDB', name: 'Paket Data Bulanan Telkomsel' },
    'tsel_sakti': { code: 'LISTSAKTI', name: 'Paket Combo Sakti Telkomsel' },
    'tsel_ns': { code: 'LISTNS', name: 'Paket Nelpon Sakti Telkomsel' },
    'tsel_orbit': { code: 'LISTORBIT', name: 'Paket Orbit Telkomsel' },
    'tsel_omni': { code: 'LISTOMNI', name: 'Paket Omni Telkomsel' },
    'isat_di': { code: 'LISTDI', name: 'Paket Only4You Indosat' },
    'xl_dx': { code: 'LISTDX', name: 'Paket Cuanku XL/AXIS' },
    'tri_dtr': { code: 'LISTDTR', name: 'Paket CuanMax Tri' },
    'byu_byu': { code: 'LISTBYU', name: 'Paket By.U' }
  };
  
  const productInfo = productMap[data];
  
  if (!productInfo) {
    await bot.sendMessage(chatId, '❌ Produk tidak ditemukan.');
    return;
  }
  
  // Save to session
  db.saveSession(userId, 'waiting_phone', {
    productCode: productInfo.code,
    productName: productInfo.name,
    step: 'list'
  });
  
  await bot.sendMessage(chatId, 
    `📱 *${productInfo.name}*\n\nSilakan masukkan nomor HP tujuan:\n\nFormat: 08123456789 atau 628123456789`, 
    {
      parse_mode: 'Markdown',
      reply_markup: menus.cancelButton()
    }
  );
}

/**
 * Cancel transaction
 */
async function handleCancel(bot, chatId, userId, messageId) {
  db.clearSession(userId);
  
  await bot.editMessageText('❌ Transaksi dibatalkan.', {
    chat_id: chatId,
    message_id: messageId
  });
  
  setTimeout(async () => {
    await bot.sendMessage(chatId, '🏠 Kembali ke Menu Utama', {
      reply_markup: menus.mainMenu()
    });
  }, 1000);
}

module.exports = {
  handleCallbackQuery
};
