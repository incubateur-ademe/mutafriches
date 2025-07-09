import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'mutafriches_user',
    password: process.env.DB_PASSWORD || 'mutafriches_password',
    database: process.env.DB_NAME || 'mutafriches',
  },
  verbose: true,
  strict: true,
});
