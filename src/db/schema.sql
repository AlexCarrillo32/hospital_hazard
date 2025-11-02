-- Waste Compliance Agent Database Schema

-- Generators (hospitals, factories, etc.)
CREATE TABLE generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    epa_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EPA Waste Codes
CREATE TABLE waste_codes (
    code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    hazard_characteristics TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waste Profiles
CREATE TABLE waste_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generator_id UUID REFERENCES generators(id),
    waste_code VARCHAR(10) REFERENCES waste_codes(code),
    profile_name VARCHAR(255) NOT NULL,
    chemical_composition JSONB NOT NULL,
    physical_state VARCHAR(50),
    quantity_kg NUMERIC(10, 2),
    ai_classification_confidence NUMERIC(3, 2),
    ai_decision_log JSONB,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    approval_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disposal Facilities (TSDFs)
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    epa_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    capabilities TEXT[],
    accepted_waste_codes VARCHAR(10)[],
    price_per_kg NUMERIC(10, 2),
    max_capacity_kg NUMERIC(10, 2),
    certification_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Electronic Manifests
CREATE TABLE manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_number VARCHAR(50) UNIQUE NOT NULL,
    waste_profile_id UUID REFERENCES waste_profiles(id),
    generator_id UUID REFERENCES generators(id),
    facility_id UUID REFERENCES facilities(id),
    transporter_name VARCHAR(255),
    transporter_epa_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'created',
    route_details JSONB,
    signatures JSONB,
    audit_trail JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs (immutable compliance records)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_waste_profiles_generator ON waste_profiles(generator_id);
CREATE INDEX idx_waste_profiles_status ON waste_profiles(approval_status);
CREATE INDEX idx_manifests_status ON manifests(status);
CREATE INDEX idx_manifests_generator ON manifests(generator_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
