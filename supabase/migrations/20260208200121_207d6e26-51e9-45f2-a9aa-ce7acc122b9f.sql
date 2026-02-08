-- Create demo disposal organization
INSERT INTO public.organizations (
  id,
  name,
  name_en,
  organization_type,
  is_active,
  email,
  phone,
  address,
  city,
  region,
  license_number,
  commercial_register
) VALUES (
  'b0000000-0000-0000-0000-000000000006',
  'شركة الأمان للتخلص الآمن من النفايات الخطرة',
  'Al-Aman Safe Hazardous Waste Disposal',
  'disposal',
  true,
  'disposal@demo.com',
  '+201000000006',
  'المنطقة الصناعية، العاشر من رمضان',
  'العاشر من رمضان',
  'الشرقية',
  'HWD-2024-001',
  '123456'
);

-- Create demo disposal user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'disposal@demo.com',
  crypt('disposal123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "مدير جهة التخلص النهائي"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- Create identity for the user
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000006',
  'disposal@demo.com',
  '{"sub": "a0000000-0000-0000-0000-000000000006", "email": "disposal@demo.com"}',
  'email',
  now(),
  now(),
  now()
);

-- Create profile for disposal user
INSERT INTO public.profiles (
  id,
  user_id,
  full_name,
  email,
  phone,
  organization_id,
  is_active,
  position
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000006',
  'مدير جهة التخلص النهائي',
  'disposal@demo.com',
  '+201000000006',
  'b0000000-0000-0000-0000-000000000006',
  true,
  'مدير'
);