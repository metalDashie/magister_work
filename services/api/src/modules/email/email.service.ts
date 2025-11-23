import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import * as Handlebars from 'handlebars'
import * as fs from 'fs'
import * as path from 'path'
import { Order } from '../../database/entities'
import { formatPrice } from '@fullmag/common'

export interface EmailOptions {
  to: string
  subject: string
  template: string
  context: Record<string, any>
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter
  private readonly logger = new Logger(EmailService.name)
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map()

  constructor(private configService: ConfigService) {
    this.initializeTransporter()
    this.precompileTemplates()
  }

  private initializeTransporter() {
    const emailEnabled = this.configService.get('EMAIL_ENABLED', 'false') === 'true'

    if (!emailEnabled) {
      this.logger.warn('Email sending is disabled. Set EMAIL_ENABLED=true to enable.')
      return
    }

    const host = this.configService.get('EMAIL_HOST')
    const port = this.configService.get('EMAIL_PORT')
    const secure = this.configService.get('EMAIL_SECURE', 'false') === 'true'
    const user = this.configService.get('EMAIL_USER')
    const pass = this.configService.get('EMAIL_PASSWORD')

    if (!host) {
      this.logger.warn('Email host not configured. Emails will not be sent.')
      return
    }

    // Build transport options
    const transportOptions: nodemailer.TransportOptions = {
      host,
      port: parseInt(port || '1025'),
      secure,
    } as any

    // Only add auth if credentials are provided (not needed for Mailpit)
    if (user && pass) {
      (transportOptions as any).auth = {
        user,
        pass,
      }
    }

    this.transporter = nodemailer.createTransport(transportOptions)

    this.logger.log(`Email service initialized successfully (host: ${host}:${port})`)
  }

  private precompileTemplates() {
    const templatesDir = path.join(__dirname, '..', '..', 'templates', 'email')

    try {
      const templateFiles = [
        'welcome.hbs',
        'order-confirmation.hbs',
        'order-status-update.hbs',
        'payment-success.hbs',
        'password-reset.hbs',
        'email-verification.hbs',
      ]

      for (const file of templateFiles) {
        const templatePath = path.join(templatesDir, file)
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8')
          const templateName = file.replace('.hbs', '')
          this.templates.set(templateName, Handlebars.compile(templateContent))
          this.logger.log(`Compiled email template: ${templateName}`)
        }
      }
    } catch (error) {
      this.logger.error('Failed to precompile email templates', error)
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (service not configured): ${options.subject}`)
      return false
    }

    try {
      const template = this.templates.get(options.template)
      if (!template) {
        this.logger.error(`Email template not found: ${options.template}`)
        return false
      }

      const html = template(options.context)
      const from = this.configService.get('EMAIL_FROM', 'noreply@fullmag.com')

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html,
      })

      this.logger.log(`Email sent successfully: ${options.subject} to ${options.to}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to send email: ${options.subject}`, error)
      return false
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Ласкаво просимо до FullMag!',
      template: 'welcome',
      context: {
        name,
        frontendUrl: this.configService.get('FRONTEND_URL', 'http://localhost:10002'),
        year: new Date().getFullYear(),
      },
    })
  }

  async sendOrderConfirmation(order: Order, userEmail: string): Promise<boolean> {
    const items = order.items.map((item) => ({
      name: item.product?.name || 'Product',
      quantity: item.quantity,
      price: formatPrice(item.price, 'UAH'),
      total: formatPrice(item.price * item.quantity, 'UAH'),
    }))

    return this.sendEmail({
      to: userEmail,
      subject: `Підтвердження замовлення №${order.id.slice(0, 8)}`,
      template: 'order-confirmation',
      context: {
        orderNumber: order.id.slice(0, 8),
        orderId: order.id,
        items,
        totalAmount: formatPrice(order.totalAmount, 'UAH'),
        deliveryCity: order.deliveryCity,
        deliveryWarehouse: order.deliveryWarehouse,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        orderDate: new Date(order.createdAt).toLocaleDateString('uk-UA'),
        year: new Date().getFullYear(),
      },
    })
  }

  async sendOrderStatusUpdate(
    order: Order,
    userEmail: string,
    oldStatus: string,
    newStatus: string
  ): Promise<boolean> {
    const statusMessages: Record<string, string> = {
      pending: 'Очікує обробки',
      processing: 'В обробці',
      paid: 'Оплачено',
      shipped: 'Відправлено',
      delivered: 'Доставлено',
      cancelled: 'Скасовано',
    }

    return this.sendEmail({
      to: userEmail,
      subject: `Оновлення статусу замовлення №${order.id.slice(0, 8)}`,
      template: 'order-status-update',
      context: {
        orderNumber: order.id.slice(0, 8),
        orderId: order.id,
        oldStatus: statusMessages[oldStatus] || oldStatus,
        newStatus: statusMessages[newStatus] || newStatus,
        totalAmount: formatPrice(order.totalAmount, 'UAH'),
        year: new Date().getFullYear(),
      },
    })
  }

  async sendPaymentSuccess(
    order: Order,
    userEmail: string,
    paymentId: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `Оплата успішна - Замовлення №${order.id.slice(0, 8)}`,
      template: 'payment-success',
      context: {
        orderNumber: order.id.slice(0, 8),
        orderId: order.id,
        paymentId,
        totalAmount: formatPrice(order.totalAmount, 'UAH'),
        paymentDate: new Date().toLocaleDateString('uk-UA'),
        year: new Date().getFullYear(),
      },
    })
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`

    return this.sendEmail({
      to: email,
      subject: 'Скидання пароля - FullMag',
      template: 'password-reset',
      context: {
        resetUrl,
        expiryMinutes: 60,
        year: new Date().getFullYear(),
      },
    })
  }

  async sendEmailVerification(
    email: string,
    name: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${verificationToken}`

    return this.sendEmail({
      to: email,
      subject: 'Підтвердіть вашу електронну пошту - FullMag',
      template: 'email-verification',
      context: {
        name,
        verificationUrl,
        expiryHours: 24,
        year: new Date().getFullYear(),
      },
    })
  }
}
