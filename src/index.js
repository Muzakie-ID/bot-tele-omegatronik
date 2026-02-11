require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const config = require('./config/config');
const db = require('./database/db');

// Import handlers
const commandHandlers = require('./handlers/commands');
const callbackHandlers = require('./handlers/callbacks');
const messageHandlers = require('./handlers/messages');

// Validate bot token
if (!config.telegram.token) {
  console.error('❌ BOT_TOKEN tidak ditemukan! Silakan set di file .env');
  process.exit(1);
}

// Webhook configuration
const WEBHOOK_MODE = process.env.WEBHOOK_MODE === 'true';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3000');

// Create bot instance
let bot;
if (WEBHOOK_MODE && WEBHOOK_URL) {
  console.log('🌐 Bot Telegram Starting in WEBHOOK mode...');
  bot = new TelegramBot(config.telegram.token, { webHook: true });
  
  // Setup webhook
  bot.setWebHook(`${WEBHOOK_URL}`).then(() => {
    console.log('✅ Webhook set to:', WEBHOOK_URL);
  }).catch((error) => {
    console.error('❌ Failed to set webhook:', error);
    process.exit(1);
  });
} else {
  console.log('🔄 Bot Telegram Starting in POLLING mode...');
  bot = new TelegramBot(config.telegram.token, { polling: true });
}

// Setup Express server for webhook and health check
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mode: WEBHOOK_MODE ? 'webhook' : 'polling',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Webhook endpoint (only used in webhook mode)
if (WEBHOOK_MODE) {
  app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Start Express server
app.listen(WEBHOOK_PORT, () => {
  console.log(`🌐 HTTP Server listening on port ${WEBHOOK_PORT}`);
  console.log(`📊 Health check: http://localhost:${WEBHOOK_PORT}/health`);
});

// ============================================
// COMMAND HANDLERS
// ============================================

bot.onText(/\/start/, (msg) => {
  commandHandlers.handleStart(bot, msg);
});

bot.onText(/\/help/, (msg) => {
  commandHandlers.handleHelp(bot, msg);
});

bot.onText(/\/saldo/, (msg) => {
  commandHandlers.handleSaldo(bot, msg);
});

bot.onText(/\/history/, (msg) => {
  commandHandlers.handleHistory(bot, msg);
});

bot.onText(/\/cancel/, (msg) => {
  commandHandlers.handleCancel(bot, msg);
});

// ============================================
// CALLBACK QUERY HANDLERS
// ============================================

bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  
  // Route to appropriate handler
  if (data.startsWith('select_')) {
    await messageHandlers.handleProductClick(bot, callbackQuery);
  } else if (data === 'confirm_payment') {
    await messageHandlers.handlePaymentConfirm(bot, callbackQuery);
  } else {
    await callbackHandlers.handleCallbackQuery(bot, callbackQuery);
  }
});

// ============================================
// MESSAGE HANDLERS
// ============================================

bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }
  
  // Handle text messages
  if (msg.text) {
    await messageHandlers.handleMessage(bot, msg);
  }
});

// ============================================
// ERROR HANDLERS
// ============================================

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stopPolling();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stopPolling();
  db.close();
  process.exit(0);
});

// ============================================
// BOT STARTED
// ============================================

console.log('✅ Bot Telegram Started Successfully!');
console.log('📝 Press Ctrl+C to stop');

// Log admin IDs
if (config.telegram.adminIds.length > 0) {
  console.log('👑 Admin IDs:', config.telegram.adminIds.join(', '));
} else {
  console.log('⚠️  No admin IDs configured');
}
