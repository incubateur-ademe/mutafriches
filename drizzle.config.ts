import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: process.env.SCALINGO_POSTGRESQL_URL
    ? // En production Scalingo
      {
        url: process.env.SCALINGO_POSTGRESQL_URL,
      }
    : // En local
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'mutafriches_user',
        password: process.env.DB_PASSWORD || 'mutafriches_password',
        database: process.env.DB_NAME || 'mutafriches',
      },
  verbose: true,
  strict: true,
});
