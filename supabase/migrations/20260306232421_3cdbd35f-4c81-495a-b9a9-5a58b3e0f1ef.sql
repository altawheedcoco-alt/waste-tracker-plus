-- Update existing profiles to set correct organization
UPDATE profiles SET 
  organization_id = '4f971587-891b-40fd-a97f-d198f92f3e2f',
  active_organization_id = '4f971587-891b-40fd-a97f-d198f92f3e2f'
WHERE id = '68ce74bd-1b82-45d6-bfa1-e56fe677e440';

-- For other 3, insert with user_id
INSERT INTO profiles (id, user_id, full_name, email, organization_id, active_organization_id)
VALUES 
  ('6bc8ea34-9cbd-4b43-844b-7fc1a07fcf43', '6bc8ea34-9cbd-4b43-844b-7fc1a07fcf43', 'وزارة البيئة - جهاز شؤون البيئة', 'eeaa@irecycle.demo', '27be0b55-22fb-4966-ae76-a18ed0e00876', '27be0b55-22fb-4966-ae76-a18ed0e00876'),
  ('40d366be-f335-4904-82b6-8f0f0d4eaea8', '40d366be-f335-4904-82b6-8f0f0d4eaea8', 'جهاز تنظيم النقل البري', 'ltra@irecycle.demo', 'd2bb4f35-dc49-4404-a399-dda1696667a3', 'd2bb4f35-dc49-4404-a399-dda1696667a3'),
  ('53c8d6ce-cfbb-4bb8-891b-c43c1c709d48', '53c8d6ce-cfbb-4bb8-891b-c43c1c709d48', 'الهيئة العامة للتنمية الصناعية', 'ida@irecycle.demo', '0fba1e59-13e6-4614-ad0f-2ecae0c1ed6d', '0fba1e59-13e6-4614-ad0f-2ecae0c1ed6d')
ON CONFLICT (id) DO UPDATE SET 
  organization_id = EXCLUDED.organization_id,
  active_organization_id = EXCLUDED.active_organization_id;

-- Ensure user_organizations links for all 4
INSERT INTO user_organizations (user_id, organization_id, role_in_organization, is_primary)
VALUES
  ('68ce74bd-1b82-45d6-bfa1-e56fe677e440', '4f971587-891b-40fd-a97f-d198f92f3e2f', 'owner', true),
  ('6bc8ea34-9cbd-4b43-844b-7fc1a07fcf43', '27be0b55-22fb-4966-ae76-a18ed0e00876', 'owner', true),
  ('40d366be-f335-4904-82b6-8f0f0d4eaea8', 'd2bb4f35-dc49-4404-a399-dda1696667a3', 'owner', true),
  ('53c8d6ce-cfbb-4bb8-891b-c43c1c709d48', '0fba1e59-13e6-4614-ad0f-2ecae0c1ed6d', 'owner', true)
ON CONFLICT DO NOTHING;