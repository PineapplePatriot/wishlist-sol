# Список Бажань — Emerald Edition 💚

A real-time wishlist site in a velvet-green, gold and black theme. Guests pick a
"рівень заможності" (joke price tiers), book gifts (optionally **as a secret**),
chip in on expensive gifts together, and everyone sees updates live. The owner
manages everything after logging in at **`/admin`**.

Built with **Vite + React**, data in **Supabase**, hosted on **Vercel**.

---

## ✨ What's inside

| Feature | How it works |
|---|---|
| **Joke tiers** | 👑 Олігарх → 🫙 Студент на гречці. Names, jokes and price ranges live in `src/config.js`. |
| **Marks** | 💚 most wanted (one per tier — the database enforces it) · ⭐ really wants · none. Gifts sort by mark. |
| **Safe booking** | Two guests clicking the same gift at the same moment → exactly one gets it, the other sees "хтось щойно забронював". |
| **🤫 Surprise toggle** | The guest chooses. Surprise = **nobody** (not even the owner) sees their name, only "заброньовано". The name never leaves the database. |
| **🤝 Chip in together** | Owner marks a gift as a group gift (optionally "needs N people"). Guests join; a progress bar shows "2 з 4 учасників". |
| **Basket** | Add several gifts, book them all at once. |
| **Cancel** | Guests can cancel their own booking **from the same phone/browser** they booked on. The owner can remove any booking. |
| **Countdown** | Owner sets the date & time in ⚙️ Налаштування; the header counts down. |
| **Photo upload** | Owner uploads gift photos straight from phone/computer (stored in Supabase Storage). Pasting an image link still works. |
| **JSON import/export** | Bulk add or replace the whole list; files from the old witch wishlist also import (old tier names fall back to "Стабільний середній клас"). |
| **Link preview** | Nice image + title when the link is shared in Telegram / Instagram / Viber (`public/og.png`, texts in `index.html`). |
| **Calm motion** | Fade-ins, hover lift, a small gold sparkle on booking. Phones with "reduce motion" switched on get no animation. |

---

## 📁 Files

```
emerald-wishlist/
├── index.html              ← page shell + link-preview texts
├── supabase-setup.sql      ← paste into Supabase once (creates everything)
├── sample-wishlist.json    ← example for JSON import
├── public/og.png           ← link-preview image (1200×630)
└── src/
    ├── config.js           ← ✏️ tiers, jokes, prices, marks — edit here
    ├── styles.css          ← ✏️ colours (top of file) & layout
    ├── App.jsx             ← the page
    ├── api.js              ← all database calls
    ├── hooks.js            ← live data, admin check, countdown
    ├── supabase.js         ← connection (reads keys from env)
    └── components/         ← header, gift card, pop-ups, admin screens
```

---

## 🚀 Setup — step by step

### 1. Supabase (the database) — ~10 min
1. **supabase.com → New project.** Name it (e.g. `wishlist-emerald`), set a database
   password (save it), region **Central EU (Frankfurt)**. Wait ~2 min.
   ⚠️ Use a **new** project — not the witch wishlist's — or the sites would share data.
2. **SQL Editor → New query** → paste the whole `supabase-setup.sql` → **Run**.
   The result table at the bottom should show **3 realtime rows, 6 policies,
   4 storage policies and 1 bucket**. Fewer → run it again.
3. **Create the owner's login:** *Authentication → Users → Add user → Create new user* →
   email + password, tick **Auto Confirm User**.
4. **Make them admin:** back in SQL Editor, run (with their email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'owner@example.com'
   on conflict do nothing;
   ```
5. **Recommended:** *Authentication → Sign In / Providers → Email* → turn **off**
   "Allow new users to sign up". (Even if left on, strangers who sign up still
   can't edit anything — only accounts in the `admins` list can.)
6. **Copy the keys:** *Project Settings → Data API* → **Project URL**;
   *Project Settings → API Keys* → **anon / public** key.
   ⚠️ Never use the `service_role` / secret key in the website.

### 2. Try it on your computer (optional)
```bash
cd emerald-wishlist
npm install
cp .env.example .env        # paste the two values from step 1.6
npm run dev                 # opens http://localhost:5173
```

### 3. Vercel (the hosting) — ~5 min
Both wishlists live in this one GitHub repo, each in its own folder, and each
gets **its own Vercel project**.
1. **vercel.com → Add New… → Project → Import** the `wishlist-sol` repo.
2. **Root Directory → Edit → choose `emerald-wishlist`.** (This is the important bit —
   it tells Vercel which site in the repo to build.) Framework: Vite (auto).
3. **Environment Variables** — add both:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | anon key |
4. **Deploy.** You get `something.vercel.app`. You can rename it under
   *Settings → Domains*.
5. Vercel publishes the repo's **production branch** (usually `main`). Until this
   folder is merged into `main`, either merge it, or temporarily set
   *Settings → Git → Production Branch* to this branch.

### 4. First run
1. Open `your-site.vercel.app/admin` → log in with the owner's email/password.
2. **⚙️ Налаштування** → title, subtitle, date & time of the party → Зберегти.
3. **+ Подарунок** (one by one, with photo upload) or **📜 JSON** (bulk).
4. Share the normal link (without `/admin`) with guests. 🎉

---

## ✏️ Common tweaks
- **Tier names / jokes / price ranges:** `src/config.js` (keep the `id`s once gifts exist).
- **Colours:** the variables at the top of `src/styles.css` (`--emerald`, `--gold`, …).
- **Link-preview texts:** the `og:` lines in `index.html`; image: replace `public/og.png` (1200×630).

## 🐞 Troubleshooting
- **Red banner "Немає зв'язку з базою даних"** → env vars missing/typo'd in Vercel
  (fix, then *Deployments → Redeploy*), or the SQL wasn't fully run.
- **"Цей акаунт не має прав адміністратора"** at login → step 1.4 wasn't run for that email.
- **Photo upload fails** → re-run `supabase-setup.sql` (it creates the `gift-photos` bucket).
- **Guest can't cancel** → they're on a different phone/browser than the one they booked on;
  the owner can remove the booking from admin mode.
