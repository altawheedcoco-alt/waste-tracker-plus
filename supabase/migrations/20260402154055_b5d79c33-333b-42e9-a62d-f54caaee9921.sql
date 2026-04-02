
-- Containers management table
CREATE TABLE public.containers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  container_code TEXT NOT NULL,
  container_type TEXT NOT NULL DEFAULT 'bin',
  capacity_liters NUMERIC,
  capacity_kg NUMERIC,
  material TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  current_fill_level NUMERIC DEFAULT 0,
  location_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  assigned_to_organization_id UUID REFERENCES public.organizations(id),
  assigned_to_route TEXT,
  last_emptied_at TIMESTAMPTZ,
  last_inspected_at TIMESTAMPTZ,
  next_maintenance_date DATE,
  condition TEXT DEFAULT 'good',
  notes TEXT,
  qr_code TEXT,
  rfid_tag TEXT,
  waste_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Container activity log
CREATE TABLE public.container_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  container_id UUID REFERENCES public.containers(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  actor_user_id UUID,
  actor_organization_id UUID,
  fill_level_before NUMERIC,
  fill_level_after NUMERIC,
  location_lat NUMERIC,
  location_lng NUMERIC,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_activities ENABLE ROW LEVEL SECURITY;

-- RLS: org members can manage their containers
CREATE POLICY "Org members can view their containers" ON public.containers
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Org members can insert containers" ON public.containers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Org members can update containers" ON public.containers
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Assigned orgs can view containers" ON public.containers
  FOR SELECT TO authenticated
  USING (assigned_to_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- Container activities RLS
CREATE POLICY "View container activities" ON public.container_activities
  FOR SELECT TO authenticated
  USING (container_id IN (SELECT id FROM public.containers WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Insert container activities" ON public.container_activities
  FOR INSERT TO authenticated
  WITH CHECK (container_id IN (SELECT id FROM public.containers WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())));
