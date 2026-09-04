# OppTracker

Track, manage, and analyze international opportunities — fellowships, internships, hackathons, and more. AI-powered scam detection, cover letter generation, and deadline tracking in one place.

## Features

- **Dashboard** — Real-time stats: total opportunities, upcoming deadlines, recent activity
- **7-Stage Workflow** — Need to Apply → Applied → Under Review → Interview → Accepted/Rejected/Scam
- **Search & Filter** — By status, funding type, category, and full-text search
- **AI URL Analyzer** — Paste any opportunity URL and get instant extraction: deadline, funding, scam score (0–100), red/green flags
- **Cover Letter Generator** — Personalized letters from your profile and opportunity details
- **Scam Detector** — Fraud analysis with risk scoring and recommendations
- **Smart Chat** — Conversational AI that knows your entire tracker
- **Deadline Reminders** — Browser notifications 3 days before deadlines
- **Scam Blacklist** — Flag and track fraudulent programs

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 8 |
| Backend | Supabase (PostgreSQL, Row Level Security) |
| AI | Google Gemini |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Google AI](https://aistudio.google.com) API key

### Setup

```bash
git clone https://github.com/Ilyasrf/OppTracker.git
cd OppTracker
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Fill in your keys:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

Set up the database — run `supabase/schema.sql` in the Supabase SQL Editor.

Start the dev server:

```bash
npm run dev
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GEMINI_API_KEY
vercel --prod
```

Or connect the repo to Vercel dashboard — auto-deploys on push.

## Project Structure

```
src/
├── components/
│   ├── ai/          # AI tool interfaces
│   ├── Auth/        # Authentication components
│   ├── Layout/      # Navbar, page wrapper
│   └── ui/          # Stats cards, status badges
├── hooks/
│   ├── useOpportunities.ts
│   └── useGemini.ts
├── lib/
│   ├── supabase.ts  # Client init
│   ├── gemini.ts    # AI client
│   ├── types.ts     # TypeScript types
│   └── notifications.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── OpportunitiesList.tsx
│   ├── OpportunityForm.tsx
│   ├── OpportunityDetail.tsx
│   ├── ScamList.tsx
│   └── AiAssistant.tsx
├── App.tsx
└── main.tsx
supabase/
└── schema.sql       # Database schema + RLS policies
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |

## Cost

$0/month on free tiers — Vercel, Supabase, and Google Gemini all have free plans sufficient for personal use.
