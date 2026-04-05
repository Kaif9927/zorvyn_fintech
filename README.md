# Zorvyn

This is a small finance dashboard backend (plus a React UI) I put together for a backend assignment: users with roles, financial records, **monthly budgets per expense category**, and aggregated dashboard endpoints. Nothing here claims to be production-hardened—it’s meant to be readable and easy to run locally.

**Do not commit `.env` or put real passwords in this file.** After `npm run db:seed`, demo logins are printed in the terminal (see **Seed logins** below).

If you’re grading this: thanks for taking the time. The sections below explain what I built, what I assumed, and how to get it running on your machine.

---

## What it actually does

There are three roles: **Admin**, **Analyst**, and **Viewer**. **Admins** can manage users and all financial records. **Analysts** and **Viewers** use dashboard and analytics scoped to **their own** data. **Viewers** and **Analysts** can **create, list, update, and soft-delete their own** income/expense rows, and manage **monthly budgets** (expense caps per category) for themselves.

The API is REST, JSON in and out, JWT in the `Authorization` header when a route is protected.

Financial records: amount, income vs expense, category, date, optional note, tied to a user. **Budgets** store a monthly **cap** per **category** (match category names to expenses). Dashboard routes give totals, category breakdowns, recent rows, and monthly/weekly trends.

---

## Things I decided (so you know where I’m coming from)

- **Admin sees everything.** Totals and lists for admins aggregate across all users. Analysts and viewers only see their own rows for dashboard math and for **financial records / budgets**.
- **Viewers get full CRUD on their own records** and budgets; they don’t see other users’ data.
- **Anyone can hit public signup** and become a Viewer; only an admin can hand out Analyst/Admin via register or the UI.
- **MySQL** is what the schema targets. If you really want SQLite, you’d switch Prisma’s provider and URL—just don’t forget to say so in your own notes if you fork this.

---

## Crypto (the short version)

I didn’t try to reinvent auth theory here.

**Passwords** go through **bcrypt** (one-way). You can’t “decrypt” them from the database—that’s intentional. There’s an optional `PASSWORD_PEPPER` if you want an extra secret mixed in before hashing.

**Transaction notes** are a different story: those are encrypted at rest with **AES-256-GCM** using `ENCRYPTION_KEY`, and decrypted when the API sends them back. If you have old rows that were stored plain, the code falls back so they don’t suddenly break.

**User IDs** stay normal integers in the DB. JWTs are signed with `JWT_SECRET`; I didn’t encrypt the primary keys themselves.

---

## Stack

Backend: Node, Express, Prisma, MySQL, JWT, bcrypt, express-validator, Node’s `crypto` for the note encryption.

Frontend: Vite + React, Tailwind, React Router, Axios, Chart.js. It’s there so you can click around—not a requirement for the backend brief, but it helps.

---

## Before you start

You’ll need Node 18+ and MySQL 8 (or compatible). That’s it.

---

## Getting it running

**1. Create a database**

```sql
CREATE DATABASE IF NOT EXISTS zorvyn_finance
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**2. Backend**

```bash
cd backend
copy .env.example .env
```

Fill in `.env` at least:

- `DATABASE_URL` — your MySQL connection string  
- `JWT_SECRET` — long random string  
- `ENCRYPTION_KEY` — exactly 64 hex characters (32 bytes). Quick way to generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If your MySQL password has an `@` in it, remember to URL-encode it as `%40` inside the URL.

Then:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

The API listens on port 5000 by default (override with `PORT`). There’s a tiny script `npm run db:verify` that pings the DB and prints counts if you want a sanity check.

**3. Frontend (optional)**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend in dev—see `vite.config.js` if you need to change the target.

---

## Seed logins (after `npm run db:seed`)

These are whatever the seed script prints; the admin account is set up for the project owner. Last time I ran it, the demo users looked like:

**Admin**

- **Default email / password** (if you don’t set env vars): `mohdkaifa909@gmail.com` / `12344321`  
- **Custom admin:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` before `npm run db:seed` (use the same values in Render’s env if you seed there). Then log in with that email and password.  
- **User ID:** depends on your DB; check: `SELECT id, email FROM users WHERE email = '…';`

**Another admin account** (without re-seeding): log in as an existing admin → **Management** → use **Register** (`POST /api/auth/register`) to create a user with role **Admin** and a different email.

**Analyst** — `analyst@zorvyn.local` / `analyst123`  

**Viewer** — `viewer@zorvyn.local` / `viewer123`  

If you change the seed file, passwords and emails may change—run seed again and trust the console output.

---

## API cheat sheet

Most routes want:

`Authorization: Bearer <token>`

**Auth**

- `POST /api/auth/login` — body: `email`, `password`  
- `POST /api/auth/signup` — public; creates a Viewer  
- `GET /api/auth/bootstrap-status` — public; `{ data: { allowed: true } }` only when **no** user has role Admin (fresh DB)  
- `POST /api/auth/bootstrap-admin` — public **only if** there is still **no** Admin in the database; body: `name`, `email`, `password` (min 6 chars); creates the **first** Admin and returns token + user (same shape as login). If you already ran **seed** or created an admin, the API returns **403** — sign in with that admin instead, or delete Admin rows / reset the DB to use bootstrap again.  
- The **login page** always shows a **Create administrator account** section; the server still enforces the rules above.  
- `POST /api/auth/register` — admin only; can set role/status  

**Users** (admin only)

- `GET /api/users` — query: `page`, `limit`, `search`  
- `GET /api/users/:id`  
- `PATCH /api/users/:id`  
- `DELETE /api/users/:id`  

**Financial records** (all roles; non-admins only see their own rows)

- `GET /api/financial-records` — filters: dates, category, type, pagination; text search hits **category** (notes are encrypted in the DB)  
- `GET /api/financial-records/:id`  
- `POST` — create a row; **Admin** may set `userId` for another user; others create for themselves  
- `PATCH`, `DELETE` — soft-delete on `DELETE`; non-admins only for **their** rows  

**Budgets** (monthly expense cap per category; all roles; non-admins only their own)

- `GET /api/budgets` — query: `year`, `month`, optional `userId` (admin only)  
- `GET /api/budgets/summary` — spent vs budget for that month (expenses summed by category)  
- `POST /api/budgets` — body: `category`, `amount`, `year`, `month`; optional `userId` (admin only); upserts on same user+category+month  
- `PATCH /api/budgets/:id` — body: `amount`  
- `DELETE /api/budgets/:id`  

**Dashboard** (any logged-in role, but data scoped by role as above)

- `GET /api/dashboard/summary`  
- `GET /api/dashboard/category-summary`  
- `GET /api/dashboard/recent-transactions` — optional `limit`  
- `GET /api/dashboard/monthly-trends` — optional `months`  
- `GET /api/dashboard/weekly-trends` — optional `weeks`  

**Health**

- `GET /health` — no auth  

---

## Where the code lives

Nothing fancy: `server.js` boots the app, `db.js` holds one Prisma client, routes call controllers, controllers call services. Shared bits live in `lib/` (JWT, errors, crypto, password helpers). Prisma schema and seed are under `prisma/`. The React app is split into `pages/`, `components/`, and a small `api/client.js` for axios + the bearer token.

---

## What I didn’t add (and I’m fine with that)

Rate limiting, full OpenAPI docs, and automated tests aren’t in here. The assignment treated those as optional extras. If this were a real product, those would be high on the list.

---

## License

Use this for coursework or assessment. If you reuse something, a nod in the readme isn’t required but it’s nice.
