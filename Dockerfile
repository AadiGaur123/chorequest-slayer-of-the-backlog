# Multi-stage Dockerfile for ChoreQuest Production Deployment
# Builds both frontend & backend into a unified container

# Stage 1: Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY shared/ ./shared/
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY shared/ ./shared/
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
RUN cd server && npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV DEMO_MODE=true

COPY server/package*.json ./
RUN npm ci --only=production
COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist ./public
COPY shared/ ./shared/

EXPOSE 4000
CMD ["node", "dist/server.js"]
