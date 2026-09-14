# Rozy 🌸

Your daily routine, habits & report card — **track, improve, and share with friends.**
A beautiful, installable PWA built with React + TypeScript + Tailwind + Framer Motion, with an optional Supabase backend for auth, cloud sync, friends and **live** routine sharing.

---

## ✨ Features

- **Today** — plan your day with colorful tasks, mark them done with a satisfying tap, live progress ring.
- **Recurring routines** — set tasks that auto-repeat on chosen weekdays.
- **History** — a calendar heatmap of every day; open any past day to see exactly what you did.
- **Report Card** — weekly / monthly / yearly grade, completion trend charts, streaks, perfect days, and per-category breakdown, with improvement vs. the previous period.
- **Friends & live sharing** *(needs cloud)* — add friends by username, share your routine, and watch tasks tick off in real time.
- **Themes** — light / dark / auto, with a smooth ambient design.
- **Reminders** — get notified before timed tasks (in-app now; full background push in Phase 2).
- **Installable PWA** — add to your home screen and use it like a native app, offline-friendly.

> The app runs **fully offline in local mode** (data saved in your browser). Add Supabase keys to unlock login, cross-device sync, friends and live sharing.

---

## 🚀 Run it

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173).

Build for production:

```bash
npm run build
npm run preview
```

---

## ☁️ Enable cloud (Phase 2 — auth, sync, friends, live sharing)

**Step 1 — Create the project & database**
1. Create a free project at [supabase.com](https://supabase.com).
2. Dashboard → **SQL Editor** → paste & run [`supabase/schema.sql`](supabase/schema.sql). This creates all tables, Row-Level-Security, the `find_user_by_username` helper, and turns on realtime.
3. **Project Settings → API** → copy the **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart `npm run dev`. Settings now shows **"Sign in / Create account"** and the Friends tab unlocks.

**Step 2 — (easy testing) turn off email confirmation**
Dashboard → **Authentication → Providers → Email** → disable *“Confirm email”* so accounts work instantly during testing. (Leave it on for production; users then confirm via the email link before signing in.)

**How it works once signed in**
- Your todos, routines, goals & notes **sync to the cloud** and across devices automatically (realtime).
- On first sign-in your existing **local data is migrated up** to your account.
- **Add a friend** by their username (Friends tab). They approve the request, then you both see each other's day — and it updates **live** as tasks get checked off. ✅

### Step 3 — Push notifications (real, works when the app is closed)
1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Put the **public** key in `.env`:
   ```
   VITE_VAPID_PUBLIC_KEY=your-public-key
   ```
3. Deploy the Edge Function (in [`supabase/functions/send-push`](supabase/functions/send-push/index.ts)) and set its secrets:
   ```bash
   supabase functions deploy send-push
   supabase secrets set VAPID_PUBLIC_KEY=your-public-key VAPID_PRIVATE_KEY=your-private-key VAPID_SUBJECT=mailto:you@example.com
   ```
4. In the app: `npm run build && npm run preview` (push needs the built service worker — it's disabled in `npm run dev`). Sign in → **Settings → Push notifications → On**, and allow notifications. The device is now registered in `push_subscriptions`.
5. Send a push any time by invoking the function:
   ```bash
   curl -X POST "https://<project>.supabase.co/functions/v1/send-push" \
     -H "Authorization: Bearer <anon-key>" -H "Content-Type: application/json" \
     -d '{"userId":"<user-uuid>","title":"⏰ Time to workout","body":"06:30 — Morning workout","url":"/"}'
   ```
   *Automate it:* add a Supabase **Database Webhook** (e.g. on `friendships` insert → notify the recipient) or a **scheduled function / cron** to fire daily reminders. The function accepts `{ userId, title, body, url }`.

---

## 🧱 Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (CSS-variable theming) |
| Animation | Framer Motion |
| Charts | Recharts |
| State | Zustand (persisted to localStorage) |
| Dates | date-fns |
| Backend *(optional)* | Supabase (Postgres + Auth + Realtime + RLS) |
| App shell | vite-plugin-pwa (installable, offline) |

---

## 📁 Structure

```
src/
  components/   ui primitives, todo & routine editors, auth modal, layout, doodles
  hooks/        theme, reminders
  lib/          types, colors, dates, stats, utils, supabase client
    cloud/      sync (mirror + realtime), friends helpers, push, row mappers, bridge
  pages/        Today, History, Reports, Friends, Settings
  store/        useStore (data), useAuth (session), useFriends (live), useUI
  sw.ts         service worker — precache + Web Push handlers
supabase/
  schema.sql             tables + Row-Level-Security + realtime + RPC
  functions/send-push/   Edge Function that delivers Web Push
```

---

## 🔒 Security notes

- The `anon` key is safe to expose in the client — **all** access is guarded by Row-Level Security in `schema.sql`: users can only read/write their own rows, and friends can *read* each other's todos **only** when the friendship row is `accepted`.
- Passwords are handled entirely by Supabase Auth (the app never stores them).
- The VAPID **private** key and service-role key live only as Edge Function secrets — never in the client bundle.
- Never commit `.env` (it's gitignored).

---

Made with 💜 — Phase 1 (planner UI) + Phase 2 (accounts, cloud sync, live friends, push) complete.
