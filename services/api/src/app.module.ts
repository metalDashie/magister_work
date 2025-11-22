import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { BullModule } from '@nestjs/bull'
import { join } from 'path'

// Modules
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ProductsModule } from './modules/products/products.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { AttributesModule } from './modules/attributes/attributes.module'
import { CartModule } from './modules/cart/cart.module'
import { OrdersModule } from './modules/orders/orders.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { WebhookModule } from './modules/webhook/webhook.module'
import { ChatModule } from './modules/chat/chat.module'
import { DeliveryModule } from './modules/delivery/delivery.module'
import { EmailModule } from './modules/email/email.module'
import { ImportModule } from './modules/import/import.module'
import { TelegramModule } from './modules/telegram/telegram.module'
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { ChatGateway } from './gateways/chat.gateway'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),

    // GraphQL - Temporarily disabled for testing
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   sortSchema: true,
    //   playground: true,
    //   context: ({ req, res }) => ({ req, res }),
    // }),

    // Bull (Redis Queue)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    AttributesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    WebhookModule,
    ChatModule,
    DeliveryModule,
    EmailModule,
    ImportModule,
    TelegramModule,
    WhatsAppModule,
    AnalyticsModule,
  ],
  providers: [ChatGateway],
})
export class AppModule {}
