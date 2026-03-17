-- FlowAid Database Schema
-- Run this in the Supabase SQL editor to set up your tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCHOOLS
-- ============================================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL, -- E.164 format: +254XXXXXXXXX
  name VARCHAR(255),
  county VARCHAR(100),
  sub_county VARCHAR(100),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  head_teacher_name VARCHAR(255),
  student_population INTEGER, -- approximate girls enrolled
  verified BOOLEAN DEFAULT FALSE,
  language_preference VARCHAR(2) DEFAULT 'EN', -- EN or SW
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  flagged BOOLEAN DEFAULT FALSE -- flagged for suspicious activity
);

CREATE INDEX idx_schools_whatsapp ON schools(whatsapp_number);
CREATE INDEX idx_schools_county ON schools(county);

-- ============================================================
-- ORGANISATIONS
-- ============================================================
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100), -- NGO Coordination Board number
  type VARCHAR(50) NOT NULL CHECK (type IN ('ngo', 'delivery', 'supplier')),
  description TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_whatsapp VARCHAR(20),
  coverage_counties TEXT[] DEFAULT '{}', -- array of county names
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  trusted_partner BOOLEAN DEFAULT FALSE, -- tier 2: auto-promoted at 10+ confirmed deliveries
  confirmed_delivery_count INTEGER DEFAULT 0,
  logo_url TEXT,
  auth_user_id UUID, -- links to Supabase Auth user
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organisations_auth_user ON organisations(auth_user_id);
CREATE INDEX idx_organisations_verified ON organisations(verified);

-- ============================================================
-- NEEDS
-- ============================================================
CREATE TABLE needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code VARCHAR(20) UNIQUE NOT NULL, -- human-readable e.g. #KE-2847
  school_id UUID NOT NULL REFERENCES schools(id),
  urgency INTEGER NOT NULL CHECK (urgency BETWEEN 1 AND 3), -- 1=low, 2=medium, 3=urgent
  approximate_quantity INTEGER,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'delivered', 'cancelled')),
  claimed_by UUID REFERENCES organisations(id),
  claimed_at TIMESTAMPTZ,
  expected_delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  confirmed_by_school BOOLEAN DEFAULT FALSE,
  confirmation_received_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_needs_status ON needs(status);
CREATE INDEX idx_needs_school ON needs(school_id);
CREATE INDEX idx_needs_urgency ON needs(urgency);
CREATE INDEX idx_needs_posted ON needs(posted_at DESC);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID NOT NULL REFERENCES needs(id),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  quantity_delivered INTEGER,
  delivery_date DATE,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_timestamp TIMESTAMPTZ,
  impact_logged BOOLEAN DEFAULT FALSE,
  manual_confirmation BOOLEAN DEFAULT FALSE, -- if confirmed via dashboard instead of WhatsApp
  manual_confirmation_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_org ON deliveries(organisation_id);
CREATE INDEX idx_deliveries_school ON deliveries(school_id);
CREATE INDEX idx_deliveries_confirmed ON deliveries(confirmed);

-- ============================================================
-- CONVERSATIONS (WhatsApp bot state machine)
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
  current_step VARCHAR(50) DEFAULT 'new', -- tracks position in conversation flow
  temp_data JSONB DEFAULT '{}', -- stores partial registration/need data
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  opted_out BOOLEAN DEFAULT FALSE -- STOP command
);

CREATE INDEX idx_conversations_whatsapp ON conversations(whatsapp_number);

-- ============================================================
-- HELPER: Generate reference codes for needs
-- ============================================================
CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_code := '#KE-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  -- Handle collision by retrying (extremely rare)
  WHILE EXISTS (SELECT 1 FROM needs WHERE reference_code = NEW.reference_code AND id != NEW.id) LOOP
    NEW.reference_code := '#KE-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reference_code
  BEFORE INSERT ON needs
  FOR EACH ROW
  WHEN (NEW.reference_code IS NULL OR NEW.reference_code = '')
  EXECUTE FUNCTION generate_reference_code();

-- ============================================================
-- HELPER: Auto-promote organisations to trusted partner
-- ============================================================
CREATE OR REPLACE FUNCTION check_trusted_partner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmed = TRUE AND OLD.confirmed = FALSE THEN
    UPDATE organisations
    SET confirmed_delivery_count = confirmed_delivery_count + 1,
        trusted_partner = CASE
          WHEN confirmed_delivery_count + 1 >= 10 THEN TRUE
          ELSE trusted_partner
        END
    WHERE id = NEW.organisation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_promote_trusted
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION check_trusted_partner();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Public read access to open needs (for the map)
CREATE POLICY "Anyone can view open needs"
  ON needs FOR SELECT
  USING (status = 'open');

-- Organisations can view all needs
CREATE POLICY "Verified orgs can view all needs"
  ON needs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organisations
      WHERE auth_user_id = auth.uid()
      AND verified = TRUE
    )
  );

-- Organisations can update needs they claimed
CREATE POLICY "Orgs can update their claimed needs"
  ON needs FOR UPDATE
  USING (
    claimed_by IN (
      SELECT id FROM organisations WHERE auth_user_id = auth.uid()
    )
  );

-- Service role bypasses RLS (for the WhatsApp bot backend)
-- This is handled by using SUPABASE_SERVICE_KEY in the backend
