/*
  # Initial Schema Setup for Content Flow CMS

  1. Tables Created
    - users (extends auth.users)
      - id (uuid, references auth.users)
      - role (text)
      - full_name (text)
      - created_at (timestamptz)

    - clients
      - id (uuid)
      - name (text)
      - email (text)
      - status (text)
      - onboarding_document (text)
      - created_at (timestamptz)

    - tasks
      - id (uuid)
      - title (text)
      - description (text)
      - client_id (uuid, references clients)
      - assigned_to (uuid, references users)
      - status (text)
      - timer_start (timestamptz)
      - timer_end (timestamptz)
      - created_at (timestamptz)

    - finances
      - id (uuid)
      - client_id (uuid, references clients)
      - amount (numeric)
      - type (text)
      - due_date (date)
      - status (text)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Set up policies for role-based access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'team_member');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE finance_type AS ENUM ('invoice', 'payment', 'expense');
CREATE TYPE finance_status AS ENUM ('pending', 'paid', 'overdue');

-- Create users table that extends auth.users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  role user_role NOT NULL DEFAULT 'team_member',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  status client_status DEFAULT 'active',
  onboarding_document TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  status task_status DEFAULT 'pending',
  timer_start TIMESTAMPTZ,
  timer_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Create finances table
CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type finance_type NOT NULL,
  due_date DATE,
  status finance_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Clients policies
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Tasks policies
CREATE POLICY "Users can view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Finances policies
CREATE POLICY "Admins can manage finances"
  ON finances FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Team members can create finances"
  ON finances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team members can view finances"
  ON finances FOR SELECT
  TO authenticated
  USING (true);