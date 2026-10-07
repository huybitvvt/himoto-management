# Supabase data source (local development)

Local development reads the existing HIMOTO records in the PostgreSQL schema `himoto` instead of the synthetic fixtures. The connection string stays in the ignored `.env.local`; the browser only calls the Next.js API routes.

| Screen | Source tables |
| --- | --- |
| Staff | `himoto.staff_profiles`, `himoto.stores` |
| Customers | `himoto.customers`, `himoto.stores`, `himoto.orders` |
| Stores | `himoto.stores`, `himoto.users`, `himoto.vehicles`, `himoto.staff_profiles` |
| Vehicles | `himoto.vehicles`, `himoto.stores` |
| Contracts | `himoto.orders`, `himoto.order_vehicle_details`, `himoto.customers`, `himoto.vehicles`, `himoto.stores` |
| Cashbook | `himoto.transactions`, `himoto.users` |

The adapter reads the lists from Supabase. The customer page can create and update records in `himoto.customers`, and delete records that have no related orders. Deletion is rejected when orders reference the customer so rental history stays intact. Duplicate identity numbers are rejected. The contract composer creates customers against the selected store and searches by identity number or phone within that store; existing unassigned customer records are associated through their non-deleted orders. Contract changes are not written. Vehicle daily/monthly rental prices remain empty because the current schema does not provide a confirmed mapping for those fields.

The API routes return 404 outside `NODE_ENV=development`, because this frontend has no real user sign-in yet. The dev server binds to `127.0.0.1`. Before enabling database reads in a public deployment, add authenticated access and use the project's CA certificate for full TLS server verification. PostgreSQL `sslmode=require` encrypts the connection but does not verify the server certificate or hostname ([Supabase SSL documentation](https://supabase.com/docs/guides/database/connecting-to-postgres)).
