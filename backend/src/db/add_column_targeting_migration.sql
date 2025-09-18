-- Add column targeting to job statuses
-- This allows each status to specify which columns in the jobs table it should target for coloring

ALTER TABLE job_statuses ADD COLUMN target_columns JSONB DEFAULT '[]'::jsonb;

-- Add comments to explain the usage
COMMENT ON COLUMN job_statuses.target_columns IS 'JSON array of column names that this status should target for coloring in the jobs table. Valid values: ["nesting", "machining", "assembly", "delivery"]';

-- Example: A "Nesting" status would target just the nesting column
-- UPDATE job_statuses SET target_columns = '["nesting"]'::jsonb WHERE name = 'nesting';

-- Example: A "Production" status might target multiple columns 
-- UPDATE job_statuses SET target_columns = '["machining", "assembly"]'::jsonb WHERE name = 'production';

-- Example: A "Completed" status might target all date columns
-- UPDATE job_statuses SET target_columns = '["nesting", "machining", "assembly", "delivery"]'::jsonb WHERE name = 'completed';

-- Create an index for faster queries on target_columns
CREATE INDEX idx_job_statuses_target_columns ON job_statuses USING GIN (target_columns);