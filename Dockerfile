FROM node:18-alpine

WORKDIR /app

# Install frontend deps and build
COPY package.json ./
RUN npm install

COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# Install server deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --production

COPY server/index.js ./

WORKDIR /app

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]
