import os
import logging
import asyncio
import threading
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
from services.omegatronik import OmegatronikService
from flask import Flask, request, jsonify

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)
logging.getLogger('httpx').setLevel(logging.WARNING)

# Global variables
flask_app = Flask(__name__)
application = None
update_queue = asyncio.Queue()

# Initialize service
omega_service = OmegatronikService(
    member_id=os.getenv('MEMBER_ID'),
    pin=os.getenv('PIN'),
    password=os.getenv('PASSWORD')
)

# User sessions
user_sessions = {}

def get_main_menu():
    """Generate main menu keyboard"""
    keyboard = [
        [InlineKeyboardButton("💰 Cek Saldo", callback_data="cek_saldo")],
        [InlineKeyboardButton("📱 Pulsa", callback_data="pulsa"),
         InlineKeyboardButton("📶 Paket Data", callback_data="paket_data")],
        [InlineKeyboardButton("🎮 Voucher Game", callback_data="voucher_game"),
         InlineKeyboardButton("💡 PLN", callback_data="pln")],
        [InlineKeyboardButton("❓ Bantuan", callback_data="bantuan")]
    ]
    return InlineKeyboardMarkup(keyboard)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command handler"""
    user = update.effective_user
    await update.message.reply_text(
        f"👋 Selamat datang {user.first_name}!\n\n"
        "🤖 Bot Auto Order Omega Tronik\n"
        "Silakan pilih menu di bawah:",
        reply_markup=get_main_menu()
    )

async def cek_saldo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check balance handler"""
    query = update.callback_query
    await query.answer()
    
    await query.edit_message_text("⏳ Mengecek saldo...")
    
    result = await omega_service.check_balance()
    
    if result['success']:
        data = result['data']
        message = f"💰 *Informasi Saldo*\n\n"
        message += f"Saldo: Rp {data.get('saldo', '0'):,}\n"
        message += f"Status: {data.get('status', '-')}"
        
        keyboard = [[InlineKeyboardButton("🔙 Kembali", callback_data="menu_utama")]]
        await query.edit_message_text(
            message,
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode='Markdown'
        )
    else:
        await query.edit_message_text(
            f"❌ Gagal cek saldo: {result['error']}\n\n"
            "Silakan coba lagi atau hubungi admin.",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔙 Kembali", callback_data="menu_utama")
            ]])
        )

async def handle_product_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle product category selection"""
    query = update.callback_query
    await query.answer()
    
    category = query.data
    user_id = update.effective_user.id
    
    # Store category in session
    if user_id not in user_sessions:
        user_sessions[user_id] = {}
    user_sessions[user_id]['category'] = category
    user_sessions[user_id]['step'] = 'input_nomor'
    
    category_names = {
        'pulsa': '📱 Pulsa',
        'paket_data': '📶 Paket Data',
        'voucher_game': '🎮 Voucher Game',
        'pln': '💡 PLN'
    }
    
    await query.edit_message_text(
        f"{category_names.get(category, category)}\n\n"
        "Silakan masukkan nomor/ID tujuan:",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("❌ Batal", callback_data="menu_utama")
        ]])
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle user messages"""
    user_id = update.effective_user.id
    
    if user_id not in user_sessions:
        await update.message.reply_text(
            "Silakan pilih menu terlebih dahulu dengan /start"
        )
        return
    
    session = user_sessions[user_id]
    
    if session.get('step') == 'input_nomor':
        nomor = update.message.text
        session['nomor'] = nomor
        session['step'] = 'show_products'
        
        await update.message.reply_text(
            f"⏳ Mengambil daftar produk untuk {nomor}..."
        )
        
        # Get product list based on category
        category = session['category']
        product_codes = {
            'pulsa': 'LISTDX',
            'paket_data': 'LISTDX',
            'voucher_game': 'LISTSAKTI',
            'pln': 'LISTPLN'
        }
        
        product_code = product_codes.get(category, 'LISTDX')
        result = await omega_service.list_products(product_code, nomor)
        
        if result['success'] and result['products']:
            products = result['products'][:10]  # Limit to 10
            keyboard = []
            
            for product in products:
                button_text = f"{product['nama']} - Rp {product['harga']:,}"
                callback_data = f"buy_{product['id']}"
                keyboard.append([InlineKeyboardButton(button_text, callback_data=callback_data)])
            
            keyboard.append([InlineKeyboardButton("❌ Batal", callback_data="menu_utama")])
            
            await update.message.reply_text(
                "Pilih produk:",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            await update.message.reply_text(
                f"❌ Gagal mengambil produk: {result.get('error', 'Unknown error')}",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("🔙 Kembali", callback_data="menu_utama")
                ]])
            )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle callback queries"""
    query = update.callback_query
    data = query.data
    
    if data == "menu_utama":
        await query.answer()
        await query.edit_message_text(
            "🏠 Menu Utama\n\nSilakan pilih menu:",
            reply_markup=get_main_menu()
        )
    elif data == "cek_saldo":
        await cek_saldo(update, context)
    elif data in ['pulsa', 'paket_data', 'voucher_game', 'pln']:
        await handle_product_category(update, context)
    elif data.startswith('buy_'):
        await handle_buy_product(update, context)
    elif data == "bantuan":
        await query.answer()
        await query.edit_message_text(
            "❓ *Bantuan*\n\n"
            "Bot ini untuk auto order produk digital melalui Omega Tronik H2H.\n\n"
            "Fitur:\n"
            "- Cek Saldo\n"
            "- Order Pulsa\n"
            "- Order Paket Data\n"
            "- Order Voucher Game\n"
            "- Order PLN\n\n"
            "Hubungi admin jika ada kendala.",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔙 Kembali", callback_data="menu_utama")
            ]]),
            parse_mode='Markdown'
        )

async def handle_buy_product(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle product purchase"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    product_id = query.data.replace('buy_', '')
    
    if user_id not in user_sessions:
        await query.edit_message_text(
            "Session expired. Silakan /start lagi.",
            reply_markup=get_main_menu()
        )
        return
    
    session = user_sessions[user_id]
    nomor = session.get('nomor')
    category = session.get('category')
    
    await query.edit_message_text("⏳ Memproses transaksi...")
    
    # Determine product code
    product_codes = {
        'pulsa': 'DX',
        'paket_data': 'DX',
        'voucher_game': 'SAKTI',
        'pln': 'PLN'
    }
    
    product_code = product_codes.get(category, 'DX')
    
    # Execute transaction
    result = await omega_service.transaction(
        product_code=product_code,
        dest=nomor,
        product_id=product_id
    )
    
    if result['success']:
        data = result['data']
        message = "✅ *Transaksi Berhasil!*\n\n"
        message += f"Produk: {data.get('produk', '-')}\n"
        message += f"Tujuan: {data.get('tujuan', nomor)}\n"
        message += f"Harga: Rp {data.get('harga', 0):,}\n"
        message += f"Ref ID: {data.get('refid', '-')}\n"
        message += f"SN: {data.get('sn', '-')}"
        
        keyboard = [[InlineKeyboardButton("🔙 Menu Utama", callback_data="menu_utama")]]
        await query.edit_message_text(
            message,
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode='Markdown'
        )
    else:
        await query.edit_message_text(
            f"❌ Transaksi gagal: {result['error']}\n\n"
            "Silakan coba lagi atau hubungi admin.",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔙 Menu Utama", callback_data="menu_utama")
            ]])
        )
    
    # Clear session
    if user_id in user_sessions:
        del user_sessions[user_id]

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"Update {update} caused error {context.error}")

@flask_app.route('/webhook', methods=['POST'])
def webhook():
    """Handle webhook updates from Telegram"""
    try:
        update = Update.de_json(request.get_json(force=True), application.bot)
        asyncio.run_coroutine_threadsafe(update_queue.put(update), application.bot._loop)
        logger.info(f"Received update: {update.update_id}")
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
    return jsonify({'ok': True})

@flask_app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    mode = 'webhook' if os.getenv('WEBHOOK_MODE', 'false').lower() == 'true' else 'polling'
    return jsonify({'status': 'ok', 'mode': mode})

async def process_updates():
    """Process updates from queue"""
    while True:
        try:
            update = await update_queue.get()
            logger.info(f"Processing update: {update.update_id}")
            await application.process_update(update)
        except Exception as e:
            logger.error(f"Error processing update: {e}")

async def setup_webhook(app, webhook_url):
    """Setup webhook with Telegram"""
    try:
        await app.bot.set_webhook(url=webhook_url)
        logger.info(f"Webhook set to: {webhook_url}")
    except Exception as e:
        logger.error(f"Failed to set webhook: {e}")
        raise

def run_async_loop(loop):
    """Run asyncio event loop in background thread"""
    asyncio.set_event_loop(loop)
    loop.run_forever()

def main():
    """Main function"""
    global application
    
    token = os.getenv('BOT_TOKEN')
    if not token:
        raise ValueError("BOT_TOKEN not found in environment")
    
    # Create application
    application = Application.builder().token(token).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(handle_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    application.add_error_handler(error_handler)
    
    # Check mode
    webhook_mode = os.getenv('WEBHOOK_MODE', 'false').lower() == 'true'
    
    if webhook_mode:
        webhook_url = os.getenv('WEBHOOK_URL')
        webhook_port = int(os.getenv('WEBHOOK_PORT', 8080))
        
        if not webhook_url:
            raise ValueError("WEBHOOK_URL required for webhook mode")
        
        # Initialize bot and set webhook
        logger.info(f"Starting bot in WEBHOOK mode")
        logger.info(f"Webhook URL: {webhook_url}")
        
        # Create event loop
        loop = asyncio.new_event_loop()
        
        async def initialize():
            await application.initialize()
            await setup_webhook(application, webhook_url)
            await application.start()
            # Start processing updates
            asyncio.create_task(process_updates())
        
        # Run initialization
        asyncio.set_event_loop(loop)
        loop.run_until_complete(initialize())
        
        # Start event loop in background thread
        loop_thread = threading.Thread(target=run_async_loop, args=(loop,), daemon=True)
        loop_thread.start()
        
        logger.info(f"Event loop started in background")
        
        # Run Flask (blocking)
        logger.info(f"Flask listening on 0.0.0.0:{webhook_port}")
        flask_app.run(
            host='0.0.0.0',
            port=webhook_port,
            debug=False,
            use_reloader=False
        )
    else:
        # Polling mode
        logger.info("Starting bot in POLLING mode")
        application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
