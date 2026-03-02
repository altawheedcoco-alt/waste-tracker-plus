-- Fix issued_by FK to reference profiles instead of auth.users
ALTER TABLE public.driver_permits DROP CONSTRAINT IF EXISTS driver_permits_issued_by_fkey;
ALTER TABLE public.driver_permits ADD CONSTRAINT driver_permits_issued_by_fkey 
  FOREIGN KEY (issued_by) REFERENCES public.profiles(id);

-- Also fix suspended_by and revoked_by if they exist with wrong references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_permits' AND column_name = 'suspended_by') THEN
    ALTER TABLE public.driver_permits DROP CONSTRAINT IF EXISTS driver_permits_suspended_by_fkey;
    BEGIN
      ALTER TABLE public.driver_permits ADD CONSTRAINT driver_permits_suspended_by_fkey 
        FOREIGN KEY (suspended_by) REFERENCES public.profiles(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_permits' AND column_name = 'revoked_by') THEN
    ALTER TABLE public.driver_permits DROP CONSTRAINT IF EXISTS driver_permits_revoked_by_fkey;
    BEGIN
      ALTER TABLE public.driver_permits ADD CONSTRAINT driver_permits_revoked_by_fkey 
        FOREIGN KEY (revoked_by) REFERENCES public.profiles(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Fix driver_id to be nullable for manual entry permits
ALTER TABLE public.driver_permits ALTER COLUMN driver_id DROP NOT NULL;
ALTER TABLE public.driver_permits DROP CONSTRAINT IF EXISTS driver_permits_driver_id_fkey;
ALTER TABLE public.driver_permits ADD CONSTRAINT driver_permits_driver_id_fkey 
  FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;