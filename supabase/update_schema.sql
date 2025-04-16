-- Add missing fields to match the application requirements

-- Add created_at timestamps to all tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE finance_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add title field to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;

-- Add status field to clients with default 'active'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add email field to clients for better client management
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;

-- Create RLS policies to allow access to data
CREATE POLICY IF NOT EXISTS "Allow all access to clients" ON clients FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to ideas" ON ideas FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access to finance_reports" ON finance_reports FOR ALL USING (true);

-- Insert some sample data if tables are empty
INSERT INTO clients (name, status, email)
SELECT 'Acme Corporation', 'active', 'contact@acme.com'
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

INSERT INTO clients (name, status, email)
SELECT 'TechStart Inc', 'active', 'info@techstart.com'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'TechStart Inc');

INSERT INTO clients (name, status, email)
SELECT 'Global Media', 'active', 'hello@globalmedia.com'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Global Media');

-- Insert sample tasks if none exist
INSERT INTO tasks (client_id, title, description, status, timer_end)
SELECT 
  (SELECT id FROM clients WHERE name = 'Acme Corporation' LIMIT 1),
  'Website Redesign',
  'Complete overhaul of company website',
  'In Progress',
  now() + interval '7 days'
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Acme Corporation')
AND NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);

INSERT INTO tasks (client_id, title, description, status, timer_end)
SELECT 
  (SELECT id FROM clients WHERE name = 'TechStart Inc' LIMIT 1),
  'Social Media Campaign',
  'Q2 marketing campaign across all platforms',
  'Pending',
  now() + interval '14 days'
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'TechStart Inc');

INSERT INTO tasks (client_id, title, description, status, timer_start, timer_end)
SELECT 
  (SELECT id FROM clients WHERE name = 'Global Media' LIMIT 1),
  'Content Creation',
  'Create blog posts and articles for Q3',
  'Completed',
  now() - interval '10 days',
  now() - interval '2 days'
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Global Media');

-- Insert sample finance data if none exists
INSERT INTO finance_reports (client_id, amount_spent, scheduled_payment)
SELECT 
  (SELECT id FROM clients WHERE name = 'Acme Corporation' LIMIT 1),
  5000.00,
  now() + interval '30 days'
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Acme Corporation')
AND NOT EXISTS (SELECT 1 FROM finance_reports LIMIT 1);

INSERT INTO finance_reports (client_id, amount_spent, scheduled_payment)
SELECT 
  (SELECT id FROM clients WHERE name = 'TechStart Inc' LIMIT 1),
  3500.00,
  now() + interval '15 days'
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'TechStart Inc');

INSERT INTO finance_reports (client_id, amount_spent, scheduled_payment)
SELECT 
  (SELECT id FROM clients WHERE name = 'Global Media' LIMIT 1),
  7250.00,
  now() + interval '45 days'
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Global Media');
