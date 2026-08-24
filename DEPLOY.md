# OppTracker — Deployment Guide

## What You Have

A React + Vite app that tracks international opportunities (fellowships, internships, hackathons). Dark bokeh theme, Supabase backend.

**Tech stack:** React 19, Vite 8, Tailwind CSS 4, Supabase, Vercel

---

## Step 1: Set Up Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
   - Choose a project name (e.g. `opp-tracker`)
   - Set a strong database password (save it somewhere)
   - Pick a region close to you
3. Once the project is created, go to **SQL Editor** (left sidebar)
4. Copy the contents of `supabase/schema.sql` and paste it into the SQL editor
5. Click **Run** — this creates the `opportunities` table with row-level security

## Step 2: Get Your Supabase Keys

1. In your Supabase project, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** — looks like `https://xxxxxxxx.supabase.co`
   - **Anon public key** — starts with `eyJ...`
3. Open the `.env` file in your project root and replace the placeholders:

```
VITE_SUPABASE_URL=https://your-actual-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

## Step 3: Enable Email Auth (Optional but Recommended)

1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it is by default)
3. Users can now sign up/log in with email and password

> **Note:** The current app doesn't have a login UI yet. All data operations use the Supabase client directly. If you want auth, you'll need to add login/signup pages later. For now, the app works without auth if you just want to test it.

## Step 4: Test Locally

```bash
cd /home/ily4s/Desktop/opportunities
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). You should see the dashboard.

> **Important:** If you see a blank page or errors in the browser console, check that your `.env` file has the correct Supabase URL and key.

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. From your project directory, run:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? → **Y**
   - Which scope? → Choose your account
   - Link to existing project? → **N**
   - Project name? → `opp-tracker` (or whatever you want)
   - Directory with code? → `./` (current directory)
   - Override settings? → **N**

5. Set environment variables on Vercel:
   ```bash
   vercel env add VITE_SUPABASE_URL
   # Paste your Supabase URL when prompted

   vercel env add VITE_SUPABASE_ANON_KEY
   # Paste your Supabase anon key when prompted
   ```

6. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard (GitHub)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Vercel auto-detects Vite — no config needed
6. Before deploying, click **"Environment Variables"** and add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
7. Click **Deploy**

Every time you push to GitHub, Vercel auto-deploys.

---

## Project Structure

```
opportunities/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.tsx        # Top navigation bar
│   │   │   └── Layout.tsx        # Page wrapper with navbar
│   │   └── ui/
│   │       ├── StatusBadge.tsx   # Colored status pills
│   │       └── StatsCard.tsx     # Dashboard stats cards
│   ├── hooks/
│   │   └── useOpportunities.ts   # CRUD operations hook
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── types.ts              # TypeScript types + labels
│   │   └── notifications.ts      # Deadline reminders + date utils
│   ├── pages/
│   │   ├── Dashboard.tsx         # Stats + deadlines + activity
│   │   ├── OpportunitiesList.tsx # List with search/filter
│   │   ├── OpportunityForm.tsx   # Add/edit form
│   │   ├── OpportunityDetail.tsx # View + status workflow
│   │   └── ScamList.tsx          # Scam blacklist
│   ├── App.tsx                   # Router setup
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles + bokeh theme
├── supabase/
│   └── schema.sql                # Database schema
├── .env                          # Your Supabase credentials (not in git)
├── .env.example                  # Template for .env
└── package.json
```

---

## How to Use

1. **Dashboard** — See stats at a glance: how many you've applied to, upcoming deadlines
2. **Add Opportunity** — Click "New Opportunity" in the navbar
3. **Track Status** — Use the status workflow: Need to Apply → Applied → Under Review → Interview → Accepted
4. **Search & Filter** — On the Opportunities page, filter by status, funding type, or category
5. **Scam List** — Mark suspicious opportunities as scams so you remember to avoid them

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page on deploy | Check that `.env` variables are set in Vercel dashboard |
| "Failed to fetch" errors | Supabase URL/key is wrong. Check `.env` |
| Data not saving | Make sure you ran the SQL schema in Supabase SQL Editor |
| Build fails | Run `npm run build` locally to see the error |
| Styles look broken | Make sure you're using the latest deploy (Vite hashes CSS) |

---

## Costs

- **Supabase:** Free tier includes 500MB database, 50K monthly active users — more than enough
- **Vercel:** Free tier includes 100GB bandwidth, 1000 build minutes — more than enough
- **Total cost: $0/month** for personal use
