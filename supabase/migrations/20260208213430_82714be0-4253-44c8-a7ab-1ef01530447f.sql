-- إضافة مفتاح أجنبي بين shipments.driver_id و drivers.id
ALTER TABLE shipments 
ADD CONSTRAINT shipments_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;