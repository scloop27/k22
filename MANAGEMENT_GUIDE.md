# Lodge Management Platform - Management Guide for Non-Coders

## Table of Contents
1. [Overview](#overview)
2. [Quick Reference - Common Changes](#quick-reference)
3. [File Structure Guide](#file-structure)
4. [Making Simple Changes](#making-simple-changes)
5. [Text and Language Changes](#text-and-language-changes)
6. [Database Configuration](#database-configuration)
7. [User Interface Customization](#user-interface-customization)
8. [Business Logic Modifications](#business-logic-modifications)
9. [Technical Reference](#technical-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This Lodge Management Platform is built using modern web technologies. The system is divided into three main parts:
- **Frontend (Client)**: What users see and interact with
- **Backend (Server)**: Handles data processing and database operations
- **Database**: Stores all information (guests, rooms, payments, etc.)

## Quick Reference - Common Changes

### 📝 Text Changes
- **Location**: `client/src/components/bilingual-text.tsx`
- **What to change**: English and Telugu text displayed to users
- **Risk**: Low ⭐

### 💰 Price Formatting
- **Location**: Various files using `₹` symbol
- **What to change**: Currency symbol, decimal places
- **Risk**: Low ⭐

### 🏠 Room Types
- **Location**: `shared/schema.ts` and registration forms
- **What to change**: Available room types (Single, Double, Suite, etc.)
- **Risk**: Medium ⭐⭐

### 📊 Business Rules
- **Location**: `server/routes.ts` and component files
- **What to change**: Discount rates, payment methods, validation rules
- **Risk**: High ⭐⭐⭐

---

## File Structure Guide

### 🗂️ Main Folders

```
📁 client/               # Frontend (User Interface)
├── 📁 src/
│   ├── 📁 components/   # Reusable UI components
│   ├── 📁 pages/        # Main application pages
│   └── 📁 lib/          # Utility functions

📁 server/               # Backend (Business Logic)
├── routes.ts            # API endpoints
├── storage.ts           # Database operations
└── index.ts             # Server startup

📁 shared/               # Shared between frontend and backend
└── schema.ts            # Database structure definitions

📁 scripts/              # Utility scripts
└── seed-*.ts            # Database seeding scripts
```

### 🎯 Key Files You Might Need to Modify

| File | Purpose | Change Frequency | Risk Level |
|------|---------|------------------|------------|
| `client/src/components/bilingual-text.tsx` | Text display | High | ⭐ Low |
| `client/src/components/guest-registration-modal.tsx` | Guest registration form | Medium | ⭐⭐ Medium |
| `client/src/pages/dashboard.tsx` | Main dashboard | Medium | ⭐⭐ Medium |
| `shared/schema.ts` | Database structure | Low | ⭐⭐⭐ High |
| `server/routes.ts` | Business logic | Low | ⭐⭐⭐ High |

---

## Making Simple Changes

### ✏️ Changing Text Display

**File**: `client/src/components/bilingual-text.tsx`

```typescript
// CURRENT CODE:
<BilingualText english="Check-in" telugu="చెక్-ఇన్" />

// TO CHANGE: Just edit the text inside quotes
<BilingualText english="Arrival" telugu="రాక" />
```

**Steps to Change Text Throughout the App:**
1. Open the specific component file (e.g., `guest-registration-modal.tsx`)
2. Find the `<BilingualText>` tags
3. Edit the `english="..."` or `telugu="..."` parts
4. Save the file

### 💱 Changing Currency Symbol

**Files to modify**: Search for `₹` symbol throughout the codebase

```typescript
// CURRENT CODE:
<p>₹{amount}</p>

// TO CHANGE TO DOLLAR:
<p>${amount}</p>

// TO CHANGE TO EURO:
<p>€{amount}</p>
```

### 📞 Changing Contact Information

**File**: Various component files and `server/routes.ts`

```typescript
// In SMS templates (server/routes.ts):
const smsTemplate = "Your bill from [LODGE_NAME]: ₹[AMOUNT]. Thank you!";

// TO CHANGE:
const smsTemplate = "Your invoice from [LODGE_NAME]: $[AMOUNT]. Thanks for staying!";
```

---

## Text and Language Changes

### 🌐 Adding New Languages

Currently supports English and Telugu. To add a new language:

1. **Modify BilingualText Component**
   - File: `client/src/components/bilingual-text.tsx`
   - Add new language prop
   
2. **Update All Component Files**
   - Search for all `<BilingualText>` usages
   - Add the new language text

**Example - Adding Hindi:**
```typescript
// OLD:
interface BilingualTextProps {
  english: string;
  telugu: string;
}

// NEW:
interface BilingualTextProps {
  english: string;
  telugu: string;
  hindi?: string;  // Optional for backward compatibility
}
```

### 📝 Common Text Locations

| Text Type | Files to Check |
|-----------|----------------|
| Form labels | `*-modal.tsx` files in `client/src/components/` |
| Button text | `dashboard.tsx`, `*-modal.tsx` |
| Error messages | `server/routes.ts` |
| Success messages | Component files with `toast` calls |

---

## Database Configuration

### 🗃️ Room Types Configuration

**File**: `shared/schema.ts`

```typescript
// CURRENT ROOM TYPES (defined by usage in forms):
// "Single", "Double", "Suite", "Deluxe", "Family", "Premium", "Executive"

// TO ADD NEW ROOM TYPE:
// 1. Add to guest registration dropdown in:
//    client/src/components/guest-registration-modal.tsx

// EXAMPLE:
<SelectItem value="Penthouse" className="font-telugu">
  <BilingualText english="Penthouse" telugu="పెంట్‌హౌస్" />
</SelectItem>
```

### 💳 Payment Methods

**File**: `server/routes.ts` and related components

```typescript
// CURRENT PAYMENT METHODS:
"cash", "qr"

// TO ADD CREDIT CARD:
// 1. Update payment creation in server/routes.ts
// 2. Update payment modals in client/src/components/payment-modal.tsx
// 3. Add validation logic
```

### 📈 Business Rules

**File**: `server/routes.ts`

```typescript
// DISCOUNT VALIDATION (around line 280):
if (discountPercentage > 50) {
  return res.status(400).json({ message: "Discount cannot exceed 50%" });
}

// TO CHANGE MAXIMUM DISCOUNT TO 30%:
if (discountPercentage > 30) {
  return res.status(400).json({ message: "Discount cannot exceed 30%" });
}
```

---

## User Interface Customization

### 🎨 Colors and Themes

**File**: `client/src/index.css`

```css
/* CURRENT COLOR SCHEME */
:root {
  --primary: 220 70% 50%;      /* Blue */
  --success: 142 76% 36%;      /* Green */
  --warning: 38 92% 50%;       /* Orange */
  --error: 0 84% 60%;          /* Red */
}

/* TO CHANGE TO PURPLE THEME: */
:root {
  --primary: 270 70% 50%;      /* Purple */
  --success: 142 76% 36%;      /* Keep green for success */
  --warning: 38 92% 50%;       /* Keep orange for warning */
  --error: 0 84% 60%;          /* Keep red for error */
}
```

### 📊 Dashboard Layout

**File**: `client/src/pages/dashboard.tsx`

```typescript
// CURRENT STATS CARDS (around line 300):
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// TO CHANGE TO 3 COLUMNS:
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// TO CHANGE TO 2 ROWS OF 3:
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
```

### 🖼️ Adding New Dashboard Cards

**File**: `client/src/pages/dashboard.tsx`

To add a new statistics card, copy the existing card structure:

```typescript
// ADD AFTER EXISTING CARDS:
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 font-telugu">
          <BilingualText english="New Metric" telugu="కొత్త మెట్రిక్" />
        </p>
        <p className="text-2xl font-semibold text-gray-900">
          {/* Your calculation here */}
          42
        </p>
      </div>
      <div className="bg-primary bg-opacity-10 p-3 rounded-full">
        <YourIcon className="text-primary" size={20} />
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Business Logic Modifications

### 💼 Checkout Process

**File**: `server/routes.ts` (around line 350)

```typescript
// CURRENT CHECKOUT LOGIC:
await storage.updateGuest(guestId, { status: "checked_out" });
await storage.updateRoom(guest.roomId, { status: "available" });

// TO ADD CHECKOUT FEE:
const checkoutFee = 100; // ₹100 checkout fee
await storage.createPayment({
  guestId: guestId,
  amount: checkoutFee.toString(),
  paymentMethod: "cash",
  status: "pending"
});
```

### 📅 Date Validation Rules

**File**: `client/src/components/guest-registration-modal.tsx`

```typescript
// CURRENT: Only allows today and future dates
const today = new Date().toISOString().split('T')[0];

// TO ALLOW PAST DATES WITHOUT WARNING:
// Remove or comment out the date validation logic around line 150
```

### 🏷️ Room Pricing Logic

**File**: Server generates pricing, but you can modify in:
- `server/routes.ts` for calculation logic
- Database directly for base prices

```typescript
// EXAMPLE: ADD WEEKEND SURCHARGE
const isWeekend = [0, 6].includes(new Date(checkinDate).getDay());
const surcharge = isWeekend ? basePrice * 0.2 : 0; // 20% weekend surcharge
const totalAmount = basePrice + surcharge;
```

---

## Technical Reference

### 🔧 Important Functions and Their Locations

#### Guest Management Functions
| Function | File | Line (Approx) | Purpose |
|----------|------|---------------|---------|
| `createGuest` | `server/storage.ts` | 180 | Creates new guest record |
| `getAllGuests` | `server/storage.ts` | 160 | Retrieves all guests |
| `updateGuest` | `server/storage.ts` | 190 | Updates guest information |
| `handleCheckoutGuest` | `client/src/pages/dashboard.tsx` | 200 | Processes checkout |

#### Room Management Functions
| Function | File | Line (Approx) | Purpose |
|----------|------|---------------|---------|
| `createRoom` | `server/storage.ts` | 80 | Creates new room |
| `updateRoom` | `server/storage.ts` | 100 | Updates room status/info |
| `getAvailableRooms` | `server/storage.ts` | 120 | Finds available rooms |

#### Payment Functions
| Function | File | Line (Approx) | Purpose |
|----------|------|---------------|---------|
| `createPayment` | `server/storage.ts` | 220 | Creates payment record |
| `updatePayment` | `server/storage.ts` | 240 | Updates payment status |
| `getPaymentsByStatus` | `server/storage.ts` | 260 | Gets pending/paid payments |

### 🎯 Key Variables to Modify

#### Business Constants
```typescript
// File: server/routes.ts
const MAX_DISCOUNT_PERCENTAGE = 50;  // Line ~280
const DEFAULT_PAYMENT_METHOD = "cash";  // Line ~270
const SMS_RATE_LIMIT = 5; // Messages per minute // Line ~400

// File: client/src/components/guest-registration-modal.tsx
const MIN_STAY_DAYS = 1;  // Line ~100
const MAX_GUESTS_PER_ROOM = 6;  // Line ~120
```

#### UI Configuration
```typescript
// File: client/src/pages/dashboard.tsx
const ITEMS_PER_PAGE = 10;  // For pagination
const REFRESH_INTERVAL = 30000;  // 30 seconds auto-refresh
const DEFAULT_CURRENCY = "₹";  // Currency symbol
```

### 📡 API Endpoints

| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/api/guests` | GET | `server/routes.ts` | Get all guests |
| `/api/guests` | POST | `server/routes.ts` | Create new guest |
| `/api/guests/:id` | PUT | `server/routes.ts` | Update guest |
| `/api/rooms` | GET | `server/routes.ts` | Get all rooms |
| `/api/rooms/available` | GET | `server/routes.ts` | Get available rooms |
| `/api/payments` | GET | `server/routes.ts` | Get all payments |
| `/api/payments/:id` | PUT | `server/routes.ts` | Update payment |

---

## Troubleshooting

### ❌ Common Issues and Solutions

#### Issue: Text Changes Not Appearing
**Solution**: 
1. Check if you edited the correct file
2. Make sure you saved the file
3. Refresh the browser
4. Check browser console for errors

#### Issue: Database Changes Not Working
**Solution**:
1. Run `npm run db:push` to update database schema
2. Check database connection in environment variables
3. Verify changes in `shared/schema.ts`

#### Issue: Application Won't Start
**Solution**:
1. Check console for error messages
2. Verify all required environment variables are set
3. Run `npm install` to ensure dependencies are installed
4. Check if port 5000 is already in use

### 🚨 When to Get Technical Help

**Immediately contact a developer if:**
- Database schema changes are needed (`shared/schema.ts`)
- Authentication/security modifications required
- Complex business logic changes
- Performance optimization needed
- Third-party integration changes

**Safe to try yourself:**
- Text and translation changes
- Color and styling modifications
- Simple form field additions
- Menu and navigation changes

### 📞 Getting Help

**Before asking for help, provide:**
1. What you were trying to change
2. Which file you modified
3. Error messages (if any)
4. Screenshots of the issue
5. What you expected to happen vs. what actually happened

---

## Final Notes

### 🔐 Security Considerations
- Never share database credentials
- Always test changes in a development environment first
- Back up data before making significant changes
- Limit access to server files to authorized personnel only

### 🚀 Best Practices
- Make small changes and test frequently
- Keep a log of what you changed and when
- Use the browser's developer tools to test CSS changes
- Ask questions rather than guessing on complex changes

### 📖 Additional Resources
- Project documentation: `replit.md`
- Database schema: `shared/schema.ts`
- Component examples: Files in `client/src/components/`

---

*This guide was created to help non-technical users safely make common modifications to the Lodge Management Platform. When in doubt, consult with a developer rather than risking data loss or system downtime.*