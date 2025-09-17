-- Create lead times table for managing working days between job statuses
CREATE TABLE IF NOT EXISTS lead_times (
  id SERIAL PRIMARY KEY,
  from_status_id INTEGER NOT NULL REFERENCES job_statuses(id) ON DELETE CASCADE,
  to_status_id INTEGER NOT NULL REFERENCES job_statuses(id) ON DELETE CASCADE,
  days INTEGER NOT NULL DEFAULT 0,
  direction VARCHAR(10) NOT NULL DEFAULT 'before',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lead_times_from_status ON lead_times(from_status_id);
CREATE INDEX IF NOT EXISTS idx_lead_times_to_status ON lead_times(to_status_id);

-- Add constraint to ensure direction is valid
ALTER TABLE lead_times ADD CONSTRAINT check_direction CHECK (direction IN ('before', 'after'));

-- Insert default lead times for existing job statuses
-- This will set up basic lead times with delivery as the reference point
INSERT INTO lead_times (from_status_id, to_status_id, days, direction, is_active)
SELECT 
  js1.id as from_status_id,
  js2.id as to_status_id,
  CASE 
    WHEN js1.order_index < js2.order_index THEN (js2.order_index - js1.order_index) * 2
    ELSE 0
  END as days,
  'before' as direction,
  true as is_active
FROM job_statuses js1
CROSS JOIN job_statuses js2
WHERE js1.id != js2.id 
  AND js2.is_final = true  -- Reference the final status (delivery)
  AND NOT js1.is_final     -- Don't create lead times for final statuses
ON CONFLICT DO NOTHING;