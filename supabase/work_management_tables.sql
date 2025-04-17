-- Work Management Tables for ContentFlow

-- Work table to store work details
CREATE TABLE public.works (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  description text,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  status public.work_status NOT NULL DEFAULT 'planned',
  start_date date,
  deadline date,
  completion_date date,
  total_budget numeric(10,2),
  remaining_budget numeric(10,2),
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT works_pkey PRIMARY KEY (id)
);

-- Create work status enum type
CREATE TYPE public.work_status AS ENUM (
  'planned',
  'in_progress',
  'completed',
  'canceled'
);

-- Work resources table to track hired personnel
CREATE TABLE public.work_resources (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  contact_info text,
  rate numeric(10,2),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT work_resources_pkey PRIMARY KEY (id)
);

-- Work expenses table to track spending categories
CREATE TABLE public.work_expenses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  date date NOT NULL,
  resource_id uuid REFERENCES public.work_resources(id),
  expense_type text NOT NULL DEFAULT 'service',
  payment_status text NOT NULL DEFAULT 'paid',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT work_expenses_pkey PRIMARY KEY (id)
);

-- Work documents table to store links and references
CREATE TABLE public.work_documents (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  document_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT work_documents_pkey PRIMARY KEY (id)
);

-- Add RLS policies
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Allow all access to works" ON public.works FOR ALL USING (true);
CREATE POLICY "Allow all access to work_resources" ON public.work_resources FOR ALL USING (true);
CREATE POLICY "Allow all access to work_expenses" ON public.work_expenses FOR ALL USING (true);
CREATE POLICY "Allow all access to work_documents" ON public.work_documents FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX works_client_id_idx ON public.works (client_id);
CREATE INDEX work_resources_work_id_idx ON public.work_resources (work_id);
CREATE INDEX work_expenses_work_id_idx ON public.work_expenses (work_id);
CREATE INDEX work_expenses_resource_id_idx ON public.work_expenses (resource_id);
CREATE INDEX work_documents_work_id_idx ON public.work_documents (work_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.works
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Sample data for testing (optional)
INSERT INTO public.works (title, description, status, start_date, deadline, total_budget, remaining_budget)
VALUES
('Website Redesign', 'Complete redesign of client website with new branding', 'in_progress', '2023-06-01', '2023-07-15', 5000.00, 3500.00),
('Content Marketing Campaign', 'Create and distribute content for Q3 marketing push', 'planned', '2023-07-01', '2023-09-30', 8000.00, 8000.00),
('Social Media Management', 'Ongoing social media management and content creation', 'in_progress', '2023-01-01', '2023-12-31', 12000.00, 6000.00);
