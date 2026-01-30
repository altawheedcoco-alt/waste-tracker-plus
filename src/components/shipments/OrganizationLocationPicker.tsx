import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationLocation {
  id: string;
  location_name: string;
  address: string;
  city: string | null;
  is_primary: boolean;
}

interface OrganizationLocationPickerProps {
  organizationId: string;
  organizationName: string;
  organizationAddress: string;
  organizationCity: string;
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
}

const OrganizationLocationPicker = ({
  organizationId,
  organizationName,
  organizationAddress,
  organizationCity,
  value,
  onChange,
  label = 'الموقع',
  placeholder = 'اختر الموقع',
}: OrganizationLocationPickerProps) => {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLocation, setNewLocation] = useState({
    location_name: '',
    address: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Primary address from organization
  const primaryAddress = `${organizationAddress}, ${organizationCity}`;

  useEffect(() => {
    if (organizationId) {
      fetchLocations();
    }
  }, [organizationId]);

  useEffect(() => {
    // Determine selected value based on current value
    if (value === primaryAddress) {
      setSelectedValue('primary');
    } else {
      const matchedLocation = locations.find(loc => `${loc.address}, ${loc.city || ''}`.trim() === value);
      if (matchedLocation) {
        setSelectedValue(matchedLocation.id);
      } else if (value && value !== primaryAddress) {
        setSelectedValue('custom');
      } else {
        setSelectedValue('');
      }
    }
  }, [value, locations, primaryAddress]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_locations')
        .select('id, location_name, address, city, is_primary')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (selectionValue: string) => {
    setSelectedValue(selectionValue);
    
    if (selectionValue === 'primary') {
      onChange(primaryAddress);
    } else if (selectionValue === 'add_new') {
      setShowAddDialog(true);
    } else if (selectionValue === 'custom') {
      // Keep current custom value
    } else {
      // It's a location ID
      const location = locations.find(loc => loc.id === selectionValue);
      if (location) {
        const fullAddress = location.city 
          ? `${location.address}, ${location.city}` 
          : location.address;
        onChange(fullAddress);
      }
    }
  };

  const handleSaveNewLocation = async () => {
    if (!newLocation.location_name || !newLocation.address) {
      toast.error('يرجى ملء اسم الموقع والعنوان');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('organization_locations')
        .insert({
          organization_id: organizationId,
          location_name: newLocation.location_name,
          address: newLocation.address,
          city: newLocation.city || null,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إضافة الموقع بنجاح');
      
      // Update the address field with new location
      const fullAddress = newLocation.city 
        ? `${newLocation.address}, ${newLocation.city}` 
        : newLocation.address;
      onChange(fullAddress);
      
      // Refresh locations list
      await fetchLocations();
      
      // Reset form and close dialog
      setNewLocation({ location_name: '', address: '', city: '' });
      setShowAddDialog(false);
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error(error.message || 'فشل في حفظ الموقع');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomAddressChange = (customAddress: string) => {
    onChange(customAddress);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={selectedValue} onValueChange={handleSelectionChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedValue === 'primary' && (
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                المقر الرئيسي - {organizationName}
              </span>
            )}
            {selectedValue === 'custom' && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                عنوان مخصص
              </span>
            )}
            {selectedValue && selectedValue !== 'primary' && selectedValue !== 'custom' && selectedValue !== 'add_new' && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {locations.find(l => l.id === selectedValue)?.location_name}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Primary Address */}
          <SelectItem value="primary">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <div className="text-right">
                <div className="font-medium">المقر الرئيسي</div>
                <div className="text-xs text-muted-foreground">{primaryAddress}</div>
              </div>
            </div>
          </SelectItem>

          {/* Additional Locations */}
          {locations.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 mt-1">
                مواقع إضافية
              </div>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <div className="text-right">
                      <div className="font-medium">{location.location_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.address}{location.city ? `, ${location.city}` : ''}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Add New Location */}
          <div className="border-t mt-1 pt-1">
            <SelectItem value="add_new">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="w-4 h-4" />
                إضافة موقع جديد
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>

      {/* Show address input for custom or display selected address */}
      {selectedValue && (
        <div className="mt-2">
          <Input
            value={value}
            onChange={(e) => handleCustomAddressChange(e.target.value)}
            placeholder="العنوان الكامل"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            يمكنك تعديل العنوان مباشرة إذا لزم الأمر
          </p>
        </div>
      )}

      {/* Add New Location Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة موقع جديد لـ {organizationName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الموقع *</Label>
              <Input
                value={newLocation.location_name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, location_name: e.target.value }))}
                placeholder="مثال: فرع الرياض، مستودع جدة"
              />
            </div>
            <div>
              <Label>العنوان *</Label>
              <Input
                value={newLocation.address}
                onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                placeholder="العنوان التفصيلي"
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Input
                value={newLocation.city}
                onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                placeholder="المدينة"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button variant="eco" onClick={handleSaveNewLocation} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الموقع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationLocationPicker;
