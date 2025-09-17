FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .
USER nodeusr
EXPOSE 3000
ENV PORT=3000
CMD ["node", "src/index.js"]
