-- Create login_activity table for tracking authentication events
CREATE TABLE IF NOT EXISTS login_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'login_success', 'login_failed', 'logout', 'password_reset_request', 'password_reset_success'
  ip_address VARCHAR(45), -- Supports IPv4 and IPv6
  user_agent TEXT,
  failure_reason VARCHAR(255), -- For failed attempts: 'wrong_password', 'user_not_found', 'account_blocked', etc.
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries by user_id and timestamp
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_timestamp ON login_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_email ON login_activity(email);
CREATE INDEX IF NOT EXISTS idx_login_activity_action ON login_activity(action);

-- Comments
COMMENT ON TABLE login_activity IS 'Tracks all authentication-related activities for security audit';
COMMENT ON COLUMN login_activity.action IS 'Type of authentication event: login_success, login_failed, logout, password_reset_request, password_reset_success';
COMMENT ON COLUMN login_activity.failure_reason IS 'Reason for failed login attempts (e.g., wrong_password, user_not_found, account_blocked)';
