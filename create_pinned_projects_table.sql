-- Create pinned_projects table for the production database
-- Run this script in the Railway database console

CREATE TABLE IF NOT EXISTS pinned_projects (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, project_id)
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_pinned_projects_user_id ON pinned_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_projects_order ON pinned_projects(user_id, "order");

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pinned_projects' 
ORDER BY ordinal_position;
