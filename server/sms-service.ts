/**
 * SMS Service - Messaging Infrastructure for Lodge Management Platform
 * 
 * This module provides a comprehensive SMS messaging system with template management,
 * delivery tracking, and multiple provider integration support.
 * 
 * INTEGRATION GUIDE FOR DEVELOPERS:
 * 1. Choose your SMS provider (Twilio, AWS SNS, Firebase, etc.)
 * 2. Implement the ISMSProvider interface
 * 3. Update environment variables
 * 4. Test with development phone numbers
 * 5. Configure production credentials
 */

import { storage } from "./storage";
import { smsLogs, guests, lodgeSettings } from "@shared/schema";
import { nanoid } from "nanoid";

// =============================================================================
// SMS PROVIDER INTERFACES - Implement these for your chosen service
// =============================================================================

export interface SMSMessage {
  to: string;           // Phone number in E.164 format (+1234567890)
  from?: string;        // Sender ID (optional, uses default)
  message: string;      // SMS content
  templateVariables?: Record<string, string>; // Variables for template replacement
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;   // Provider's message ID for tracking
  error?: string;       // Error message if failed
  cost?: number;        // Cost in credits/currency (optional)
}

export interface ISMSProvider {
  name: string;         // Provider name (e.g., "Twilio", "AWS SNS")
  sendSMS(message: SMSMessage): Promise<SMSResponse>;
  getDeliveryStatus?(messageId: string): Promise<'pending' | 'sent' | 'delivered' | 'failed'>;
  getBalance?(): Promise<number>; // Account balance/credits
}

// =============================================================================
// TEMPLATE SYSTEM - Customizable SMS templates
// =============================================================================

export interface SMSTemplate {
  id: string;
  name: string;
  category: 'booking' | 'payment' | 'checkout' | 'reminder' | 'welcome' | 'custom';
  template: string;     // Template with [VARIABLE] placeholders
  variables: string[];  // List of required variables
  language: 'english' | 'telugu' | 'both';
  active: boolean;
}

export const DEFAULT_SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'welcome-booking',
    name: 'Welcome & Booking Confirmation',
    category: 'booking',
    template: 'Welcome to [LODGE_NAME]! Your booking is confirmed. Room: [ROOM_NUMBER], Check-in: [CHECKIN_DATE] at [CHECKIN_TIME]. Amount: ₹[AMOUNT]. Thank you! (స్వాగతం [LODGE_NAME]కి! మీ బుకింగ్ కన్ఫర్మ్ అయ్యింది. గది: [ROOM_NUMBER], చెక్-ఇన్: [CHECKIN_DATE] [CHECKIN_TIME]కి. మొత్తం: ₹[AMOUNT]. ధన్యవాదాలు!)',
    variables: ['LODGE_NAME', 'ROOM_NUMBER', 'CHECKIN_DATE', 'CHECKIN_TIME', 'AMOUNT'],
    language: 'both',
    active: true
  },
  {
    id: 'payment-confirmation',
    name: 'Payment Received',
    category: 'payment',
    template: 'Payment received! ₹[AMOUNT] paid via [PAYMENT_METHOD] for room [ROOM_NUMBER]. Receipt ID: [RECEIPT_ID]. Thank you for staying with [LODGE_NAME]! (చెల్లింపు స్వీకరించబడింది! గది [ROOM_NUMBER] కోసం [PAYMENT_METHOD] ద్వారా ₹[AMOUNT] చెల్లించారు. రసీదు ID: [RECEIPT_ID]. [LODGE_NAME]తో ఉంటుండడానికి ధన్యవాదాలు!)',
    variables: ['AMOUNT', 'PAYMENT_METHOD', 'ROOM_NUMBER', 'RECEIPT_ID', 'LODGE_NAME'],
    language: 'both',
    active: true
  },
  {
    id: 'checkout-bill',
    name: 'Checkout & Final Bill',
    category: 'checkout',
    template: 'Thank you for staying at [LODGE_NAME]! Your final bill: ₹[TOTAL_AMOUNT] ([DAYS] days). Please settle any pending dues. Safe travels! ([LODGE_NAME]లో ఉంటున్నందుకు ధన్యవాదాలు! మీ చివరి బిల్: ₹[TOTAL_AMOUNT] ([DAYS] రోజులు). దయచేసి పెండింగ్ చెల్లింపులు సరిచేయండి. సురక్షిత ప్రయాణం!)',
    variables: ['LODGE_NAME', 'TOTAL_AMOUNT', 'DAYS'],
    language: 'both',
    active: true
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    category: 'reminder',
    template: 'Gentle reminder: Payment of ₹[AMOUNT] is pending for your stay at [LODGE_NAME], Room [ROOM_NUMBER]. Please settle at your earliest convenience. (గుర్తుచేయడం: [LODGE_NAME], గది [ROOM_NUMBER]లో మీ బస కోసం ₹[AMOUNT] చెల్లింపు పెండింగ్‌లో ఉంది. దయచేసి వీలైనంత త్వరగా చెల్లించండి.)',
    variables: ['AMOUNT', 'LODGE_NAME', 'ROOM_NUMBER'],
    language: 'both',
    active: true
  }
];

// =============================================================================
// SMS SERVICE CLASS - Main service orchestrator
// =============================================================================

export class SMSService {
  private provider: ISMSProvider | null = null;
  private rateLimitMap: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_SMS_PER_MINUTE = 5;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize SMS provider based on environment configuration
   * Add your provider initialization logic here
   */
  private initializeProvider() {
    // TODO: Initialize your SMS provider here
    // Example implementations provided below
    
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.provider = new TwilioProvider();
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.provider = new AWSProvider();
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      this.provider = new FirebaseProvider();
    } else {
      console.warn('No SMS provider configured. SMS functionality will use mock provider.');
      this.provider = new MockSMSProvider();
    }
  }

  /**
   * Send SMS using template system
   */
  async sendTemplatedSMS(
    templateId: string,
    recipientPhone: string,
    variables: Record<string, string>,
    guestId?: string
  ): Promise<SMSResponse> {
    try {
      // Get template
      const template = DEFAULT_SMS_TEMPLATES.find(t => t.id === templateId && t.active);
      if (!template) {
        throw new Error(`Template ${templateId} not found or inactive`);
      }

      // Validate required variables
      const missingVars = template.variables.filter(v => !variables[v]);
      if (missingVars.length > 0) {
        throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
      }

      // Replace template variables
      let message = template.template;
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
      }

      // Check rate limiting
      if (!this.checkRateLimit(recipientPhone)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Send SMS
      const response = await this.sendSMS({
        to: this.formatPhoneNumber(recipientPhone),
        message,
        templateVariables: variables
      });

      // Log to database
      await this.logSMS({
        guestId,
        phoneNumber: recipientPhone,
        message,
        templateId,
        status: response.success ? 'sent' : 'failed',
        providerId: response.messageId,
        error: response.error
      });

      return response;
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      // Log failed attempt
      await this.logSMS({
        guestId,
        phoneNumber: recipientPhone,
        message: `Template: ${templateId}`,
        templateId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send direct SMS without template
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!this.provider) {
      return {
        success: false,
        error: 'No SMS provider configured'
      };
    }

    return await this.provider.sendSMS(message);
  }

  /**
   * Rate limiting check - prevents spam
   */
  private checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();
    const attempts = this.rateLimitMap.get(phoneNumber) || [];
    
    // Remove old attempts outside window
    const recentAttempts = attempts.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= this.MAX_SMS_PER_MINUTE) {
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.rateLimitMap.set(phoneNumber, recentAttempts);
    
    return true;
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add India country code if missing
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
      return cleaned;
    }
    
    // Return as-is if already in international format
    return phone;
  }

  /**
   * Log SMS to database for tracking and audit
   */
  private async logSMS(logData: {
    guestId?: string;
    phoneNumber: string;
    message: string;
    templateId?: string;
    status: 'pending' | 'sent' | 'failed';
    providerId?: string;
    error?: string;
  }) {
    try {
      // Use storage.createSmsLog method instead of direct DB access
      if (logData.guestId) {
        await storage.createSmsLog({
          guestId: logData.guestId,
          phoneNumber: logData.phoneNumber,
          message: logData.message,
          status: logData.status
        });
      }
    } catch (error) {
      console.error('Failed to log SMS:', error);
    }
  }

  /**
   * Get SMS history for a guest
   */
  async getSMSHistory(guestId: string, limit: number = 50): Promise<any[]> {
    return await storage.getSmsLogsByGuest(guestId, limit);
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(days: number = 30): Promise<{
    totalSent: number;
    totalFailed: number;
    successRate: number;
    costTotal: number;
  }> {
    try {
      const logs = await storage.getRecentSmsLogs(days);

      const totalSent = logs.filter((log: any) => log.status === 'sent').length;
      const totalFailed = logs.filter((log: any) => log.status === 'failed').length;
      const total = totalSent + totalFailed;
      
      return {
        totalSent,
        totalFailed,
        successRate: total > 0 ? (totalSent / total) * 100 : 0,
        costTotal: 0 // Calculate based on your provider's pricing
      };
    } catch (error) {
      console.error('Failed to get SMS stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        costTotal: 0
      };
    }
  }
}

// =============================================================================
// SMS PROVIDER IMPLEMENTATIONS - Choose and implement one
// =============================================================================

/**
 * TWILIO PROVIDER IMPLEMENTATION
 * 
 * Setup Instructions:
 * 1. npm install twilio
 * 2. Get Twilio Account SID and Auth Token from console.twilio.com
 * 3. Set environment variables:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_PHONE_NUMBER=your_twilio_phone_number
 */
export class TwilioProvider implements ISMSProvider {
  name = 'Twilio';
  private client: any;

  constructor() {
    // Uncomment and install twilio package
    // const twilio = require('twilio');
    // this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      // Uncomment when twilio is installed
      /*
      const result = await this.client.messages.create({
        body: message.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: message.to
      });

      return {
        success: true,
        messageId: result.sid,
        cost: parseFloat(result.price || '0')
      };
      */
      
      // Mock response for now
      console.log(`[Twilio Mock] SMS to ${message.to}: ${message.message}`);
      return {
        success: true,
        messageId: `tw-${nanoid()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio error'
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<'pending' | 'sent' | 'delivered' | 'failed'> {
    // Implement Twilio status check
    return 'sent';
  }

  async getBalance(): Promise<number> {
    // Implement Twilio balance check
    return 0;
  }
}

/**
 * AWS SNS PROVIDER IMPLEMENTATION
 * 
 * Setup Instructions:
 * 1. npm install @aws-sdk/client-sns
 * 2. Configure AWS credentials
 * 3. Set environment variables:
 *    AWS_ACCESS_KEY_ID=your_access_key
 *    AWS_SECRET_ACCESS_KEY=your_secret_key
 *    AWS_REGION=your_region
 */
export class AWSProvider implements ISMSProvider {
  name = 'AWS SNS';

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      // Implement AWS SNS SMS sending
      console.log(`[AWS Mock] SMS to ${message.to}: ${message.message}`);
      return {
        success: true,
        messageId: `aws-${nanoid()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS error'
      };
    }
  }
}

/**
 * FIREBASE PROVIDER IMPLEMENTATION
 * 
 * Setup Instructions:
 * 1. npm install firebase-admin
 * 2. Get Firebase service account key
 * 3. Set environment variable:
 *    FIREBASE_SERVICE_ACCOUNT=path_to_service_account.json
 */
export class FirebaseProvider implements ISMSProvider {
  name = 'Firebase';

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      // Implement Firebase SMS sending
      console.log(`[Firebase Mock] SMS to ${message.to}: ${message.message}`);
      return {
        success: true,
        messageId: `fb-${nanoid()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Firebase error'
      };
    }
  }
}

/**
 * MOCK PROVIDER - For development and testing
 * This provider logs messages to console instead of sending real SMS
 */
export class MockSMSProvider implements ISMSProvider {
  name = 'Mock SMS Provider';
  private mockDelay = 1000; // Simulate network delay

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));

    // Log the SMS for development
    console.log('📱 [MOCK SMS]');
    console.log(`   To: ${message.to}`);
    console.log(`   Message: ${message.message}`);
    console.log(`   Variables:`, message.templateVariables);
    console.log('---');

    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      return {
        success: false,
        error: 'Mock provider simulated failure'
      };
    }

    return {
      success: true,
      messageId: `mock-${nanoid()}`,
      cost: 0.05 // Mock cost per SMS
    };
  }

  async getDeliveryStatus(messageId: string): Promise<'pending' | 'sent' | 'delivered' | 'failed'> {
    return 'sent';
  }

  async getBalance(): Promise<number> {
    return 1000; // Mock balance
  }
}

// =============================================================================
// USAGE EXAMPLES - How to use the SMS service in your application
// =============================================================================

/**
 * Example 1: Send welcome SMS after guest registration
 */
export async function sendWelcomeSMS(guestId: string, guestData: any, roomData: any, lodgeData: any) {
  const smsService = new SMSService();
  
  const variables = {
    LODGE_NAME: lodgeData.name,
    ROOM_NUMBER: roomData.roomNumber,
    CHECKIN_DATE: new Date(guestData.checkinDate).toLocaleDateString(),
    CHECKIN_TIME: guestData.checkinTime,
    AMOUNT: guestData.totalAmount
  };

  return await smsService.sendTemplatedSMS(
    'welcome-booking',
    guestData.phoneNumber,
    variables,
    guestId
  );
}

/**
 * Example 2: Send payment confirmation
 */
export async function sendPaymentConfirmationSMS(paymentData: any, guestData: any, roomData: any, lodgeData: any) {
  const smsService = new SMSService();
  
  const variables = {
    AMOUNT: paymentData.amount,
    PAYMENT_METHOD: paymentData.paymentMethod === 'cash' ? 'Cash' : 'QR Code',
    ROOM_NUMBER: roomData.roomNumber,
    RECEIPT_ID: paymentData.id.slice(-8).toUpperCase(),
    LODGE_NAME: lodgeData.name
  };

  return await smsService.sendTemplatedSMS(
    'payment-confirmation',
    guestData.phoneNumber,
    variables,
    guestData.id
  );
}

/**
 * Example 3: Send checkout bill
 */
export async function sendCheckoutSMS(guestData: any, lodgeData: any) {
  const smsService = new SMSService();
  
  const variables = {
    LODGE_NAME: lodgeData.name,
    TOTAL_AMOUNT: guestData.totalAmount,
    DAYS: guestData.totalDays.toString()
  };

  return await smsService.sendTemplatedSMS(
    'checkout-bill',
    guestData.phoneNumber,
    variables,
    guestData.id
  );
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================
export const smsService = new SMSService();