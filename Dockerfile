# Stage 1: Build Frontend
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY shared/ ./shared/
COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "server/index.js"]
