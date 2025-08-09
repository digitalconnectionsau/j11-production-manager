-- Migration to convert from production_tasks/project_tasks to direct jobs table
-- Run this against your Railway database

-- First, create the new job_status enum
CREATE TYPE job_status AS ENUM (
  'not-assigned', 
  'nesting-complete', 
  'machining-complete', 
  'assembly-complete', 
  'delivered'
);

-- Create the new jobs table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  unit VARCHAR(100),
  type VARCHAR(255),
  items VARCHAR(255) NOT NULL,
  nesting_date VARCHAR(10),
  machining_date VARCHAR(10),
  assembly_date VARCHAR(10),
  delivery_date VARCHAR(10),
  status job_status DEFAULT 'not-assigned',
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Drop the old tables (be careful - this will delete existing data!)
-- Only run these if you're sure you want to remove the old structure
-- DROP TABLE IF EXISTS project_tasks;
-- DROP TABLE IF EXISTS production_tasks;
-- DROP TYPE IF EXISTS task_status;
-- DROP TYPE IF EXISTS task_priority;

-- Note: Comment out the DROP statements above until you're ready to remove old data
-- For now, both old and new structures will coexist
