
-- Add 'employee' role to all transporter member-level users
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'employee'
FROM auth.users u
JOIN user_organizations uo ON uo.user_id = u.id
WHERE uo.role_in_organization = 'member'
  AND u.email LIKE '%@transporter.demo'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'employee'
  );
