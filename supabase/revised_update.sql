-- Revised schema update to work with existing tables

-- Add created_at timestamps to tables that might not have them
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add title field to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;

-- Add status field to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ensure RLS policies exist
CREATE POLICY IF NOT EXISTS "Allow all access to clients" ON clients FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to finances" ON finances FOR ALL USING (true);
