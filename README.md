# OppTracker

A personal notebook for fellowships, internships, jobs, and other applications.
Built with React, TypeScript, Vite, Supabase Auth/Postgres, and Vercel.

## Daily use

- **My desk:** next pending application, upcoming deadlines, overdue applications, and recently updated records. Submitted applications are excluded from the application to-do list; their original deadlines remain in their records.
- **Opportunities:** search title/place/notes, filter status/funding/category, and sort by deadline, update time, or title.
- **Export backup:** downloads every fetched opportunity as JSON, including IDs and timestamps. Keep the export private. This is an opportunity export, not a full Supabase database backup; it does not include Auth users or profiles. No automatic import/restore is implemented.
- **Calendar:** downloads pending future deadlines as an `.ics` file with 3-day, 1-day, and 1-hour alarms. Import it into your calendar and confirm alerts are enabled there. Calendar apps may handle alarms differently. This is a snapshot, not a subscription: export/import again when deadlines change, and remove obsolete calendar events when you apply or change a deadline. The website does not send email or background push notifications.
- **Dates:** enter deadlines in the timezone displayed beside the input. Dates are stored as UTC timestamps and displayed in your device timezone. Verify the organizer's timezone before saving.
- **Notes & next steps:** record requirements, preparation tasks, and follow-up plans in the existing notes field. This release needs no new columns.
- **AI:** draft letters, discuss saved opportunities, extract a draft from pasted official source text, and review possible risk signals. AI cannot browse websites, verify legitimacy, or change records. Review and save extracted drafts yourself. Extracted dates stay in notes until you verify their exact time and timezone.
- AI panels retain their drafts when switching tabs, but navigating away or reloading clears unsaved AI results.

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

This release **does not require a database migration**. Do not run either SQL file against the existing production database. `supabase/schema.sql` is for a fresh database only; it now refuses to run when tracker tables already exist. The incomplete historical migration is disabled.

1. Before rollout, export opportunities and take a database backup using your Supabase backup process. Verify the opportunity count and that the backup is usable. No backup is automatically taken by this code change.
2. Verify the deployed `opportunities` and `profiles` tables have the owner-only RLS policies expected by this repository. The frontend's `user_id` filters are not a substitute for database authorization.
3. Configure these **server-only** Vercel environment variables:

   | Variable             | Value                                       |
   | -------------------- | ------------------------------------------- |
   | `GEMINI_API_KEY`     | A new Gemini API key                        |
   | `GEMINI_MODEL`       | A model ID available to your Gemini project |
   | `AI_ALLOWED_USER_ID` | Your existing Supabase Auth user UUID       |

   The function uses `SUPABASE_URL` / `SUPABASE_ANON_KEY` when provided, otherwise the existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. It never requires a service-role key.

4. Preview and test with a separate test backend or the isolated mock test described below. A preview pointed at production can still write production records.
5. Deploy the verified frontend and API together. Revoke the old browser-exposed Gemini key and remove `VITE_GEMINI_API_KEY` from deployment environments. Old cached builds can contain the old key; revocation is necessary.
6. Verify login, existing opportunity count, AI access, and calendar import. Keep the previous deployment available for frontend rollback. Rolling back does not restore a revoked key; prefer disabling AI temporarily over re-exposing a key.

The API verifies the Supabase access token, restricts access to the configured owner, limits prompt size, masks upstream errors, and times out slow requests. Its small in-memory request limit is per function instance, not a durable cost cap. Set appropriate Gemini quotas/billing alerts. Use a shared limit if the app later serves multiple users.

## Isolated browser checks

`tests/browser_smoke.py` intercepts all API traffic and aborts unexpected external requests. It creates, updates, and exports only in-memory fixtures. It must use the dummy Supabase endpoint below.

```sh
VITE_SUPABASE_URL=https://opptracker-test.invalid VITE_SUPABASE_ANON_KEY=public-test-key npm run dev -- --host 127.0.0.1 --port 5173
# In another terminal with Python Playwright and Chromium installed:
python tests/browser_smoke.py
```

The test covers deadline filtering, export, search, timezone-preserving edits, failed saves, applied timestamps, unsafe AI text, failed profile saves, malformed AI responses, draft capture, mobile layout/navigation, and failed reads. Screenshots are written to `/tmp/opptracker-desktop.png` and `/tmp/opptracker-mobile.png`.

The hand-drawn headings use the self-hosted Caveat font from Google Fonts, licensed under the SIL Open Font License in `public/fonts/OFL.txt`.
