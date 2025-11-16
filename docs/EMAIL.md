# Email Integration

This document describes the email sending functionality integrated into the backend API.

## Overview

The system uses **Nodemailer** with **Handlebars** templates to send transactional emails to users. Emails are automatically triggered by various events in the application.

## Features

- **Welcome Emails**: Sent when users register
- **Order Confirmation**: Sent when orders are created
- **Order Status Updates**: Sent when order status changes
- **Payment Success**: Sent when payments are completed
- **Password Reset**: Sent when users request password reset (future feature)

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=FullMag <noreply@fullmag.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Supported Email Providers

#### Gmail

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the app password in `EMAIL_PASSWORD`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### SendGrid SMTP

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Outlook/Office 365

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Mailgun SMTP

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.com
EMAIL_PASSWORD=your-mailgun-smtp-password
```

### Disabling Email

To disable email sending (for development/testing):

```env
EMAIL_ENABLED=false
```

When disabled, email sending will be logged but not actually sent.

## Email Templates

All email templates are located in `services/api/src/templates/email/` and use Handlebars syntax.

### Available Templates

1. **welcome.hbs** - Welcome email for new users
2. **order-confirmation.hbs** - Order confirmation with items and delivery info
3. **order-status-update.hbs** - Notification when order status changes
4. **payment-success.hbs** - Payment confirmation
5. **password-reset.hbs** - Password reset link (for future implementation)

### Template Structure

All templates follow a consistent structure:
- Responsive HTML design
- Company logo and branding
- Clear call-to-action buttons
- Footer with copyright information
- Support for Ukrainian localization

### Customizing Templates

To customize email templates:

1. Edit the `.hbs` files in `services/api/src/templates/email/`
2. Use Handlebars syntax for dynamic content: `{{variableName}}`
3. Restart the server to reload templates
4. Test by triggering the relevant action (register, order, etc.)

## Email Service API

### EmailService Methods

#### `sendWelcomeEmail(email: string, name: string)`

Sends a welcome email to newly registered users.

**Parameters:**
- `email`: User's email address
- `name`: User's name

**Triggered by:** User registration (auth.service.ts)

#### `sendOrderConfirmation(order: Order, userEmail: string)`

Sends order confirmation with item details and delivery information.

**Parameters:**
- `order`: Order entity with items and user
- `userEmail`: User's email address

**Triggered by:** Order creation (orders.service.ts)

#### `sendOrderStatusUpdate(order: Order, userEmail: string, oldStatus: string, newStatus: string)`

Notifies user about order status changes.

**Parameters:**
- `order`: Order entity
- `userEmail`: User's email address
- `oldStatus`: Previous status
- `newStatus`: New status

**Triggered by:** Order status update (orders.service.ts)

#### `sendPaymentSuccess(order: Order, userEmail: string, paymentId: string)`

Confirms successful payment processing.

**Parameters:**
- `order`: Order entity
- `userEmail`: User's email address
- `paymentId`: Payment provider's transaction ID

**Triggered by:** Payment status update to SUCCESS (payments.service.ts)

#### `sendPasswordResetEmail(email: string, resetToken: string)`

Sends password reset link (for future implementation).

**Parameters:**
- `email`: User's email address
- `resetToken`: Secure reset token

**Triggered by:** Password reset request

## Integration Points

### 1. User Registration (AuthService)

```typescript
// services/api/src/modules/auth/auth.service.ts
async register(createUserDto: CreateUserDto) {
  // ... user creation logic

  // Send welcome email
  await this.emailService.sendWelcomeEmail(
    result.email,
    result.name || result.email.split('@')[0]
  )

  return { access_token, user: result }
}
```

### 2. Order Creation (OrdersService)

```typescript
// services/api/src/modules/orders/orders.service.ts
async create(userId: string, createOrderDto: CreateOrderDto) {
  // ... order creation logic

  const order = await this.findOne(savedOrder.id, userId)

  // Send order confirmation email
  if (order.user?.email) {
    await this.emailService.sendOrderConfirmation(order, order.user.email)
  }

  return order
}
```

### 3. Order Status Update (OrdersService)

```typescript
// services/api/src/modules/orders/orders.service.ts
async updateStatus(id: string, status: OrderStatus) {
  // ... status update logic

  // Send status update email
  if (updatedOrder.user?.email && oldStatus !== status) {
    await this.emailService.sendOrderStatusUpdate(
      updatedOrder,
      updatedOrder.user.email,
      oldStatus,
      status
    )
  }

  return updatedOrder
}
```

### 4. Payment Success (PaymentsService)

```typescript
// services/api/src/modules/payments/payments.service.ts
async updatePaymentStatus(providerPaymentId: string, status: PaymentStatus) {
  // ... status update logic

  // Send payment success email
  if (status === PaymentStatus.SUCCESS && payment?.order?.user?.email) {
    await this.emailService.sendPaymentSuccess(
      payment.order,
      payment.order.user.email,
      payment.providerPaymentId
    )
  }
}
```

## Testing Email Sending

### Local Development

For local development and testing, you can use:

1. **Gmail** with an app password (recommended for testing)
2. **Mailtrap** ([https://mailtrap.io](https://mailtrap.io)) - Email testing service
3. **MailHog** - Local SMTP server for development

### Mailtrap Configuration

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=FullMag <noreply@fullmag.com>
```

### Testing Flow

1. **Test User Registration:**
   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User"
     }'
   ```
   → Should send welcome email

2. **Test Order Creation:**
   - Add items to cart
   - Complete checkout
   → Should send order confirmation email

3. **Test Order Status Update:**
   ```bash
   curl -X PATCH http://localhost:3001/orders/{orderId}/status \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"status": "shipped"}'
   ```
   → Should send status update email

4. **Test Payment Success:**
   - Complete payment via Monobank
   - Wait for webhook callback
   → Should send payment success email

## Email Template Variables

### Welcome Email
- `name`: User's name
- `frontendUrl`: Frontend application URL
- `year`: Current year

### Order Confirmation
- `orderNumber`: Short order ID (first 8 characters)
- `orderId`: Full order UUID
- `items`: Array of order items with name, quantity, price, total
- `totalAmount`: Formatted total amount
- `deliveryCity`: Delivery city name
- `deliveryWarehouse`: Warehouse/branch description
- `recipientName`: Recipient's full name
- `recipientPhone`: Recipient's phone number
- `orderDate`: Order creation date
- `year`: Current year

### Order Status Update
- `orderNumber`: Short order ID
- `orderId`: Full order UUID
- `oldStatus`: Previous status (localized)
- `newStatus`: New status (localized)
- `totalAmount`: Formatted total amount
- `frontendUrl`: Frontend application URL
- `year`: Current year

### Payment Success
- `orderNumber`: Short order ID
- `orderId`: Full order UUID
- `paymentId`: Payment provider's transaction ID
- `totalAmount`: Formatted total amount
- `paymentDate`: Payment completion date
- `frontendUrl`: Frontend application URL
- `year`: Current year

### Password Reset
- `resetUrl`: Password reset link with token
- `expiryMinutes`: Token expiry time (60 minutes)
- `year`: Current year

## Error Handling

The email service includes comprehensive error handling:

- **Configuration Missing**: Service logs warning and returns `false`
- **Template Not Found**: Logs error and returns `false`
- **Send Failure**: Logs error with details and returns `false`
- **Success**: Logs success message and returns `true`

All email sending is non-blocking and won't prevent the main operation from succeeding.

## Best Practices

1. **Always use EMAIL_ENABLED flag** - Easy to disable emails in development
2. **Test with real email providers** - Ensure deliverability
3. **Monitor email logs** - Check for failures and debugging
4. **Use transactional email services** - For production (SendGrid, Mailgun, etc.)
5. **Implement retry logic** - For failed email sends (future enhancement)
6. **Add unsubscribe links** - For marketing emails (if added in future)
7. **Track email opens/clicks** - Using email service webhooks (future enhancement)

## Troubleshooting

### Emails Not Sending

1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify SMTP credentials are correct
3. Check firewall/network allows SMTP connections
4. Review server logs for error messages
5. Test with a different email provider

### Gmail "Less Secure App" Error

Gmail no longer supports "less secure apps". You must:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the app password in `EMAIL_PASSWORD`

### Emails Going to Spam

1. Configure SPF records for your domain
2. Configure DKIM signing
3. Use a reputable transactional email service
4. Avoid spammy content in templates

### Template Changes Not Reflecting

Templates are compiled on server startup. Restart the server after making changes:

```bash
cd services/api
pnpm dev
```

## Future Enhancements

1. **Email Queue**: Use Bull queue for async email sending
2. **Retry Logic**: Automatic retry for failed sends
3. **Email Templates Admin**: Web interface for editing templates
4. **A/B Testing**: Test different email variants
5. **Analytics**: Track open rates, click rates, conversions
6. **Personalization**: Dynamic content based on user preferences
7. **Bulk Emails**: Newsletter and marketing campaigns
8. **Email Verification**: Verify email addresses on registration

## Dependencies

- **nodemailer** (^6.9.8): Node.js email sending library
- **handlebars** (^4.7.8): Template engine for HTML emails
- **@types/nodemailer** (^6.4.14): TypeScript types

## Related Documentation

- [API Documentation](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Setup Guide](./SETUP.md)
- [Features](./FEATURES.md)
