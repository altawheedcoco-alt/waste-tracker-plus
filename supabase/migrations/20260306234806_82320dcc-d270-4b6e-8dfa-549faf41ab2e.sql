INSERT INTO profiles (id, user_id, full_name, email, organization_id, active_organization_id)
VALUES (
  '68ce74bd-1b82-45d6-bfa1-e56fe677e440',
  '68ce74bd-1b82-45d6-bfa1-e56fe677e440',
  'جهاز تنظيم إدارة المخلفات',
  'wmra@irecycle.demo',
  '4f971587-891b-40fd-a97f-d198f92f3e2f',
  '4f971587-891b-40fd-a97f-d198f92f3e2f'
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  active_organization_id = EXCLUDED.active_organization_id,
  user_id = EXCLUDED.user_id;