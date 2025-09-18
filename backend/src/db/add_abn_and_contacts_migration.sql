-- Add ABN to clients table and create contacts table
-- Migration date: 2025-09-18

-- Add ABN column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS abn varchar(20);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  office VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON contacts(is_primary);