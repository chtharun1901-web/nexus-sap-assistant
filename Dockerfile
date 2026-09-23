FROM node:22-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm install --omit=dev

# Copy client files and build frontend
COPY client/package*.json ./client/
RUN npm --prefix client install
COPY client/ ./client/
RUN npm --prefix client run build

# Copy backend files
COPY server.js db.js ./
COPY public/ ./public/

EXPOSE 3456
ENV PORT=3456
ENV NODE_ENV=production

CMD ["node", "server.js"]
