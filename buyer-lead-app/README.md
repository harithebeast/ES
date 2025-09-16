# Buyer Lead Intake App

A Next.js application for capturing, managing, and processing buyer leads with comprehensive validation, search/filtering, and CSV import/export functionality.

## Features

### Core Functionality
- **Lead Management**: Create, view, edit, and delete buyer leads
- **Search & Filtering**: Real-time search by name, phone, email with URL-synced filters
- **Pagination**: Server-side pagination with 10 leads per page
- **CSV Import/Export**: Bulk import with validation and error reporting, filtered export
- **Lead History**: Track all changes with user attribution and timestamps
- **Ownership Control**: Users can only edit their own leads

### Data Model
- **Buyers**: Complete lead information with validation
- **Buyer History**: Audit trail for all changes
- **Enums**: Strict validation for cities, property types, BHK, purpose, timeline, source, status

### Technical Features
- **Server-Side Rendering**: All pages use SSR for better performance
- **Type Safety**: Full TypeScript with Zod validation
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Comprehensive error boundaries and validation
- **Accessibility**: Basic a11y improvements with proper labels and focus management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Authentication**: Demo cookie-based auth

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd buyer-lead-app
   npm install
   ```

2. **Environment setup**:
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgres://username:password@localhost:5432/buyer_leads"
   ```

3. **Database setup**:
   ```bash
   # Generate migrations
   npm run db:generate
   
   # Run migrations (requires DATABASE_URL)
   npm run db:migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Visit `http://localhost:3000`
   - Click "Continue as Demo User" to login
   - Navigate to `/buyers` to see the lead management interface

## Supabase Setup

If you use Supabase (recommended for quick setup):

1. Create a new Supabase project.
2. In Supabase Dashboard, go to Project Settings → Database → Connection string.
3. Copy the URI and set it as `SUPABASE_DB_URL` in your `.env.local`.
4. Supabase requires SSL; the app auto-enables it when the URL contains `supabase.co`.

Example `.env.local` for Supabase:
```env
SUPABASE_DB_URL="postgres://postgres:<password>@<host>.supabase.co:5432/postgres"
# Optional: force SSL on other hosts
SUPABASE_DB_SSL=true
```

For migrations, the tooling prefers `SUPABASE_DB_URL` and falls back to `DATABASE_URL`.

## Usage

### Creating Leads
1. Go to `/buyers/new`
2. Fill in the required fields (name, phone, city, property type, etc.)
3. BHK is required only for Apartment/Villa property types
4. Budget validation ensures max ≥ min when both are provided

### Managing Leads
1. View all leads at `/buyers`
2. Use filters to narrow down results by city, property type, status, timeline
3. Search by name, phone, or email
4. Click "View/Edit" to modify individual leads

### CSV Operations
1. **Export**: Click "Export CSV" to download current filtered results
2. **Import**: Go to `/buyers/import` to upload CSV files
   - Max 200 rows, 1MB file size
   - Detailed validation with row-by-row error reporting
   - Only valid rows are imported

### Lead History
- All changes are tracked in the buyer_history table
- View recent changes on the lead detail page
- Includes field-level diffs and timestamps

## API Endpoints

- `GET /buyers` - List leads with filtering and pagination
- `GET /buyers/new` - Create new lead form
- `GET /buyers/[id]` - View/edit specific lead
- `GET /buyers/import` - CSV import page
- `POST /api/export-csv` - Export filtered leads as CSV
- `POST /api/import-csv` - Import leads from CSV

## Database Schema

### buyers table
- `id` (uuid, primary key)
- `fullName` (string, 2-80 chars)
- `email` (string, optional, validated)
- `phone` (string, 10-15 digits, required)
- `city` (enum: Chandigarh|Mohali|Zirakpur|Panchkula|Other)
- `propertyType` (enum: Apartment|Villa|Plot|Office|Retail)
- `bhk` (enum: 1|2|3|4|Studio, optional for non-residential)
- `purpose` (enum: Buy|Rent)
- `budgetMin` (integer, optional)
- `budgetMax` (integer, optional, must be ≥ budgetMin)
- `timeline` (enum: 0-3m|3-6m|>6m|Exploring)
- `source` (enum: Website|Referral|Walk-in|Call|Other)
- `status` (enum: New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped)
- `notes` (text, optional, max 1000 chars)
- `tags` (string array, optional)
- `ownerId` (string, user identifier)
- `updatedAt` (timestamp)

### buyer_history table
- `id` (uuid, primary key)
- `buyerId` (uuid, foreign key)
- `changedBy` (string, user identifier)
- `changedAt` (timestamp)
- `diff` (jsonb, field changes)

## Design Decisions

### Validation Strategy
- **Client-side**: Basic HTML5 validation for immediate feedback
- **Server-side**: Comprehensive Zod validation for security
- **CSV Import**: Row-by-row validation with detailed error reporting

### SSR vs Client-Side
- **SSR**: All main pages use server-side rendering for better SEO and performance
- **Client-side**: Interactive elements like search debouncing and form validation

### Ownership Enforcement
- **Database Level**: `ownerId` field tracks lead ownership
- **Application Level**: Server actions check ownership before allowing edits
- **UI Level**: Visual indicators show ownership status

### Rate Limiting
- **In-memory**: Simple rate limiting for demo purposes
- **Production**: Should use Redis or dedicated rate limiting service
- **Limits**: 5 creates/minute, 10 updates/minute, 3 imports/minute

## What's Implemented vs Skipped

### ✅ Implemented
- Complete CRUD operations with validation
- SSR with real pagination and filtering
- CSV import/export with error handling
- Ownership checks and rate limiting
- Unit tests for validation logic
- Error boundaries and basic accessibility
- Lead history tracking

### ⚠️ Trade-offs Made
- **Demo Auth**: Used cookie-based auth instead of proper OAuth for simplicity
- **In-memory Rate Limiting**: Not suitable for production scaling
- **Basic UI**: Focused on functionality over advanced styling
- **Simple Error Handling**: Basic error boundaries without advanced error reporting

### 🚫 Not Implemented
- Real authentication system (OAuth, magic links)
- Advanced search (full-text search on notes)
- File uploads for attachments
- Real-time notifications
- Advanced analytics/reporting
- Mobile-responsive optimizations

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- Budget validation logic
- BHK requirement validation
- Enum value validation

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set `DATABASE_URL` environment variable
3. Run database migrations
4. Deploy

### Other Platforms
- Ensure PostgreSQL database is available
- Set environment variables
- Run `npm run build` and `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details