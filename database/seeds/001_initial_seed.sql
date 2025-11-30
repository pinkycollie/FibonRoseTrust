-- FibonRose Trust - Seed Data
-- Initial data for development environment

-- ===========================================
-- Verification Types Seed Data
-- ===========================================
INSERT INTO verification_types (name, display_name, description, icon) VALUES
    ('identity', 'Identity Verification', 'Verify your real-world identity', 'user-check'),
    ('email', 'Email Verification', 'Verify your email address', 'mail'),
    ('phone', 'Phone Verification', 'Verify your phone number', 'phone'),
    ('professional', 'Professional Credentials', 'Verify professional certifications and licenses', 'briefcase'),
    ('interpreter', 'ASL Interpreter Certification', 'Verify ASL interpreter certifications (RID, NIC, etc.)', 'hands'),
    ('deaf_community', 'Deaf Community Verification', 'Community-verified Deaf or Hard of Hearing status', 'heart'),
    ('education', 'Education Verification', 'Verify educational credentials and degrees', 'graduation-cap'),
    ('employment', 'Employment Verification', 'Verify current and past employment', 'building'),
    ('background', 'Background Check', 'Verified background check completion', 'shield-check'),
    ('civic', 'Civic Pass', 'Civic blockchain-based identity verification', 'fingerprint')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- Sample Development User (password: 'password')
-- Note: In production, passwords should be properly hashed
-- ===========================================
INSERT INTO users (username, password, name, email, role) VALUES
    ('admin', '$2b$10$demohashedpassword', 'Admin User', 'admin@fibonrose.test', 'admin'),
    ('testuser', '$2b$10$demohashedpassword', 'Test User', 'test@fibonrose.test', 'user')
ON CONFLICT (username) DO NOTHING;

-- ===========================================
-- Sample Trust Scores
-- ===========================================
INSERT INTO trust_scores (user_id, score, level, max_score, verification_count, positive_transactions, total_transactions)
SELECT id, 50, 1, 100, 2, 5, 5 FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;

INSERT INTO trust_scores (user_id, score, level, max_score, verification_count, positive_transactions, total_transactions)
SELECT id, 100, 5, 100, 10, 50, 50 FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- ===========================================
-- Sample Data Permissions
-- ===========================================
INSERT INTO data_permissions (user_id, permission_key, enabled)
SELECT id, 'share_trust_score', TRUE FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;

INSERT INTO data_permissions (user_id, permission_key, enabled)
SELECT id, 'share_verifications', TRUE FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;

INSERT INTO data_permissions (user_id, permission_key, enabled)
SELECT id, 'share_profile', TRUE FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;
