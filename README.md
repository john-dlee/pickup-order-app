# Sapporo Sushi Pickup Order App
Mobile-first pickup ordering web application for a local sushi takeaway store to reduce wait times for customers during peak hours.

## Tech Stack
* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
* **Backend:** Next.js API Routes (Route Handlers)ß
* **Database:** PostgreSQL (Supabase)
* **Payments:** Stripe Checkout & Webhooks
* **Infrastructure:** Vercel


## Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    participant C as Customer
    participant A as Next.js
    participant S as Stripe
    participant DB as Supabase

    C->>A: POST /api/checkout (item IDs + quantities)
    critical Server-side validation
        A->>DB: Check store hours & menu prices
    end
    A->>S: Create Checkout Session
    S-->>C: Redirect to hosted Checkout
    C->>S: Pay

    S-->>C: Redirect to /order/success?session_id=...

    note over S,A: Async (may arrive after redirect)
    S->>A: POST /api/webhooks/stripe<br/>(checkout.session.completed)
    A->>DB: Insert orders + order_items

    loop Poll every 3s until order exists
        C->>A: GET /api/orders/lookup?session_id=...
        A->>DB: Query by stripe_checkout_session_id
        A-->>C: order or null
    end
```

## dijfie

```mermaid
flowchart TB
  subgraph Client
    C[Customer]
    K[Kitchen admin]
  end

  subgraph Vercel
    A[Next.js App Router<br/>UI + API routes]
  end

  subgraph External
    S[Stripe]
    DB[(Supabase)]
  end

  C -->|menu, checkout, order lookup| A
  C -->|pay| S
  A -->|create session| S
  S -->|webhook| A
  A -->|menu, orders, hours| DB
  K -->|admin UI| A
  K <-->|Realtime + poll| DB
  ```