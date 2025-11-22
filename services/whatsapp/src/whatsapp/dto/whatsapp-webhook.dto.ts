/**
 * WhatsApp Cloud API Webhook DTOs
 * Based on Meta's WhatsApp Business Platform documentation
 */

// Incoming webhook payload structure
export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account'
  entry: WhatsAppWebhookEntry[]
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: WhatsAppWebhookChange[]
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue
  field: 'messages'
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp'
  metadata: WhatsAppMetadata
  contacts?: WhatsAppContact[]
  messages?: WhatsAppIncomingMessage[]
  statuses?: WhatsAppMessageStatus[]
  errors?: WhatsAppError[]
}

export interface WhatsAppMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface WhatsAppContact {
  profile: {
    name: string
  }
  wa_id: string
}

// Incoming message types
export interface WhatsAppIncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts' | 'interactive' | 'button' | 'reaction'
  text?: {
    body: string
  }
  image?: WhatsAppMediaMessage
  audio?: WhatsAppMediaMessage
  video?: WhatsAppMediaMessage
  document?: WhatsAppMediaMessage & { filename?: string }
  location?: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
  button?: {
    text: string
    payload: string
  }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
      description?: string
    }
  }
  reaction?: {
    message_id: string
    emoji: string
  }
  context?: {
    from: string
    id: string
  }
}

export interface WhatsAppMediaMessage {
  id: string
  mime_type: string
  sha256?: string
  caption?: string
}

// Message status updates
export interface WhatsAppMessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  conversation?: {
    id: string
    origin: {
      type: 'business_initiated' | 'user_initiated' | 'referral_conversion'
    }
    expiration_timestamp?: string
  }
  pricing?: {
    billable: boolean
    pricing_model: string
    category: string
  }
  errors?: WhatsAppError[]
}

export interface WhatsAppError {
  code: number
  title: string
  message: string
  error_data?: {
    details: string
  }
}

// Outgoing message DTOs
export interface WhatsAppSendMessageDto {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'template' | 'interactive'
  text?: {
    preview_url?: boolean
    body: string
  }
  context?: {
    message_id: string
  }
}

export interface WhatsAppSendMessageResponse {
  messaging_product: 'whatsapp'
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

// Webhook verification query params
export interface WhatsAppWebhookVerifyQuery {
  'hub.mode': string
  'hub.verify_token': string
  'hub.challenge': string
}
