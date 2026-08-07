FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm ci

WORKDIR /app/server
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:dev"]
