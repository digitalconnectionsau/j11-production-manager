-- User Management and Permissions System Migration
-- Migration date: 2025-09-18

-- Add new fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW();

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create roles table  
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table (users can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
-- User Management
('manage_users', 'Manage Users', 'Add, edit, block, and remove users', 'user_management'),
('view_users', 'View Users', 'View user list and details', 'user_management'),
('edit_user_permissions', 'Edit User Permissions', 'Assign roles and permissions to users', 'user_management'),

-- Client Management
('add_clients', 'Add Clients', 'Create new client records', 'client_management'),
('edit_clients', 'Edit Clients', 'Modify existing client information', 'client_management'),
('view_clients', 'View Clients', 'View client list and details', 'client_management'),
('delete_clients', 'Delete Clients', 'Remove client records', 'client_management'),

-- Project Management
('add_projects', 'Add Projects', 'Create new projects', 'project_management'),
('edit_projects', 'Edit Projects', 'Modify project information', 'project_management'),
('view_projects', 'View Projects', 'View project list and details', 'project_management'),
('delete_projects', 'Delete Projects', 'Remove projects', 'project_management'),
('change_project_status', 'Change Project Status', 'Update project status/state', 'project_management'),
('change_project_dates', 'Change Project Dates', 'Modify project timelines and dates', 'project_management'),

-- Job Management
('add_jobs', 'Add Jobs', 'Create new jobs/tasks', 'job_management'),
('edit_jobs', 'Edit Jobs', 'Modify job information', 'job_management'),
('view_jobs', 'View Jobs', 'View job list and details', 'job_management'),
('delete_jobs', 'Delete Jobs', 'Remove jobs', 'job_management'),
('change_job_status', 'Change Job Status', 'Update job status/state', 'job_management'),
('change_job_dates', 'Change Job Dates', 'Modify job timelines and dates', 'job_management'),

-- Analytics & Reporting
('view_analytics', 'View Analytics', 'Access analytics dashboard and reports', 'analytics'),
('export_data', 'Export Data', 'Export data and generate reports', 'analytics'),

-- System Configuration
('manage_settings', 'Manage Settings', 'Configure system settings and preferences', 'system'),
('manage_lead_times', 'Manage Lead Times', 'Configure lead times between job statuses', 'system'),
('manage_holidays', 'Manage Holidays', 'Configure holidays and working days', 'system'),

-- Pin Management
('pin_projects', 'Pin Projects', 'Pin/unpin projects for quick access', 'project_management')

ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_super_admin) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
('admin', 'Administrator', 'Administrative access with most permissions', false),
('project_manager', 'Project Manager', 'Manage projects, jobs, and clients', false),
('production_user', 'Production User', 'View and update job statuses', false),
('viewer', 'Viewer', 'Read-only access to projects and jobs', false)

ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin gets most permissions (excluding user management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' 
AND p.name NOT IN ('manage_users', 'edit_user_permissions')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Project Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'project_manager' 
AND p.name IN (
  'view_users', 'add_clients', 'edit_clients', 'view_clients',
  'add_projects', 'edit_projects', 'view_projects', 'change_project_status', 'change_project_dates',
  'add_jobs', 'edit_jobs', 'view_jobs', 'change_job_status', 'change_job_dates',
  'view_analytics', 'pin_projects'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Production User permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'production_user' 
AND p.name IN (
  'view_clients', 'view_projects', 'view_jobs', 'change_job_status', 'change_job_dates'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' 
AND p.name IN (
  'view_clients', 'view_projects', 'view_jobs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);