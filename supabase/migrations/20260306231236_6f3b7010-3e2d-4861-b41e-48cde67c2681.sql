
-- Link user to existing WMRA organization
INSERT INTO user_organizations (user_id, organization_id)
VALUES ('68ce74bd-1b82-45d6-bfa1-e56fe677e440', '4f971587-891b-40fd-a97f-d198f92f3e2f')
ON CONFLICT DO NOTHING;

-- Set active organization on profile
UPDATE profiles SET organization_id = '4f971587-891b-40fd-a97f-d198f92f3e2f', active_organization_id = '4f971587-891b-40fd-a97f-d198f92f3e2f' WHERE id = '68ce74bd-1b82-45d6-bfa1-e56fe677e440';
