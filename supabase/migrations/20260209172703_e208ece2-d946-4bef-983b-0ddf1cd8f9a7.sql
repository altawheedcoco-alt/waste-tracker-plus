-- Add missing foreign key constraints for shipment_receipts
ALTER TABLE public.shipment_receipts
  ADD CONSTRAINT shipment_receipts_generator_id_fkey
  FOREIGN KEY (generator_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.shipment_receipts
  ADD CONSTRAINT shipment_receipts_transporter_id_fkey
  FOREIGN KEY (transporter_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.shipment_receipts
  ADD CONSTRAINT shipment_receipts_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;