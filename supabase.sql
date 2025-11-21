-- =============================================
-- COMPLETE DATABASE SETUP FOR COSMIC FIRE
-- Run this after database reset
-- =============================================

-- Create donations table WITHOUT strict foreign key constraint
CREATE TABLE IF NOT EXISTS donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Made optional, no REFERENCES constraint
    amount DECIMAL(10,2) NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS donations_user_id_idx ON donations(user_id);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON donations(created_at);

-- Enable Row Level Security
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can insert donations
CREATE POLICY "Anyone can insert donations" ON donations
    FOR INSERT WITH CHECK (true);

-- Anyone can read donations
CREATE POLICY "Anyone can read donations" ON donations
    FOR SELECT USING (true);

-- Only authenticated users can update their own donations
CREATE POLICY "Users can update own donations" ON donations
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create goals table to store configurable goals
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_name TEXT NOT NULL DEFAULT 'default',
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 1000000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(goal_name)
);

-- Insert default goal
INSERT INTO goals (goal_name, target_amount) 
VALUES ('default', 1000000000.00)
ON CONFLICT (goal_name) DO NOTHING;

-- Enable Row Level Security for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Anyone can read goals
CREATE POLICY "Anyone can read goals" ON goals
    FOR SELECT USING (true);

-- Only authenticated users can update goals
CREATE POLICY "Authenticated users can update goals" ON goals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger for goals updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to be more permissive for real-time
DROP POLICY IF EXISTS "Anyone can insert donations" ON donations;
DROP POLICY IF EXISTS "Anyone can read donations" ON donations;
DROP POLICY IF EXISTS "Users can update own donations" ON donations;

-- Recreate simpler policies for real-time to work properly
CREATE POLICY "Enable all operations for donations" ON donations
FOR ALL USING (true);

CREATE POLICY "Enable all operations for goals" ON goals
FOR ALL USING (true);





-- Enable real-time for donations table
BEGIN;
  -- Drop existing publication if any
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  
  -- Create publication
  CREATE PUBLICATION supabase_realtime;
  
  -- Add tables to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE donations;
  ALTER PUBLICATION supabase_realtime ADD TABLE goals;
COMMIT;


-- Check total amount
SELECT SUM(amount) as total_raised FROM donations;

