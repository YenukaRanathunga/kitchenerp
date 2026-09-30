# Office Stock

Web inventory for office kitchen, cleaning, medical, and other supplies.

The app starts with 38 item names and zero stock for each. Staff can add and edit items, receive stock, issue stock, search and filter items, and review the latest 50 stock movements. Each movement stores a person and timestamp. Items at their reorder threshold show a warning; zero stock shows an out-of-stock status.

## Local setup

Requires Node.js 22.13 or newer and pnpm 11.25.0.

```sh
pnpm install
node node_modules/drizzle-kit/bin.cjs generate
node scripts/run-framework.mjs build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sleepy_trauma.sql
node scripts/run-framework.mjs dev
```

The app uses Cloudflare D1 for shared, persistent inventory data. The `drizzle/` migration creates the tables; the first inventory request inserts the starter item list. The Site binding is declared in `.openai/hosting.json`.

The current private deployment is [Office Stock](https://office-inventory-2026.yenukaadarsha.chatgpt.site/). Access is granted through Site sharing, not through this repository.
