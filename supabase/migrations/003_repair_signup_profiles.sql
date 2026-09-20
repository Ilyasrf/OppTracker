-- Repair the existing signup trigger without replacing users or opportunities.
-- Also create missing profiles for existing users, preserving every existing profile.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, coalesce(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

INSERT INTO public.profiles (id, email)
SELECT id, coalesce(email, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;

COMMIT;
