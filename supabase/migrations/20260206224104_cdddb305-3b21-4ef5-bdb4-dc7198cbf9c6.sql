-- إضافة قيود المفاتيح الخارجية المفقودة للشحنات
ALTER TABLE public.shipments 
ADD CONSTRAINT shipments_generator_id_fkey 
FOREIGN KEY (generator_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.shipments 
ADD CONSTRAINT shipments_recycler_id_fkey 
FOREIGN KEY (recycler_id) REFERENCES public.organizations(id) ON DELETE SET NULL;