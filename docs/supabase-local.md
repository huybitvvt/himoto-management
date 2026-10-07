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

The adapter reads the lists from Supabase. The customer page can create and update records in `himoto.customers`, and delete records that have no related orders. Deletion is rejected when orders reference the customer so rental history stays intact. Duplicate identity numbers are rejected. The contract composer creates customers against the selected store and searches by identity number or phone within that store; existing unassigned customer records are associated through their non-deleted orders. With `NEXT_PUBLIC_MANAGEMENT_API_MODE=supabase-local`, the composer creates and updates unfinished contract drafts in the existing `himoto.orders` draft fields, with revision checks to reject stale edits. Issued contracts, payments, deposits, and vehicle states are not changed. See [contract drafts](contract-drafts.md). Vehicle daily/monthly rental prices remain empty because the current schema does not provide a confirmed mapping for those fields.

Open `/login` and use an active HIMOTO administrator account. Passwords are checked against the existing bcrypt hashes in `himoto.users`; no account, password, or schema is changed. The local integration currently returns full datasets and therefore rejects non-administrator accounts until branch and feature permissions are implemented. An HttpOnly, SameSite=Strict signed cookie lasts eight hours; each database request checks that the account is still active and authorized. Mutations require a same-origin request. Logout clears the cookie.

The API routes still return 404 outside `NODE_ENV=development`. The dev server binds to `127.0.0.1`. Public deployments show the login design with **Xem bản demo** and never accept real credentials or open the database. Before enabling database reads in a public deployment, implement the required authorization scopes and use the project's CA certificate for full TLS server verification. PostgreSQL `sslmode=require` encrypts the connection but does not verify the server certificate or hostname ([Supabase SSL documentation](https://supabase.com/docs/guides/database/connecting-to-postgres)).

For a stable local session across server restarts, set a randomly generated `MANAGEMENT_SESSION_SECRET` in the ignored `.env.local`. Without it, the dev server generates an in-memory key; restarting the server signs out local users. Login attempts are limited to ten per email in fifteen minutes within the running server process.
