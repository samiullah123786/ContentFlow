-- Team and Enhanced Categories SQL Migration

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  skills TEXT[],
  hourly_rate NUMERIC(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policy for team_members
CREATE POLICY "Team members are viewable by everyone"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Team members are editable by authenticated users"
  ON team_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Modify clients table structure for enhanced categories

-- 1. Update timeline to be JSONB to store multiple timeline events
ALTER TABLE clients 
  ALTER COLUMN timeline TYPE JSONB USING 
    CASE 
      WHEN timeline IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(jsonb_build_object('date', NULL, 'description', timeline))
    END;

-- 2. Update tracking_results to be JSONB to store metrics and multiple entries
ALTER TABLE clients 
  ALTER COLUMN tracking_results TYPE JSONB USING 
    CASE 
      WHEN tracking_results IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(jsonb_build_object('date', now(), 'description', tracking_results, 'metrics', '{}'::jsonb))
    END;

-- 3. Rename video_editor to hired_people and change to JSONB
ALTER TABLE clients RENAME COLUMN video_editor TO hired_people;
ALTER TABLE clients 
  ALTER COLUMN hired_people TYPE JSONB USING 
    CASE 
      WHEN hired_people IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(jsonb_build_object('name', hired_people, 'role', 'Video Editor', 'team_member_id', NULL, 'external', true))
    END;

-- 4. Update budget to be JSONB to store structured budget information
ALTER TABLE clients 
  ALTER COLUMN budget TYPE JSONB USING 
    CASE 
      WHEN budget IS NULL THEN jsonb_build_object('total', 0, 'currency', 'USD', 'breakdown', '[]'::jsonb, 'notes', budget)
      ELSE jsonb_build_object('total', 0, 'currency', 'USD', 'breakdown', '[]'::jsonb, 'notes', budget)
    END;

-- 5. Update video_folder to include more structured information
ALTER TABLE clients 
  ALTER COLUMN video_folder TYPE JSONB USING 
    CASE 
      WHEN video_folder IS NULL THEN jsonb_build_object('path', '', 'links', '[]'::jsonb, 'notes', '')
      ELSE jsonb_build_object('path', video_folder, 'links', '[]'::jsonb, 'notes', '')
    END;

-- Insert sample team members
INSERT INTO team_members (name, role, email, skills, hourly_rate, status)
VALUES 
  ('John Smith', 'Video Editor', 'john@example.com', ARRAY['Video Editing', 'Motion Graphics'], 35.00, 'active'),
  ('Sarah Johnson', 'Content Writer', 'sarah@example.com', ARRAY['Copywriting', 'SEO'], 30.00, 'active'),
  ('Michael Chen', 'Graphic Designer', 'michael@example.com', ARRAY['Photoshop', 'Illustrator'], 40.00, 'active'),
  ('Emma Wilson', 'Social Media Manager', 'emma@example.com', ARRAY['Instagram', 'TikTok', 'Facebook'], 25.00, 'active')
ON CONFLICT DO NOTHING;

-- Create function to initialize default timeline events
CREATE OR REPLACE FUNCTION initialize_default_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.timeline IS NULL OR NEW.timeline = '[]'::jsonb THEN
    NEW.timeline := jsonb_build_array(
      jsonb_build_object('id', '1', 'date', (CURRENT_DATE + INTERVAL '7 days')::text, 'title', 'Project Start', 'description', 'Initial project kickoff'),
      jsonb_build_object('id', '2', 'date', (CURRENT_DATE + INTERVAL '14 days')::text, 'title', 'First Deliverable', 'description', 'First content piece due'),
      jsonb_build_object('id', '3', 'date', (CURRENT_DATE + INTERVAL '30 days')::text, 'title', 'Project Review', 'description', 'Review progress and adjust strategy')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default timeline
DROP TRIGGER IF EXISTS set_default_timeline_trigger ON clients;
CREATE TRIGGER set_default_timeline_trigger
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION initialize_default_timeline();

-- Create function to initialize default tracking results
CREATE OR REPLACE FUNCTION initialize_default_tracking_results()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_results IS NULL OR NEW.tracking_results = '[]'::jsonb THEN
    NEW.tracking_results := jsonb_build_array(
      jsonb_build_object(
        'id', '1', 
        'date', CURRENT_DATE::text, 
        'title', 'Initial Metrics', 
        'description', 'Baseline metrics before campaign start',
        'metrics', jsonb_build_object(
          'views', 0,
          'engagement', 0,
          'followers', 0,
          'conversions', 0
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default tracking results
DROP TRIGGER IF EXISTS set_default_tracking_results_trigger ON clients;
CREATE TRIGGER set_default_tracking_results_trigger
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION initialize_default_tracking_results();

-- Update existing clients with default values for new structured fields
UPDATE clients
SET 
  timeline = COALESCE(timeline, jsonb_build_array(
    jsonb_build_object('id', '1', 'date', (CURRENT_DATE + INTERVAL '7 days')::text, 'title', 'Project Start', 'description', 'Initial project kickoff'),
    jsonb_build_object('id', '2', 'date', (CURRENT_DATE + INTERVAL '14 days')::text, 'title', 'First Deliverable', 'description', 'First content piece due'),
    jsonb_build_object('id', '3', 'date', (CURRENT_DATE + INTERVAL '30 days')::text, 'title', 'Project Review', 'description', 'Review progress and adjust strategy')
  )),
  tracking_results = COALESCE(tracking_results, jsonb_build_array(
    jsonb_build_object(
      'id', '1', 
      'date', CURRENT_DATE::text, 
      'title', 'Initial Metrics', 
      'description', 'Baseline metrics before campaign start',
      'metrics', jsonb_build_object(
        'views', 0,
        'engagement', 0,
        'followers', 0,
        'conversions', 0
      )
    )
  )),
  hired_people = COALESCE(hired_people, '[]'::jsonb),
  budget = COALESCE(budget, jsonb_build_object('total', 0, 'currency', 'USD', 'breakdown', '[]'::jsonb, 'notes', '')),
  video_folder = COALESCE(video_folder, jsonb_build_object('path', '', 'links', '[]'::jsonb, 'notes', ''))
WHERE 
  timeline IS NULL OR 
  tracking_results IS NULL OR 
  hired_people IS NULL OR 
  budget IS NULL OR 
  video_folder IS NULL;
