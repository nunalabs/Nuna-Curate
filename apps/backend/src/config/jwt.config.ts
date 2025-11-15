import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'change-this-in-production',
  expiresIn: process.env.JWT_EXPIRY || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-in-production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
}));
