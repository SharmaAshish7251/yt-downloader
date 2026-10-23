# Use official Node.js image based on Debian Bookworm slim
FROM node:20-bookworm-slim

# Install Python 3, pip, python-is-python3 symlink, and ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python-is-python3 \
    ffmpeg \
    ca-certificates \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Install yt-dlp as a Python module so `python -m yt_dlp` works directly
RUN python3 -m pip install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

# Set container environment defaults
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    PYTHON=python3

# Install dependencies separately for optimal Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Build the Next.js production bundle
RUN npm run build

# Expose default port
EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"]
