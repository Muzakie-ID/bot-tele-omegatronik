#!/bin/bash

# Docker Run Script untuk Bot Telegram Omega Tronik

set -e

echo "🐳 Bot Telegram Omega Tronik - Docker Setup"
echo "==========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  File .env tidak ditemukan!"
    echo "📝 Membuat .env dari template..."
    cp .env.example .env
    echo "✅ File .env sudah dibuat. Silakan edit dengan kredensial Anda!"
    echo ""
    echo "Edit file .env dengan command:"
    echo "  nano .env"
    echo ""
    exit 1
fi

# Create directories if not exist
mkdir -p database logs nginx/ssl

# Function to show menu
show_menu() {
    echo ""
    echo "Pilih mode operasi:"
    echo "1) Polling Mode (Recommended - tanpa perlu domain/SSL)"
    echo "2) Webhook Mode (Perlu domain & SSL)"
    echo "3) Build & Start"
    echo "4) Stop"
    echo "5) Restart"
    echo "6) View Logs"
    echo "7) Status"
    echo "8) Clean & Rebuild"
    echo "0) Exit"
    echo ""
    read -p "Pilihan: " choice
}

# Start with polling mode
start_polling() {
    echo "🚀 Starting bot in POLLING mode..."
    docker-compose up -d telegram-bot
    echo "✅ Bot started!"
    echo "📊 View logs: docker-compose logs -f telegram-bot"
}

# Start with webhook mode
start_webhook() {
    echo "🚀 Starting bot in WEBHOOK mode..."
    
    # Check SSL certificates
    if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
        echo "⚠️  SSL certificates tidak ditemukan!"
        echo "📝 Silakan letakkan certificate di:"
        echo "   - nginx/ssl/fullchain.pem"
        echo "   - nginx/ssl/privkey.pem"
        echo ""
        echo "Atau gunakan Let's Encrypt:"
        echo "   certbot certonly --standalone -d yourdomain.com"
        exit 1
    fi
    
    docker-compose --profile webhook up -d
    echo "✅ Bot and Nginx started!"
    echo "📊 View logs: docker-compose logs -f"
}

# Build and start
build_start() {
    echo "🏗️  Building Docker image..."
    docker-compose build --no-cache
    echo "🚀 Starting containers..."
    start_polling
}

# Stop containers
stop_containers() {
    echo "🛑 Stopping containers..."
    docker-compose down
    echo "✅ Containers stopped!"
}

# Restart containers
restart_containers() {
    echo "🔄 Restarting containers..."
    docker-compose restart
    echo "✅ Containers restarted!"
}

# View logs
view_logs() {
    echo "📊 Viewing logs (Ctrl+C to exit)..."
    docker-compose logs -f telegram-bot
}

# Status
show_status() {
    echo "📊 Container Status:"
    docker-compose ps
}

# Clean and rebuild
clean_rebuild() {
    echo "🧹 Cleaning up..."
    docker-compose down -v
    docker system prune -f
    echo "🏗️  Rebuilding..."
    docker-compose build --no-cache
    echo "✅ Clean and rebuild complete!"
}

# Main menu loop
while true; do
    show_menu
    
    case $choice in
        1)
            start_polling
            ;;
        2)
            start_webhook
            ;;
        3)
            build_start
            ;;
        4)
            stop_containers
            ;;
        5)
            restart_containers
            ;;
        6)
            view_logs
            ;;
        7)
            show_status
            ;;
        8)
            clean_rebuild
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Pilihan tidak valid!"
            ;;
    esac
done
