# Ledger Admin

A Next.js application for managing ledger operations.

## Prerequisites

- [Bun](https://bun.sh/)
- PostgreSQL database
- [Task](https://taskfile.dev/) (optional but recommended)
- Docker & Docker Compose (for local database)

## Getting Started

1. Clone the repository:

```bash
git clone git@github.com:Kaosethi/Ledger-Admin.git
cd Ledger-Admin
```

2. Install dependencies:

```bash
# Using Bun directly
bun install

# Using Task (recommended)
task install
```

3. Set up environment variables:

   - Copy `dot.env.example` to `.env.local`:

   ```bash
   cp dot.env.example .env.local
   ```

   - Update the database connection URL in `.env.local` with your credentials:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/database?sslmode=require"
   ```

4. Start the local PostgreSQL database:

```bash
docker compose up -d
```

5. Run database migrations:

```bash
# Using Bun directly
bun run db:generate  # Generate migration files
bun run db:push      # Apply migrations to the database

# Using Task (recommended)
task db:generate
task db:push
```

6. Run the development server:

```bash
# Using Bun directly
bun run dev

# Using Task (recommended)
task dev
```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Commands

### Using Task (recommended)

```bash
task dev                # Run development server
task install            # Install dependencies
task build              # Build for production
task start              # Start production server
task lint               # Run ESLint
task db:generate        # Generate database migrations
task db:push            # Apply migrations to database
task db:studio          # Open Drizzle Studio for database management
task db:migrate         # Run database migrations
task docker:compose     # Start database using docker-compose
```

### Using Bun directly

```bash
bun run dev             # Run development server
bun run build           # Build for production
bun run start           # Start production server
bun run lint            # Run ESLint
bun run db:generate     # Generate database migrations
bun run db:push         # Apply migrations to database
bun run db:studio       # Open Drizzle Studio
bun run db:migrate      # Run database migrations
```

## Database Information

- PostgreSQL database runs via Docker Compose
- Default connection: `postgresql://username:password@localhost:5432/database`
- Database schema is managed with [Drizzle ORM](https://orm.drizzle.team/)

### Accessing Database UI

Run the following command to open Drizzle Studio (in progress):

```bash
task db:studio
# or
bun run db:studio
```

## Project Structure

- `src/` - Source code directory
  - `app/` - Next.js app directory (routes and API endpoints)
  - `components/` - Reusable React components
  - `lib/` - Utility functions and shared code
    - `db/` - Database schema and client
  - `hooks/` - Custom React hooks

## Troubleshooting

- If you encounter database connection issues, ensure Docker is running and the PostgreSQL container is started
- Check `.env.local` for correct environment variables
- For permission issues with Docker, you may need to run commands with `sudo`

## Turborepo

This project uses [Turborepo](https://turbo.build/) for build system optimization. Turborepo helps optimize the build process by caching outputs and running tasks in parallel.

### Available Commands

#### Default Commands (Using Turborepo)

- `bun dev` - Start the development server with Turborepo
- `bun build` - Build the application with Turborepo
- `bun start` - Start the production server with Turborepo
- `bun lint` - Run linting with Turborepo
- `bun db:generate` - Generate database schema with Turborepo
- `bun db:push` - Push database schema with Turborepo
- `bun db:migrate` - Run database migrations with Turborepo
- `bun db:studio` - Open database studio with Turborepo

#### Direct Commands (Bypassing Turborepo)

- `bun next:dev` - Start the development server directly
- `bun next:build` - Build the application directly
- `bun next:start` - Start the production server directly
- `bun next:lint` - Run linting directly
- `bun drizzle:generate` - Generate database schema directly
- `bun drizzle:push` - Push database schema directly
- `bun drizzle:migrate` - Run database migrations directly
- `bun drizzle:studio` - Open database studio directly

### Turborepo Cache

Turborepo will cache your builds to speed up subsequent builds. To clear the cache:

```bash
bun turbo clean
```
