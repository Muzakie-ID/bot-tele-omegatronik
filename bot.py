import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
from services.omegatronik import OmegatronikService

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
application = None

# Initialize service
omega_service = OmegatronikService(
    member_id=os.getenv('MEMBER_ID'),
    pin=os.getenv('PIN'),
    password=os.getenv('PASSWORD')
)

# User sessions
user_sessions = {}

# Constants for session states
STATE_WAITING_DESTINATION = 'waiting_destination'
STATE_WAITING_PRODUCT_CODE = 'waiting_product_code'


def get_main_menu():
    """Generate main menu keyboard"""
    keyboard = [
        [InlineKeyboardButton("💰 Cek Saldo", callback_data="cek_saldo")],
        [InlineKeyboardButton("📦 Order Produk", callback_data="order_produk")],
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


async def start_order(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start order process - ask for destination"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    # Set session state
    user_sessions[user_id] = {
        'state': STATE_WAITING_DESTINATION
    }
    
    await query.edit_message_text(
        "📦 *Order Produk*\n\n"
        "Silakan masukkan nomor tujuan:\n"
        "(Nomor HP, ID PLN, dll.)",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("🔙 Batal", callback_data="menu_utama")
        ]]),
        parse_mode='Markdown'
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages for order process"""
    user_id = update.effective_user.id
    text = update.message.text
    
    if user_id not in user_sessions:
        await update.message.reply_text(
            "Silakan mulai dengan /start",
            reply_markup=get_main_menu()
        )
        return
    
    session = user_sessions[user_id]
    
    if session['state'] == STATE_WAITING_DESTINATION:
        # Store destination and ask for product code
        session['destination'] = text
        session['state'] = STATE_WAITING_PRODUCT_CODE
        
        await update.message.reply_text(
            f"📱 Nomor tujuan: {text}\n\n"
            "Silakan masukkan kode produk:",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔙 Batal", callback_data="menu_utama")
            ]])
        )
    
    elif session['state'] == STATE_WAITING_PRODUCT_CODE:
        # Process order
        destination = session['destination']
        product_code = text
        
        await update.message.reply_text("⏳ Memproses order...")
        
        result = await omega_service.order_product(destination, product_code)
        
        if result['success']:
            data = result['data']
            message = f"✅ *Order Berhasil!*\n\n"
            message += f"Trx ID: {data.get('trx_id', '-')}\n"
            message += f"Tujuan: {data.get('destination', '-')}\n"
            message += f"Produk: {data.get('product_name', data.get('product_code', '-'))}\n"
            message += f"Harga: Rp {data.get('price', 0):,}\n"
            message += f"Status: {data.get('status', '-')}\n"
            message += f"Pesan: {data.get('message', '-')}"
            
            await update.message.reply_text(
                message,
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("🔙 Menu Utama", callback_data="menu_utama")
                ]]),
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                f"❌ *Order Gagal*\n\n"
                f"Error: {result['error']}\n\n"
                "Silakan coba lagi.",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("🔙 Menu Utama", callback_data="menu_utama")
                ]]),
                parse_mode='Markdown'
            )
        
        # Clear session
        del user_sessions[user_id]


async def show_bantuan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help message"""
    query = update.callback_query
    await query.answer()
    
    help_text = "❓ *Bantuan*\n\n"
    help_text += "📋 *Fitur Bot:*\n"
    help_text += "• 💰 Cek Saldo - Cek saldo akun Omega Tronik\n"
    help_text += "• 📦 Order Produk - Order produk digital\n\n"
    help_text += "📝 *Cara Order:*\n"
    help_text += "1. Pilih menu Order Produk\n"
    help_text += "2. Masukkan nomor tujuan\n"
    help_text += "3. Masukkan kode produk\n"
    help_text += "4. Tunggu konfirmasi order\n\n"
    help_text += "📞 *Hubungi Admin:* @admin_username"
    
    keyboard = [[InlineKeyboardButton("🔙 Kembali", callback_data="menu_utama")]]
    await query.edit_message_text(
        help_text,
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode='Markdown'
    )


async def back_to_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Return to main menu"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    # Clear session if exists
    if user_id in user_sessions:
        del user_sessions[user_id]
    
    await query.edit_message_text(
        "🤖 *Bot Auto Order Omega Tronik*\n\n"
        "Silakan pilih menu:",
        reply_markup=get_main_menu(),
        parse_mode='Markdown'
    )


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle all callback queries"""
    query = update.callback_query
    data = query.data
    
    if data == "cek_saldo":
        await cek_saldo(update, context)
    elif data == "order_produk":
        await start_order(update, context)
    elif data == "bantuan":
        await show_bantuan(update, context)
    elif data == "menu_utama":
        await back_to_menu(update, context)


def main():
    """Main function to run the bot"""
    global application, update_queue, bot_loop
    
    bot_token = os.getenv('BOT_TOKEN')
    webhook_mode = os.getenv('WEBHOOK_MODE', 'false').lower() == 'true'
    webhook_url = os.getenv('WEBHOOK_URL', '')
    
    if not bot_token:
        logger.error("BOT_TOKEN not found in environment variables")
        return
    
    # Create application
    application = Application.builder().token(bot_token).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(handle_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    if webhook_mode:
        # Webhook mode
        logger.info("Starting bot in webhook mode...")
        
        # Set webhook
        application.run_webhook(
            listen='0.0.0.0',
            port=int(os.getenv('WEBHOOK_PORT', 8095)),
            url_path='webhook',
            webhook_url=webhook_url
        )
    else:
        # Polling mode
        logger.info("Starting bot in polling mode...")
        application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
