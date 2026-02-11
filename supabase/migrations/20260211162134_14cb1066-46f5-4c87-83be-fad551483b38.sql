
-- Timeslots defined by recycler organizations
CREATE TABLE public.recycler_timeslots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INT NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Bookings for specific dates
CREATE TABLE public.slot_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timeslot_id UUID NOT NULL REFERENCES public.recycler_timeslots(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  recycler_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  booked_by_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  booked_by_user_id UUID REFERENCES auth.users(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  vehicle_plate TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  notes TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(timeslot_id, shipment_id)
);

-- Add booking reference to shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS slot_booking_id UUID REFERENCES public.slot_bookings(id);

-- Enable RLS
ALTER TABLE public.recycler_timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_bookings ENABLE ROW LEVEL SECURITY;

-- Timeslot policies: recyclers manage their own, everyone can view active ones
CREATE POLICY "Recyclers manage own timeslots"
  ON public.recycler_timeslots FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Everyone can view active timeslots"
  ON public.recycler_timeslots FOR SELECT
  USING (is_active = true);

-- Booking policies
CREATE POLICY "Involved orgs can view bookings"
  ON public.slot_bookings FOR SELECT
  USING (
    recycler_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR booked_by_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Generators/transporters can create bookings"
  ON public.slot_bookings FOR INSERT
  WITH CHECK (
    booked_by_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Involved orgs can update bookings"
  ON public.slot_bookings FOR UPDATE
  USING (
    recycler_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR booked_by_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Function to check slot availability
CREATE OR REPLACE FUNCTION public.check_slot_availability(
  p_timeslot_id UUID,
  p_booking_date DATE
) RETURNS INT AS $$
DECLARE
  v_max_capacity INT;
  v_current_bookings INT;
BEGIN
  SELECT max_capacity INTO v_max_capacity
  FROM public.recycler_timeslots WHERE id = p_timeslot_id AND is_active = true;

  IF v_max_capacity IS NULL THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO v_current_bookings
  FROM public.slot_bookings
  WHERE timeslot_id = p_timeslot_id
    AND booking_date = p_booking_date
    AND status = 'confirmed';

  RETURN v_max_capacity - v_current_bookings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Index for fast availability checks
CREATE INDEX idx_slot_bookings_lookup ON public.slot_bookings(timeslot_id, booking_date, status);
CREATE INDEX idx_recycler_timeslots_org ON public.recycler_timeslots(organization_id, is_active);
