# OppTracker

### Never Lose Track of an Opportunity Again

---

## The Problem

Every year, millions of students and young professionals apply to international fellowships, internships, hackathons, and funded programs. The process is chaotic:

- Opportunities are scattered across dozens of websites, emails, and social media posts
- Deadlines are missed because there is no centralized tracking system
- Applicants waste hours writing cover letters from scratch for each program
- Scam programs steal time and money from vulnerable applicants
- There is no way to see the big picture of where you stand in your application pipeline

**OppTracker solves all of this in one place.**

---

## What is OppTracker?

OppTracker is a **web-based opportunity management platform** that helps users track, analyze, and apply to international programs with AI-powered assistance. It combines a clean dashboard with smart automation to turn a stressful process into a structured workflow.

---

## Core Features

### 1. Smart Dashboard

A real-time overview of your application pipeline:

- **4 key metrics** at a glance: Total opportunities, Need to Apply, Applied, and Interview stages
- **Upcoming Deadlines** with color-coded countdown badges (red for urgent, yellow for soon, green for plenty of time)
- **Recent Activity** feed showing your latest additions

### 2. Full Opportunity Management (CRUD)

Track every detail of each opportunity:

| Field | Description |
|-------|-------------|
| Title | Name of the program |
| URL | Link to the application page |
| Deadline | Application closing date with auto-countdown |
| Status | 7-stage workflow (see below) |
| Funding Type | Fully funded, partially funded, unpaid, etc. |
| Category | Fellowship, internship, hackathon, volunteering, job, scholarship, other |
| Location | Country or city |
| Travel & Accommodation | What is covered |
| Notes | Any additional details |
| Applied Date | When you submitted your application |

### 3. Application Status Workflow

A structured pipeline that mirrors the real application process:

```
Need to Apply  -->  Applied  -->  Under Review  -->  Interview  -->  Accepted
                         |               |
                         v               v
                      Rejected         Rejected
                         
                         or
                         
                      Mark as Scam (terminal)
```

The detail page only shows valid next-step buttons based on the current status, preventing invalid state transitions.

### 4. Search and Filtering

Find any opportunity instantly:

- **Text search** across title and location
- **Filter by status** (e.g., show only "Applied" opportunities)
- **Filter by funding type** (e.g., show only "Fully Funded")
- **Filter by category** (e.g., show only "Fellowships")
- All filters work together with AND logic

### 5. Scam Detection & Blacklist

Protect yourself from fraudulent programs:

- **Dedicated Scam List page** showing all flagged opportunities in red
- **Mark any opportunity as a scam** from the detail view
- **Unmark scams** if flagged in error (reverts to "Need to Apply")
- **AI-powered scam analysis** (see AI features below)

### 6. Deadline Reminders

Never miss a deadline again:

- Browser Notification API integration
- Automatic reminders scheduled **3 days before** each deadline
- Color-coded countdown badges throughout the interface
- Days-until-deadline calculations on every card

---

## AI-Powered Features

OppTracker integrates **Google Gemini 3.6 Flash** to provide four intelligent tools:

### 1. URL Analyzer

Paste any opportunity URL and the AI extracts:

- Title, deadline, funding type, category, location
- Travel and accommodation details
- Application requirements
- **Scam score** (0-100) with color-coded risk indicator
- Red flags and green flags
- Summary of the opportunity

This turns a 10-minute manual research task into a **5-second automated analysis**.

### 2. Cover Letter Generator

Generate personalized cover letters in seconds:

- Select any opportunity from your tracker
- Edit your profile (name, background, skills, interests) stored locally
- Add extra context specific to this application
- Receive a **300-400 word personalized cover letter** tailored to the opportunity
- **Copy to clipboard** with one click

The AI uses your profile and the opportunity details to write letters that sound like you, not a template.

### 3. Smart Chat Assistant

A conversational AI that knows your entire tracker:

- Ask questions like "What fully funded opportunities do I have?"
- Get deadline summaries: "Which deadlines are coming up soon?"
- Request analysis: "Which opportunities should I prioritize?"
- The AI has access to **all your opportunities** and your profile
- Maintains chat history for contextual follow-up questions
- Renders formatted responses with markdown (headers, bold, lists, code blocks)

### 4. Scam Detector

Analyze any opportunity for fraud signals:

- Select an opportunity from your tracker or enter custom details
- Receive a **scam score** from 0-100
- Get a list of **red flags** (warning signs)
- Get a list of **green flags** (positive indicators)
- Receive a clear recommendation:
  - **Apply with confidence** (score 0-30)
  - **Proceed with caution** (score 31-60)
  - **Do not apply** (score 61-100)
- Detailed summary explaining the assessment

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 + TypeScript | Type safety, modern React features, large ecosystem |
| **Build Tool** | Vite 8 | Fast development server, optimized builds |
| **Routing** | React Router 7 | Client-side routing for SPA |
| **Styling** | Tailwind CSS 4 | Rapid UI development, consistent design system |
| **Backend** | Supabase (PostgreSQL) | Instant API, real-time subscriptions, Row Level Security |
| **AI** | Google Gemini 3.6 Flash | Fast, accurate, free tier available |
| **Deployment** | Vercel | Zero-config deployment, global CDN, free tier |

---

## Architecture

```
OppTracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/          # Page wrapper, navigation
│   │   ├── ui/              # Stats cards, status badges
│   │   └── ai/              # AI tool interfaces
│   ├── pages/               # Route-level components
│   │   ├── Dashboard        # Overview with stats
│   │   ├── OpportunitiesList # Searchable, filterable list
│   │   ├── OpportunityForm  # Add/edit form
│   │   ├── OpportunityDetail # Single view + status workflow
│   │   ├── ScamList         # Blacklisted scams
│   │   └── AiAssistant      # Tabbed AI tools
│   ├── hooks/               # Custom React hooks
│   │   ├── useOpportunities # CRUD operations
│   │   └── useGemini        # AI integration
│   └── lib/                 # Utilities and config
│       ├── types.ts         # TypeScript definitions
│       ├── supabase.ts      # Database client
│       ├── gemini.ts        # AI client
│       └── notifications.ts # Browser notifications
├── supabase/
│   └── schema.sql           # Database schema + RLS
└── vercel.json              # Deployment config
```

---

## Database Design

Single-table architecture for simplicity:

**Table: `opportunities`**

- UUID primary key
- Automatic timestamps (created_at, updated_at)
- Status field with CHECK constraints ensuring valid states
- Funding type and category with CHECK constraints
- User ID field (ready for multi-user authentication)
- Row Level Security enabled for data protection

**Key Design Decisions:**

- Single table minimizes complexity for a hackathon project
- CHECK constraints enforce data integrity at the database level
- Auto-updating `updated_at` trigger keeps timestamps accurate
- RLS policies ready for when authentication is added

---

## Design Philosophy

### Visual Identity

- **Dark theme** with deep navy background (#0a0a0f)
- **Animated bokeh effect** with floating light particles
- **Glass-morphism cards** with backdrop blur and subtle blue borders
- **Color-coded status system** for instant visual recognition
- **JetBrains Mono** for headings, **Inter** for body text

### Color System

| Status | Color | Meaning |
|--------|-------|---------|
| Need to Apply | Yellow | Action required |
| Applied | Blue | Waiting for response |
| Under Review | Purple | In progress |
| Interview | Cyan | Active engagement |
| Accepted | Green | Success |
| Rejected | Red | Not selected |
| Scam | Dark Red | Fraudulent |

### User Experience

- **One-click navigation** between all sections
- **Instant search** with real-time filtering
- **Confirmation dialogs** before destructive actions
- **Responsive design** that works on desktop and mobile
- **Graceful degradation** when API keys are missing

---

## Deployment

### Live Demo

The application is deployed on Vercel with automatic deployments from GitHub.

### Cost

**$0/month** using free tiers:

- Vercel: Free hosting for personal projects
- Supabase: Free tier with 500MB database, 1GB file storage
- Google Gemini: Free tier with generous rate limits

### Setup

3 environment variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
```

Deploy with one command: `vercel`

---

## What Makes OppTracker Different

1. **AI-Native**: Not just a tracker, but an intelligent assistant that analyzes opportunities, writes cover letters, and detects scams
2. **Workflow-Oriented**: The 7-stage status pipeline mirrors how applications actually work
3. **Scam Protection**: Built-in fraud detection protects users from wasting time on fake programs
4. **Personalization**: AI cover letters are tailored to your profile, not generic templates
5. **Zero Cost**: Runs entirely on free tiers, accessible to anyone
6. **Privacy-First**: User data stays in Supabase with Row Level Security; no third-party tracking

---

## Future Roadmap

- [ ] **User Authentication**: Login/signup with Supabase Auth
- [ ] **Multi-User Support**: Team collaboration for application groups
- [ ] **Mobile App**: React Native version for on-the-go tracking
- [ ] **Browser Extension**: Auto-capture opportunities from any website
- [ ] **Email Integration**: Auto-import opportunities from email notifications
- [ ] **Calendar Sync**: Export deadlines to Google Calendar / Outlook
- [ ] **Analytics Dashboard**: Application success rates, time-to-response metrics
- [ ] **Community Features**: Share scam reports, recommend opportunities
- [ ] **Multi-Language Support**: Interface in multiple languages
- [ ] **Offline Mode**: Work without internet connection

---

## Built With

- **React** for the user interface
- **Supabase** for the backend and database
- **Google Gemini** for AI capabilities
- **Tailwind CSS** for styling
- **Vite** for development and building
- **Vercel** for deployment

---

## Summary

OppTracker is a complete solution for managing international opportunity applications. It combines:

- **Comprehensive tracking** with a 7-stage workflow
- **AI-powered automation** for analysis, cover letters, and scam detection
- **Beautiful design** with a dark theme and intuitive navigation
- **Zero cost** running on free tiers of modern platforms
- **Privacy-first architecture** with Row Level Security

It solves a real problem that affects millions of students and young professionals worldwide, and it does so with intelligence, elegance, and accessibility.

---

*Built for the hackathon by Ilyas*
*GitHub: https://github.com/Ilyasrf/OppTracker*
