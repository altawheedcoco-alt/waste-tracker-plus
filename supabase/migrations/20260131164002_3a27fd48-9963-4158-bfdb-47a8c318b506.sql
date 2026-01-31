-- Change waste_state column from enum to text to allow custom values
ALTER TABLE public.shipments 
ALTER COLUMN waste_state TYPE text;