-- Create shipment_receipts table for pickup certificates
CREATE TABLE public.shipment_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  transporter_id UUID NOT NULL REFERENCES public.organizations(id),
  generator_id UUID NOT NULL REFERENCES public.organizations(id),
  driver_id UUID REFERENCES public.drivers(id),
  
  -- Receipt details
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pickup_location TEXT,
  pickup_coordinates JSONB,
  
  -- Waste details
  waste_type TEXT,
  waste_category TEXT,
  declared_weight DECIMAL(10,2),
  actual_weight DECIMAL(10,2),
  unit TEXT DEFAULT 'kg',
  
  -- Verification
  generator_signature TEXT,
  driver_signature TEXT,
  pickup_photos TEXT[],
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed', 'cancelled')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.shipment_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Transporters can view their receipts"
ON public.shipment_receipts
FOR SELECT
USING (
  transporter_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Generators can view their receipts"
ON public.shipment_receipts
FOR SELECT
USING (
  generator_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Transporters can create receipts"
ON public.shipment_receipts
FOR INSERT
WITH CHECK (
  transporter_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Transporters can update their receipts"
ON public.shipment_receipts
FOR UPDATE
USING (
  transporter_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Generators can confirm receipts"
ON public.shipment_receipts
FOR UPDATE
USING (
  generator_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(CAST((SELECT COUNT(*) + 1 FROM public.shipment_receipts WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())) AS TEXT), 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto receipt number
CREATE TRIGGER set_receipt_number
BEFORE INSERT ON public.shipment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.generate_receipt_number();

-- Create trigger for updated_at
CREATE TRIGGER update_shipment_receipts_updated_at
BEFORE UPDATE ON public.shipment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_shipment_receipts_transporter ON public.shipment_receipts(transporter_id);
CREATE INDEX idx_shipment_receipts_generator ON public.shipment_receipts(generator_id);
CREATE INDEX idx_shipment_receipts_shipment ON public.shipment_receipts(shipment_id);
CREATE INDEX idx_shipment_receipts_status ON public.shipment_receipts(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_receipts;