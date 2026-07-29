FROM node:22-slim

WORKDIR /app
COPY . .
RUN npm ci

WORKDIR /app/web
EXPOSE 5173

CMD ["npm", "run", "dev"]
