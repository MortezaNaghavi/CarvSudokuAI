# Carv Sudoku AI

Carv Sudoku AI is a web-based Sudoku arcade that combines classic puzzle gameplay with AI-powered hints, daily challenges, leaderboards, and Solana wallet integration. The project is split into a React client and an Express/Node backend, sharing types and game logic through a common `shared` package.

## Features

- AI-assisted Sudoku solver with contextual hints per cell
- Multiple difficulty levels and a Daily Challenge mode
- Game stats: time, hints used, completion tracking, streaks
- Global leaderboard with wallet-based identity
- Solana wallet integration (Phantom, Backpack, Solflare, Coinbase, etc.)
- Optional NFT minting for completed challenges/runs
- Dark/light theme, sound effects, and confetti animations

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI, Wouter
- **Backend:** Node.js, Express, WebSocket (`ws`)
- **Shared:** Type-safe schemas via `zod` and `drizzle-orm`
- **Database:** PostgreSQL + Drizzle
- **Blockchain:** `@solana/web3.js`, Solana Wallet Adapter
- **State & Data:** React Query (`@tanstack/react-query`)

## Getting Started

### Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+ (comes with recent Node versions)
- A PostgreSQL database (local or hosted)
- A Solana RPC endpoint (e.g., devnet or mainnet, depending on your setup)

### 1. Install dependencies

From the project root:

```bash
npm install
```

This installs dependencies for the server, client, and shared code.

### 2. Configure environment variables

Create a `.env` file in the project root (or export environment variables in your shell). Depending on your setup, you’ll typically need values like:

```bash
# server
PORT=5000
NODE_ENV=development

# database
DATABASE_URL=postgres://user:password@host:5432/db_name

# optional: any Solana / RPC / app-specific settings you use
# SOLANA_RPC_URL=...
# CARV_PROGRAM_ID=...
```

Check `drizzle.config.ts`, `server` routes, and any config files to align env variables with your environment.

### 3. Apply database schema (Drizzle)

If you are starting from an empty database, push the current schema:

```bash
npm run db:push
```

This uses `drizzle-kit` to sync the schema to your database.

## Running the App

### Development mode

In development, the Express server is started with Vite dev middleware for the client:

```bash
npm run dev
```

By default, the server listens on `PORT` (falls back to `5000`):

- API and app: `http://localhost:5000`

The dev server auto-reloads on code changes.

### Production build

To build both the client (Vite) and server bundle:

```bash
npm run build
```

This will:

- Build the React client into `dist/` (static assets)
- Bundle the Express server into `dist/index.js`

Then start the production server:

```bash
PORT=5000 NODE_ENV=production npm start
```

Again, the app will be available at:

- `http://localhost:5000`

## Project Structure

- `client/` – React + Vite front-end (UI, game screen, wallet integration)
- `server/` – Express API, WebSocket handling, session & leaderboard logic
- `shared/` – Shared TypeScript types, schemas, and Sudoku-related data models
- `dist/` – Built assets for production (`npm run build` output)

## Deployment

For a typical Linux server:

1. Clone the repository and `cd` into it.
2. Install Node and npm, then run `npm install`.
3. Set environment variables or `.env` (including `DATABASE_URL` and `PORT`).
4. Run `npm run db:push` to migrate the database.
5. Build and start the app:

   ```bash
   npm run build
   PORT=5000 NODE_ENV=production npm start
   ```

6. Optionally, use a process manager like `pm2` and a reverse proxy (Nginx) for HTTPS and domain routing.

## License

MIT

