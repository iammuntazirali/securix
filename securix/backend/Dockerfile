FROM node:20-slim

# Install Nmap
RUN apt-get update && apt-get install -y nmap && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
