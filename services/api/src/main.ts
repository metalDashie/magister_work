import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { LoggingInterceptor } from './interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  // Global prefix
  app.setGlobalPrefix('api')

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor())

  const port = configService.get('PORT') || 3001

  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}`)
}

bootstrap()
