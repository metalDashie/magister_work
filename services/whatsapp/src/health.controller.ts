import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      service: 'whatsapp',
      status: 'running',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }
}
