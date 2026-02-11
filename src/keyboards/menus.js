/**
 * Keyboard menus untuk Telegram Bot
 */

/**
 * Main menu keyboard
 */
function mainMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📱 Pulsa & Paket Data', callback_data: 'menu_pulsa' },
        { text: '⚡ Token Listrik', callback_data: 'menu_token' }
      ],
      [
        { text: '🎮 Voucher Game', callback_data: 'menu_game' },
        { text: '📺 Voucher Digital', callback_data: 'menu_voucher' }
      ],
      [
        { text: '💰 Cek Saldo', callback_data: 'check_balance' },
        { text: '📊 Riwayat', callback_data: 'history' }
      ],
      [
        { text: 'ℹ️ Info & Bantuan', callback_data: 'help' }
      ]
    ]
  };
}

/**
 * Menu Pulsa & Paket Data
 */
function pulsaMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📱 Telkomsel', callback_data: 'provider_telkomsel' }
      ],
      [
        { text: '📱 Indosat', callback_data: 'provider_indosat' }
      ],
      [
        { text: '📱 XL / AXIS', callback_data: 'provider_xl' }
      ],
      [
        { text: '📱 Tri', callback_data: 'provider_tri' }
      ],
      [
        { text: '📱 By.U', callback_data: 'provider_byu' }
      ],
      [
        { text: '🔙 Kembali', callback_data: 'back_main' }
      ]
    ]
  };
}

/**
 * Menu Provider - Telkomsel
 */
function telkomselMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Paket Data Harian', callback_data: 'tsel_dh' },
        { text: '📦 Paket Data Mingguan', callback_data: 'tsel_dm' }
      ],
      [
        { text: '📦 Paket Data Bulanan', callback_data: 'tsel_db' },
        { text: '📦 Paket Combo Sakti', callback_data: 'tsel_sakti' }
      ],
      [
        { text: '📦 Paket Nelpon Sakti', callback_data: 'tsel_ns' },
        { text: '📦 Paket Orbit', callback_data: 'tsel_orbit' }
      ],
      [
        { text: '📦 Paket Omni', callback_data: 'tsel_omni' }
      ],
      [
        { text: '🔙 Kembali', callback_data: 'menu_pulsa' }
      ]
    ]
  };
}

/**
 * Menu Provider - Indosat
 */
function indosatMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Paket Only4You', callback_data: 'isat_di' }
      ],
      [
        { text: '🔙 Kembali', callback_data: 'menu_pulsa' }
      ]
    ]
  };
}

/**
 * Menu Provider - XL/AXIS
 */
function xlMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Paket Cuanku Spesial', callback_data: 'xl_dx' }
      ],
      [
        { text: '🔙 Kembali', callback_data: 'menu_pulsa' }
      ]
    ]
  };
}

/**
 * Menu Provider - Tri
 */
function triMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Paket CuanMax', callback_data: 'tri_dtr' }
      ],
      [
        { text: '🔙 Kembali', callback_data: 'menu_pulsa' }
      ]
    ]
  };
}

/**
 * Menu Provider - By.U
 */
function byuMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Paket By.U', callback_data: 'byu_byu' }
      ],
      [
        { text: '🔙 Kembali', callback_data: 'menu_pulsa' }
      ]
    ]
  };
}

/**
 * Cancel button
 */
function cancelButton() {
  return {
    inline_keyboard: [
      [
        { text: '❌ Batal', callback_data: 'cancel' }
      ]
    ]
  };
}

/**
 * Back to main menu button
 */
function backToMainButton() {
  return {
    inline_keyboard: [
      [
        { text: '🏠 Menu Utama', callback_data: 'back_main' }
      ]
    ]
  };
}

/**
 * Confirmation keyboard
 */
function confirmationKeyboard(callbackConfirm, callbackCancel = 'cancel') {
  return {
    inline_keyboard: [
      [
        { text: '✅ Ya, Lanjutkan', callback_data: callbackConfirm },
        { text: '❌ Batal', callback_data: callbackCancel }
      ]
    ]
  };
}

/**
 * Generate product list keyboard
 */
function productListKeyboard(products, prefix) {
  const keyboard = [];
  
  // Group products in rows of 1
  products.forEach(product => {
    keyboard.push([
      { text: `${product.name} - ${product.price}`, callback_data: `${prefix}_${product.id}` }
    ]);
  });
  
  // Add back button
  keyboard.push([
    { text: '🔙 Kembali', callback_data: 'back_provider' }
  ]);
  
  return { inline_keyboard: keyboard };
}

module.exports = {
  mainMenu,
  pulsaMenu,
  telkomselMenu,
  indosatMenu,
  xlMenu,
  triMenu,
  byuMenu,
  cancelButton,
  backToMainButton,
  confirmationKeyboard,
  productListKeyboard
};
