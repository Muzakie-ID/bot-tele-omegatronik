# Bot Telegram Auto Order - Python

Bot Telegram sederhana untuk auto order produk digital melalui Omega Tronik H2H API.

## Features

- ✅ Cek Saldo
- ✅ Order Produk (Pulsa, Paket Data, Voucher Game, PLN, dll.)
- ✅ Inline keyboard navigation
- ✅ Error handling
- ✅ Auto retry dengan backup endpoint

## Requirements

- Python 3.11+
- Docker & Docker Compose (opsional)
- Telegram Bot Token (dari @BotFather)
- Akun Omega Tronik H2H

## Quick Start

### Polling Mode (Simple)

```bash
# Setup environment
cp .env.example .env
nano .env  # Set BOT_TOKEN, MEMBER_ID, PIN, PASSWORD

# Install dependencies
pip install -r requirements.txt

# Run bot
python bot.py
```

### Docker Mode

```bash
# Setup environment
cp .env.example .env
nano .env  # Set BOT_TOKEN, MEMBER_ID, PIN, PASSWORD

# Run with Docker
docker compose up -d

# View logs
docker compose logs -f
```

## Environment Variables

```env
BOT_TOKEN=your_bot_token_here          # Token dari @BotFather
MEMBER_ID=your_member_id               # Member ID Omega Tronik
PIN=your_pin                           # PIN transaksi
PASSWORD=your_password                 # Password API
WEBHOOK_MODE=false                     # Set true untuk webhook mode
WEBHOOK_URL=https://your-domain.com/webhook  # URL webhook
WEBHOOK_PORT=8080                      # Port webhook
```

## Project Structure

```
.
├── bot.py                      # Main bot application
├── services/
│   ├── __init__.py
│   └── omegatronik.py         # Omega Tronik API integration
├── utils/
│   ├── __init__.py
│   └── signature.py           # Signature generator
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker image
├── docker-compose.yml         # Docker orchestration
└── .env.example              # Environment template
```

## Docker Commands

```bash
# Build and start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Restart
docker compose restart
```

## Cara Penggunaan

### 1. Setup Bot Telegram

1. Buka [@BotFather](https://t.me/BotFather) di Telegram
2. Kirim `/newbot` untuk membuat bot baru
3. Ikuti instruksi dan dapatkan **BOT_TOKEN**

### 2. Setup Akun Omega Tronik

1. Daftar akun di [Omega Tronik](https://omegatronik.com)
2. Dapatkan **MEMBER_ID**, **PIN**, dan **PASSWORD** dari dashboard

### 3. Konfigurasi Environment

Buat file `.env` dari template:

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan kredensial Anda.

### 4. Jalankan Bot

**Mode Polling (Development):**
```bash
python bot.py
```

**Mode Docker:**
```bash
docker compose up -d
```

### 5. Gunakan Bot

1. Buka bot di Telegram
2. Kirim `/start`
3. Pilih menu yang tersedia:
   - 💰 Cek Saldo - Cek saldo akun
   - 📦 Order Produk - Order produk digital
   - ❓ Bantuan - Bantuan penggunaan

## Troubleshooting

### Bot tidak merespon

1. Cek apakah BOT_TOKEN sudah benar
2. Cek log untuk error message
3. Pastikan kredensial Omega Tronik benar

### Error koneksi API

1. Cek koneksi internet
2. Pastikan akun Omega Tronik aktif
3. Cek saldo akun

### Docker tidak jalan

1. Pastikan Docker dan Docker Compose terinstall
2. Cek port tidak bentrok
3. Lihat log dengan `docker compose logs -f`

## License

MIT License
