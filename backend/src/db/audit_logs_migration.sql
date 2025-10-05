-- Migration to add audit_logs table for comprehensive change tracking
-- Run this migration to add audit logging capabilities

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    field_name VARCHAR(100), -- NULL for create/delete, field name for updates
    old_value TEXT, -- NULL for create, previous value for update/delete
    new_value TEXT, -- NULL for delete, new value for create/update
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    ip_address VARCHAR(45), -- Supports both IPv4 and IPv6
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all data changes in the system';
COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of the record that was modified';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: create, update, or delete';
COMMENT ON COLUMN audit_logs.field_name IS 'Name of the field that changed (for updates only)';
COMMENT ON COLUMN audit_logs.old_value IS 'Previous value before the change';
COMMENT ON COLUMN audit_logs.new_value IS 'New value after the change';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who made the change';
COMMENT ON COLUMN audit_logs.user_email IS 'Email of the user who made the change (for redundancy)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user who made the change';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client information of the user';