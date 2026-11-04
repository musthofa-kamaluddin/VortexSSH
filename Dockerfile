# Stage 1: Build React Client
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Install server production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy server code
COPY server/ /app/server/

# Copy built frontend assets
COPY --from=client-builder /app/client/dist /app/client/dist

WORKDIR /app
EXPOSE 3001

CMD ["node", "server/index.js"]
