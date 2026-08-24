# Opportunity Tracker — Design Spec

## Overview
A personal web app to track international opportunities (fellowships, internships, hackathons, volunteering). Dark bokeh + blue accents theme matching the FASR website aesthetic.

## Tech Stack
- **Frontend:** React 18 + Vite + React Router v6 + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel

## Data Model

### opportunities table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| title | TEXT | Required |
| url | TEXT | Website URL |
| deadline | TIMESTAMPTZ | Application deadline |
| status | TEXT ENUM | need_to_apply, applied, under_review, interview, accepted, rejected, scam |
| funding_type | TEXT ENUM | fully_funded, partial, unpaid, unknown |
| location | TEXT | Country/city |
| travel_accommodation | TEXT | Travel/housing info |
| category | TEXT ENUM | fellowship, internship, hackathon, volunteering, other |
| notes | TEXT | Personal notes |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### Auth
- Email + password via Supabase Auth
- Row Level Security: users only see their own data

## Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Stats cards, deadline countdowns, recent activity |
| `/opportunities` | List | Full list with search, filters, sort |
| `/opportunities/new` | Add | Form to add new opportunity |
| `/opportunities/:id` | Edit | Edit/view opportunity details |
| `/scam-list` | Scam List | Blacklisted opportunities with reasons |

## Visual Design
- **Background:** Dark (#0a0a0f) with animated bokeh circles (CSS radial gradients)
- **Typography:** JetBrains Mono for headings, Inter for body
- **Accents:** Blue (#3b82f6) CTAs, Cyan (#06b6d4) highlights, Red (#ef4444) scam alerts
- **Cards:** Glass-morphism with backdrop-blur, subtle borders
- **Nav:** Fixed top bar with logo, nav links, "New Opportunity" button
- **Status badges:** Color-coded pills

## Features
1. **CRUD:** Add/edit/delete opportunities with modal/slide-out form
2. **Dashboard:** Stats (total, applied, pending, interviews, accepted), deadline countdowns
3. **Search & Filter:** By status, funding type, category, location. Text search on title.
4. **Scam List:** Separate page. Add scam opportunities with reason.
5. **Deadline Reminders:** Browser Notification API — 3 days before deadline
6. **Responsive:** Mobile + desktop
