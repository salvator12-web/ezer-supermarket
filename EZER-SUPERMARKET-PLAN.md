# EZER Supermarket × GIGO Business Company — Build Plan

> Anchor doc for this project. Keep this file in the repo root and update the
> checkboxes as phases complete. If a new chat session picks this project back
> up, read this file first — it captures the full spec, the merge notes from
> the two source repos, and exactly where we left off.

## Status

- [x] Phase 1 — Backend scaffold (models, routes, config, env template)
- [x] Phase 2 — Public customer pages (Home / Shop / Track) on mock data
- [ ] Phase 3 — Auth + Admin dashboard (split — see below)
  - [x] Phase 3A — Firebase staff login, protected routing, dashboard shell, Overview, Products CRUD
  - [x] Phase 3B — Inventory (stock in/out, low-stock alerts) + Orders (filter tabs, assign rider, GIGO sync status)
- [x] Phase 4 — Rider app (Available / Active / History)
- [ ] Phase 5 — Real integrations (split — see below)
  - [x] Phase 5A — Wire storefront to the live backend (real products, real delivery quote, real order
    creation, real MTN MoMo request-to-pay trigger, live order tracking)
  - [ ] Phase 5B — Firestore real-time + FCM push (split — see below)
    - [x] Firestore real-time sync: Track page + rider Active page now get live status pushes instead
      of polling
    - [x] FCM push registration: service worker, permission request, foreground notifications for riders
- [ ] Phase 6 — EN/FR i18n pass over admin dashboard + rider app (public pages already covered, see
  Phase 2 note below) — deprioritized for now, internal staff/rider tool, English-only is fine until
  there's a concrete need

**Current phase: Phase 5 is fully done. FCM push registration (second half of Phase 5B) is now wired
up end-to-end: service worker, permission request + token registration on rider login, and a foreground
toast for in-app notifications. Only remaining items before a real customer-facing launch are the
manual Firebase console step below and production env values — see "Next step".**

Note: Phase 2 already includes an EN/FR toggle end-to-end on all three public
pages (translations.js, LanguageContext), ahead of the Phase 6 checklist item.

### Phase 5A notes
- Backend integrations were mostly already real from earlier phases and just needed a frontend to call
  them: `delivery.controller.js` already calls the Google Maps Distance Matrix API,
  `payment.controller.js` already calls MTN MoMo's Collections API (`requesttopay`), and
  `notification.controller.js` already sends real FCM pushes via the Firebase Admin SDK. No backend
  changes were needed for 5A.
- `Shop.jsx` / `FeaturedProducts.jsx` / `StatsBar.jsx` now fetch from `GET /api/products`,
  `GET /api/products/featured`, and count real products instead of importing `data/products.js`'s old
  mock catalog (that file now only keeps the static category list + the `getStockStatus` helper).
- New `utils/mapProduct.js` normalizes a Mongo product doc (`_id`, `minStockLevel`) to the flat shape
  the cart/shop components expect (`id`, `minStock`) — no changes needed to `CartContext`, `ProductCard`,
  `QtyStepper`, or `StockBadge`.
- `CheckoutForm.jsx` calls `POST /api/delivery/quote` (debounced 500ms as the address is typed) instead
  of the old deterministic hash-based estimate, then `POST /api/orders` to actually create the order,
  then `POST /api/payment/momo/request` to fire the real USSD push when paying by MoMo. If the MoMo
  request fails the order still completes — the customer can still track it and staff can retry payment.
- New `utils/status.js` maps the backend's snake_case order status enum (`picked_up`, `on_the_way`) to
  the camelCase steps `ProgressTracker` and `translations.js` already used, so neither had to change.
- Removed `utils/orders.js` and `utils/delivery.js` (Phase 2's localStorage/mock-estimate layer) since
  nothing depends on mock data anymore.

### Firestore real-time notes (Phase 5B, part 1)
- `backend/config/firebase.js` now also exports a `firestore()` accessor alongside the existing
  Auth/Messaging ones — same Admin SDK credentials, no new env vars needed.
- New `backend/utils/firestoreSync.js` mirrors only `status`, `riderName`, and `paymentStatus` into
  `orders/{orderId}` in Firestore whenever `order.controller.js` creates, updates the status of, or
  assigns a rider to an order. Deliberately lean — customer contact info and item details never leave
  MongoDB, so an anonymous-read Firestore security rule on this collection stays low-risk. It's called
  fire-and-forget (`.catch(() => {})`) and logs internally, so a Firestore hiccup never fails the
  underlying Mongo write.
- `Track.jsx` still does one `GET /api/orders/:orderId` for full order details (items, customer,
  payment), then subscribes to the Firestore doc for live `status`/`riderName` updates — shows a small
  "Live" badge once the listener connects. No more 8s polling.
- Rider `Active.jsx` layers the same Firestore subscription on top of its own PATCH-driven status
  updates, mainly to catch an admin cancelling the order out from under the rider.
- **Required Firestore security rule** (not something this code can set — needs to be added in the
  Firebase console): allow anonymous `get` (not `list`) on `orders/{orderId}` documents, since customers
  tracking an order aren't authenticated. Something like:
  ```
  match /orders/{orderId} {
    allow get: if true;
    allow write: if false; // only the backend Admin SDK writes here
  }
  ```

### FCM push notes (Phase 5B, part 2 — done)
- `frontend/public/firebase-messaging-sw.js` handles background/closed-app push. Firebase config is
  passed as URL query params on `serviceWorker.register(...)` rather than hardcoded in the file, since
  static files in `public/` never go through Vite's `import.meta.env` substitution.
- New `frontend/src/utils/push.js`: `registerRiderPush()` registers the service worker, requests
  notification permission, gets an FCM token via `getToken()`, and PUTs it to
  `/api/auth/fcm-token` (backend endpoint already existed from Phase 4/5A). Fails silently (never
  throws) if push isn't supported, permission is denied, or the VAPID key isn't set — a push failure
  should never block rider login.
- `onForegroundPush()` wraps `onMessage()` for pushes that arrive while the rider app is open; the
  service worker's `onBackgroundMessage` only fires when the app is backgrounded/closed, so the two
  are mutually exclusive by design (no double notifications).
- `RiderLayout.jsx` calls `registerRiderPush()` once `profile` loads and shows a small dismissing toast
  (`rider-push-toast`) on foreground pushes; clicking a background OS notification opens `/rider`
  (`notificationclick` handler in the service worker).
- `frontend/src/config/firebase.js` now also exports the initialized `app` instance (needed by
  `getMessaging(app)` in `push.js`).
- New env var: `VITE_FIREBASE_VAPID_KEY` (Firebase console → Project settings → Cloud Messaging → Web
  Push certificates) — required for push to work; without it, `registerRiderPush()` logs a warning and
  no-ops.


### Phase 3A notes
- Frontend needs a `firebase` client SDK dependency (added to `frontend/package.json`) purely for staff
  email/password sign-in — customers never touch Firebase directly.
- New frontend env vars in `frontend/.env.example`: `VITE_API_URL`, `VITE_FIREBASE_API_KEY`,
  `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
- `src/utils/api.js` is the single fetch wrapper for all backend calls — attaches the Firebase ID token
  automatically when a staff user is signed in.
- `src/context/AuthContext.jsx` calls `GET /api/auth/me` after Firebase sign-in to get `role` from Mongo.
- `ProtectedRoute` gates `/dashboard/*` to `role === "admin"`; the same pattern gates `/rider/*` in Phase 4.
- No backend changes were needed — Phase 1's `product`, `stats`, and `auth` routes already covered this.

### Phase 3B notes
- One backend addition: `GET /api/auth/staff?role=` (admin-only, in `auth.controller.js`/`auth.routes.js`)
  so the Orders page can populate the "assign rider" dropdown with active riders. Everything else used
  Phase 1's existing `inventory` and `order` routes as-is.
- Inventory page calls `POST /inventory/stock-in` / `stock-out` per product, with an optional reason
  logged to the `Inventory` movement collection; summary counts and the low/critical/out filter come
  straight from `GET /inventory`.
- Orders page: status filter tabs re-query `GET /orders?status=`, status changes go through
  `PATCH /orders/:id/status`, rider assignment through `PATCH /orders/:id/assign`.
- **GIGO sync status** — the `Order` model has no dedicated sync field yet (that arrives with the real
  Firestore/GIGO push in Phase 5), so the "Synced / Pending" badge on the Orders page is derived from
  whether a rider is assigned. Swap this for a real field once Phase 5 wires the actual GIGO Delivery
  backend push.

### Phase 4 notes
- No backend changes needed — used Phase 1's existing `GET /orders/rider/available|active|history` and
  `PATCH /orders/:id/assign` (self-assign: omit `riderId` and the backend uses `req.user.id`) /
  `PATCH /orders/:id/status` routes as-is.
- `ProtectedRoute role="rider"` gates `/rider/*`; `AuthContext`/Firebase login is shared with admin —
  the same `/login` page routes riders to `/rider` and admins to `/dashboard` based on the `role` field
  from `GET /api/auth/me`.
- Layout is a top tab bar (not a sidebar) since riders are expected to be on mobile in the field.
- Active tab auto-advances the status machine one step at a time (accepted → picked_up → on_the_way →
  delivered) and clears back to the empty state once delivered, matching the backend's
  `Rider.activeOrder` reset in `order.controller.js`.
- FCM push registration (`PUT /api/auth/fcm-token`) exists on the backend already but isn't wired into
  the rider frontend yet — that's Phase 5 (real FCM push) territory, not core rider-app UX.
Phase 6's remaining scope is just the admin/rider pages once those exist.

---

## Source repos (merge base)

| Repo | What it has | Notes |
|---|---|---|
| `QUIRKE12/gigo-delivery` | Express + Mongoose backend (`DeliveryOrder`, `User` models; `auth/orders/riders/users` routes), Vite React frontend | Reasonably clean, closest to the new file-size rules already |
| `QUIRKE12/GIGO-BUSINESS-COMPANY` | Monolithic `backend/index.js` (Product/User/Order schemas + Firebase Admin auth all in one file — over the new 300-line rule), Tailwind + Firebase React frontend (`dashboard/shop/routers`) | Needs to be split into `config/middleware/models/routes/controllers` per the code rules below |

Plan: keep `gigo-delivery`'s file layout as the skeleton, port over GIGO-BUSINESS-COMPANY's Product/Inventory logic and Firebase Admin wiring, split everything to satisfy the 300-line rule.

---

## Business context

- Name: **EZER Supermarket × GIGO Business Company**
- Location: Murambi Cell, Gatenga Sector, Kicukiro District, Kigali, Rwanda
- Landmark: Near Nyanza car parking, Kicukiro
- Currency: FRw (Francs Rwandais)
- Delivery: Kigali and surroundings only

## Product categories (11)

Fresh Produce · Bakery · Dairy & Eggs · Beverages · Meat & Fish · Grains & Staples ·
Snacks & Confectionery · Condiments & Sauces · Personal Care · Household & Cleaning · Health & Baby

## Design system

Same tokens as the SwiftDrop / EZER prototype already built (light + auto-dark CSS
variables, Tabler icons, system font stack, 8–12px radius, 0.5px flat borders, no
heavy shadows). Full variable list is in the existing `ezer-supermarket.html`
prototype — reuse those exact values when building the real app's `index.css`.

## Routes / pages

- `/` — Home (public): navbar w/ EN/FR + cart badge + Staff Login, hero, stats bar,
  "How it works" (4 steps), 8 featured products, footer
- `/shop` — Shop (public): search, category tabs, product grid, cart drawer,
  checkout form (Google Maps delivery fee), MTN MoMo or Cash payment, order confirmation (`EZ-XXXX`)
- `/track` — Track order (public): enter order ID, live Firestore status, progress bar
- `/login` — Staff only, Firebase Auth, redirects admin → `/dashboard`, rider → `/rider`
- `/dashboard/*` — Admin only: Overview (KPIs, recent orders, best sellers, revenue chart),
  Products (table + modal CRUD), Inventory (stock in/out, alerts), Orders (filter tabs, GIGO sync status)
- `/rider/*` — Rider only: Available orders, Active delivery, History

## Roles & access

- Customer: no login, `/`, `/shop`, `/track`
- Rider: Firebase Auth, `role: rider`, redirect to `/login` if unauthenticated
- Admin: Firebase Auth, `role: admin`, redirect to `/login` if not admin

## Order flow

Browse → cart → name/phone/address → Google Maps distance fee → MTN MoMo or Cash →
save to MongoDB (`GigoInventory` DB) → sync to Firestore → push to GIGO Delivery
backend → FCM notifies free riders → rider accepts → picked up → on the way →
delivered → customer sees live status on `/track`.

## Payment — MTN MoMo

- Sandbox: `https://sandbox.momodeveloper.mtn.com`, Production: `https://momodeveloper.mtn.com`
- Env: `MOMO_SUBSCRIPTION_KEY`, `MOMO_API_USER`, `MOMO_API_KEY`, `MOMO_ENVIRONMENT`
- Flow: Request to Pay → USSD push → customer PIN → MTN callback → update order → Firestore update
- Cash on Delivery: `paymentMethod: "cash"`, rider collects, admin marks paid

## Delivery fee — Google Maps Distance Matrix

- Origin fixed: Murambi, Gatenga, Kicukiro, Kigali, Rwanda
- `fee = Math.ceil(distanceKm / 10) * 1000`, clamped between 1,000 and 10,000 FRw
- Env: `GOOGLE_MAPS_API_KEY`

## Firebase

- Auth: email/password for staff only, role stored in Firestore `users` collection
- Firestore: `orders/{orderId}`, `riders/{riderId}`, `notifications/{id}`
- FCM: service worker `firebase-messaging-sw.js`, notify riders with no active delivery
- Storage: `products/{productId}/image`

## Tech stack

- Frontend: React 18 + Vite, React Router v6, CSS variables (no Tailwind on the
  new build — GIGO-BUSINESS-COMPANY's Tailwind config will be dropped in favor
  of the CSS-variable system already used in the SwiftDrop/EZER prototype),
  Tabler Icons webfont, Context API (Auth / Language / Cart), Firebase SDK
- Backend: Node/Express, MongoDB Atlas (`GigoInventory` DB), Firebase Admin SDK,
  **max 300 lines per file**, structure:

```
backend/
├── index.js
├── .env
├── config/{db.js, firebase.js}
├── middleware/{auth.js, errorHandler.js}
├── models/{User.js, Product.js, Order.js, Inventory.js, Rider.js}
├── routes/{auth,product,order,inventory,delivery,payment,stats,notification}.routes.js
└── controllers/{auth,product,order,inventory,delivery,payment,stats,notification}.controller.js
```

## Environment variables (template — fill in real values in `.env`, never commit it)

```
MONGODB_URI=
JWT_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
MOMO_SUBSCRIPTION_KEY=
MOMO_API_USER=
MOMO_API_KEY=
MOMO_ENVIRONMENT=sandbox
GOOGLE_MAPS_API_KEY=
FCM_SERVER_KEY=
PORT=5000
```

## Code rules

- Max 300 lines per file (strict)
- No hardcoded credentials — everything via env vars
- All UI strings via `t('key')`, `translations.js` (en/fr), toggle persisted in
  `localStorage` under `gigo_lang`
- Error handling + loading states + empty states on every async view
- Mobile-first, min 320px width
- Order ID format `EZ-XXXX`
- Stock status: In Stock `stock > minStock*2` · Low `stock <= minStock*2` ·
  Critical `stock <= minStock` · Out `stock === 0`
- One component per file

---

## Next step

Pick a phase (see checklist at top) and I'll build it against this plan. Phase 1
(backend scaffold) is the recommended starting point since every other phase
depends on the models and routes it defines.
