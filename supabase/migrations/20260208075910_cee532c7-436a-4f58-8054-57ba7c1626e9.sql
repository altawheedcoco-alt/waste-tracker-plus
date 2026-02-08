-- جدول أجهزة GPS المربوطة بالسائقين
CREATE TABLE public.gps_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  device_serial TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL DEFAULT 'generic',
  protocol TEXT NOT NULL DEFAULT 'http',
  connection_config JSONB DEFAULT '{}',
  api_endpoint TEXT,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  last_ping_at TIMESTAMP WITH TIME ZONE,
  last_location JSONB,
  battery_level INTEGER,
  signal_strength INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجلات مواقع GPS
CREATE TABLE public.gps_location_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  altitude DECIMAL(10, 2),
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  accuracy DECIMAL(8, 2),
  source TEXT NOT NULL DEFAULT 'gps_device',
  raw_data JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات التتبع للشحنات
CREATE TABLE public.shipment_tracking_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE UNIQUE,
  tracking_source TEXT NOT NULL DEFAULT 'mobile',
  primary_source TEXT DEFAULT 'mobile',
  gps_device_id UUID REFERENCES public.gps_devices(id) ON DELETE SET NULL,
  fallback_enabled BOOLEAN DEFAULT true,
  location_sync_interval INTEGER DEFAULT 30,
  anomaly_detection_enabled BOOLEAN DEFAULT true,
  max_source_deviation DECIMAL(10, 2) DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أنواع أجهزة GPS المدعومة
CREATE TABLE public.gps_device_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  manufacturer TEXT NOT NULL,
  protocol TEXT NOT NULL,
  default_port INTEGER,
  config_schema JSONB NOT NULL DEFAULT '{}',
  parser_type TEXT NOT NULL DEFAULT 'json',
  sample_payload JSONB,
  documentation_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة أنواع GPS الشائعة
INSERT INTO public.gps_device_types (name, manufacturer, protocol, default_port, config_schema, parser_type) VALUES
('teltonika_fmb', 'Teltonika', 'tcp', 5001, '{"imei": "string", "password": "string"}', 'binary'),
('queclink_gv', 'Queclink', 'tcp', 5002, '{"device_id": "string", "password": "string"}', 'text'),
('calamp_lmu', 'CalAmp', 'http', 443, '{"api_url": "string", "api_key": "string", "device_esn": "string"}', 'json'),
('ruptela_fm', 'Ruptela', 'tcp', 5003, '{"imei": "string"}', 'binary'),
('concox_gt06', 'Concox', 'tcp', 5004, '{"imei": "string"}', 'binary'),
('coban_gps103', 'Coban', 'tcp', 5005, '{"imei": "string", "password": "string"}', 'text'),
('generic_http', 'Generic', 'http', 443, '{"webhook_url": "string", "auth_token": "string"}', 'json'),
('generic_mqtt', 'Generic', 'mqtt', 1883, '{"broker_url": "string", "topic": "string", "username": "string", "password": "string"}', 'json');

-- Enable RLS
ALTER TABLE public.gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_location_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_device_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gps_devices
CREATE POLICY "gps_devices_select" ON public.gps_devices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.organization_id = gps_devices.organization_id)
);

CREATE POLICY "gps_devices_all" ON public.gps_devices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.organization_id = gps_devices.organization_id)
);

-- RLS Policies for gps_location_logs
CREATE POLICY "gps_location_logs_select" ON public.gps_location_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.gps_devices d 
    JOIN public.profiles p ON p.organization_id = d.organization_id 
    WHERE d.id = gps_location_logs.device_id AND p.id = auth.uid()
  )
);

CREATE POLICY "gps_location_logs_insert" ON public.gps_location_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for shipment_tracking_config
CREATE POLICY "tracking_config_select" ON public.shipment_tracking_config FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shipments s 
    JOIN public.profiles p ON p.organization_id = s.generator_id OR p.organization_id = s.transporter_id OR p.organization_id = s.recycler_id
    WHERE s.id = shipment_tracking_config.shipment_id AND p.id = auth.uid()
  )
);

CREATE POLICY "tracking_config_all" ON public.shipment_tracking_config FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.shipments s 
    JOIN public.profiles p ON p.organization_id = s.generator_id OR p.organization_id = s.transporter_id OR p.organization_id = s.recycler_id
    WHERE s.id = shipment_tracking_config.shipment_id AND p.id = auth.uid()
  )
);

-- RLS for device types (public read)
CREATE POLICY "device_types_public_read" ON public.gps_device_types FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_gps_devices_org ON public.gps_devices(organization_id);
CREATE INDEX idx_gps_devices_driver ON public.gps_devices(driver_id);
CREATE INDEX idx_gps_location_logs_device ON public.gps_location_logs(device_id);
CREATE INDEX idx_gps_location_logs_shipment ON public.gps_location_logs(shipment_id);
CREATE INDEX idx_gps_location_logs_recorded ON public.gps_location_logs(recorded_at DESC);

-- Triggers
CREATE TRIGGER update_gps_devices_updated_at BEFORE UPDATE ON public.gps_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipment_tracking_config_updated_at BEFORE UPDATE ON public.shipment_tracking_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_location_logs;