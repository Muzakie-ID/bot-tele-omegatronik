#!/bin/bash
# Setup Script untuk Nginx + SSL di Host Server

set -e

echo "================================================"
echo "  Nginx Setup untuk Bot Telegram"
echo "  (Running di Host Server, bukan Docker)"
echo "================================================"
echo ""

# Configuration
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"

echo "⚠️  IMPORTANT: Edit script ini dulu!"
echo "   1. Ganti DOMAIN dengan domain Anda"
echo "   2. Ganti EMAIL dengan email Anda"
echo ""
read -p "Sudah edit DOMAIN dan EMAIL? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Silakan edit script ini dulu, lalu run lagi!"
    exit 1
fi

# 1. Install Nginx
echo ""
echo "📦 Installing Nginx..."
sudo apt update
sudo apt install -y nginx

# 2. Install Certbot (Let's Encrypt)
echo ""
echo "🔐 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 3. Stop Nginx temporarily
echo ""
echo "⏸️  Stopping Nginx..."
sudo systemctl stop nginx

# 4. Generate SSL Certificate
echo ""
echo "🔒 Generating SSL Certificate dengan Let's Encrypt..."
echo "    Domain: $DOMAIN"
echo "    Email: $EMAIL"
sudo certbot certonly --standalone \
  -d $DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --preferred-challenges http

# 5. Copy Nginx config
echo ""
echo "📝 Setting up Nginx configuration..."

# Create config from template
sudo tee /etc/nginx/sites-available/bot-telegram > /dev/null <<EOF
# Bot Telegram - Nginx Configuration

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    access_log /var/log/nginx/bot-telegram-access.log;
    error_log /var/log/nginx/bot-telegram-error.log;

    limit_req_zone \$binary_remote_addr zone=telegram_limit:10m rate=10r/s;

    location /webhook {
        limit_req zone=telegram_limit burst=20 nodelay;
        
        proxy_pass http://localhost:8095/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:8095/health;
        access_log off;
    }

    location / {
        return 404;
    }
}
EOF

# 6. Enable site
echo ""
echo "✅ Enabling site..."
sudo ln -sf /etc/nginx/sites-available/bot-telegram /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# 7. Test Nginx config
echo ""
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# 8. Start Nginx
echo ""
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx --no-pager

# 9. Setup auto-renewal
echo ""
echo "⏰ Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update bot .env file:"
echo "   WEBHOOK_MODE=true"
echo "   WEBHOOK_URL=https://$DOMAIN/webhook"
echo ""
echo "2. Restart Docker container:"
echo "   docker compose restart telegram-bot"
echo ""
echo "3. Set Telegram webhook:"
echo "   curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://$DOMAIN/webhook\""
echo ""
echo "4. Test webhook:"
echo "   curl https://$DOMAIN/health"
echo ""
echo "5. Check logs:"
echo "   sudo tail -f /var/log/nginx/bot-telegram-access.log"
echo "   docker compose logs -f telegram-bot"
echo ""
echo "📝 SSL Certificate Location:"
echo "   /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "🔄 SSL Auto-Renewal:"
echo "   Certbot will automatically renew certificates"
echo "   Run 'sudo certbot renew --dry-run' to test"
echo ""
