# ContentFlow CMS

A content management system for marketing agencies.

## Database Setup

To ensure the application works correctly, you need to update your Supabase database schema. Follow these steps:

1. Navigate to your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of the `supabase/revised_update.sql` file
4. Paste it into the SQL Editor
5. Run the SQL script

This update will:
- Add missing columns to your existing tables (created_at, title, status)
- Create necessary policies for Row Level Security
- Work with your existing `finances` table structure

For sample finance data, you can run the `supabase/finance_sample_data.sql` script which will:
- Add sample invoices, payments, and expenses if your finances table is empty
- Skip adding sample data if you already have finance records
- Automatically use your existing client IDs for the sample data

## Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Running the Application

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Dashboard**: Overview of key metrics and recent activities
- **Client Management**: Add, edit, and manage client information
- **Task Tracking**: Create and track tasks with deadlines and status updates
- **Activities View**: See all recent activities across the system
- **Financial Reporting**: Track invoices, payments, and expenses
- **Project Ideas**: Store and manage project ideas for clients
