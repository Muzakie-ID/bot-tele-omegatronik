# Webhook Mode Setup Guide

Panduan lengkap deploy bot dengan **webhook mode** menggunakan nginx + SSL.

## Prerequisites

- Server Linux (Ubuntu/Debian) dengan akses root
- Domain/subdomain sudah pointing ke IP server
- Port 80 dan 443 terbuka
- Docker dan Docker Compose sudah terinstall

## Step 1: Setup Domain DNS

Pastikan domain sudah pointing ke IP server:

```bash
nslookup callback.muzakie.my.id
# Harus return IP server Anda
```

**Setting DNS di provider:**
- Type: **A**
- Name: **callback.muzakie.my.id**
- Value: **IP_SERVER_ANDA**
- TTL: 300

## Step 2: Install SSL Certificate

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot certonly --nginx -d callback.muzakie.my.id

# Certificate akan tersimpan di:
# /etc/letsencrypt/live/callback.muzakie.my.id/
```

## Step 3: Setup Nginx

```bash
# Copy config
sudo cp nginx-webhook.conf /etc/nginx/sites-available/bot-telegram

# Enable site
sudo ln -s /etc/nginx/sites-available/bot-telegram /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**PENTING:** Jika ada config lain dengan `server_name` yang sama, hapus atau edit untuk avoid conflict.

## Step 4: Clone & Configure Bot

```bash
# Clone repository
cd ~
git clone https://github.com/Muzakie-ID/bot-tele-omegatronik.git
cd bot-tele-omegatronik

# Setup environment
cp .env.example .env
nano .env
```

**Edit `.env` dengan webhook mode:**

```env
# Bot Configuration
BOT_TOKEN=7123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789

# Omega Tronik API
MEMBER_ID=OX1234
PIN=123456
PASSWORD=your_password_here

# Webhook Mode
WEBHOOK_MODE=true
WEBHOOK_URL=https://callback.muzakie.my.id/webhook
WEBHOOK_PORT=8080
```

## Step 5: Deploy dengan Docker

```bash
# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f telegram-bot
```

**Logs yang benar:**
```
INFO - Setting webhook: https://callback.muzakie.my.id/webhook
INFO - Bot started in WEBHOOK mode
```

## Step 6: Verify Webhook

### Test Health Endpoint

```bash
curl https://callback.muzakie.my.id/health
```

Expected response:
```json
{"status":"ok","mode":"webhook"}
```

### Test Webhook dengan Telegram

```bash
# Get webhook info
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://callback.muzakie.my.id/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Test Bot

Buka Telegram dan kirim `/start` ke bot Anda. Harus langsung dapat reply.

## Troubleshooting

### Webhook tidak terset

**Problem:** `curl webhook info` menunjukkan URL kosong

**Solution:**
```bash
# Set webhook manual
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://callback.muzakie.my.id/webhook"

# Restart bot
docker compose restart telegram-bot
```

### Health endpoint 502 Bad Gateway

**Problem:** Nginx tidak bisa connect ke bot container

**Solution:**
```bash
# Cek container running
docker compose ps

# Cek port 8095 listening
sudo ss -tlnp | grep 8095

# Cek logs
docker compose logs --tail=50 telegram-bot
```

### SSL Certificate Error

**Problem:** Browser warning atau Telegram reject webhook

**Solution:**
```bash
# Renew certificate
sudo certbot renew --nginx

# Check certificate valid
openssl s_client -connect callback.muzakie.my.id:443 -servername callback.muzakie.my.id
```

### Bot tidak merespon di Telegram

**Problem:** Pesan tidak sampai ke bot

**Solution:**
```bash
# Monitor nginx access log
sudo tail -f /var/log/nginx/bot-telegram-access.log

# Monitor bot logs
docker compose logs -f telegram-bot

# Check webhook delivery
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
# Lihat field "last_error_date" dan "last_error_message"
```

### Cannot GET /webhook

**Ini NORMAL!** Endpoint `/webhook` hanya accept POST dari Telegram, bukan GET dari browser.

Test dengan health endpoint: `curl https://callback.muzakie.my.id/health`

## Maintenance

### Update Bot Code

```bash
cd ~/bot-tele-omegatronik
git pull origin main
docker compose up -d --build
docker compose logs -f
```

### View Logs

```bash
# Real-time logs
docker compose logs -f telegram-bot

# Last 100 lines
docker compose logs --tail=100 telegram-bot

# Nginx access logs
sudo tail -f /var/log/nginx/bot-telegram-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/bot-telegram-error.log
```

### Restart Services

```bash
# Restart bot only
docker compose restart telegram-bot

# Restart nginx
sudo systemctl restart nginx

# Full restart (bot + rebuild)
docker compose down
docker compose up -d --build
```

### Switch to Polling Mode

Edit `.env`:
```env
WEBHOOK_MODE=false
```

Then restart:
```bash
docker compose restart telegram-bot
```

## Performance Tips

1. **Rate Limiting** - Tambahkan di nginx untuk protect dari spam:
```nginx
limit_req_zone $binary_remote_addr zone=telegram:10m rate=10r/s;

location /webhook {
    limit_req zone=telegram burst=20 nodelay;
    # ... proxy settings
}
```

2. **Bot Stats** - Monitor webhook statistics dari Telegram:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | jq
```

3. **Health Monitoring** - Setup cron untuk auto-restart jika unhealthy:
```bash
*/5 * * * * docker compose ps | grep -q 'unhealthy' && docker compose restart telegram-bot
```

## Security

- ✅ SSL/TLS encryption (Let's Encrypt)
- ✅ Webhook hanya dari Telegram IP ranges
- ✅ Health endpoint tidak expose sensitive data
- ✅ Environment variables di `.env` (tidak di git)
- ✅ Container restart policy untuk high availability

## Support

- Repository: https://github.com/Muzakie-ID/bot-tele-omegatronik
- Issues: https://github.com/Muzakie-ID/bot-tele-omegatronik/issues
