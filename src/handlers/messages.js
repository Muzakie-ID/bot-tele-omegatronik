const db = require('../database/db');
const menus = require('../keyboards/menus');
const omegatronik = require('../services/omegatronik');
const Formatter = require('../utils/formatter');

/**
 * Handler untuk text messages
 */
async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  
  // Get session
  const session = db.getSession(userId);
  
  if (!session || !session.state) {
    // No active session, ignore
    return;
  }
  
  try {
    switch (session.state) {
      case 'waiting_phone':
        await handlePhoneInput(bot, chatId, userId, text, session);
        break;
      case 'waiting_product_selection':
        await handleProductSelection(bot, chatId, userId, text, session);
        break;
      case 'waiting_confirmation':
        await handleConfirmation(bot, chatId, userId, text, session);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('Message handler error:', error);
    await bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
    db.clearSession(userId);
  }
}

/**
 * Handle phone number input
 */
async function handlePhoneInput(bot, chatId, userId, text, session) {
  // Validate phone number
  const phone = text.replace(/\D/g, '');
  
  if (phone.length < 10 || phone.length > 13) {
    await bot.sendMessage(chatId, '❌ Nomor tidak valid. Silakan masukkan nomor yang benar (10-13 digit).');
    return;
  }
  
  // Format phone number
  let formattedPhone = phone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('62')) {
    formattedPhone = '62' + formattedPhone;
  }
  
  await bot.sendMessage(chatId, `⏳ Mengambil daftar paket untuk ${formattedPhone}...`);
  
  // Get product list
  const result = await omegatronik.listProducts(session.data.productCode, formattedPhone);
  
  if (!result.success) {
    await bot.sendMessage(chatId, `❌ Gagal mengambil daftar paket:\n${result.error}`, {
      reply_markup: menus.backToMainButton()
    });
    db.clearSession(userId);
    return;
  }
  
  if (!result.products || result.products.length === 0) {
    await bot.sendMessage(chatId, '❌ Tidak ada paket tersedia saat ini.', {
      reply_markup: menus.backToMainButton()
    });
    db.clearSession(userId);
    return;
  }
  
  // Generate keyboard dengan daftar produk
  const keyboard = {
    inline_keyboard: []
  };
  
  result.products.forEach(product => {
    keyboard.inline_keyboard.push([
      { 
        text: `${Formatter.truncate(product.name, 40)} - ${Formatter.rupiah(product.price)}`, 
        callback_data: `select_${product.id}` 
      }
    ]);
  });
  
  keyboard.inline_keyboard.push([
    { text: '❌ Batal', callback_data: 'cancel' }
  ]);
  
  // Save products to session
  session.data.phone = formattedPhone;
  session.data.products = result.products;
  db.saveSession(userId, 'waiting_product_click', session.data);
  
  await bot.sendMessage(chatId, 
    `📋 *Daftar Paket Tersedia*\n\nNomor: ${formattedPhone}\n\nPilih paket yang diinginkan:`, 
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );
}

/**
 * Handle product selection (from callback)
 */
async function handleProductClick(bot, callbackQuery) {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  await bot.answerCallbackQuery(callbackQuery.id);
  
  if (!data.startsWith('select_')) {
    return;
  }
  
  const productId = data.replace('select_', '');
  const session = db.getSession(userId);
  
  if (!session || !session.data.products) {
    await bot.sendMessage(chatId, '❌ Session expired. Silakan mulai lagi.');
    db.clearSession(userId);
    return;
  }
  
  // Find selected product
  const product = session.data.products.find(p => p.id === productId);
  
  if (!product) {
    await bot.sendMessage(chatId, '❌ Produk tidak ditemukan.');
    return;
  }
  
  // Get check price code
  const checkCode = session.data.productCode.replace('LIST', 'CEK');
  
  await bot.sendMessage(chatId, '⏳ Mengecek harga...');
  
  // Check price
  const priceResult = await omegatronik.checkPrice(checkCode, session.data.phone, productId);
  
  if (!priceResult.success) {
    await bot.sendMessage(chatId, `❌ Gagal cek harga:\n${priceResult.error}`, {
      reply_markup: menus.backToMainButton()
    });
    db.clearSession(userId);
    return;
  }
  
  // Save to session
  session.data.selectedProduct = product;
  session.data.selectedProductId = productId;
  session.data.price = priceResult.price;
  session.data.description = priceResult.description;
  db.saveSession(userId, 'waiting_payment_confirm', session.data);
  
  // Show confirmation
  const confirmMessage = `
📦 *Detail Pesanan*

Produk: ${priceResult.description}
Nomor: ${session.data.phone}
Harga: ${Formatter.rupiah(priceResult.price)}

Apakah Anda yakin ingin melanjutkan?
  `.trim();
  
  const confirmKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ Ya, Bayar Sekarang', callback_data: 'confirm_payment' },
        { text: '❌ Batal', callback_data: 'cancel' }
      ]
    ]
  };
  
  await bot.sendMessage(chatId, confirmMessage, {
    parse_mode: 'Markdown',
    reply_markup: confirmKeyboard
  });
}

/**
 * Handle payment confirmation
 */
async function handlePaymentConfirm(bot, callbackQuery) {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;
  
  await bot.answerCallbackQuery(callbackQuery.id);
  
  const session = db.getSession(userId);
  
  if (!session || session.state !== 'waiting_payment_confirm') {
    await bot.sendMessage(chatId, '❌ Session expired. Silakan mulai lagi.');
    db.clearSession(userId);
    return;
  }
  
  await bot.sendMessage(chatId, '⏳ Memproses transaksi...');
  
  // Generate transaction ID
  const trxId = Formatter.generateTrxId();
  
  // Get payment code
  const payCode = session.data.productCode.replace('LIST', '').replace('CEK', '');
  
  // Do transaction
  const result = await omegatronik.transaction(
    payCode,
    session.data.phone,
    trxId,
    session.data.selectedProductId
  );
  
  // Get user from DB
  const dbUser = db.getOrCreateUser({ id: userId });
  
  // Save transaction to database
  db.saveTransaction({
    user_id: dbUser.id,
    ref_id: trxId,
    product_code: payCode,
    product_name: session.data.description,
    destination: session.data.phone,
    amount: session.data.price,
    status: result.status || 'PENDING',
    sn: result.sn,
    message: result.message,
    request_data: session.data,
    response_data: result
  });
  
  // Clear session
  db.clearSession(userId);
  
  // Send result
  if (result.success) {
    const successMessage = `
✅ *Transaksi BERHASIL!*

Ref ID: ${trxId}
Produk: ${session.data.description}
Tujuan: ${session.data.phone}
Harga: ${Formatter.rupiah(session.data.price)}
${result.sn ? `SN: ${result.sn}` : ''}

Terima kasih telah menggunakan layanan kami! 🙏
    `.trim();
    
    await bot.sendMessage(chatId, successMessage, {
      parse_mode: 'Markdown',
      reply_markup: menus.mainMenu()
    });
  } else {
    const failMessage = `
❌ *Transaksi GAGAL*

Ref ID: ${trxId}
Status: ${result.status || 'GAGAL'}
${result.message ? `Pesan: ${result.message}` : ''}

Silakan coba lagi atau hubungi admin jika masalah berlanjut.
    `.trim();
    
    await bot.sendMessage(chatId, failMessage, {
      parse_mode: 'Markdown',
      reply_markup: menus.mainMenu()
    });
  }
}

module.exports = {
  handleMessage,
  handleProductClick,
  handlePaymentConfirm
};
