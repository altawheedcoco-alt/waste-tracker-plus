import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GPSDevice, GPSDeviceType } from '@/types/gpsTracking';
import { toast } from 'sonner';

export const useGPSDevices = () => {
  const { user, profile } = useAuth();
  const [devices, setDevices] = useState<GPSDevice[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<GPSDeviceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch device types
  const fetchDeviceTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('gps_device_types')
      .select('*')
      .eq('is_active', true)
      .order('manufacturer');

    if (error) {
      console.error('Error fetching device types:', error);
      return;
    }

    setDeviceTypes(data as GPSDeviceType[]);
  }, []);

  // Fetch organization devices
  const fetchDevices = useCallback(async () => {
    if (!profile?.organization_id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('gps_devices')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    setIsLoading(false);

    if (error) {
      console.error('Error fetching GPS devices:', error);
      toast.error('فشل في جلب أجهزة GPS');
      return;
    }

    setDevices(data as GPSDevice[]);
  }, [profile?.organization_id]);

  // Add new device
  const addDevice = useCallback(async (device: Partial<GPSDevice>) => {
    if (!profile?.organization_id) {
      toast.error('لم يتم تحديد المنظمة');
      return null;
    }

    const insertData = {
      device_name: device.device_name || 'جهاز جديد',
      device_serial: device.device_serial || '',
      device_type: device.device_type || 'generic',
      protocol: device.protocol || 'http',
      organization_id: profile.organization_id,
      driver_id: device.driver_id || null,
      connection_config: device.connection_config || {},
      api_endpoint: device.api_endpoint || null,
      api_key: device.api_key || null,
      is_active: device.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('gps_devices')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error adding GPS device:', error);
      toast.error('فشل في إضافة جهاز GPS');
      return null;
    }

    toast.success('تم إضافة جهاز GPS بنجاح');
    await fetchDevices();
    return data as GPSDevice;
  }, [profile?.organization_id, fetchDevices]);

  // Update device
  const updateDevice = useCallback(async (id: string, updates: Partial<GPSDevice>) => {
    const { error } = await supabase
      .from('gps_devices')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating GPS device:', error);
      toast.error('فشل في تحديث جهاز GPS');
      return false;
    }

    toast.success('تم تحديث جهاز GPS بنجاح');
    await fetchDevices();
    return true;
  }, [fetchDevices]);

  // Delete device
  const deleteDevice = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('gps_devices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting GPS device:', error);
      toast.error('فشل في حذف جهاز GPS');
      return false;
    }

    toast.success('تم حذف جهاز GPS بنجاح');
    await fetchDevices();
    return true;
  }, [fetchDevices]);

  // Link device to driver
  const linkToDriver = useCallback(async (deviceId: string, driverId: string | null) => {
    return updateDevice(deviceId, { driver_id: driverId });
  }, [updateDevice]);

  // Test device connection
  const testConnection = useCallback(async (deviceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gps-device-gateway', {
        body: {
          action: 'test_connection',
          device_id: deviceId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('الاتصال بالجهاز ناجح');
        return true;
      } else {
        toast.error(data?.message || 'فشل الاتصال بالجهاز');
        return false;
      }
    } catch (error) {
      console.error('Error testing device connection:', error);
      toast.error('فشل في اختبار الاتصال');
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDeviceTypes();
    fetchDevices();
  }, [fetchDeviceTypes, fetchDevices]);

  // Realtime updates
  useEffect(() => {
    if (!profile?.organization_id) return;

    const channel = supabase
      .channel('gps-devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gps_devices',
          filter: `organization_id=eq.${profile.organization_id}`,
        },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.organization_id, fetchDevices]);

  return {
    devices,
    deviceTypes,
    isLoading,
    addDevice,
    updateDevice,
    deleteDevice,
    linkToDriver,
    testConnection,
    refreshDevices: fetchDevices,
  };
};

export default useGPSDevices;
