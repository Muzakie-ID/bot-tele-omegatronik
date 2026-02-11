# Bot Telegram Auto Order - Omega Tronik

Bot Telegram untuk auto order produk digital (pulsa, paket data, token listrik, voucher game, dll) melalui H2H Omega Tronik.

## 🚀 Fitur

- ✅ Full Button Navigation (Inline Keyboard)
- ✅ Order Pulsa & Paket Data (Telkomsel, Indosat, XL, Tri, By.U)
- ✅ Sistem Cuanku (List → Cek Harga → Bayar)
- ✅ Cek Saldo
- ✅ Riwayat Transaksi
- ✅ Database SQLite untuk tracking
- ✅ Session Management
- ✅ Auto-retry dengan backup endpoint
- ✅ PM2 Ready untuk production

## 📋 Requirements

- Node.js >= 14.x
- NPM atau Yarn
- Telegram Bot Token (dari @BotFather)
- Akun Omega Tronik H2H

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

### Menggunakan PM2 (Recommended untuk Server)

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
├── src/
│   ├── config/
│   │   └── config.js              # Konfigurasi aplikasi
│   ├── database/
│   │   └── db.js                  # Database handler (SQLite)
│   ├── handlers/
│   │   ├── callbacks.js           # Handler untuk button clicks
│   │   ├── commands.js            # Handler untuk commands
│   │   └── messages.js            # Handler untuk text messages
│   ├── keyboards/
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

### Command List

- `/start` - Mulai bot dan tampilkan menu utama
- `/help` - Bantuan dan informasi
- `/saldo` - Cek saldo Omega Tronik
- `/history` - Lihat riwayat transaksi
- `/cancel` - Batalkan transaksi aktif

## 🔧 Konfigurasi Server

### 1. Deploy ke VPS

```bash
# Clone repository
git clone <your-repo-url>
cd bot-tele-auto-order

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

### 2. Update Bot di Server

```bash
# Pull latest changes
git pull

# Restart bot
npm run pm2:restart
```

### 3. Monitor Logs

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
