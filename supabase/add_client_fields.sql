-- Add additional fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS channel_details TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_ideas TEXT; 