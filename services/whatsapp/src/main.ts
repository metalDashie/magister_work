import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { LoggingInterceptor } from './interceptors/logging.interceptor'

async function bootstrap() {
  const logger = new Logger('WhatsAppService')
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })

  // Global request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  const port = process.env.PORT || 3002
  await app.listen(port)

  logger.log(`WhatsApp service is running on port ${port}`)
}

bootstrap()
