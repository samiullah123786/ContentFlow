-- Client Template Update
-- Add new fields to clients table for the 11 standard categories

-- 1. Client goal
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_goal TEXT;

-- 2. Onboarding checklist (stored as JSONB to allow for structured data)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '[]'::jsonb;

-- 3. Budget
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget TEXT;

-- 4. Timeline
ALTER TABLE clients ADD COLUMN IF NOT EXISTS timeline TEXT;

-- 5. Tracking results
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tracking_results TEXT;

-- 6. Client inspiration list
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inspiration_list TEXT;

-- 7. Client scripts document
ALTER TABLE clients ADD COLUMN IF NOT EXISTS scripts_document TEXT;

-- 8. Client video editor
ALTER TABLE clients ADD COLUMN IF NOT EXISTS video_editor TEXT;

-- 9. Video folder
ALTER TABLE clients ADD COLUMN IF NOT EXISTS video_folder TEXT;

-- 10. Video description
ALTER TABLE clients ADD COLUMN IF NOT EXISTS video_description TEXT;

-- 11. Client account details
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_details TEXT;

-- Create default onboarding checklist template for new clients
CREATE OR REPLACE FUNCTION set_default_onboarding_checklist()
RETURNS TRIGGER AS $$
BEGIN
  NEW.onboarding_checklist := '[
    {"id": "1", "title": "Initial client meeting", "completed": false},
    {"id": "2", "title": "Collect brand assets", "completed": false},
    {"id": "3", "title": "Define content strategy", "completed": false},
    {"id": "4", "title": "Set up content calendar", "completed": false},
    {"id": "5", "title": "Create client folder structure", "completed": false},
    {"id": "6", "title": "Set up analytics tracking", "completed": false},
    {"id": "7", "title": "Finalize contract", "completed": false},
    {"id": "8", "title": "Collect payment details", "completed": false},
    {"id": "9", "title": "Schedule kickoff call", "completed": false},
    {"id": "10", "title": "Send welcome package", "completed": false}
  ]'::jsonb;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set default onboarding checklist for new clients
DROP TRIGGER IF EXISTS set_default_onboarding_checklist_trigger ON clients;
CREATE TRIGGER set_default_onboarding_checklist_trigger
BEFORE INSERT ON clients
FOR EACH ROW
WHEN (NEW.onboarding_checklist IS NULL OR NEW.onboarding_checklist = '[]'::jsonb)
EXECUTE FUNCTION set_default_onboarding_checklist();

-- Update existing clients to have the default onboarding checklist if they don't have one
UPDATE clients
SET onboarding_checklist = '[
  {"id": "1", "title": "Initial client meeting", "completed": false},
  {"id": "2", "title": "Collect brand assets", "completed": false},
  {"id": "3", "title": "Define content strategy", "completed": false},
  {"id": "4", "title": "Set up content calendar", "completed": false},
  {"id": "5", "title": "Create client folder structure", "completed": false},
  {"id": "6", "title": "Set up analytics tracking", "completed": false},
  {"id": "7", "title": "Finalize contract", "completed": false},
  {"id": "8", "title": "Collect payment details", "completed": false},
  {"id": "9", "title": "Schedule kickoff call", "completed": false},
  {"id": "10", "title": "Send welcome package", "completed": false}
]'::jsonb
WHERE onboarding_checklist IS NULL OR onboarding_checklist = '[]'::jsonb;
