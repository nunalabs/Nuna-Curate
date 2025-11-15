import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER || 'nuna_curate',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'nuna_curate_dev',
}));
