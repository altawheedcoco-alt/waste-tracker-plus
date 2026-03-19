
-- Call records table
CREATE TABLE public.call_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL,
  caller_org_id uuid NOT NULL REFERENCES public.organizations(id),
  receiver_org_id uuid NOT NULL REFERENCES public.organizations(id),
  call_type text NOT NULL DEFAULT 'voice' CHECK (call_type IN ('voice', 'video')),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'answered', 'ended', 'missed', 'rejected', 'busy')),
  started_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org calls"
ON public.call_records FOR SELECT TO authenticated
USING (
  caller_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR receiver_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create calls from their org"
ON public.call_records FOR INSERT TO authenticated
WITH CHECK (
  caller_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their org calls"
ON public.call_records FOR UPDATE TO authenticated
USING (
  caller_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR receiver_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Index for quick lookup
CREATE INDEX idx_call_records_orgs ON public.call_records(caller_org_id, receiver_org_id);
CREATE INDEX idx_call_records_status ON public.call_records(status) WHERE status = 'ringing';

-- Enable realtime for call signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_records;
