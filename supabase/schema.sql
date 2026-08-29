-- Drop existing policies and trigger
DROP POLICY IF EXISTS "Allow all operations" ON opportunities;
DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
DROP FUNCTION IF EXISTS update_updated_at();

-- Recreate the table with proper user_id
-- IMPORTANT: Run the migration script first to preserve existing data
-- See migrations/001_add_auth.sql

DROP TABLE IF EXISTS opportunities;

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'need_to_apply' CHECK (status IN ('need_to_apply','applied','under_review','interview','accepted','rejected','scam')),
  funding_type TEXT DEFAULT 'unknown' CHECK (funding_type IN ('fully_funded','partial','unpaid','unknown')),
  location TEXT,
  travel_accommodation TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('fellowship','internship','hackathon','volunteering','job','forum','other')),
  notes TEXT,
  applied_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Users can only read their own opportunities
CREATE POLICY "Users can read own opportunities"
  ON opportunities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own opportunities
CREATE POLICY "Users can insert own opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own opportunities
CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own opportunities
CREATE POLICY "Users can delete own opportunities"
  ON opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- User profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  background TEXT DEFAULT '',
  interests TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
