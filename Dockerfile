FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y iputils-ping curl ca-certificates dnsutils && \
    update-ca-certificates && \
    pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run bot
CMD ["python", "-u", "bot.py"]
