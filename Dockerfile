FROM node:24-bookworm-slim AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --include=dev
COPY web/ ./
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV DB_PATH=/data/peliculas.db
COPY package.json server.js static.js ./
COPY --from=frontend /app/web/dist ./web/dist
EXPOSE 3000
CMD ["node", "server.js"]
