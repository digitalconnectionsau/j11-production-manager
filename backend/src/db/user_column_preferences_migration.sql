-- Migration: Add user column preferences table
-- This table stores per-user preferences for table column visibility and widths

CREATE TABLE IF NOT EXISTS user_column_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    width_px INTEGER DEFAULT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    CONSTRAINT fk_user_column_preferences_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate preferences
    CONSTRAINT uk_user_column_preferences 
        UNIQUE (user_id, table_name, column_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_column_preferences_user_table 
ON user_column_preferences(user_id, table_name);

-- Insert default column preferences for the jobs table
-- This will serve as the template for new users
INSERT INTO user_column_preferences (user_id, table_name, column_name, is_visible, width_px, order_index)
SELECT 
    4, -- Default admin user
    'jobs',
    column_name,
    true,
    width_px,
    order_index
FROM (VALUES
    ('unit', 120, 1),
    ('type', 120, 2),
    ('items', 150, 3),
    ('projectName', 200, 4),
    ('nestingDate', 120, 5),
    ('machiningDate', 120, 6),
    ('assemblyDate', 120, 7),
    ('deliveryDate', 120, 8),
    ('status', 150, 9),
    ('actions', 100, 10)
) AS default_columns(column_name, width_px, order_index)
ON CONFLICT (user_id, table_name, column_name) DO NOTHING;