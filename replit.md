# Lodge Management Platform

## Overview

This is a bilingual (English/Telugu) lodge management platform designed for small lodges in Telangana. The application is built as a full-stack web application with a React frontend and Express backend, using PostgreSQL with Drizzle ORM for data management. The platform focuses on essential features for daily lodge operations including guest registration, room management, billing, and automated SMS notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Migration to Replit Environment (July 31, 2025)**
- Successfully migrated project from Replit Agent to standard Replit environment  
- Fixed TypeScript compilation errors in storage.ts related to schema mismatches
- **Database Integration**: Successfully migrated from in-memory storage to PostgreSQL with Drizzle ORM
- Set up database connection and pushed schema successfully
- **Custom Room Types Feature**: Added customizable room type management system
  - Admins can now create custom room types with ID and display names
  - Dynamic room type selection in onboarding process
  - Proper validation and error handling for room type management
- **Complete Room Management System**: Added comprehensive room management functionality
  - Removed floor option from room schema as requested
  - Added room management modal with three tabs (Add/Manage/Edit)
  - Support for custom room types (Single, Double, Suite, Deluxe, Family, Premium, etc.)
  - Room status management (available, occupied, maintenance)
  - Room deletion for non-occupied rooms
- **Date Validation Enhancement**: Implemented smart date validation for guest registration
  - Check-in/check-out dates only allow today and future dates by default
  - Manual data entry option with warning for past dates
  - Clear user feedback with bilingual warning messages
- **Database Seeding**: Successfully populated database with test data
  - Created 20 random rooms with different types and prices (₹500-₹3500 range)
  - Generated 4 test guests with realistic booking data
  - Added corresponding payment records with mixed cash/QR payment methods
- **Enhanced Guest Management System**: Added comprehensive guest filtering and sorting
  - Date-wise guest sorting (newest/oldest check-in dates)
  - Advanced search filters: text search + date range filtering
  - Enhanced guest registration with check-in time and purpose of visit fields
  - 30 checked-out users seeded with realistic historical data from past 15 days
**Complete Functionality**: All features working properly:
  - Authentication and session management
  - Lodge setup and configuration with custom room types
  - Room management with real-time status updates and comprehensive CRUD operations
  - Guest registration with enhanced date validation and new fields (checkinTime, purposeOfVisit)
  - Payment processing and SMS notifications
  - Dashboard analytics and reporting
- **SMS Messaging Service**: Complete SMS infrastructure implemented
  - SMS service with multiple provider support (Twilio, AWS SNS, Firebase, Mock)
  - Template-based messaging system with bilingual templates
  - Rate limiting and security features
  - Database logging and analytics
  - SMS management interface in dashboard
  - Automatic SMS triggers for guest registration and payment confirmation
  - Developer integration guide (SMS_INTEGRATION_GUIDE.md) with detailed setup instructions
**Management Documentation**: Created comprehensive guides for non-technical users
  - MANAGEMENT_GUIDE.md: Non-coder friendly guide with step-by-step instructions
  - TECHNICAL_REFERENCE.md: Complete technical documentation for developers
  - Detailed file locations, function references, and safe modification guidelines

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Structure**: Organized with reusable UI components in `/components/ui/` and feature-specific components
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Bilingual Support**: Custom `BilingualText` component displaying English text followed by Telugu translations

### Backend Architecture
- **API Structure**: RESTful API with Express.js
- **Authentication**: Simple session-based authentication for single admin user
- **Storage Layer**: Abstract storage interface with in-memory implementation (designed to be easily replaced with database implementation)
- **Route Organization**: Modular route structure in `/server/routes.ts`

### Database Schema
The application uses Drizzle ORM with the following main entities:
- **Users**: Admin authentication
- **Lodge Settings**: Lodge configuration and preferences
- **Rooms**: Room inventory with types, pricing, and status
- **Guests**: Guest information and booking details
- **Payments**: Payment tracking with manual verification
- **SMS Logs**: SMS notification history

## Data Flow

1. **Authentication Flow**: Admin logs in → Check if lodge setup is complete → Redirect to onboarding or dashboard
2. **Guest Registration**: Collect guest details → Check room availability → Calculate costs → Assign room → Create payment record
3. **Payment Processing**: Manual verification of cash/QR payments → Update payment status → Send SMS notification
4. **Room Management**: Real-time room status updates → Visual grid display with filtering options

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Hookform resolvers
- **Date Handling**: date-fns for date operations
- **Icons**: Lucide React for consistent iconography

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL with Drizzle ORM
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for runtime type validation
- **Build Tools**: esbuild for server bundling, tsx for TypeScript execution

## Deployment Strategy

The application is configured for deployment with:

- **Development**: `npm run dev` - Runs server with Vite HMR integration
- **Build**: `npm run build` - Builds frontend assets and bundles server code
- **Production**: `npm start` - Runs bundled server code
- **Database**: `npm run db:push` - Pushes schema changes to database

### Build Configuration
- Frontend builds to `dist/public` using Vite
- Server bundles to `dist/index.js` using esbuild
- Static assets served from built frontend in production
- Development includes Replit integration for cloud development

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- Node.js environment with ES module support
- TypeScript compilation support

The architecture prioritizes simplicity and maintainability while providing a solid foundation for a small lodge management system with bilingual support and essential booking/payment features.