-- Add missing driver roles for driver accounts
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('c4835f84-b69e-488a-9fb8-7bf4629fb3e8', 'driver'),  -- company-driver@irecycle.test
  ('9d9180d2-a944-4970-baf9-2ad0370dc177', 'driver'),  -- independent-driver@irecycle.test
  ('3ba017fa-9e27-49b1-acf2-56986de54ffc', 'driver')   -- demo-driver@irecycle.test
ON CONFLICT (user_id, role) DO NOTHING;