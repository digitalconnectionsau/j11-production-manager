-- Migration to update existing jobs table to match Excel structure
-- This will modify the existing table structure

-- First, check if job_status enum exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM (
          'not-assigned', 
          'nesting-complete', 
          'machining-complete', 
          'assembly-complete', 
          'delivered'
        );
    END IF;
END $$;

-- Backup the existing jobs table (optional)
-- CREATE TABLE jobs_backup AS SELECT * FROM jobs;

-- Drop existing columns we don't need
ALTER TABLE jobs DROP COLUMN IF EXISTS title;
ALTER TABLE jobs DROP COLUMN IF EXISTS description;
ALTER TABLE jobs DROP COLUMN IF EXISTS status_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS due_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS priority;
ALTER TABLE jobs DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE jobs DROP COLUMN IF EXISTS actual_hours;
ALTER TABLE jobs DROP COLUMN IF EXISTS notes;
ALTER TABLE jobs DROP COLUMN IF EXISTS is_completed;

-- Add new columns to match Excel structure
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unit VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS items VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS nesting_date VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS machining_date VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assembly_date VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivery_date VARCHAR(10);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status job_status DEFAULT 'not-assigned';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS comments TEXT;

-- Make items NOT NULL
UPDATE jobs SET items = 'Unknown Item' WHERE items IS NULL;
ALTER TABLE jobs ALTER COLUMN items SET NOT NULL;
