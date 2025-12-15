-- =============================================
-- COMPLETE DATABASE SETUP FOR BillionToHeaven
-- Run this after database reset
-- =============================================

-- First, drop all existing tables if they exist (clean start)
DROP TABLE IF EXISTS bottle_queue_entries CASCADE;
DROP TABLE IF EXISTS bottle_replies CASCADE;
DROP TABLE IF EXISTS message_bottles CASCADE;
DROP TABLE IF EXISTS bottle_inventory CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS donations CASCADE;

-- Create donations table
CREATE TABLE donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bottle inventory table
CREATE TABLE bottle_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'empty' CHECK (status IN ('empty', 'filled', 'dropped')),
    filled_at TIMESTAMP WITH TIME ZONE,
    dropped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(donation_id) -- Each donation gives exactly one bottle
);

-- =============================================
-- QUEUE TABLE (MINIMAL - STEP 1)
-- =============================================

CREATE TABLE bottle_queue_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    donation_id UUID UNIQUE NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'served')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    served_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- MESSAGE BOTTLE SYSTEM TABLES
-- =============================================

-- Message bottles table
CREATE TABLE message_bottles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Connection to donation
    sender_donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
    
    -- Connection to inventory
    inventory_id UUID REFERENCES bottle_inventory(id) ON DELETE SET NULL,
    
    -- Message content
    message TEXT NOT NULL CHECK (char_length(message) <= 280),
    is_anonymous BOOLEAN DEFAULT true,
    show_donation_amount BOOLEAN DEFAULT false,
    allow_reply BOOLEAN DEFAULT true,
    
    -- Bottle metadata
    bottle_color VARCHAR(20) DEFAULT 'blue',
    status VARCHAR(20) DEFAULT 'floating' CHECK (status IN ('floating', 'found', 'read', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    found_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Found by (when bottle is found)
    finder_donation_id UUID REFERENCES donations(id) ON DELETE SET NULL
);

-- Bottle replies table (for Phase 5)
CREATE TABLE bottle_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bottle_id UUID REFERENCES message_bottles(id) ON DELETE CASCADE,
    sender_donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
    message TEXT NOT NULL CHECK (char_length(message) <= 280),
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CONTINUE WITH EXISTING TABLES
-- =============================================

-- Create goals table to store configurable goals
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_name TEXT NOT NULL DEFAULT 'default',
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 1000000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(goal_name)
);

-- =============================================
-- CREATE INDEXES (MUST BE SEPARATE FROM CREATE TABLE)
-- =============================================

-- Donations indexes
CREATE INDEX donations_user_id_idx ON donations(user_id);
CREATE INDEX donations_created_at_idx ON donations(created_at);

-- Bottle inventory indexes
CREATE INDEX idx_inventory_user_status ON bottle_inventory(user_id, status);
CREATE INDEX idx_inventory_donation ON bottle_inventory(donation_id);

-- Queue indexes (MINIMAL - STEP 1)
CREATE INDEX idx_queue_waiting_position ON bottle_queue_entries (queue_position) WHERE status = 'waiting';
CREATE INDEX idx_queue_user ON bottle_queue_entries (user_id, status);

-- Message bottles indexes
CREATE INDEX idx_bottles_status ON message_bottles(status);
CREATE INDEX idx_bottles_sender ON message_bottles(sender_donation_id);
CREATE INDEX idx_bottles_finder ON message_bottles(finder_donation_id);
CREATE INDEX idx_bottles_inventory ON message_bottles(inventory_id);
CREATE INDEX idx_bottles_floating ON message_bottles(status, created_at) WHERE status = 'floating';

-- Bottle replies indexes
CREATE INDEX idx_replies_bottle ON bottle_replies(bottle_id);
CREATE INDEX idx_replies_sender ON bottle_replies(sender_donation_id);

-- Goals indexes
CREATE INDEX idx_goals_name ON goals(goal_name);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert default goal
INSERT INTO goals (goal_name, target_amount) 
VALUES ('default', 1000000000.00)
ON CONFLICT (goal_name) DO NOTHING;

-- =============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for donations
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for goals updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get bottle color based on donation amount
CREATE OR REPLACE FUNCTION get_bottle_color(amount DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE
        WHEN amount < 5 THEN 'blue'
        WHEN amount < 20 THEN 'green'
        WHEN amount < 50 THEN 'purple'
        WHEN amount < 100 THEN 'gold'
        ELSE 'rainbow'
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set queue position on insert
CREATE OR REPLACE FUNCTION set_queue_position()
RETURNS TRIGGER AS $$
DECLARE
    max_position INTEGER;
BEGIN
    IF NEW.queue_position IS NULL THEN
        SELECT COALESCE(MAX(queue_position), 0) INTO max_position 
        FROM bottle_queue_entries;
        
        NEW.queue_position := max_position + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bottle_queue_position 
BEFORE INSERT ON bottle_queue_entries
FOR EACH ROW EXECUTE FUNCTION set_queue_position();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable Row Level Security
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_replies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE POLICIES (SIMPLE FOR REAL-TIME)
-- =============================================

-- Drop existing policies if any (for safety)
DO $$ 
BEGIN
    -- Donations policies
    DROP POLICY IF EXISTS "Enable all operations for donations" ON donations;
    DROP POLICY IF EXISTS "Anyone can insert donations" ON donations;
    DROP POLICY IF EXISTS "Anyone can read donations" ON donations;
    DROP POLICY IF EXISTS "Users can update own donations" ON donations;
    
    -- Bottle inventory policies
    DROP POLICY IF EXISTS "Enable all operations for inventory" ON bottle_inventory;
    
    -- Queue policies
    DROP POLICY IF EXISTS "Enable all operations for queue" ON bottle_queue_entries;
    
    -- Goals policies
    DROP POLICY IF EXISTS "Enable all operations for goals" ON goals;
    DROP POLICY IF EXISTS "Anyone can read goals" ON goals;
    DROP POLICY IF EXISTS "Authenticated users can update goals" ON goals;
    
    -- Message bottles policies
    DROP POLICY IF EXISTS "Enable all operations for bottles" ON message_bottles;
    DROP POLICY IF EXISTS "Anyone can insert bottles" ON message_bottles;
    DROP POLICY IF EXISTS "Anyone can read floating bottles" ON message_bottles;
    DROP POLICY IF EXISTS "Users can read their own bottles" ON message_bottles;
    DROP POLICY IF EXISTS "Users can update their own bottles" ON message_bottles;
    
    -- Bottle replies policies
    DROP POLICY IF EXISTS "Enable all operations for replies" ON bottle_replies;
    DROP POLICY IF EXISTS "Anyone can insert replies" ON bottle_replies;
    DROP POLICY IF EXISTS "Users can read replies to their bottles" ON bottle_replies;
    DROP POLICY IF EXISTS "Users can read replies they sent" ON bottle_replies;
EXCEPTION
    WHEN undefined_object THEN 
        NULL; -- Policies don't exist yet, that's fine
END $$;

-- Create simple policies for real-time to work properly
CREATE POLICY "Enable all operations for donations" ON donations
FOR ALL USING (true);

CREATE POLICY "Enable all operations for inventory" ON bottle_inventory
FOR ALL USING (true);

CREATE POLICY "Enable all operations for queue" ON bottle_queue_entries
FOR ALL USING (true);

CREATE POLICY "Enable all operations for goals" ON goals
FOR ALL USING (true);

CREATE POLICY "Enable all operations for bottles" ON message_bottles
FOR ALL USING (true);

CREATE POLICY "Enable all operations for replies" ON bottle_replies
FOR ALL USING (true);

-- =============================================
-- ENABLE REAL-TIME
-- =============================================

BEGIN;
  -- Drop existing publication if any
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  
  -- Create publication
  CREATE PUBLICATION supabase_realtime;
  
  -- Add tables to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE donations;
  ALTER PUBLICATION supabase_realtime ADD TABLE bottle_inventory;
  ALTER PUBLICATION supabase_realtime ADD TABLE bottle_queue_entries;
  ALTER PUBLICATION supabase_realtime ADD TABLE goals;
  ALTER PUBLICATION supabase_realtime ADD TABLE message_bottles;
  ALTER PUBLICATION supabase_realtime ADD TABLE bottle_replies;
COMMIT;

-- =============================================
-- INITIAL DATA CHECK
-- =============================================

-- Check all tables were created
SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check initial total amount (will be 0 initially)
SELECT COALESCE(SUM(amount), 0) as total_raised FROM donations;

-- Show table structure
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
