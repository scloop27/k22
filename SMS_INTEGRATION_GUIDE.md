# SMS Integration Guide for Lodge Management Platform

## 📱 SMS Service Implementation Guide

This guide provides step-by-step instructions for developers to integrate SMS messaging functionality into the Lodge Management Platform.

---

## 🏗️ Architecture Overview

The SMS system is built with a modular architecture that supports multiple providers:

```
📁 SMS System Architecture
├── 🎯 SMS Service (server/sms-service.ts)
│   ├── Template Management
│   ├── Provider Abstraction  
│   ├── Rate Limiting
│   └── Database Logging
├── 🔌 Provider Implementations
│   ├── Twilio Provider
│   ├── AWS SNS Provider
│   ├── Firebase Provider
│   └── Mock Provider (Development)
└── 📊 Integration Points
    ├── Guest Registration
    ├── Payment Confirmation
    └── Checkout Process
```

---

## 🚀 Quick Setup Guide

### Step 1: Choose Your SMS Provider

**Option A: Twilio (Recommended)**
```bash
npm install twilio
```

**Option B: AWS SNS**
```bash
npm install @aws-sdk/client-sns
```

**Option C: Firebase**
```bash
npm install firebase-admin
```

### Step 2: Set Environment Variables

Create or update your `.env` file:

```bash
# For Twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here  
TWILIO_PHONE_NUMBER=+1234567890

# For AWS SNS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# For Firebase
FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json
```

### Step 3: Test with Development Data

The system includes a Mock Provider for development testing:

```typescript
// Will output to console instead of sending real SMS
console.log('📱 [MOCK SMS]');
console.log('   To: +919876543210');
console.log('   Message: Welcome to Test Lodge! Your booking is confirmed...');
```

---

## 🔧 Provider Implementation

### Twilio Implementation Example

```typescript
export class TwilioProvider implements ISMSProvider {
  name = 'Twilio';
  private client: any;

  constructor() {
    const twilio = require('twilio');
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio error'
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<string> {
    const message = await this.client.messages(messageId).fetch();
    return message.status; // 'queued', 'sent', 'delivered', 'failed'
  }

  async getBalance(): Promise<number> {
    const balance = await this.client.balance.fetch();
    return parseFloat(balance.balance);
  }
}
```

### AWS SNS Implementation Example

```typescript
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

export class AWSProvider implements ISMSProvider {
  name = 'AWS SNS';
  private snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      const command = new PublishCommand({
        PhoneNumber: message.to,
        Message: message.message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      });

      const result = await this.snsClient.send(command);
      
      return {
        success: true,
        messageId: result.MessageId,
        cost: 0.05 // Estimate, check AWS pricing
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SNS error'
      };
    }
  }
}
```

---

## 📝 SMS Templates System

### Default Templates

The system includes 4 pre-built bilingual templates:

1. **Welcome & Booking Confirmation**
   - Sent after guest registration
   - Variables: `LODGE_NAME`, `ROOM_NUMBER`, `CHECKIN_DATE`, `CHECKIN_TIME`, `AMOUNT`

2. **Payment Confirmation**
   - Sent when payment is marked as paid
   - Variables: `AMOUNT`, `PAYMENT_METHOD`, `ROOM_NUMBER`, `RECEIPT_ID`, `LODGE_NAME`

3. **Checkout & Final Bill**
   - Sent during checkout process
   - Variables: `LODGE_NAME`, `TOTAL_AMOUNT`, `DAYS`

4. **Payment Reminder**
   - Manual or scheduled reminders
   - Variables: `AMOUNT`, `LODGE_NAME`, `ROOM_NUMBER`

### Adding Custom Templates

```typescript
// Add to DEFAULT_SMS_TEMPLATES array in sms-service.ts
{
  id: 'custom-promo',
  name: 'Promotional Offer',
  category: 'custom',
  template: 'Special offer at [LODGE_NAME]! Get [DISCOUNT]% off your next stay. Valid till [EXPIRY_DATE]. Book now! ([LODGE_NAME]లో ప్రత్యేక ఆఫర్! మీ తదుపరి బస కోసం [DISCOUNT]% తగ్గింపు పొందండి. [EXPIRY_DATE] వరకు వర్తిస్తుంది. ఇప్పుడే బుక్ చేయండి!)',
  variables: ['LODGE_NAME', 'DISCOUNT', 'EXPIRY_DATE'],
  language: 'both',
  active: true
}
```

---

## 🔗 Integration Points

### 1. Guest Registration SMS

**Location**: `server/routes.ts` (POST /api/guests)

```typescript
// After creating guest and payment
const { sendWelcomeSMS } = await import("./sms-service");
sendWelcomeSMS(guest.id, guest, room, lodgeSettings).catch(error => {
  console.error('Failed to send welcome SMS:', error);
});
```

**What it does**:
- Sends welcome message with booking confirmation
- Includes room number, check-in details, and total amount
- Runs asynchronously (doesn't block response)

### 2. Payment Confirmation SMS

**Location**: `server/routes.ts` (PUT /api/payments/:id)

```typescript
// When payment status changes to "paid"
if (validatedData.status === "paid") {
  const { sendPaymentConfirmationSMS } = await import("./sms-service");
  sendPaymentConfirmationSMS(payment, guest, room, lodgeSettings);
}
```

**What it does**:
- Confirms payment received
- Shows payment method and receipt ID
- Thanks customer for their stay

### 3. Checkout Process SMS

**Location**: `server/routes.ts` (PUT /api/guests/:id/checkout)

```typescript
// During checkout process
const { sendCheckoutSMS } = await import("./sms-service");
sendCheckoutSMS(guest, lodgeSettings);
```

**What it does**:
- Shows final bill amount
- Thanks for the stay
- Prompts to settle any pending dues

---

## 🛡️ Security Features

### Rate Limiting
- Maximum 5 SMS per phone number per minute
- Prevents spam and abuse
- Configurable limits

```typescript
private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
private readonly MAX_SMS_PER_MINUTE = 5;
```

### Phone Number Formatting
- Automatically adds India country code (+91)
- Converts 10-digit numbers to international format
- Handles various input formats

```typescript
private formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  // Additional formatting logic...
}
```

### Database Logging
- All SMS attempts logged to database
- Tracks success/failure rates
- Audit trail for compliance

---

## 📊 Analytics & Monitoring

### SMS Statistics

```typescript
const smsService = new SMSService();
const stats = await smsService.getSMSStats(30); // Last 30 days

console.log(`Total Sent: ${stats.totalSent}`);
console.log(`Success Rate: ${stats.successRate}%`);
console.log(`Total Cost: ₹${stats.costTotal}`);
```

### Guest SMS History

```typescript
const history = await smsService.getSMSHistory(guestId, 50);
// Returns last 50 SMS messages for a guest
```

### Database Queries for Reports

```sql
-- SMS success rate by day
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as total_sms,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
  ROUND(
    (SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
  ) as success_rate
FROM sms_logs 
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- Most active phone numbers
SELECT 
  phone_number,
  COUNT(*) as sms_count,
  MAX(sent_at) as last_sms
FROM sms_logs 
GROUP BY phone_number
ORDER BY sms_count DESC
LIMIT 10;
```

---

## 🧪 Testing Guide

### Development Testing

1. **Use Mock Provider**
   - No real SMS charges
   - Console output for debugging
   - Simulates success/failure scenarios

2. **Test Phone Numbers**
   - Use your own phone number
   - Twilio/AWS provide test numbers
   - Verify formatting works correctly

### Production Testing

1. **Start with Small Volume**
   - Test with 5-10 real customers first
   - Monitor delivery rates
   - Check customer feedback

2. **Monitor Costs**
   - Track SMS spending
   - Set up billing alerts
   - Optimize message length

### Error Handling Test Cases

```typescript
// Test various error scenarios
const testCases = [
  { phone: "invalid", expected: "Invalid phone number" },
  { phone: "+1234567890", template: "nonexistent", expected: "Template not found" },
  { phone: "+919876543210", variables: {}, expected: "Missing variables" }
];

for (const test of testCases) {
  try {
    await smsService.sendTemplatedSMS(test.template, test.phone, test.variables);
  } catch (error) {
    console.log(`✓ Error handled correctly: ${error.message}`);
  }
}
```

---

## 💰 Cost Optimization

### Message Length Optimization

SMS providers charge per message segment (160 characters):

```typescript
function optimizeMessage(message: string): string {
  // Remove extra spaces
  message = message.replace(/\s+/g, ' ').trim();
  
  // Use abbreviations for common terms
  message = message.replace(/rupees/gi, '₹');
  message = message.replace(/number/gi, 'No.');
  
  // Keep under 160 characters for single SMS
  if (message.length > 160) {
    console.warn(`Message length: ${message.length} chars (will be charged as multiple SMS)`);
  }
  
  return message;
}
```

### Template Optimization Tips

1. **Keep messages concise**
   - Use abbreviations where appropriate
   - Remove unnecessary words
   - Prioritize essential information

2. **Bilingual considerations**
   - Telugu text uses more characters
   - Consider English-only for cost savings
   - Test character counts carefully

3. **Variable placement**
   - Put most important variables first
   - Use shorter variable names in templates

---

## 🚨 Troubleshooting

### Common Issues

**1. SMS not sending**
```bash
# Check environment variables
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Check console logs
tail -f logs/app.log | grep SMS
```

**2. Invalid phone number format**
```typescript
// Debug phone number formatting
console.log('Original:', phoneNumber);
console.log('Formatted:', formatPhoneNumber(phoneNumber));
```

**3. Template variable errors**
```typescript
// Check template variables
const template = DEFAULT_SMS_TEMPLATES.find(t => t.id === templateId);
console.log('Required variables:', template.variables);
console.log('Provided variables:', Object.keys(variables));
```

**4. Rate limiting issues**
```typescript
// Check rate limit status
const attempts = rateLimitMap.get(phoneNumber) || [];
console.log(`Recent attempts for ${phoneNumber}:`, attempts.length);
```

### Error Codes

| Error Code | Description | Solution |
|------------|------------|----------|
| `PROVIDER_NOT_CONFIGURED` | No SMS provider set up | Add environment variables |
| `TEMPLATE_NOT_FOUND` | Invalid template ID | Check template exists and is active |
| `MISSING_VARIABLES` | Required template variables missing | Provide all required variables |
| `RATE_LIMIT_EXCEEDED` | Too many SMS to same number | Wait or increase limits |
| `INVALID_PHONE_NUMBER` | Phone number format invalid | Use +91 format for India |

---

## 📋 Deployment Checklist

### Pre-deployment

- [ ] SMS provider credentials configured
- [ ] Environment variables set in production
- [ ] Database schema updated (`npm run db:push`)
- [ ] SMS templates reviewed and approved
- [ ] Rate limiting configured appropriately
- [ ] Error handling tested thoroughly

### Post-deployment

- [ ] Send test SMS to verify integration
- [ ] Monitor SMS delivery rates
- [ ] Check database logging working
- [ ] Verify billing/cost tracking
- [ ] Test error scenarios work correctly
- [ ] Customer feedback collection set up

### Monitoring Setup

```typescript
// Add to your monitoring dashboard
const smsMetrics = {
  dailySMSCount: () => storage.getSMSStatsForDay(),
  successRate: () => storage.getSMSSuccessRate(),
  averageCost: () => storage.getAverageSMSCost(),
  failureReasons: () => storage.getSMSFailureReasons()
};
```

---

## 🔄 Future Enhancements

### Planned Features

1. **Scheduled SMS**
   - Birthday wishes
   - Booking reminders
   - Promotional campaigns

2. **Two-way SMS**
   - Customer replies
   - Booking confirmations via SMS
   - Payment confirmations

3. **Multi-language Support**
   - Hindi support
   - Regional language detection
   - Dynamic language selection

4. **Advanced Templates**
   - Rich text formatting
   - Image/media attachments
   - Interactive elements

### Integration Possibilities

- **WhatsApp Business API**
- **Email notifications**
- **Push notifications**
- **Voice calls for urgent matters**

---

This guide provides everything needed to successfully integrate SMS functionality into the Lodge Management Platform. For additional support or custom implementations, refer to the provider documentation or contact your development team.