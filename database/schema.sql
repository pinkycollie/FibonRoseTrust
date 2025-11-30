-- FibonRose Trust - Database Schema
-- PostgreSQL Database Schema for Local Development

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Users Table
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    auth0_sub TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    profile_picture_url TEXT,
    last_login TIMESTAMP
);

-- ===========================================
-- Verification Types Table
-- ===========================================
CREATE TABLE IF NOT EXISTS verification_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL
);

-- ===========================================
-- Verifications Table
-- ===========================================
CREATE TABLE IF NOT EXISTS verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type_id INTEGER NOT NULL REFERENCES verification_types(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    verified_by TEXT,
    data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMP
);

-- ===========================================
-- Trust Scores Table
-- ===========================================
CREATE TABLE IF NOT EXISTS trust_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 0,
    verification_count INTEGER NOT NULL DEFAULT 0,
    positive_transactions INTEGER NOT NULL DEFAULT 0,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Data Permissions Table
-- ===========================================
CREATE TABLE IF NOT EXISTS data_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- ===========================================
-- Webhook Subscriptions Table
-- ===========================================
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    partner_id INTEGER,
    headers JSONB DEFAULT '{}'
);

-- ===========================================
-- Webhook Deliveries Table
-- ===========================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source TEXT,
    payload JSONB NOT NULL,
    status TEXT NOT NULL,
    status_code INTEGER,
    response TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    request_headers TEXT,
    request_payload TEXT,
    response_body TEXT,
    processed_at TIMESTAMP,
    attempts INTEGER NOT NULL DEFAULT 0
);

-- ===========================================
-- Notion Integrations Table
-- ===========================================
CREATE TABLE IF NOT EXISTS notion_integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    database_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced TIMESTAMP,
    settings JSONB DEFAULT '{}'
);

-- ===========================================
-- Xano Integrations Table
-- ===========================================
CREATE TABLE IF NOT EXISTS xano_integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    base_url TEXT NOT NULL,
    webhook_secret TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced TIMESTAMP,
    ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    settings JSONB DEFAULT '{}'
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth0_sub ON users(auth0_sub);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_type_id ON verifications(type_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user_id ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_score ON trust_scores(score);
CREATE INDEX IF NOT EXISTS idx_data_permissions_user_id ON data_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_is_active ON webhook_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription_id ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notion_integrations_user_id ON notion_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_xano_integrations_user_id ON xano_integrations(user_id);

-- ===========================================
-- Comments
-- ===========================================
COMMENT ON TABLE users IS 'User accounts for the FibonRose Trust system';
COMMENT ON TABLE verification_types IS 'Types of verifications available in the system';
COMMENT ON TABLE verifications IS 'User verification records';
COMMENT ON TABLE trust_scores IS 'Trust scores calculated for each user';
COMMENT ON TABLE data_permissions IS 'User data sharing permissions';
COMMENT ON TABLE webhook_subscriptions IS 'Webhook subscription configurations';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery logs and status';
COMMENT ON TABLE notion_integrations IS 'Notion API integration settings';
COMMENT ON TABLE xano_integrations IS 'Xano API integration settings';
