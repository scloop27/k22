# Lodge Management Platform - Technical Reference

## Architecture Overview

This application follows a modern full-stack architecture with clear separation of concerns:

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack Query v5
- **Routing**: Wouter (client-side)
- **Authentication**: Session-based with express-session
- **Build Tools**: Vite (frontend), esbuild (backend)

---

## Detailed File Structure

```
📁 Project Root/
├── 📁 client/                      # Frontend React Application
│   ├── 📁 src/
│   │   ├── 📁 components/           # Reusable UI Components
│   │   │   ├── 📁 ui/              # shadcn/ui base components
│   │   │   ├── bilingual-text.tsx  # Bilingual text display component
│   │   │   ├── guest-registration-modal.tsx  # Guest registration form
│   │   │   ├── guest-details-modal.tsx       # Guest information viewer
│   │   │   ├── edit-guest-modal.tsx          # Guest editing form
│   │   │   ├── payment-modal.tsx             # Payment processing form
│   │   │   ├── room-management-modal.tsx     # Room CRUD operations
│   │   │   ├── room-grid.tsx                 # Room status visualization
│   │   │   ├── revenue-chart.tsx             # Analytics visualization
│   │   │   └── settings-modal.tsx            # Lodge configuration
│   │   ├── 📁 pages/               # Application Pages
│   │   │   ├── dashboard.tsx       # Main application dashboard
│   │   │   ├── login.tsx          # Authentication page
│   │   │   └── onboarding.tsx     # Initial setup wizard
│   │   ├── 📁 lib/                # Utility Functions
│   │   │   ├── queryClient.ts     # TanStack Query configuration
│   │   │   ├── types.ts          # TypeScript type definitions
│   │   │   └── utils.ts          # General utility functions
│   │   ├── 📁 hooks/             # Custom React Hooks
│   │   │   └── use-toast.ts      # Toast notification hook
│   │   ├── App.tsx               # Root component with routing
│   │   ├── main.tsx              # Application entry point
│   │   └── index.css             # Global styles and CSS variables
│   └── index.html                # HTML template
├── 📁 server/                     # Backend Express Application
│   ├── routes.ts                 # API route definitions
│   ├── storage.ts               # Database operations and storage interface
│   ├── vite.ts                  # Vite integration for development
│   └── index.ts                 # Express server entry point
├── 📁 shared/                    # Shared Code Between Frontend/Backend
│   └── schema.ts                # Database schema and type definitions
├── 📁 scripts/                   # Utility Scripts
│   ├── seed-database.ts         # Initial data population
│   └── seed-checked-out-users.ts  # Test data for checked-out users
├── 📁 components/               # shadcn/ui component configurations
├── package.json                 # Dependencies and scripts
├── drizzle.config.ts           # Database migration configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── replit.md                   # Project documentation
```

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Lodge Settings Table
```sql
CREATE TABLE lodge_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  discount_rate DECIMAL(5,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  sms_template TEXT,
  room_types TEXT[] DEFAULT ARRAY['Single', 'Double'],
  is_setup_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Rooms Table
```sql
CREATE TABLE rooms (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'available' -- 'available', 'occupied', 'maintenance'
);
```

#### Guests Table
```sql
CREATE TABLE guests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  aadhar_number TEXT NOT NULL,
  checkin_date TIMESTAMP NOT NULL,
  checkin_time TEXT NOT NULL,           -- New field: HH:MM format
  checkout_date TIMESTAMP NOT NULL,
  purpose_of_visit TEXT NOT NULL,       -- New field: Business, Tourism, etc.
  room_id VARCHAR REFERENCES rooms(id),
  number_of_guests INTEGER DEFAULT 1,
  total_days INTEGER NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'checked_out'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id VARCHAR REFERENCES guests(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'qr'
  status TEXT DEFAULT 'pending', -- 'pending', 'paid'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);
```

#### SMS Logs Table
```sql
CREATE TABLE sms_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id VARCHAR REFERENCES guests(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Authentication Endpoints
```typescript
POST /api/auth/login
Body: { username: string, password: string }
Response: { user: { id: string, username: string } }

POST /api/auth/logout
Response: { message: string }

GET /api/auth/me
Response: { user: { id: string, username: string } | null }
```

### Lodge Settings Endpoints
```typescript
GET /api/lodge-settings
Response: LodgeSettings | null

POST /api/lodge-settings
Body: InsertLodgeSettings
Response: LodgeSettings

PUT /api/lodge-settings/:id
Body: Partial<InsertLodgeSettings>
Response: LodgeSettings
```

### Room Management Endpoints
```typescript
GET /api/rooms
Response: Room[]

POST /api/rooms
Body: InsertRoom
Response: Room

PUT /api/rooms/:id
Body: Partial<InsertRoom>
Response: Room

DELETE /api/rooms/:id
Response: { message: string }

GET /api/rooms/available?checkinDate=ISO&checkoutDate=ISO
Response: Room[]
```

### Guest Management Endpoints
```typescript
GET /api/guests?search=string
Response: Guest[]

POST /api/guests
Body: InsertGuest
Response: Guest

PUT /api/guests/:id
Body: Partial<InsertGuest>
Response: Guest

PUT /api/guests/:id/checkout
Response: { message: string }
```

### Payment Endpoints
```typescript
GET /api/payments
Response: PaymentWithGuest[]

PUT /api/payments/:id
Body: { status: 'paid' | 'pending', paymentMethod?: string }
Response: Payment
```

### Analytics Endpoints
```typescript
GET /api/analytics/dashboard
Response: {
  availableRooms: number,
  occupiedRooms: number,
  maintenanceRooms: number,
  todayRevenue: number,
  totalRooms: number,
  activeGuests: number
}

GET /api/analytics/revenue?period=string
Response: RevenueData[]
```

---

## Frontend Architecture

### Component Hierarchy
```
App
├── Router (wouter)
├── QueryClientProvider (TanStack Query)
├── TooltipProvider (Radix UI)
└── Routes
    ├── Login
    ├── Onboarding
    └── Dashboard
        ├── TabsContainer
        ├── DashboardTab (Stats + Quick Actions)
        ├── GuestsTab (Guest List + Filters)
        ├── RoomsTab (Room Grid)
        ├── PaymentsTab (Payment List)
        └── AnalyticsTab (Charts + Reports)
```

### State Management Strategy

#### Server State (TanStack Query)
```typescript
// Key patterns used throughout the app
queryKey: ["/api/endpoint"]           // Simple endpoints
queryKey: ["/api/endpoint", param]    // Parameterized endpoints
queryKey: ["/api/endpoint", id]       // Resource-specific queries

// Cache invalidation after mutations
queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
```

#### Local State (useState)
- Form data and UI state
- Modal open/close states
- Filter and search parameters
- Temporary selections

### Data Flow Patterns

#### Guest Registration Flow
1. User opens registration modal
2. Form validates input with Zod schemas
3. API call to create guest + payment record
4. Room status updated to "occupied"
5. Cache invalidated for guests/rooms/payments
6. Success notification displayed
7. Modal closes and data refreshes

#### Payment Processing Flow
1. User selects payment from list
2. Payment modal opens with current status
3. User updates payment method/status
4. API call to update payment record
5. SMS notification sent (if applicable)
6. Cache invalidated for payments
7. UI updates with new status

---

## Backend Architecture

### Express Middleware Stack
1. **cors** - Cross-origin resource sharing
2. **express.json()** - JSON body parsing
3. **express-session** - Session management
4. **express.static** - Static file serving (production)
5. **Custom routes** - Application API endpoints

### Database Layer (Drizzle ORM)

#### Connection Setup
```typescript
// Uses Neon serverless PostgreSQL
const db = neon(process.env.DATABASE_URL!);
```

#### Query Patterns
```typescript
// Select with joins
const guestWithRoom = await db
  .select({
    ...guests,
    room: {
      roomNumber: rooms.roomNumber,
      roomType: rooms.roomType
    }
  })
  .from(guests)
  .leftJoin(rooms, eq(guests.roomId, rooms.id));

// Complex filtering
const availableRooms = await db
  .select()
  .from(rooms) 
  .where(
    and(
      eq(rooms.status, "available"),
      not(inArray(rooms.id, occupiedRoomIds))
    )
  );
```

### Business Logic Organization

#### Storage Interface Pattern
```typescript
interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<InsertRoom>): Promise<Room>;
  
  // Guest operations  
  createGuest(guest: InsertGuest): Promise<Guest>;
  getAvailableRooms(checkin: Date, checkout: Date): Promise<Room[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
}
```

#### Validation Strategy
```typescript
// Using Zod schemas derived from Drizzle
const insertGuestSchema = createInsertSchema(guests);
const validatedData = insertGuestSchema.parse(req.body);
```

---

## Key Features Implementation

### 1. Bilingual Support
**Location**: `client/src/components/bilingual-text.tsx`

```typescript
interface BilingualTextProps {
  english: string;
  telugu: string;
  className?: string;
}

export function BilingualText({ english, telugu, className }: BilingualTextProps) {
  return (
    <span className={className}>
      {english} {telugu && `(${telugu})`}
    </span>
  );
}
```

### 2. Date Validation System
**Location**: `client/src/components/guest-registration-modal.tsx`

Features:
- Default: Only today and future dates allowed
- Manual data entry toggle for past dates
- Warning messages in both languages
- Real-time validation feedback

### 3. Room Availability Engine
**Location**: `server/storage.ts`

Algorithm:
1. Get all rooms from database
2. Find guests with overlapping date ranges
3. Exclude occupied rooms from available list
4. Return filtered room list

```typescript
async getAvailableRooms(checkinDate: Date, checkoutDate: Date): Promise<Room[]> {
  const allRooms = await this.getAllRooms();
  
  const overlappingGuests = await db
    .select()
    .from(guests)
    .where(
      and(
        eq(guests.status, "active"),
        lt(guests.checkinDate, checkoutDate),
        gt(guests.checkoutDate, checkinDate)
      )
    );

  const occupiedRoomIds = new Set(
    overlappingGuests.map((guest) => guest.roomId).filter(Boolean)
  );

  return allRooms.filter((room) => !occupiedRoomIds.has(room.id));
}
```

### 4. Dynamic Room Type Management
**Location**: Multiple files

Components:
- Database schema allows custom room types
- Admin interface for adding/removing room types
- Form dropdowns populate dynamically
- Validation ensures consistency

### 5. Enhanced Guest Filtering and Sorting
**Location**: `client/src/pages/dashboard.tsx`

Features:
- Text search across name, phone, Aadhar
- Date range filtering (check-in dates)
- Sort by newest/oldest check-in
- Real-time filter application
- Results count display

```typescript
const guests = useMemo(() => {
  if (!allGuests) return [];
  
  let filteredGuests = [...allGuests];
  
  // Apply date filters
  if (dateFromFilter) {
    const fromDate = new Date(dateFromFilter);
    filteredGuests = filteredGuests.filter(guest => 
      new Date(guest.checkinDate) >= fromDate
    );
  }
  
  // Sort by check-in date
  filteredGuests.sort((a, b) => {
    const dateA = new Date(a.checkinDate).getTime();
    const dateB = new Date(b.checkinDate).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });
  
  return filteredGuests;
}, [allGuests, dateFromFilter, dateToFilter, sortOrder]);
```

---

## Development Workflow

### Database Changes
1. Modify schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update TypeScript types automatically generated
4. Update affected components and API routes

### Adding New Features
1. Define database schema changes (if needed)
2. Create/update storage interface methods
3. Implement API endpoints in `server/routes.ts`
4. Create UI components in `client/src/components/`
5. Integrate with main dashboard
6. Add proper error handling and validation

### Testing Strategy
- **Database**: Use seed scripts for consistent test data
- **API**: Test endpoints with various input scenarios
- **UI**: Verify responsive design and bilingual text
- **Integration**: Test complete user workflows

### Performance Considerations
- TanStack Query caches server responses
- Database indexes on frequently queried fields
- Pagination for large datasets (not yet implemented)
- Efficient JOIN queries for related data

---

## Security Implementation

### Authentication
- Session-based authentication with secure cookies
- Password hashing using bcrypt (implementation in routes.ts)
- Session timeout and cleanup

### Data Validation
- Server-side validation using Zod schemas
- SQL injection prevention via Drizzle ORM
- Input sanitization for all user inputs

### Authorization
- Simple admin-only access (single user system)
- API endpoint protection via session checks
- No public endpoints (all require authentication)

---

## Deployment Architecture

### Development Mode
```bash
npm run dev
# Starts Express server with Vite integration
# Hot module replacement for frontend
# Direct database connection
```

### Production Build
```bash
npm run build  # Builds frontend + backend
npm start      # Runs production server
```

### Environment Variables
```bash
DATABASE_URL=postgresql://...     # Required: Database connection
NODE_ENV=production              # Optional: Environment mode
SESSION_SECRET=random_string     # Optional: Session encryption
```

---

## Extension Points

### Adding New Guest Fields
1. Update `guests` table schema in `shared/schema.ts`
2. Run database migration with `npm run db:push`
3. Update guest registration form
4. Update guest details display
5. Modify API validation schemas

### Integrating SMS Services
- Current: Placeholder SMS logging
- To add: Implement actual SMS provider integration
- Location: `server/routes.ts` around payment confirmation

### Adding Reports/Analytics
1. Create new API endpoints in `server/routes.ts`
2. Implement database queries in `server/storage.ts`
3. Create chart components using Recharts
4. Add to analytics tab in dashboard

### Multi-tenant Support
- Modify database schema to include tenant/lodge ID
- Update all queries to filter by tenant
- Add tenant management interface
- Implement tenant-specific authentication

---

This technical reference provides the foundation for understanding and extending the Lodge Management Platform. For specific implementation details, refer to the individual source files and their inline comments.