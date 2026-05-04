CREATE TABLE IF NOT EXISTS beneficiary_requests (
  id SERIAL PRIMARY KEY,
  beneficiary_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('FOOD', 'SHELTER', 'MEDICAL', 'EMERGENCY_SUPPORT')),
  description TEXT NOT NULL,
  urgency_level VARCHAR(10) NOT NULL CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beneficiary_requests_user_status
  ON beneficiary_requests (beneficiary_user_id, status);

CREATE TABLE IF NOT EXISTS beneficiary_request_status_logs (
  id SERIAL PRIMARY KEY,
  beneficiary_request_id INTEGER NOT NULL REFERENCES beneficiary_requests(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
