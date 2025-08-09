-- Migration to create job_statuses table and update jobs table
-- This will replace the hardcoded job_status enum with a flexible table

-- Create the job_statuses table
CREATE TABLE job_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color code like #FF5733
  background_color VARCHAR(7) NOT NULL, -- Background hex color
  order_index INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_final BOOLEAN DEFAULT FALSE, -- If true, this is a completion status
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default job statuses
INSERT INTO job_statuses (name, display_name, color, background_color, order_index, is_default, is_final) VALUES
('not-assigned', 'Not Assigned', '#6B7280', '#F3F4F6', 1, TRUE, FALSE),
('nesting-complete', 'Nesting Complete', '#059669', '#D1FAE5', 2, FALSE, FALSE),
('machining-complete', 'Machining Complete', '#DC2626', '#FEE2E2', 3, FALSE, FALSE),
('assembly-complete', 'Assembly Complete', '#7C2D12', '#FED7AA', 4, FALSE, FALSE),
('delivered', 'Delivered', '#16A34A', '#DCFCE7', 5, FALSE, TRUE);

-- Add status_id column to jobs table
ALTER TABLE jobs ADD COLUMN status_id INTEGER REFERENCES job_statuses(id);

-- Update existing jobs to use the new status_id (map old enum values to new IDs)
UPDATE jobs SET status_id = (
  CASE 
    WHEN status = 'not-assigned' THEN (SELECT id FROM job_statuses WHERE name = 'not-assigned')
    WHEN status = 'nesting-complete' THEN (SELECT id FROM job_statuses WHERE name = 'nesting-complete')
    WHEN status = 'machining-complete' THEN (SELECT id FROM job_statuses WHERE name = 'machining-complete')
    WHEN status = 'assembly-complete' THEN (SELECT id FROM job_statuses WHERE name = 'assembly-complete')
    WHEN status = 'delivered' THEN (SELECT id FROM job_statuses WHERE name = 'delivered')
    ELSE (SELECT id FROM job_statuses WHERE is_default = TRUE LIMIT 1)
  END
);

-- Make status_id NOT NULL after updating existing records
ALTER TABLE jobs ALTER COLUMN status_id SET NOT NULL;

-- Drop the old status column (after verifying data migration)
-- ALTER TABLE jobs DROP COLUMN status;

-- Drop the old enum type (after dropping the column)
-- DROP TYPE IF EXISTS job_status;
