-- Simple schema update to fix the most critical issues

-- Add created_at timestamps to all tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE finance_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add title field to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;

-- Add status field to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create RLS policies to allow access to data
CREATE POLICY IF NOT EXISTS "Allow all access to clients" ON clients FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to finance_reports" ON finance_reports FOR ALL USING (true);
