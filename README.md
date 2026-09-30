# Office Stock

Shared inventory for office kitchen, cleaning, medical, and other supplies. The app includes 38 starter items, stock receive and issue records, item editing, search, activity history, and low stock alerts.

## Vercel setup

This is a Next.js app backed by Neon Postgres. Import this repository into Vercel, add a Neon database through Vercel Storage, and configure these server-side environment variables:

- `DATABASE_URL`: Neon connection string, supplied by the Vercel integration.
- `OFFICE_STOCK_PASSWORD`: strong password shared with authorized office staff.

The database tables and starter items are created automatically on the first inventory request. All starter counts begin at zero. Stock changes are shared across signed-in browsers and each issue or receipt records a person and time.

To run locally, use Node.js 22.13 or newer and pnpm 11.25.0:

```sh
pnpm install
pnpm dev
```

Create `.env.local` with both variables before opening the local app. Do not commit `.env.local`.
