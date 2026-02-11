# Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy application source
COPY . .

# Create necessary directories
RUN mkdir -p /app/database /app/logs

# Set permissions
RUN chmod +x /app/src/index.js

# Expose port for webhook (optional)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "src/index.js"]
