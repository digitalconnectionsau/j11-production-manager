-- Create holidays table for Gold Coast, Queensland holidays
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Gold Coast, Queensland public holidays for 2025
INSERT INTO holidays (name, date, is_public, is_custom, description) VALUES
('New Year''s Day', '2025-01-01', true, false, 'Public holiday - New Year''s Day'),
('Australia Day', '2025-01-27', true, false, 'Public holiday - Australia Day'),
('Good Friday', '2025-04-18', true, false, 'Public holiday - Good Friday'),
('Easter Saturday', '2025-04-19', true, false, 'Public holiday - Easter Saturday'),
('Easter Monday', '2025-04-21', true, false, 'Public holiday - Easter Monday'),
('Anzac Day', '2025-04-25', true, false, 'Public holiday - Anzac Day'),
('Labour Day', '2025-05-05', true, false, 'Public holiday - Labour Day (Queensland)'),
('Queen''s Birthday', '2025-06-09', true, false, 'Public holiday - Queen''s Birthday (Queensland)'),
('Ekka Wednesday', '2025-08-13', true, false, 'Public holiday - Royal Queensland Show Day (Brisbane area)'),
('Christmas Day', '2025-12-25', true, false, 'Public holiday - Christmas Day'),
('Boxing Day', '2025-12-26', true, false, 'Public holiday - Boxing Day');

-- Insert holidays for 2026
INSERT INTO holidays (name, date, is_public, is_custom, description) VALUES
('New Year''s Day', '2026-01-01', true, false, 'Public holiday - New Year''s Day'),
('Australia Day', '2026-01-26', true, false, 'Public holiday - Australia Day'),
('Good Friday', '2026-04-03', true, false, 'Public holiday - Good Friday'),
('Easter Saturday', '2026-04-04', true, false, 'Public holiday - Easter Saturday'),
('Easter Monday', '2026-04-06', true, false, 'Public holiday - Easter Monday'),
('Anzac Day', '2026-04-25', true, false, 'Public holiday - Anzac Day'),
('Labour Day', '2026-05-04', true, false, 'Public holiday - Labour Day (Queensland)'),
('Queen''s Birthday', '2026-06-08', true, false, 'Public holiday - Queen''s Birthday (Queensland)'),
('Ekka Wednesday', '2026-08-12', true, false, 'Public holiday - Royal Queensland Show Day (Brisbane area)'),
('Christmas Day', '2026-12-25', true, false, 'Public holiday - Christmas Day'),
('Boxing Day', '2026-12-26', true, false, 'Public holiday - Boxing Day');

-- Create index for efficient date queries
CREATE INDEX idx_holidays_date ON holidays (date);
CREATE INDEX idx_holidays_public ON holidays (is_public);
