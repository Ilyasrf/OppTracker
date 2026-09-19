# OppTracker

A personal notebook for fellowships, internships, jobs, and other applications.
Built with React, TypeScript, Vite, Supabase Auth/Postgres, and Vercel.

## Daily use

- **My desk:** next pending application, upcoming deadlines, overdue applications, and recently updated records. Submitted applications are excluded from the application to-do list; their original deadlines remain in their records.
- **Opportunities:** search title/place/notes, filter status/funding/category, and sort by deadline, update time, or title.
- **Export backup:** downloads every fetched opportunity as JSON, including IDs and timestamps. Keep the export private. This is an opportunity export, not a full Supabase database backup; it does not include Auth users or profiles. No automatic import/restore is implemented.
- **Calendar:** downloads pending future deadlines as an `.ics` file with 3-day, 1-day, and 1-hour alarms. Import it into your calendar and confirm alerts are enabled there. Calendar apps may handle alarms differently. This is a snapshot, not a subscription: export/import again when deadlines change, and remove obsolete calendar events when you apply or change a deadline. The website does not send email or background push notifications.
- **Dates:** enter deadlines in the timezone displayed beside the input. Dates are stored as UTC timestamps and displayed in your device timezone. Verify the organizer's timezone before saving.
- **Notes & next steps:** keep application-specific requirements and follow-ups in opportunity notes.
- **Preparation:** create certificate, job interview, and course plans with target dates, linked opportunities, editable starter checklists, study resources, and reflections. Save changes explicitly to sync across devices. Mark plans completed or archive them; nothing is automatically deleted. Target dates do not schedule notifications. Export plans separately to include their checklists and notes.
- **AI history:** conversations are saved to your Supabase account before requesting a reply and again after receiving it. Open previous conversations, search their titles, start a new chat, or export the current chat. Failed AI replies can be retried without duplicating your question. Each conversation holds up to 200 messages within a 2 MB storage limit; AI context uses the latest 10 messages within a 12,000-character budget. Conversations from the old, memory-only chat cannot be recovered.
- **Preparation coaching:** after saving a plan, choose “Prepare with AI.” Review the prepared prompt, then send it. Only the plan details included in that prompt are shared; AI does not automatically read every preparation plan or change your checklists.
- **AI:** draft letters, discuss saved opportunities, extract a draft from pasted official source text, and review possible risk signals. AI cannot browse websites, verify legitimacy, or change records. Review and save extracted drafts yourself. Extracted dates stay in notes until you verify their exact time and timezone.
- Preparation edits and chat messages awaiting a successful save are kept in this tab’s session storage, scoped to your account, for recovery after navigation/reload. This is not a backup: closing the tab, clearing browser data, or blocked storage can lose unsaved drafts. Save or export before leaving; the UI reports failures and offers recovery. Other AI panels retain drafts only while mounted.
- Concurrent edits use a server timestamp check. A stale tab cannot overwrite a newer plan or conversation. Export an unsaved draft, then reload the saved version to resolve a conflict.

## Authentication

Login, signup, and confirmation use the existing Supabase Auth project and account data. The screens share the notebook design, support password managers and password visibility, and return you to the protected page you opened before signing in. Signup handles both email confirmation and immediate sessions according to your existing Supabase settings. Failed or expired callback links show a sign-in recovery message. No provider settings, existing passwords, users, or sessions are reset by this release.

Run `python tests/auth_smoke.py` against the same dummy Vite endpoint documented below to test login/signup/confirmation, sign-out (including remote revocation failure), protected redirects, external redirect rejection, and desktop/mobile layout without creating real accounts or sending emails.

## Local development

Node.js 22.18+ is recommended. Copy `.env.example` to `.env.local`, then configure your Supabase URL and public/anon key. Never use a service-role key in the browser.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

`npm run dev` serves the frontend. Use `vercel dev` to run the local `/api/ai` serverless route as well, or test AI against a preview deployment with the server environment configured. Missing AI configuration produces a helpful error and does not affect opportunity management.

## Production rollout — existing installation

This release **requires the additive migration** [`002_preparation_and_chat.sql`](supabase/migrations/002_preparation_and_chat.sql) for chat history and preparation. It creates only new tables, validation functions, policies, indexes, and triggers; it does not update or remove existing opportunities or profiles. Until applied, the new sections show a setup message while existing opportunity management continues to work.

Do **not** run `supabase/schema.sql` or migration `001_add_auth.sql` against production. The schema is for a fresh database only and refuses existing tracker tables; migration 001 is disabled. For a new installation, run the schema first, then migration 002. Migration 002 is transactional and intended to run once; a repeat run fails and rolls back without deleting records.

1. Before rollout, export opportunities and take a database backup using your Supabase backup process. Verify the opportunity count and that the backup is usable. No backup is automatically taken by this code change.
2. Test migration 002 on a separate Supabase test project, then apply it once through the Supabase SQL Editor on the existing project. Verify your opportunity count and sample records are unchanged. Both new tables have owner-only RLS and no client delete permission. Linked opportunities must belong to the same user. The code push does not apply SQL automatically.
3. Verify the deployed `opportunities` and `profiles` tables have the owner-only RLS policies expected by this repository. The frontend's `user_id` filters are not a substitute for database authorization.
4. Configure these **server-only** Vercel environment variables:

   | Variable             | Value                                       |
   | -------------------- | ------------------------------------------- |
   | `GEMINI_API_KEY`     | A new Gemini API key                        |
   | `GEMINI_MODEL`       | A model ID available to your Gemini project |
   | `AI_ALLOWED_USER_ID` | Your existing Supabase Auth user UUID       |

   The function uses `SUPABASE_URL` / `SUPABASE_ANON_KEY` when provided, otherwise the existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. It never requires a service-role key.

5. Preview and test with a separate test backend or the isolated mock test described below. A preview pointed at production can still write production records.
6. Deploy the verified frontend and API together. Revoke the old browser-exposed Gemini key and remove `VITE_GEMINI_API_KEY` from deployment environments. Old cached builds can contain the old key; revocation is necessary.
7. Verify login, existing opportunity count, AI access, calendar import, a saved/reloaded conversation, and a saved/reloaded preparation plan. Keep the previous deployment available for frontend rollback. Rolling back does not restore a revoked key; prefer disabling AI temporarily over re-exposing a key.

The API verifies the Supabase access token, restricts access to the configured owner, limits prompt size, masks upstream errors, and times out slow requests. Its small in-memory request limit is per function instance, not a durable cost cap. Set appropriate Gemini quotas/billing alerts. Use a shared limit if the app later serves multiple users.

## Isolated browser checks

`tests/browser_smoke.py` intercepts all API traffic and aborts unexpected external requests. It creates, updates, and exports only in-memory fixtures. It must use the dummy Supabase endpoint below.

```sh
VITE_SUPABASE_URL=https://opptracker-test.invalid VITE_SUPABASE_ANON_KEY=public-test-key npm run dev -- --host 127.0.0.1 --port 5173
# In another terminal with Python Playwright and Chromium installed:
python tests/browser_smoke.py
```

The test also covers saved/reloaded conversations, reply retries, unsaved draft recovery, preparation checklists, resources, coaching prompts, exports, archiving, concurrent-write rejection, missing-migration messages, and mobile preparation layout.

The test covers deadline filtering, export, search, timezone-preserving edits, failed saves, applied timestamps, unsafe AI text, failed profile saves, malformed AI responses, draft capture, mobile layout/navigation, and failed reads. Screenshots are written to `/tmp/opptracker-desktop.png` and `/tmp/opptracker-mobile.png`.

The hand-drawn headings use the self-hosted Caveat font from Google Fonts, licensed under the SIL Open Font License in `public/fonts/OFL.txt`.

## Local database-policy check

The migration check runs real PostgreSQL semantics in an in-memory PGlite instance. It uses two dummy users to verify RLS, linked-opportunity ownership, JSON validation, concurrent writes, disabled deletion, and preservation of existing opportunity rows. No network database is contacted and no runtime dependency is added to the app.

```sh
npm install --prefix /tmp/opptracker-sql-check @electric-sql/pglite
PGLITE_MODULE=/tmp/opptracker-sql-check/node_modules/@electric-sql/pglite/dist/index.js node tests/migration_check.mjs
```

For a frontend rollback, retain the additive tables and switch to the previous deployment. Do not drop the tables: that would delete newly saved plans and conversations.
