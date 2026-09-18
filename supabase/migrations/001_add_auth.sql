-- Historical migration retired: its instructions were incomplete and unsafe.
-- Existing authenticated installations require no migration for this release.
-- Never run schema.sql against existing tables or drop/recreate opportunities.
DO $$ BEGIN
  RAISE EXCEPTION 'Legacy migration disabled. Inspect the live schema and take a verified backup before preparing an installation-specific additive migration.';
END $$;
