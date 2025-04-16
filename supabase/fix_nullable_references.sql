-- Fix schema to make created_by nullable
ALTER TABLE clients ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE finances ALTER COLUMN created_by DROP NOT NULL;

-- Add policies to allow operations without auth
DROP POLICY IF EXISTS "Clients without auth" ON clients;
CREATE POLICY "Clients without auth"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Tasks without auth" ON tasks;
CREATE POLICY "Tasks without auth"
  ON tasks FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Finances without auth" ON finances;
CREATE POLICY "Finances without auth"
  ON finances FOR ALL
  USING (true)
  WITH CHECK (true); 