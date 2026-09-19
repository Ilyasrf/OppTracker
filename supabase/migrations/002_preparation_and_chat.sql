-- Additive migration: new tables only. No opportunity/profile rows are changed.
-- Run once in Supabase SQL Editor after a verified backup. Transaction rolls back on error.
BEGIN;

CREATE FUNCTION public.notebook_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

-- Validate JSON item shapes as well as table ownership at the database boundary.
CREATE FUNCTION public.valid_chat_messages(items jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_typeof(items) = 'array' AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(items) item WHERE NOT coalesce(
      jsonb_typeof(item) = 'object'
      AND jsonb_typeof(item->'id') = 'string' AND length(item->>'id') BETWEEN 1 AND 64
      AND item->>'role' IN ('user', 'assistant')
      AND jsonb_typeof(item->'content') = 'string' AND length(item->>'content') BETWEEN 1 AND 100000
      AND jsonb_typeof(item->'timestamp') = 'string'
      AND item->>'timestamp' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$', false)
  );
$$;
CREATE FUNCTION public.valid_preparation_tasks(items jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_typeof(items) = 'array' AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(items) item WHERE NOT coalesce(
      jsonb_typeof(item) = 'object'
      AND jsonb_typeof(item->'id') = 'string' AND length(item->>'id') BETWEEN 1 AND 64
      AND jsonb_typeof(item->'title') = 'string' AND length(btrim(item->>'title')) BETWEEN 1 AND 300
      AND jsonb_typeof(item->'done') = 'boolean', false)
  );
$$;

CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 120),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (public.valid_chat_messages(messages) AND jsonb_array_length(messages) <= 200 AND octet_length(messages::text) <= 2000000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX ai_conversations_owner ON public.ai_conversations(user_id);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_read ON public.ai_conversations FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY conversation_insert ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY conversation_update ON public.ai_conversations FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE TRIGGER conversation_timestamp BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.notebook_updated_at();

CREATE TABLE public.preparation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  kind text NOT NULL CHECK (kind IN ('certificate', 'interview', 'course')),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'archived')),
  provider text NOT NULL DEFAULT '' CHECK (length(provider) <= 200),
  target_date date,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 20000),
  resources text NOT NULL DEFAULT '' CHECK (length(resources) <= 10000),
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (public.valid_preparation_tasks(tasks) AND jsonb_array_length(tasks) <= 100 AND octet_length(tasks::text) <= 100000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX preparation_owner ON public.preparation_plans(user_id);
ALTER TABLE public.preparation_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY preparation_read ON public.preparation_plans FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY preparation_insert ON public.preparation_plans FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) = user_id AND (opportunity_id IS NULL OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.user_id = (SELECT auth.uid())))
);
CREATE POLICY preparation_update ON public.preparation_plans FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK (
  (SELECT auth.uid()) = user_id AND (opportunity_id IS NULL OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.user_id = (SELECT auth.uid())))
);
CREATE TRIGGER preparation_timestamp BEFORE UPDATE ON public.preparation_plans FOR EACH ROW EXECUTE FUNCTION public.notebook_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.ai_conversations, public.preparation_plans TO authenticated;
REVOKE DELETE ON public.ai_conversations, public.preparation_plans FROM authenticated;
REVOKE ALL ON public.ai_conversations, public.preparation_plans FROM anon;
-- No delete policy: keep chat history and archive preparation plans instead.
COMMIT;
