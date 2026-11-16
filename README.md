# FYP-FireBomba-Admin

This is the admin dashboard for our final year project, a fire-detection IoT system.

- `backend/`: Express REST API (port 3000), backed by **Supabase** (Postgres + Supabase Auth)
- `frontend/`: Expo / React Native app, run in the browser

> **Note:** The project no longer uses XAMPP/MySQL. `backend/sql/database.sql` is legacy and is not needed.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS) and npm
- Git
- Access to the team's **Supabase project** (ask a teammate for an invite), or your own Supabase project

---

## 1. Clone the repo

```bash
git clone https://github.com/Daryl711/FYP-FireBomba-Admin.git
cd FYP-FireBomba-Admin
```

**Reminder:** run `git pull` every time before you start developing.

---

## 2. Get your Supabase keys

In the Supabase dashboard, open **Project Settings → API** (or **API Keys**) and note down:

| Value | Used by |
|---|---|
| Project URL | backend and frontend |
| `service_role` (secret) key | backend only |
| Publishable / `anon` key | frontend only |

> ⚠️ The **service role key** bypasses all database security. Only put it in `backend/.env`. Never put it in the frontend and never commit it.

---

## 3. Backend

```bash
cd backend
npm install
```

Create a file `backend/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# PORT=3000   (optional, defaults to 3000)
```

Start the server (uses nodemon, so it reloads on file changes):

```bash
npm run start
```

Check that it is running. Open http://localhost:3000/health in your browser, or run:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

If the server crashes with `Missing Supabase environment variables`, your `backend/.env` is missing or misnamed.

---

## 4. Frontend

Open a **second terminal**, leaving the backend running:

```bash
cd frontend
npm install
```

Create a file `frontend/.env` (you can copy `frontend/.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Start the web app:

```bash
npm run web
```

Expo prints a local URL (usually http://localhost:8081) and opens it in your browser.

> `EXPO_PUBLIC_*` values are read when Expo starts. After editing `frontend/.env`, stop Expo and run `npm run web` again. If old values still show up, run `npx expo start --web -c` to clear the cache.

---

## 5. Logging in

Only **admin** accounts can log in to the dashboard. An account counts as an admin when it has all three of:

1. a user in **Supabase Auth**
2. a profile row in the `users` table
3. a row in `user_roles` with `role = 'admin'`

If you're using the team's Supabase project, ask a teammate for an admin account.

If you're setting up a fresh Supabase project:

1. Run `backend/sql/supabase.sql` in the Supabase **SQL Editor**. Note that this file is not fully up to date. For example, the code also expects a `user_roles` table and a `status` column on `rooms`.
2. Create a user under **Authentication → Users → Add user**, and copy its UUID.
3. Run the following in the SQL Editor, replacing the placeholders:

   ```sql
   -- users.bilik_id is required, so make sure a bilik exists
   INSERT INTO bilik (bilik_number, household_name) VALUES ('1', 'Admin') RETURNING bilik_id;

   INSERT INTO users (user_id, bilik_id, email, full_name, role)
   VALUES ('<auth-user-uuid>', <bilik_id>, 'admin@example.com', 'Admin', 'admin');

   INSERT INTO user_roles (user_id, role) VALUES ('<auth-user-uuid>', 'admin');
   ```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend shows network errors | Make sure the backend is running and `EXPO_PUBLIC_API_URL` points to it (`http://localhost:3000`). |
| Login fails with "not an admin" or a profile error | The account is missing a `user_roles` admin row or a `users` profile row. See step 5. |
| Port 3000 already in use | Set `PORT=3001` in `backend/.env` and update `EXPO_PUBLIC_API_URL` to match. |

For production deployment (EC2 + Nginx + pm2), see `CLAUDE.md` and `deploy/nginx/firebomba.conf`.
