# Ledger Admin

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

- Node.js (v18 or later)
- npm, yarn, pnpm, or bun
- PostgreSQL database
- [Task](https://taskfile.dev/) (optional but recommended)

## Getting Started

1. Clone the repository:

```bash
git clone [repository-url]
cd Ledger-Admin
```

2. Install dependencies:

```bash
# Using npm
npm install

# Using Task (recommended)
task install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the database connection URL in `.env` with your credentials:

   ```
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

4. Run database migrations:

```bash
# Using npm
npm run db:generate  # Generate migration files
npm run db:push      # Apply migrations to the database

# Using Task (recommended)
task db:generate
task db:push
```

5. Run the development server:

```bash
# Using npm
npm run dev

# Using Task (recommended)
task dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

This project uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL for database management.

### Schema

The database schema is defined in `src/lib/db/schema.ts`:

- **Users**: Stores user information with roles and authentication details
- **Transactions**: Records transactions linked to users

### Working with Migrations

#### Creating a New Migration

When you make changes to your database schema in `src/lib/db/schema.ts`:

1. Generate migration files:

   ```bash
   task db:generate
   ```

   This creates SQL migration files in `src/lib/db/migrations/`.

2. Review the generated SQL files in the migrations directory.

3. Apply the migrations to your database:
   ```bash
   task db:push
   ```

#### Adding a New Table or Column

1. Edit `src/lib/db/schema.ts` to add your new table or column:

   ```typescript
   // Example: Adding a new table
   export const products = pgTable("products", {
     id: serial("id").primaryKey(),
     name: varchar("name", { length: 255 }).notNull(),
     price: decimal("price", { precision: 10, scale: 2 }).notNull(),
     description: text("description"),
     createdAt: timestamp("created_at").defaultNow().notNull(),
   });

   // Example: Adding relations for the new table
   export const productsRelations = relations(products, ({ many }) => ({
     // Define relationships here
   }));
   ```

2. Generate and apply migrations as described above.

#### Viewing Database Content

You can use Drizzle Studio to view and manage your database content:

```bash
task db:studio
```

This opens a web interface where you can browse tables, run queries, and modify data.

### Database Commands

- `task db:generate` - Generate SQL migration files from schema changes
- `task db:push` - Apply migrations to the database
- `task db:studio` - Open Drizzle Studio to manage database content visually

### API Routes

The following API endpoints are available:

- **GET /api/users** - Fetch all users
- **POST /api/users** - Create a new user
- **GET /api/transactions** - Fetch all transactions
- **POST /api/transactions** - Create a new transaction

## Development Tasks

This project uses [Task](https://taskfile.dev/) for common development tasks. Here are the available commands:

- `task dev` - Run the development server
- `task install` - Install project dependencies
- `task build` - Build the application for production
- `task start` - Start the production server
- `task lint` - Run ESLint to check code quality
- `task format` - Format code using Prettier
- `task clean` - Clean build artifacts and dependencies

To see all available tasks:

```bash
task --list
```

## Project Structure

- `src/` - Source code directory
  - `app/` - Next.js app directory
  - `components/` - Reusable React components
  - `lib/` - Utility functions and shared code
    - `db/` - Database schema and client
    - `config.ts` - Environment configuration
  - `types/` - TypeScript type definitions

## Development

- The project uses TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code linting
- Prettier for code formatting

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Deployment

For production deployment, ensure all environment variables are properly configured in your deployment platform.
