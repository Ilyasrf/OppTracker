CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT DEFAULT 'single-user',
  title TEXT NOT NULL,
  url TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'need_to_apply' CHECK (status IN ('need_to_apply','applied','under_review','interview','accepted','rejected','scam')),
  funding_type TEXT DEFAULT 'unknown' CHECK (funding_type IN ('fully_funded','partial','unpaid','unknown')),
  location TEXT,
  travel_accommodation TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('fellowship','internship','hackathon','volunteering','other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations"
  ON opportunities FOR ALL
  USING (true)
  WITH CHECK (true);

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
