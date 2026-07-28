import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile('../.env');
} catch {
  // .env is optional locally; DATABASE_URL may already be set in the environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
