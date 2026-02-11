# 🐳 Docker Deployment Guide

Panduan lengkap untuk menjalankan Bot Telegram Omega Tronik menggunakan Docker.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Bot Token dari @BotFather
- Kredensial Omega Tronik H2H

## 🚀 Quick Start

### Windows

```bash
# 1. Copy environment template
copy .env.example .env

# 2. Edit .env dengan kredensial Anda
notepad .env

# 3. Jalankan script
docker-run.bat
```

### Linux/Mac

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env dengan kredensial Anda
nano .env

# 3. Beri permission script
chmod +x docker-run.sh

# 4. Jalankan script
./docker-run.sh
```

## 🎯 Mode Operasi

### 1. Polling Mode (Recommended)

Mode ini **TIDAK PERLU** domain atau SSL certificate. Bot akan melakukan long-polling ke Telegram server.

```bash
# Start dengan polling mode
docker-compose up -d telegram-bot

# View logs
docker-compose logs -f telegram-bot
```

**Kelebihan:**
- ✅ Mudah setup, tidak perlu domain
- ✅ Tidak perlu SSL certificate
- ✅ Cocok untuk development & testing
- ✅ Bisa jalan di localhost

**Kekurangan:**
- ⚠️ Slightly higher latency
- ⚠️ Lebih resource intensive

### 2. Webhook Mode

Mode ini **PERLU** domain dan SSL certificate. Telegram akan mengirim request ke webhook URL Anda.

```bash
# Setup SSL certificate dulu
mkdir -p nginx/ssl
# Copy certificate ke nginx/ssl/fullchain.pem dan nginx/ssl/privkey.pem

# Edit .env
WEBHOOK_MODE=true
WEBHOOK_URL=https://yourdomain.com/webhook

# Start dengan webhook mode
docker-compose --profile webhook up -d

# View logs
docker-compose logs -f
```

**Kelebihan:**
- ✅ Lower latency
- ✅ More efficient
- ✅ Scalable

**Kekurangan:**
- ⚠️ Perlu domain & SSL
- ⚠️ Setup lebih kompleks

## 🔧 Commands

### Basic Operations

```bash
# Build image
docker-compose build

# Start containers (background)
docker-compose up -d

# Start containers (foreground)
docker-compose up

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View logs (follow mode)
docker-compose logs -f telegram-bot

# View logs (last 100 lines)
docker-compose logs --tail=100 telegram-bot
```

### Advanced Operations

```bash
# Rebuild without cache
docker-compose build --no-cache

# Remove volumes (WARNING: akan hapus database!)
docker-compose down -v

# Scale bot (jangan lakukan ini untuk Telegram bot!)
# docker-compose up -d --scale telegram-bot=2

# Execute command in container
docker-compose exec telegram-bot sh

# View container stats
docker stats bot-tele-omegatronik

# Inspect container
docker inspect bot-tele-omegatronik
```

## 📁 Volume Mapping

Bot menggunakan volumes untuk persistence:

```yaml
volumes:
  - ./database:/app/database    # Database SQLite
  - ./logs:/app/logs            # Log files
```

File-file ini akan tetap ada meskipun container di-stop atau di-rebuild.

## 🌐 Network Configuration

Bot menggunakan bridge network untuk komunikasi antar container:

```yaml
networks:
  bot-network:
    driver: bridge
```

## 🔒 SSL Certificate Setup (untuk Webhook Mode)

### Menggunakan Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy ke project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set permission
sudo chown $USER:$USER nginx/ssl/*.pem
chmod 600 nginx/ssl/*.pem
```

### Self-Signed Certificate (untuk testing)

```bash
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/privkey.pem -out nginx/ssl/fullchain.pem -days 365 -nodes
```

⚠️ **Note:** Telegram webhook TIDAK SUPPORT self-signed certificate untuk production!

## 🔍 Monitoring & Debugging

### View Real-time Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f telegram-bot

# With timestamps
docker-compose logs -f --timestamps telegram-bot
```

### Check Container Health

```bash
# Container status
docker-compose ps

# Detailed inspect
docker inspect bot-tele-omegatronik

# Health check
docker exec bot-tele-omegatronik node -e "process.exit(0)"
```

### Access Container Shell

```bash
# Alpine Linux shell
docker-compose exec telegram-bot sh

# Inside container, you can:
ls -la                    # List files
cat logs/error.log        # View logs
node -v                   # Check Node version
ps aux                    # View processes
```

### Database Access

```bash
# Install sqlite3 in container
docker-compose exec telegram-bot apk add sqlite

# Access database
docker-compose exec telegram-bot sqlite3 /app/database/bot.db

# Inside sqlite:
.tables                   # List tables
SELECT * FROM users;      # Query users
.quit                     # Exit
```

## 🚨 Troubleshooting

### Container tidak start

```bash
# Check logs
docker-compose logs telegram-bot

# Check environment variables
docker-compose config

# Rebuild image
docker-compose build --no-cache
docker-compose up -d
```

### Bot tidak merespon

```bash
# Check if container running
docker ps

# Check logs
docker-compose logs -f telegram-bot

# Restart container
docker-compose restart telegram-bot

# Check bot token
docker-compose exec telegram-bot env | grep BOT_TOKEN
```

### Database error

```bash
# Stop container
docker-compose down

# Backup database
cp database/bot.db database/bot.db.backup

# Remove database (WARNING!)
rm database/bot.db

# Restart container (akan create new database)
docker-compose up -d
```

### Port already in use

```bash
# Check what's using port 3000
netstat -ano | findstr :3000    # Windows
lsof -i :3000                    # Linux/Mac

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

## 📊 Production Deployment

### Deployment ke VPS/Server

```bash
# 1. Clone repository
git clone https://github.com/Muzakie-ID/bot-tele-omegatronik.git
cd bot-tele-omegatronik

# 2. Setup environment
cp .env.example .env
nano .env  # Edit dengan kredensial

# 3. Start dengan Docker Compose
docker-compose up -d

# 4. Check logs
docker-compose logs -f telegram-bot

# 5. Setup auto-restart on server reboot
docker update --restart=unless-stopped bot-tele-omegatronik
```

### Update Bot di Production

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild image
docker-compose build

# 3. Restart container
docker-compose up -d

# 4. Check logs
docker-compose logs -f telegram-bot
```

### Backup & Restore

```bash
# Backup database
docker cp bot-tele-omegatronik:/app/database/bot.db ./backup/bot-$(date +%Y%m%d).db

# Restore database
docker cp ./backup/bot-20260211.db bot-tele-omegatronik:/app/database/bot.db
docker-compose restart telegram-bot
```

## 🔐 Security Best Practices

1. **Jangan commit file .env ke git**
2. **Gunakan strong password untuk Omega Tronik**
3. **Batasi akses SSH ke server**
4. **Update Docker image secara berkala**
5. **Monitor logs untuk aktivitas mencurigakan**
6. **Backup database secara rutin**
7. **Gunakan SSL certificate valid untuk webhook**

## 📞 Support

- **Issues:** https://github.com/Muzakie-ID/bot-tele-omegatronik/issues
- **Telegram:** @OmegaTronikSupport
- **WhatsApp:** +62 838-5289-9848

---

**Made with ❤️ for seamless digital transactions**
