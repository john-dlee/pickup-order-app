# Roadmap

## v1 — Shipped

- Menu with categories, modifiers (e.g. ramen base), sold-out state, and cart limits
- Cart → checkout → Stripe Checkout (AUD) → success page
- Validated cart snapshots in `checkout_sessions` (Stripe metadata only holds `checkout_id`)
- Stripe webhook creates paid orders + order items (idempotent by session ID)
- Shared `fulfillCheckoutSession` helper; stale / expired webhook guards
- Daily order numbers per Sydney calendar day (`next_daily_order_number` RPC + conflict retries)
- Success page: `paid_at` stamp + poll until order # appears
- Store hours + manual open/closed override; checkout blocked when closed
- Kitchen dashboard: Realtime queue, polling fallback, Ready, completed list
- Paid-but-unfulfilled alerts with send-to-kitchen / dismiss
- Admin menu: toggle availability (sold out)
- Public `/policies` (pickup, refund, privacy, contact)
- Live on production domain

**Live:** https://www.sushisapporo.com.au/menu

## v2 — To do later

- [ ] Admin order history beyond today (date picker or paginated list)
- [ ] Refund sync: `charge.refunded` webhook → `payment_status: refunded` on order
- [ ] Add real item photos
- [ ] SMS/pickup notification when order marked ready
- [ ] Customer order status page (`/order/[id]`) without login
- [ ] Admin refunds button (Stripe Refund API + kitchen cancel flow)
- [ ] Kitchen: poll orders only when Realtime is offline; pause polls when tab hidden / store closed
- [ ] Success page: backoff instead of fixed 3s poll