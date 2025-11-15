import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

// Modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NFTModule } from './modules/nft/nft.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StellarModule } from './modules/stellar/stellar.module';
import { StorageModule } from './modules/storage/storage.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

// Config
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { stellarConfig } from './config/stellar.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, stellarConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? {
          rejectUnauthorized: false,
        } : false,
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [{
        ttl: configService.get('THROTTLE_TTL', 60) * 1000,
        limit: configService.get('THROTTLE_LIMIT', 100),
      }],
    }),

    // Queue (Redis)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),

    // Application modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    NFTModule,
    CollectionsModule,
    MarketplaceModule,
    AnalyticsModule,
    StellarModule,
    StorageModule,
    WebsocketModule,
  ],
})
export class AppModule {}
