# Use Node.js with Python support
FROM node:20

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Install Python dependencies
RUN pip3 install --break-system-packages -e . || true

# Fix the build script to handle import.meta.url
RUN sed -i 's/format: "cjs",/format: "esm",\n    banner: { js: "import { createRequire } from \"module\"; import { fileURLToPath } from \"url\"; import { dirname } from \"path\"; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);" },/' script/build.ts

# Also change the output file extension
RUN sed -i 's/outfile: "dist\/index.cjs",/outfile: "dist\/index.mjs",/' script/build.ts

# Build the application
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the application with ESM format
CMD ["node", "dist/index.mjs"]