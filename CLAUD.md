# Ledger-Admin Project Overview

## Project Description

Ledger-Admin is a Next.js web application designed to serve as an administrative interface for a ledger system. Based on the codebase analysis, it appears to be an aid distribution platform where administrators can manage accounts, merchants, and transactions.

## Tech Stack

- **Frontend Framework**: Next.js 15.3.0 with App Router
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS
- **Component Libraries**:
  - Radix UI for primitive components
  - Lucide React for icons
- **Charts/Visualizations**: Recharts
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Better Auth with JWT (jose library)
- **Form Validation**: Zod
- **QR Code Generation**: qrcode and qrcode.react
- **Data Export**: PapaParse for CSV handling
- **TypeScript**: For type safety

## Application Architecture

### Frontend Structure

- Uses Next.js App Router architecture
- Client-side authentication flow with stateful login/logout
- Tab-based interface for different admin functions
- Modal components for dialogs and confirmations
- Print components for document generation

### Authentication System

- Separate dedicated `/login` page for authentication
- Integration with Better Auth for secure credential management
- JSON Web Tokens (JWT) using jose for token handling
- HTTP-only cookies for secure token storage
- Middleware-based route protection
- Automatic redirection to login for unauthenticated requests
- Session status checks via API endpoint

### Data Model

The application uses a PostgreSQL database with Drizzle ORM, featuring a robust schema with:

1. **Administrators** - Users with access to the admin dashboard

   - UUID-based primary keys
   - Profile information (first/last name, email)
   - Role-based access control
   - Password security with hashing
   - Activity and login tracking
   - Soft delete capability

2. **Accounts** - Beneficiary accounts with balance information

   - Unique display IDs for public reference
   - Child and guardian information
   - Balance management with precision numeric type
   - PIN-based authentication
   - Status control (Active/Inactive/Suspended)
   - QR code token generation
   - Contact details and notes
   - Performance indexes on frequently queried fields
   - Soft delete capability

3. **Merchants** - Vendors/shops that can receive transactions

   - Business profile with contact details
   - Status workflow (pending_approval/active/rejected/suspended)
   - Category classification
   - Web presence tracking (website, logo)
   - Optimized indexes for quick lookups
   - Soft delete capability

4. **Transactions** - Financial transactions between accounts and merchants

   - Comprehensive transaction details
   - Multiple transaction types (Debit/Credit/Adjustment)
   - Status tracking (Completed/Pending/Failed/Declined)
   - Reference codes and metadata support
   - Extensive indexing for reporting performance

5. **Admin Logs** - Audit trail of administrator activities

   - Detailed tracking of all administrative actions
   - IP address and user agent recording
   - Categorized by action types
   - Target entity references
   - Optimized for security audits

6. **Account Permissions** - Granular access control system
   - Many-to-many relationship between administrators and accounts
   - Permission-based authorization model
   - Audit timestamps for permission grants

### Database Features

- **UUID Primary Keys** - All tables use UUID for security and distribution
- **Consistent Timestamps** - Creation and update tracking across all entities
- **Soft Delete Pattern** - Non-destructive record removal
- **Optimized Indexes** - Performance tuning for common queries
- **Field Validation** - Zod schema validation with detailed error messages
- **Referential Integrity** - Enforced foreign key constraints with appropriate cascade/restrict policies
- **Type Safety** - Comprehensive TypeScript integration with Drizzle ORM

### Key Features

#### Authentication System

- Email/password authentication for administrators
- Session management with periodic status checks
- Activity logging for security audit

#### Account Management

- Account creation and modification
- Balance management
- Status control (Active/Inactive/Suspended)
- QR code generation for account identification

#### Merchant Management

- Merchant registration and approval workflow
- Status management (pending_approval/active/rejected/suspended)
- Business information tracking

#### Transaction Processing

- Transaction history and reporting
- Multiple transaction types (Debit/Credit/Adjustment)
- Status tracking (Completed/Pending/Failed/Declined)

#### Dashboard and Analytics

- Data visualization using Recharts
- Summary statistics and metrics
- Activity monitoring

#### Reporting

- Data export capabilities
- Print functionality for reports and documents

## Frontend Components

The UI is organized around several main component types:

1. **Page Components** - Top-level components for routing
2. **Tab Components** - Content sections within the dashboard
3. **UI Components** - Reusable UI elements
4. **Modal Components** - Dialogs for actions and confirmations
5. **Print Components** - Templates for printed output

## API Structure

The backend API follows RESTful conventions with endpoints organized by resource:

- `/api/auth/*` - Authentication endpoints
  - `/api/auth/login` - User login with JWT token generation
  - `/api/auth/logout` - Session termination
  - `/api/auth/check` - Session validation
- `/api/administrators/*` - Administrator management
- `/api/accounts/*` - Account management
- `/api/merchants/*` - Merchant management
- `/api/transactions/*` - Transaction processing

## Development Infrastructure

- Docker containerization
- Kubernetes deployment configuration
- Drizzle migrations for database schema management

## Project Status

The project appears to be in active development, with comprehensive components and infrastructure already in place. The codebase shows attention to security concerns, data validation, and user experience.
