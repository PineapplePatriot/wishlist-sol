# Список Бажань — Witch / Mystery Edition 🔮

A real-time birthday wishlist site. Guests browse gifts grouped into crystal
"rarity" tiers, reserve them with a nickname, and everyone sees bookings update
live. The host manages the list through a hidden admin mode (add items one by one
**or** bulk-upload via JSON).

Built with **Vite + React**, data synced through **Supabase**, deployed on **Vercel**.

---

## 📁 Repo structure

```
.
├── index.html              ← page shell (title, fonts, root div)
├── package.json            ← dependencies & scripts
├── vite.config.js          ← Vite + React plugin
├── vercel.json             ← Vercel build + SPA rewrite config
├── .env.example            ← copy to .env and add your Supabase keys
├── .gitignore
├── supabase-setup.sql      ← paste into Supabase SQL editor to create the table
├── sample-wishlist.json    ← example file for the JSON bulk-upload feature
├── public/
│   └── music/              ← drop your .mp3 files here (see MusicPlayer.jsx)
│       └── .gitkeep
└── src/
    ├── main.jsx            ← React entry point
    ├── App.jsx             ← the whole app (categories, booking, admin, effects)
    ├── MusicPlayer.jsx     ← floating music player + track list
    ├── useStorage.js       ← Supabase-backed storage + realtime sync hook
    └── supabase.js         ← Supabase client (reads keys from .env)
```

---

## 🚀 Quick start (local)

```bash
npm install
cp .env.example .env        # then fill in your two Supabase values
npm run dev                 # opens http://localhost:5173
```

`npm run build` makes the production `dist/`; `npm run preview` serves it locally.

---

## 🎵 Adding music

1. Put `.mp3` files in `public/music/`.
2. Open `src/MusicPlayer.jsx` and edit the `TRACKS` array so each `src` matches
   your filename exactly (paths are relative to `public/`, e.g. `"music/song.mp3"`).
3. You can add or remove as many tracks as you like.

---

## 🔮 Admin mode

Click the small 🔮 button under the header and enter the "spell".
Default code: **`witch2026`** — change it in `src/App.jsx` (the `ADMIN_CODE`
constant near the top). Admin mode unlocks **+ Додати** (single item) and
**📜 JSON** (bulk upload / template download / export).

### JSON format
```json
{
  "items": [
    {
      "name": "Назва (обов'язково)",
      "category": "amethyst",
      "price": "1200 грн",
      "star": "purple",            // "purple" | "yellow" | ""
      "photo": "https://...jpg",
      "description": "деталі...",
      "links": ["https://shop/item"]
    }
  ]
}
```
Category IDs: `diamond`, `amethyst`, `moonstone`, `sapphire`, `tourmaline`, `quartz`, `pebble`.
A bare array `[ {...} ]` also works. See `sample-wishlist.json`.

---

# 🗄️ Supabase refresher

Supabase is the live database. The app stores everything in **one tiny table**
with just two rows — one holding all gift items, one holding all bookings — as
JSON. Realtime is what makes a booking on one phone appear instantly on another.

### Steps
1. Go to **supabase.com** → sign in → **New project**. Pick a name, set a database
   password (save it somewhere), choose the region closest to your guests
   (e.g. Frankfurt / Central EU for Ukraine). Wait ~2 min for it to spin up.
2. Left sidebar → **SQL Editor** → **New query**. Open `supabase-setup.sql` from
   this repo, paste the whole thing in, and click **Run**. That creates the
   `wishlist_data` table, the access policies, and turns on realtime — all at once.
3. Left sidebar → **Project Settings**:
   - **Data API** → copy the **Project URL** → this is `VITE_SUPABASE_URL`.
   - **API Keys** → copy the **anon / public** key → this is `VITE_SUPABASE_ANON_KEY`.
   - ⚠️ Use the **anon** key only. Never use the `service_role` / secret key in a
     frontend — it bypasses all security.
4. Paste both values into your `.env` file (and later into Vercel — see below).

### A note on security
This wishlist is intentionally **public**: anyone with the link can view and book,
and the admin "spell" lives only in the frontend (it's light protection to keep
guests from accidentally editing — not real auth). The SQL policies reflect that
by allowing open read/write. That's fine for a birthday list shared with friends.
If you wanted true protection you'd add Supabase Auth, but it isn't needed here.

### ⚠️ Use a NEW Supabase project
Don't reuse the original Fatui wishlist's project/keys — both sites would write to
the same two rows and overwrite each other. Fresh project = separate data.

---

# ▲ Vercel refresher

Vercel hosts the site and rebuilds it automatically every time you push to GitHub.

### Steps
1. Push this repo to **GitHub** (see below if starting fresh).
2. Go to **vercel.com** → sign in with GitHub → **Add New… → Project** →
   **Import** your repo.
3. Vercel auto-detects Vite (the included `vercel.json` confirms the build command
   `npm run build` and output `dist`). You don't need to change these.
4. **Before deploying**, expand **Environment Variables** and add the same two
   keys from Supabase:
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon key |
   These must be set in Vercel too — the `.env` file is git-ignored and never
   uploaded, so Vercel can't see your local one.
5. Click **Deploy**. After ~1 min you get a live `your-project.vercel.app` URL.

### Updating later
Every `git push` to the main branch triggers a fresh deploy automatically. If you
add the env vars *after* a deploy, hit **Redeploy** so the new build picks them up.

### Starting a fresh GitHub repo
```bash
git init
git add .
git commit -m "Witch wishlist"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```
(`node_modules`, `dist`, and `.env` are git-ignored, so they won't be committed.)

---

## 🧭 Order of operations (the short version)
1. Create Supabase project → run `supabase-setup.sql` → copy URL + anon key.
2. `npm install`, copy `.env.example` → `.env`, paste keys, `npm run dev` to test.
3. Add music to `public/music/` + update `MusicPlayer.jsx` (optional).
4. Push to GitHub.
5. Import to Vercel → add the two env vars → Deploy.
6. Open the live site, enter the admin spell, upload the wishlist (form or JSON). ✨
