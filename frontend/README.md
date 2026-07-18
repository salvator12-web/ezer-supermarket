# EZER Supermarket — Frontend (Phase 2: public pages)

React 18 + Vite app covering the three public routes from the plan, running
entirely on **mock data** — no backend calls yet (that starts in Phase 5).

## What's here

- `/` — Home: hero, stats bar, "How it works", 8 featured products, footer
- `/shop` — Shop: search, category tabs (11 categories), product grid, cart
  drawer, checkout form (mock delivery-fee quote), MTN MoMo / Cash payment
  (simulated), order confirmation (`EZ-XXXX`)
- `/track` — Track order: enter an Order ID, live-style progress bar
  (Pending → Accepted → Picked Up → On the Way → Delivered)
- EN / FR language toggle, persisted to `localStorage` under `gigo_lang`
- Cart state via Context API (`CartContext`), language via `LanguageContext`
- Design tokens (colors, radius, font stack) copied verbatim from the brief,
  light + auto-dark via `prefers-color-scheme`
- Tabler Icons loaded from the CDN webfont, no Tailwind

## What's mocked (by design — this is Phase 2)

- **Products** (`src/data/products.js`) — static catalog, will become
  `GET /api/products` against the Phase 1 backend
- **Delivery fee** (`src/utils/delivery.js`) — deterministic pseudo-distance
  from the address text, same formula/clamp as the real spec
  (`Math.ceil(distanceKm / 10) * 1000`, clamped 1,000–10,000 FRw). Becomes a
  real Google Maps Distance Matrix call in Phase 5.
- **Payment** — MTN MoMo shows a simulated "USSD push" delay, then
  auto-confirms; Cash confirms immediately. Becomes the real MTN MoMo
  Request-to-Pay flow in Phase 5.
- **Orders** (`src/utils/orders.js`) — placed orders are kept in
  `localStorage` for this browser only, plus 3 seeded demo orders
  (`EZ-1000`, `EZ-1001`, `EZ-1002`) so `/track` has something to show on a
  fresh browser. Becomes MongoDB + Firestore real-time in Phases 3 & 5.

## Setup

```bash
cd frontend
npm install
npm run dev
```

## Not in this phase

Staff login, admin dashboard, and rider app are Phase 3–4 — the "Staff
Login" button in the navbar is present but inert (see
`EZER-SUPERMARKET-PLAN.md` for the full roadmap).
