# 🌐 Setup Nginx di Host Server (Bukan Docker)

Panduan lengkap setup Nginx reverse proxy di host server untuk bot Telegram yang running di Docker container.

## 📋 Prerequisites

- Ubuntu/Debian server dengan root access
- Domain sudah pointing ke IP server
- Docker container bot sudah running di port 8095
- Port 80 dan 443 terbuka di firewall

## 🚀 Quick Setup

### Metode 1: Automatic Setup (Recommended)

```bash
# 1. Download setup script
wget https://raw.githubusercontent.com/Muzakie-ID/bot-tele-omegatronik/main/setup-nginx-host.sh

# 2. Edit script - ganti DOMAIN dan EMAIL
nano setup-nginx-host.sh

# Edit baris ini:
# DOMAIN="yourdomain.com"  -> ganti dengan domain Anda
# EMAIL="your-email@example.com"  -> ganti dengan email Anda

# 3. Beri permission
chmod +x setup-nginx-host.sh

# 4. Run script
sudo ./setup-nginx-host.sh
```

Script akan otomatis:
- ✅ Install Nginx
- ✅ Install Certbot (Let's Encrypt)
- ✅ Generate SSL certificate
- ✅ Setup Nginx config
- ✅ Enable site
- ✅ Start Nginx
- ✅ Setup auto-renewal SSL

### Metode 2: Manual Setup

**1. Install Nginx:**

```bash
sudo apt update
sudo apt install -y nginx
```

**2. Install Certbot (untuk SSL):**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**3. Generate SSL Certificate:**

```bash
# Stop Nginx sementara
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Start Nginx lagi
sudo systemctl start nginx
```

**4. Buat Nginx Config:**

```bash
sudo nano /etc/nginx/sites-available/bot-telegram
```

Paste config ini (ganti `yourdomain.com` dengan domain Anda):

```nginx
# Rate Limiting Zone (MUST be at http level, not server level)
# Add this to /etc/nginx/nginx.conf in http {} block:
# limit_req_zone $binary_remote_addr zone=telegram_limit:10m rate=10r/s;

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Webhook
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/bot-telegram-access.log;
    error_log /var/log/nginx/bot-telegram-error.log;

    # Webhook - Proxy ke Docker container
    location /webhook {
        limit_req zone=telegram_limit burst=20 nodelay;
        
        proxy_pass http://localhost:8095/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:8095/health;
        access_log off;
    }

    # Block other paths
    location / {
        return 404;
    }
}
```

**5. Enable Site:**

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/bot-telegram /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## ⚙️ Configure Bot untuk Webhook Mode

**1. Edit .env di server:**

```bash
nano ~/bot-tele-omegatronik/.env
```

Tambahkan/edit:

```env
WEBHOOK_MODE=true
WEBHOOK_URL=https://yourdomain.com/webhook
WEBHOOK_PORT=3000
```

**2. Restart bot container:**

```bash
cd ~/bot-tele-omegatronik
docker compose restart telegram-bot
```

**3. Set webhook di Telegram:**

```bash
# Ganti <YOUR_BOT_TOKEN> dengan token Anda
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/webhook"

# Response seharusnya: {"ok":true,"result":true,...}
```

**4. Verify webhook:**

```bash
# Check webhook info
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## 🧪 Testing

**1. Test SSL:**

```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{"status":"ok","mode":"webhook","timestamp":"...","uptime":...}
```

**2. Test webhook endpoint:**

```bash
# Ini akan return 404 (normal, karena butuh Telegram signature)
curl https://yourdomain.com/webhook
```

**3. Test bot di Telegram:**

- Buka bot Anda di Telegram
- Ketik `/start`
- Bot harus merespon instantly (webhook lebih cepat dari polling)

## 📊 Monitoring

**View Nginx logs:**

```bash
# Access log (semua request)
sudo tail -f /var/log/nginx/bot-telegram-access.log

# Error log
sudo tail -f /var/log/nginx/bot-telegram-error.log

# Live monitoring
sudo tail -f /var/log/nginx/bot-telegram-access.log | grep webhook
```

**View bot logs:**

```bash
cd ~/bot-tele-omegatronik
docker compose logs -f telegram-bot
```

**Check Nginx status:**

```bash
sudo systemctl status nginx
```

**Check SSL certificate:**

```bash
sudo certbot certificates
```

## 🔄 SSL Auto-Renewal

Certbot automatically renews certificates. Test renewal:

```bash
# Dry run (test tanpa apply)
sudo certbot renew --dry-run

# Force renewal (jika perlu)
sudo certbot renew --force-renewal

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

## 🔧 Troubleshooting

### Webhook tidak terima request

```bash
# Check Nginx error log
sudo tail -50 /var/log/nginx/bot-telegram-error.log

# Check bot container running
docker ps | grep bot-tele-omegatronik

# Check port 8095 listening
netstat -tulpn | grep 8095

# Test local connection
curl http://localhost:8095/health
```

### SSL Certificate Error

```bash
# Renew certificate
sudo certbot renew

# Check certificate validity
sudo certbot certificates

# Test Nginx config
sudo nginx -t
```

### Rate Limit Hit

Edit `/etc/nginx/sites-available/bot-telegram`:

```nginx
# Increase rate limit
limit_req_zone $binary_remote_addr zone=telegram_limit:10m rate=20r/s;

location /webhook {
    limit_req zone=telegram_limit burst=50 nodelay;
    ...
}
```

Reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Security Tips

1. **Firewall:** Only allow ports 80, 443, and SSH
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **Fail2ban:** Protect from brute force
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Rate limiting:** Already configured in Nginx config

4. **Keep updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## 📝 Summary

**Architecture:**
```
Internet → Nginx (Port 443) → Docker Container (Port 8095) → Bot App
           ↓
        SSL/TLS
        Let's Encrypt
```

**URLs:**
- Webhook: `https://yourdomain.com/webhook`
- Health: `https://yourdomain.com/health`

**Logs:**
- Nginx: `/var/log/nginx/bot-telegram-*.log`
- Bot: `docker compose logs telegram-bot`

**SSL:**
- Auto-renewal enabled via Certbot
- Certificate location: `/etc/letsencrypt/live/yourdomain.com/`

---

**Need help?** Check logs atau hubungi support! 🚀
