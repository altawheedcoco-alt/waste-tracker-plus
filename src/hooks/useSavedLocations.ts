import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavedLocation {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  name: string;
  name_en: string | null;
  address: string;
  city: string | null;
  governorate: string | null;
  latitude: number;
  longitude: number;
  location_type: string;
  category: string;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface NewLocationData {
  name: string;
  name_en?: string;
  address: string;
  city?: string;
  governorate?: string;
  latitude: number;
  longitude: number;
  location_type?: string;
  category?: string;
  phone?: string;
  notes?: string;
}

export function useSavedLocations() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!profile?.organization_id) {
      setLocations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setLocations((data as unknown as SavedLocation[]) || []);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const saveLocation = async (locationData: NewLocationData): Promise<SavedLocation | null> => {
    if (!profile?.organization_id || !profile?.id) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول لحفظ الموقع',
        variant: 'destructive',
      });
      return null;
    }

    setSaving(true);
    try {
      // Check if location already exists (within ~10 meters)
      const existingLocation = locations.find(
        loc => 
          Math.abs(loc.latitude - locationData.latitude) < 0.0001 &&
          Math.abs(loc.longitude - locationData.longitude) < 0.0001
      );

      if (existingLocation) {
        toast({
          title: 'الموقع موجود مسبقاً',
          description: `هذا الموقع محفوظ باسم "${existingLocation.name}"`,
          variant: 'default',
        });
        return existingLocation;
      }

      const { data, error } = await supabase
        .from('saved_locations')
        .insert({
          organization_id: profile.organization_id,
          created_by: profile.id,
          name: locationData.name,
          name_en: locationData.name_en || null,
          address: locationData.address,
          city: locationData.city || null,
          governorate: locationData.governorate || null,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          location_type: locationData.location_type || 'custom',
          category: locationData.category || 'other',
          phone: locationData.phone || null,
          notes: locationData.notes || null,
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      const newLocation = data as unknown as SavedLocation;
      setLocations(prev => [newLocation, ...prev]);
      
      toast({
        title: 'تم الحفظ',
        description: `تم حفظ الموقع "${locationData.name}" بنجاح`,
      });

      return newLocation;
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الموقع',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateLocation = async (id: string, updates: Partial<NewLocationData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setLocations(prev =>
        prev.map(loc => (loc.id === id ? { ...loc, ...updates } : loc))
      );

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الموقع بنجاح',
      });

      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الموقع',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== id));

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الموقع بنجاح',
      });

      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الموقع',
        variant: 'destructive',
      });
      return false;
    }
  };

  const incrementUsage = async (id: string) => {
    try {
      const location = locations.find(l => l.id === id);
      if (!location) return;

      await supabase
        .from('saved_locations')
        .update({
          usage_count: location.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const searchLocations = useCallback((query: string): SavedLocation[] => {
    if (!query.trim()) return locations;
    
    const lowerQuery = query.toLowerCase();
    return locations.filter(
      loc =>
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.address.toLowerCase().includes(lowerQuery) ||
        loc.city?.toLowerCase().includes(lowerQuery) ||
        loc.name_en?.toLowerCase().includes(lowerQuery)
    );
  }, [locations]);

  return {
    locations,
    loading,
    saving,
    saveLocation,
    updateLocation,
    deleteLocation,
    incrementUsage,
    searchLocations,
    refetch: fetchLocations,
  };
}
