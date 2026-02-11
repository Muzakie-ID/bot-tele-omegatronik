# Bot Telegram Auto Order - Python

Bot Telegram untuk auto order produk digital melalui Omega Tronik H2H API.

## Features

- ✅ Cek Saldo
- ✅ Order Pulsa
- ✅ Order Paket Data  
- ✅ Order Voucher Game
- ✅ Order PLN Token
- ✅ Full inline keyboard navigation
- ✅ Auto retry dengan backup endpoint
- ✅ Error handling

## Requirements

- Python 3.11+
- Docker & Docker Compose
- Telegram Bot Token (dari @BotFather)
- Akun Omega Tronik H2H

## Quick Start

### Polling Mode (Simple)

```bash
# Clone repo
git clone https://github.com/Muzakie-ID/bot-tele-omegatronik.git
cd bot-tele-omegatronik

# Setup environment
cp .env.example .env
nano .env  # Set BOT_TOKEN, MEMBER_ID, PIN, PASSWORD

# Run with Docker
docker compose up -d

# View logs
docker compose logs -f
```

### Webhook Mode (Production)

Untuk production dengan nginx + SSL, ikuti panduan lengkap: [WEBHOOK-SETUP.md](WEBHOOK-SETUP.md)

**Quick summary:**
1. Setup domain DNS pointing ke server
2. Install SSL certificate dengan certbot
3. Setup nginx config dari `nginx-webhook.conf`
4. Set `.env` dengan `WEBHOOK_MODE=true` dan `WEBHOOK_URL`
5. Deploy dengan Docker

```bash
# Example .env for webhook
WEBHOOK_MODE=true
WEBHOOK_URL=https://callback.muzakie.my.id/webhook
WEBHOOK_PORT=8080
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
nano .env

# Run bot
python bot.py
```

## Environment Variables

```env
BOT_TOKEN=your_bot_token_here          # Token dari @BotFather
MEMBER_ID=your_member_id               # Member ID Omega Tronik
PIN=your_pin                           # PIN transaksi
PASSWORD=your_password                 # Password API
```

## Project Structure

```
.
├── bot.py                      # Main bot application
├── services/
│   └── omegatronik.py         # Omega Tronik API integration
├── utils/
│   └── signature.py           # Signature generator
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker image
├── docker-compose.yml         # Docker orchestration
└── .env.example              # Environment template
```

## Docker Commands

```bash
# Build and start
docker compose up -d --build

# View logs (real-time)
docker compose logs -f

# Restart
docker compose restart

# Stop and remove
docker compose down

# Update code
git pull origin main
docker compose up -d --build
```

## API Documentation

Bot menggunakan Omega Tronik H2H API:

- **Endpoint**: `https://gateway.omegatronik.com/api/trx`
- **Backup**: `https://gtw.omegatronik.com/api/trx`
- **Method**: GET with signature

### Signature Format

```python
string = f"OtomaX|{memberID}|{product}|{dest}|{refID}|{pin}|{password}"
signature = base64(sha1(string)).replace('+', '-').replace('/', '_').rstrip('=')
```

## Troubleshooting

### Bot tidak merespon
```bash
docker compose logs telegram-bot  # Cek logs
docker compose ps                 # Cek status container
```

### API error
- Verifikasi MEMBER_ID, PIN, PASSWORD di `.env`
- Cek saldo akun Omega Tronik
- Cek koneksi internet

### Container restart loop
```bash
docker compose logs --tail=50    # Lihat error terakhir
```

## License

MIT

## Repository

https://github.com/Muzakie-ID/bot-tele-omegatronik


