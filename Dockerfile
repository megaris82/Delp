FROM node:18-alpine

WORKDIR /app

COPY backend/package.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend/ ./backend/
COPY frontend/ ./frontend/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "backend/src/server.js"]
