# Bot Telegram Auto Order - Omega Tronik

Bot Telegram untuk auto order produk digital (pulsa, paket data, token listrik, voucher game, dll) melalui H2H Omega Tronik dengan dukungan **Docker** dan **Webhook/Callback**.

## 🚀 Fitur Utama

### Bot Features
- ✅ **Full Button Navigation** (Inline Keyboard)
- ✅ **Order Pulsa & Paket Data** (Telkomsel, Indosat, XL, Tri, By.U)
- ✅ **Sistem Cuanku** (List → Cek Harga → Bayar)
- ✅ **Cek Saldo** real-time
- ✅ **Riwayat Transaksi** dengan tracking
- ✅ **Session Management** untuk flow transaksi
- ✅ **Auto-retry** dengan backup endpoint

### Technical Features
- 🐳 **Docker Support** - Easy deployment dengan Docker & Docker Compose
- 🌐 **Webhook Mode** - Support callback dari Telegram untuk real-time response
- 🔄 **Polling Mode** - Traditional long-polling (tidak perlu domain)
- 💾 **SQLite Database** - Transaction tracking & user management
- 🔒 **Nginx Reverse Proxy** - SSL termination untuk webhook
- 📊 **Health Check** - Monitoring endpoint
- 🔐 **Signature Verification** - Secure API integration dengan Omega Tronik
- ⚡ **PM2 Ready** - Process manager untuk production

## 📋 Requirements

### Tanpa Docker:
- Node.js >= 14.x
- NPM atau Yarn

### Dengan Docker (Recommended):
- Docker Engine 20.10+
- Docker Compose 2.0+

### Umum:
- Telegram Bot Token (dari @BotFather)
- Akun Omega Tronik H2H
- Domain + SSL Certificate (optional, hanya untuk webhook mode)

## 🛠️ Instalasi

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Environment

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan kredensial Anda:

```env
# Telegram Bot Configuration
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Omega Tronik H2H Configuration
OMEGA_MEMBER_ID=OX9999
OMEGA_PIN=1234
OMEGA_PASSWORD=your_password_here
OMEGA_ENDPOINT=https://apiomega.id/
OMEGA_ENDPOINT_BACKUP=http://188.166.178.169:6969/

# Admin Telegram User IDs (comma separated)
ADMIN_IDS=123456789,987654321

# Database
DB_PATH=./database/bot.db

# Environment
NODE_ENV=production
```

### 3. Cara Mendapatkan Bot Token

1. Buka Telegram dan cari **@BotFather**
2. Ketik `/newbot`
3. Ikuti instruksi untuk membuat bot baru
4. Copy token yang diberikan ke `BOT_TOKEN`

### 4. Cara Mendapatkan User ID untuk Admin

1. Buka Telegram dan cari **@userinfobot**
2. Start bot dan lihat ID Anda
3. Masukkan ID ke `ADMIN_IDS`

## 🏃 Menjalankan Bot

### Development Mode (dengan auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Menggunakan Docker (Recommended untuk Server) 🐳

Docker mempermudah deployment dan mendukung webhook mode untuk callback.

**Quick Start:**

```bash
# Windows
docker-run.bat

# Linux/Mac
chmod +x docker-run.sh
./docker-run.sh
```

**Manual Docker Commands:**

```bash
# 1. Build image
docker-compose build

# 2. Start bot (Polling Mode)
docker-compose up -d

# 3. View logs
docker-compose logs -f telegram-bot

# 4. Stop bot
docker-compose down
```

**Webhook Mode (untuk callback):**

```bash
# Edit .env
WEBHOOK_MODE=true
WEBHOOK_URL=https://yourdomain.com/webhook

# Start dengan Nginx reverse proxy
docker-compose --profile webhook up -d
```

📖 **Panduan lengkap Docker:** Lihat [DOCKER.md](DOCKER.md)

### Menggunakan PM2

```bash
# Install PM2 globally (jika belum)
npm install -g pm2

# Start bot dengan PM2
npm run pm2:start

# Stop bot
npm run pm2:stop

# Restart bot
npm run pm2:restart

# Lihat logs
npm run pm2:logs
```

## 📁 Struktur Project

```
bot-tele-auto-order/
├── src/ (support webhook & polling)
├── nginx/
│   └── nginx.conf                 # Nginx reverse proxy config
├── database/
│   └── bot.db                     # SQLite database (auto-created)
├── logs/                          # Application logs
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .env.docker                    # Docker environment template
├── .dockerignore                  # Docker ignore file
├── .gitignore
├── Dockerfile                     # Docker image definition
├── docker-compose.yml             # Docker orchestration
├── docker-run.sh                  # Docker management script (Linux/Mac)
├── docker-run.bat                 # Docker management script (Windows)
├── ecosystem.config.js            # PM2 configuration
├── package.json
├── README.md                      # This file
└── DOCKER.md                      # Docker deployment guideards/
│   │   └── menus.js               # Keyboard layouts
│   ├── services/
│   │   └── omegatronik.js         # Integrasi Omega Tronik API
│   ├── utils/
│   │   ├── formatter.js           # Format helper
│   │   ├── parser.js              # Response parser
│   │   └── signature.js           # Signature generator
│   └── index.js                   # Entry point
├── database/
│   └── bot.db                     # SQLite database (auto-created)
├── logs/                          # PM2 logs
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .gitignore
├── ecosystem.config.js            # PM2 configuration
├── package.json
└── README.md
```

## 🎮 Cara Menggunakan Bot

### Untuk User

1. **Start Bot**
   - Buka bot Telegram Anda
   - Ketik `/start`

2. **Pilih Produk**
   - Klik menu sesuai kebutuhan (Pulsa, Token, dll)
   - Pilih provider (Telkomsel, XL, dll)
   - Pilih jenis paket

3. **Input Nomor**
   - Masukkan nomor HP tujuan
   - Format: `08123456789` atau `628123456789`

4. **Pilih Paket**
   - Bot akan menampilkan daftar paket tersedia
   - Klik paket yang diinginkan

5. **Konfirmasi**
   - Review detail pesanan
   - Klik "✅ Ya, Bayar Sekarang"

6. **Selesai**
   - Tunggu proses transaksi
   - Bukti transaksi akan dikirim via bot
Deploy ke Server

### Metode 1: Docker (Recommended) 🐳

Docker adalah cara termudah dan tercepat untuk deploy bot ke server.

**Quick Start:**

```bash
# Clone repository
git clone https://github.com/Muzakie-ID/bot-tele-omegatronik.git
cd bot-tele-omegatronik

# Setup environment
cp .env.example .env
nano .env  # Edit dengan kredensial Anda

# Windows
docker-run.bat

# Linux/Mac
chmod +x docker-run.sh
./docker-run.sh
```

**Manual Docker Commands:**

```bash
# Build & Start
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f telegram-bot

# Stop
docker-compose down

# Update
git pull
docker-compose build
docker-compose up -d
```

**Untuk Webhook Mode (dengan domain + SSL):**

```bash
# Setup SSL certificate
mkdi� Mode Operasi

### Polling Mode (Default)

Mode ini **TIDAK PERLU** domain atau SSL certificate. Bot akan melakukan long-polling ke Telegram server.

**Kelebihan:**
- ✅ Mudah setup, tidak perlu domain
- ✅ Tidak perlu SSL certificate
- ✅ Cocok untuk development & testing
- ✅ Bisa jalan di localhost

**Configuration:**
```env
WEBHOOK_MODE=false
```

### Webhook Mode (Advanced)

Mode ini **PERLU** domain dan SSL certificate valid. Telegram akan mengirim callback ke webhook URL Anda.

**K🌟 Advanced Features

### Health Check Endpoint

Bot menyediakan health check endpoint untuk monitoring:

```bash
# Local
curl http://localhost:3000/health

# Production
curl https://yourdomain.com/health
```

Response:
```json
{
  "status": "ok",
  "mode": "polling",
  "timestamp": "2026-02-11T10:30:45.123Z",
  "uptime": 1234.56
}
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BOT_TOKEN` | Telegram bot token dari @BotFather | Yes | - |
| `OMEGA_MEMBER_ID` | Member ID Omega Tronik | Yes | - |
| `OMEGA_PIN` | PIN transaksi | Yes | - |
| `OMEGA_PASSWORD` | Password transaksi | Yes | - |
| `OMEGA_ENDPOINT` | Primary API endpoint | No | https://apiomega.id/ |
| `OMEGA_ENDPOINT_BACKUP` | Backup API endpoint | No | http://188.166.178.169:6969/ |
| `ADMIN_IDS` | Comma-separated admin Telegram IDs | No | - |
| `WEBHOOK_MODE` | Enable webhook mode | No | false |
| `WEBHOOK_URL` | Webhook URL (with /webhook path) | No* | - |
| `WEBHOOK_PORT` | HTTP server port | No | 3000 |
| `DB_PATH` | SQLite database path | No | ./database/bot.db |
| `NODE_ENV` | Environment (production/development) | No | production |

*Required when `WEBHOOK_MODE=true`

## 📦 Docker Images

Bot menggunakan Node.js 18 Alpine untuk image yang ringan dan secure.

**Image size:** ~150MB  
**Base:** node:18-alpine  
**Includes:** Express, node-telegram-bot-api, better-sqlite3, axios

## 🔐 Security Best Practices

1. ✅ **Jangan commit file `.env` ke git**
2. ✅ **Gunakan strong password untuk Omega Tronik**
3. ✅ **Restrict admin access** dengan `ADMIN_IDS`
4. ✅ **Keep dependencies updated:** `npm update`
5. ✅ **Monitor logs** untuk aktivitas mencurigakan
6. ✅ **Backup database** secara rutin
7. ✅ **Use valid SSL certificate** untuk webhook mode
8. ✅ **Set firewall rules** untuk restrict access

## 📊 Monitoring

### Docker Monitoring

```bash
# Container stats
docker stats bot-tele-omegatronik

# Health check
docker inspect --format='{{json .State.Health}}' bot-tele-omegatronik

# Resource usage
docker-compose top
```

### PM2 Monitoring

```bash
# Dashboard
pm2 monit

# Status overview
pm2 status

# Memory usage
pm2 info bot-tele-order
```

## 🔗 Links & Resources

- **Repository:** https://github.com/Muzakie-ID/bot-tele-omegatronik
- **Docker Guide:** [DOCKER.md](DOCKER.md)
- **Omega Tronik Support:** @OmegaTronikSupport
- **WhatsApp:** +62 838-5289-9848
- **Omega Tronik Web:** https://omegatronik.report.web.id/

## 📝 License

ISC

## 🙏 Credits

- **Omega Tronik H2H API** - Digital product provider
- **node-telegram-bot-api** - Telegram bot framework
- **better-sqlite3** - Fast SQLite database
- **Express** - Web framework for webhook
- **Axios** - HTTP client
- **Docker** - Containerization platform

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**🚀 Dibuat dengan ❤️ untuk kemudahan transaksi digital**

**⭐ Star this repo jika bermanfaat!

### Bot tidak merespon

**Docker:**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f telegram-bot

# Restart
docker-compose restart telegram-bot
```

**PM2:**
```bash
# Check status
pm2 status

# View logs
pm2 logs bot-tele-order

# Restart
pm2 restart bot-tele-order
```

### Database error

**Docker:**
```bash
# Backup database
docker cp bot-tele-omegatronik:/app/database/bot.db ./backup/

# Remove database (WARNING: akan hapus data)
rm database/bot.db

# Restart
docker-compose restart telegram-bot
```

**PM2:**
```bash
# Backup database
cp database/bot.db database/bot.db.backup

# Remove database
rm database/bot.db

# Restart
pm2 restart bot-tele-order
```

### Webhook tidak working

1. Pastikan domain sudah pointing ke server
2. Check SSL certificate: `openssl s_client -connect yourdomain.com:443`
3. Verify webhook: `curl https://yourdomain.com/webhook`
4. Check Nginx logs: `docker-compose logs nginx`
5. Test health endpoint: `curl https://yourdomain.com/health`

### Port already in use

```bash
# Check what's using the port
netstat -ano | findstr :3000    # Windows
lsof -i :3000                    # Linux/Mac

# Change port in .env or docker-compose.yml
WEBHOOK_PORT=3001
```

### Signature error

- Pastikan `OMEGA_PIN` dan `OMEGA_PASSWORD` benar
- Cek format signature di dokumentasi Omega Tronik
- Verify Member ID sudah sesuai
git clone https://github.com/Muzakie-ID/bot-tele-omegatronik.git
cd bot-tele-omegatronik

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit dengan kredensial Anda

# Start dengan PM2
npm install -g pm2
npm run pm2:start

# Setup auto-start on reboot
pm2 startup
pm2 save
```

**Update Bot:**

```bash
git pull
npm install
npm run pm2:restart
```

**Monitor Logs:**

```bash
# Real-time logs
npm run pm2:logs

# Error logs only
pm2 logs bot-tele-order --err
```bash
# Real-time logs
npm run pm2:logs

# Error logs only
pm2 logs bot-tele-order --err

# View all logs
pm2 logs
```

## 🐛 Troubleshooting

### Bot tidak merespon

1. Cek apakah bot sudah running: `pm2 status`
2. Lihat logs: `npm run pm2:logs`
3. Restart bot: `npm run pm2:restart`

### Database error

```bash
# Delete database dan restart (WARNING: akan hapus data)
rm -f database/bot.db
npm run pm2:restart
```

### Signature error

- Pastikan `OMEGA_PIN` dan `OMEGA_PASSWORD` benar
- Cek format signature di dokumentasi Omega Tronik

## 📞 Support

- **Telegram:** @OmegaTronikSupport
- **WhatsApp:** +62 838-5289-9848
- **Website:** https://omegatronik.report.web.id/

## 📝 License

ISC

## 🙏 Credits

- Omega Tronik H2H API
- node-telegram-bot-api
- better-sqlite3

---

**Dibuat dengan ❤️ untuk kemudahan transaksi digital**
