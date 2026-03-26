-- Stock Advisor Database Schema
-- Run this in Supabase SQL Editor to initialize all tables

-- Users table
-- Note: team_id is nullable at first; it gets set after the team is created during signup.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR,
  team_id UUID,  -- populated after team creation
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
-- created_by references the user who created the team; added after users table exists.
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  created_by UUID REFERENCES users(id),  -- nullable to avoid circular FK on insert
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add team_id FK constraint (after teams table exists)
ALTER TABLE users ADD CONSTRAINT users_team_id_fk
FOREIGN KEY (team_id) REFERENCES teams(id);

-- Portfolios (user holdings)
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR NOT NULL,
  shares_owned NUMERIC,
  average_cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Stock research reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR NOT NULL,
  analysis TEXT NOT NULL,
  recommendation VARCHAR (10), -- 'BUY', 'HOLD', 'SELL'
  valuation_metrics JSONB,
  risk_assessment JSONB,
  peer_comparison JSONB,
  portfolio_fit TEXT,
  sentiment JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price alerts
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR NOT NULL,
  target_price NUMERIC NOT NULL,
  alert_type VARCHAR, -- 'above', 'below'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  triggered_at TIMESTAMP,
  UNIQUE(user_id, ticker, target_price)
);

-- Daily screening results
CREATE TABLE screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  screening_date DATE DEFAULT CURRENT_DATE,
  category VARCHAR, -- 'trending', 'undervalued', 'high-growth', etc.
  stocks JSONB, -- Array of {ticker, reasoning, recommendation}
  sent_to_teams BOOLEAN DEFAULT FALSE,
  sent_to_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  type VARCHAR, -- 'price_alert', 'weekly_digest', 'daily_screening'
  recipient_email VARCHAR,
  recipient_channel VARCHAR, -- For Teams/Slack
  content TEXT,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Screening jobs log (for monitoring automated tasks)
CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR, -- 'daily_screening', 'price_check', 'weekly_digest'
  status VARCHAR, -- 'started', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_ticker ON reports(ticker);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active);
CREATE INDEX idx_screening_results_team_id ON screening_results(team_id);
CREATE INDEX idx_screening_results_date ON screening_results(screening_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_team_id ON notifications(team_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own portfolio"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own portfolio"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own price alerts"
  ON price_alerts FOR ALL
  USING (auth.uid() = user_id);
