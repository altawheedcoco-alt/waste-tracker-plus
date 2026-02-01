-- Add more comprehensive visibility permissions
ALTER TABLE public.partner_visibility_settings
ADD COLUMN can_view_shipment_details boolean NOT NULL DEFAULT true,
ADD COLUMN can_view_driver_info boolean NOT NULL DEFAULT true,
ADD COLUMN can_view_vehicle_info boolean NOT NULL DEFAULT true,
ADD COLUMN can_view_estimated_arrival boolean NOT NULL DEFAULT true,
ADD COLUMN can_receive_notifications boolean NOT NULL DEFAULT true,
ADD COLUMN can_view_reports boolean NOT NULL DEFAULT true;