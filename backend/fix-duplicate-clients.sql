-- Fix duplicate Hutchinson clients
-- This script consolidates "Hutchinsons" and "Hutchinson Builders" into one client

-- Step 1: Find the duplicate clients
SELECT id, name FROM clients WHERE LOWER(name) LIKE '%hutchinson%' ORDER BY name;

-- Step 2: Decide which client record to keep (let's keep "Hutchinson Builders")
-- and update all projects that reference the old client

-- Step 3: Update projects to point to the correct client
-- (Replace the IDs below with the actual IDs from your database query)
UPDATE projects 
SET client_id = (SELECT id FROM clients WHERE name = 'Hutchinson Builders')
WHERE client_id = (SELECT id FROM clients WHERE name = 'Hutchinsons');

-- Step 4: Delete the duplicate client record
DELETE FROM clients WHERE name = 'Hutchinsons';

-- Step 5: Verify the fix
SELECT 
  c.name as client_name,
  COUNT(j.id) as job_count
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
LEFT JOIN jobs j ON p.id = j.project_id
WHERE LOWER(c.name) LIKE '%hutchinson%'
GROUP BY c.id, c.name;