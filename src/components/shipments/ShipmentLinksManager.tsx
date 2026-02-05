import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Share2,
  Settings2,
  Building2,
  Package,
  Lock,
  Unlock,
  FileText,
  Truck,
  MapPin,
  Factory,
  Recycle,
  Navigation,
  X,
} from 'lucide-react';
import GoogleMapsSearchBox from '@/components/maps/GoogleMapsSearchBox';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import WasteTypeCombobox from '@/components/shipments/WasteTypeCombobox';

interface Partner {
  id: string;
  name: string;
  type: 'organization' | 'external';
  orgType?: string;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  city?: string;
}

interface ShipmentLink {
  id: string;
  organization_id: string;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  preset_generator_id: string | null;
  preset_generator_external_id: string | null;
  preset_recycler_id: string | null;
  preset_recycler_external_id: string | null;
  preset_waste_type: string | null;
  preset_waste_category: string | null;
  preset_notes: string | null;
  preset_pickup_location: unknown;
  preset_delivery_location: unknown;
  allow_weight_edit: boolean;
  allow_date_edit: boolean;
  allow_generator_edit: boolean;
  allow_recycler_edit: boolean;
  allow_location_edit: boolean;
  require_photo: boolean;
}

// Helper to parse location data from JSON
const parseLocationData = (data: unknown): LocationData | null => {
  if (!data || typeof data !== 'object') return null;
  const loc = data as Record<string, unknown>;
  if (typeof loc.address === 'string' && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return {
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      city: typeof loc.city === 'string' ? loc.city : undefined,
    };
  }
  return null;
};

// Basic waste type labels for display (full classification is handled by WasteTypeCombobox)
const wasteTypeLabels: Record<string, string> = {
  wood: 'أخشاب',
  plastic: 'بلاستيك',
  paper: 'ورق وكرتون',
  metal: 'معادن',
  glass: 'زجاج',
  organic: 'عضوي',
  electronic: 'إلكتروني',
  hazardous: 'خطر',
  textile: 'منسوجات',
  rubber: 'مطاط',
  mixed: 'مختلط',
  other: 'أخرى',
  chemical: 'كيميائي',
  medical: 'طبي',
  construction: 'بناء وهدم',
};

const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const ShipmentLinksManager = () => {
  const { profile, organization } = useAuth();
  const [links, setLinks] = useState<ShipmentLink[]>([]);
  const [generators, setGenerators] = useState<Partner[]>([]);
  const [recyclers, setRecyclers] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  
  // Preset fields
  const [presetGeneratorId, setPresetGeneratorId] = useState('');
  const [presetRecyclerId, setPresetRecyclerId] = useState('');
  const [presetWasteType, setPresetWasteType] = useState('');
  const [presetWasteCategory, setPresetWasteCategory] = useState('');
  const [presetNotes, setPresetNotes] = useState('');
  
  // Preset locations
  const [presetPickupLocation, setPresetPickupLocation] = useState<LocationData | null>(null);
  const [presetDeliveryLocation, setPresetDeliveryLocation] = useState<LocationData | null>(null);
  
  // Permissions
  const [allowWeightEdit, setAllowWeightEdit] = useState(true);
  const [allowDateEdit, setAllowDateEdit] = useState(true);
  const [allowGeneratorEdit, setAllowGeneratorEdit] = useState(false);
  const [allowRecyclerEdit, setAllowRecyclerEdit] = useState(false);
  const [allowLocationEdit, setAllowLocationEdit] = useState(true);
  const [requirePhoto, setRequirePhoto] = useState(false);
  
  // Google Maps
  const { isLoaded: mapsLoaded } = useGoogleMaps();

  const loadLinks = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('organization_shipment_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    if (!profile?.organization_id) return;

    try {
      // Load generators (registered organizations)
      const { data: genOrgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('organization_type', 'generator')
        .order('name');

      // Load recyclers (registered organizations)
      const { data: recOrgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('organization_type', 'recycler')
        .order('name');

      // Load external partners
      const { data: externals } = await supabase
        .from('external_partners')
        .select('id, name, partner_type')
        .eq('organization_id', profile.organization_id)
        .order('name');

      const allGenerators: Partner[] = [
        ...(genOrgs || []).map(o => ({ 
          id: o.id, 
          name: o.name, 
          type: 'organization' as const,
          orgType: 'generator'
        })),
        ...(externals || [])
          .filter(e => e.partner_type === 'generator')
          .map(e => ({ 
            id: e.id, 
            name: `${e.name} (خارجي)`, 
            type: 'external' as const,
            orgType: 'generator'
          })),
      ];

      const allRecyclers: Partner[] = [
        ...(recOrgs || []).map(o => ({ 
          id: o.id, 
          name: o.name, 
          type: 'organization' as const,
          orgType: 'recycler'
        })),
        ...(externals || [])
          .filter(e => e.partner_type === 'recycler')
          .map(e => ({ 
            id: e.id, 
            name: `${e.name} (خارجي)`, 
            type: 'external' as const,
            orgType: 'recycler'
          })),
      ];

      setGenerators(allGenerators);
      setRecyclers(allRecyclers);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  useEffect(() => {
    loadLinks();
    loadPartners();
  }, [profile?.organization_id]);

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setHasExpiry(false);
    setExpiryDate('');
    setPresetGeneratorId('');
    setPresetRecyclerId('');
    setPresetWasteType('');
    setPresetWasteCategory('');
    setPresetNotes('');
    setPresetPickupLocation(null);
    setPresetDeliveryLocation(null);
    setAllowWeightEdit(true);
    setAllowDateEdit(true);
    setAllowGeneratorEdit(false);
    setAllowRecyclerEdit(false);
    setAllowLocationEdit(true);
    setRequirePhoto(false);
  };

  const createLink = async () => {
    if (!profile?.organization_id) return;

    setCreating(true);
    try {
      const token = generateToken();
      const selectedGenerator = generators.find(p => p.id === presetGeneratorId);
      const selectedRecycler = recyclers.find(p => p.id === presetRecyclerId);
      
      const insertData: any = {
        organization_id: profile.organization_id,
        token,
        title: newTitle || 'رابط شحنة سريعة',
        description: newDescription || null,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        created_by: profile.id,
        preset_waste_type: presetWasteType || null,
        preset_waste_category: presetWasteCategory || null,
        preset_notes: presetNotes || null,
        preset_pickup_location: presetPickupLocation ? JSON.stringify(presetPickupLocation) : null,
        preset_delivery_location: presetDeliveryLocation ? JSON.stringify(presetDeliveryLocation) : null,
        allow_weight_edit: allowWeightEdit,
        allow_date_edit: allowDateEdit,
        allow_generator_edit: allowGeneratorEdit,
        allow_recycler_edit: allowRecyclerEdit,
        allow_location_edit: allowLocationEdit,
        require_photo: requirePhoto,
      };

      // Set generator based on type
      if (selectedGenerator) {
        if (selectedGenerator.type === 'organization') {
          insertData.preset_generator_id = presetGeneratorId;
        } else {
          insertData.preset_generator_external_id = presetGeneratorId;
        }
      }

      // Set recycler based on type
      if (selectedRecycler) {
        if (selectedRecycler.type === 'organization') {
          insertData.preset_recycler_id = presetRecyclerId;
        } else {
          insertData.preset_recycler_external_id = presetRecyclerId;
        }
      }

      const { error } = await supabase
        .from('organization_shipment_links')
        .insert(insertData);

      if (error) throw error;

      toast.success('✅ تم إنشاء الرابط بنجاح');
      setDialogOpen(false);
      resetForm();
      loadLinks();
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('فشل في إنشاء الرابط');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (linkId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_shipment_links')
        .update({ is_active: !isActive })
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success(isActive ? 'تم إيقاف الرابط' : 'تم تفعيل الرابط');
    } catch (error) {
      console.error('Error toggling link:', error);
      toast.error('فشل في تحديث الرابط');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    try {
      const { error } = await supabase
        .from('organization_shipment_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      loadLinks();
      toast.success('تم حذف الرابط');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('فشل في حذف الرابط');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/shipment/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const shareLink = async (link: ShipmentLink) => {
    const url = `${window.location.origin}/shipment/${link.token}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || 'رابط شحنة سريعة',
          text: link.description || 'سجل شحنتك بسهولة',
          url,
        });
      } catch (error) {
        copyLink(link.token);
      }
    } else {
      copyLink(link.token);
    }
  };

  const getGeneratorName = (link: ShipmentLink) => {
    if (link.preset_generator_id) {
      return generators.find(p => p.id === link.preset_generator_id)?.name || 'مولد محدد';
    }
    if (link.preset_generator_external_id) {
      return generators.find(p => p.id === link.preset_generator_external_id)?.name || 'مولد خارجي';
    }
    return null;
  };

  const getRecyclerName = (link: ShipmentLink) => {
    if (link.preset_recycler_id) {
      return recyclers.find(p => p.id === link.preset_recycler_id)?.name || 'مدور محدد';
    }
    if (link.preset_recycler_external_id) {
      return recyclers.find(p => p.id === link.preset_recycler_external_id)?.name || 'مدور خارجي';
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              روابط الشحنات السريعة
            </CardTitle>
            <CardDescription>
              أنشئ روابط مخصصة لتسجيل الشحنات مع بيانات محددة مسبقاً
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء رابط جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء رابط شحنة جديد</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>عنوان الرابط</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="مثال: شحنات شركة نستلة - أخشاب"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الوصف (اختياري)</Label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="تعليمات للسائق أو معلومات إضافية..."
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Preset Data Section */}
                <Accordion type="single" collapsible defaultValue="preset">
                  <AccordionItem value="preset" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Settings2 className="h-4 w-4 text-primary" />
                        البيانات الثابتة (محددة مسبقاً)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {/* Generator Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Factory className="h-4 w-4" />
                          الجهة المولدة
                        </Label>
                        <Select value={presetGeneratorId} onValueChange={setPresetGeneratorId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجهة المولدة..." />
                          </SelectTrigger>
                          <SelectContent>
                            {generators.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {partner.type === 'external' ? 'خارجي' : 'مسجل'}
                                  </Badge>
                                  {partner.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Recycler Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Recycle className="h-4 w-4" />
                          جهة التدوير
                        </Label>
                        <Select value={presetRecyclerId} onValueChange={setPresetRecyclerId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر جهة التدوير..." />
                          </SelectTrigger>
                          <SelectContent>
                            {recyclers.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {partner.type === 'external' ? 'خارجي' : 'مسجل'}
                                  </Badge>
                                  {partner.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Waste Type - Full Classification */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          نوع المخلفات (التصنيف الكامل)
                        </Label>
                        <WasteTypeCombobox
                          value={presetWasteCategory || ''}
                          onChange={(wasteType, hazardLevel, wasteDescription) => {
                            setPresetWasteType(wasteType);
                            setPresetWasteCategory(wasteDescription);
                          }}
                        />
                        {presetWasteCategory && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <span className="font-medium">المختار:</span> {presetWasteCategory}
                          </div>
                        )}
                      </div>

                      {/* Preset Notes */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          ملاحظات ثابتة
                        </Label>
                        <Textarea
                          value={presetNotes}
                          onChange={(e) => setPresetNotes(e.target.value)}
                          placeholder="ملاحظات تظهر مع كل شحنة..."
                          rows={2}
                        />
                      </div>

                      <Separator className="my-3" />

                      {/* Preset Locations */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <MapPin className="h-4 w-4" />
                          المواقع المحددة مسبقاً
                        </div>

                        {/* Pickup Location */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-emerald-600" />
                            مكان الاستلام
                          </Label>
                          {presetPickupLocation ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="text-sm flex-1 truncate">{presetPickupLocation.address}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => setPresetPickupLocation(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : mapsLoaded ? (
                            <GoogleMapsSearchBox
                              onSelect={(result) => {
                                setPresetPickupLocation({
                                  address: result.address,
                                  lat: result.position.lat,
                                  lng: result.position.lng,
                                });
                              }}
                              placeholder="ابحث عن مكان الاستلام..."
                              showLocalResults={true}
                            />
                          ) : (
                            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground text-center">
                              جاري تحميل الخريطة...
                            </div>
                          )}
                        </div>

                        {/* Delivery Location */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-blue-600" />
                            مكان التسليم
                          </Label>
                          {presetDeliveryLocation ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className="text-sm flex-1 truncate">{presetDeliveryLocation.address}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => setPresetDeliveryLocation(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : mapsLoaded ? (
                            <GoogleMapsSearchBox
                              onSelect={(result) => {
                                setPresetDeliveryLocation({
                                  address: result.address,
                                  lat: result.position.lat,
                                  lng: result.position.lng,
                                });
                              }}
                              placeholder="ابحث عن مكان التسليم..."
                              showLocalResults={true}
                            />
                          ) : (
                            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground text-center">
                              جاري تحميل الخريطة...
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="permissions" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4 text-amber-600" />
                        صلاحيات المستخدم
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowWeightEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتعديل الوزن</Label>
                        </div>
                        <Switch checked={allowWeightEdit} onCheckedChange={setAllowWeightEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowDateEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتعديل التاريخ</Label>
                        </div>
                        <Switch checked={allowDateEdit} onCheckedChange={setAllowDateEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowGeneratorEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتغيير المولد</Label>
                        </div>
                        <Switch checked={allowGeneratorEdit} onCheckedChange={setAllowGeneratorEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowRecyclerEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتغيير المدور</Label>
                        </div>
                        <Switch checked={allowRecyclerEdit} onCheckedChange={setAllowRecyclerEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {allowLocationEdit ? <Unlock className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-amber-600" />}
                          <Label className="cursor-pointer">السماح بتعديل المواقع</Label>
                        </div>
                        <Switch checked={allowLocationEdit} onCheckedChange={setAllowLocationEdit} />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {requirePhoto ? <Lock className="h-4 w-4 text-amber-600" /> : <Unlock className="h-4 w-4 text-emerald-600" />}
                          <Label className="cursor-pointer">إلزام رفع صورة</Label>
                        </div>
                        <Switch checked={requirePhoto} onCheckedChange={setRequirePhoto} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Separator />

                {/* Expiry */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>تحديد تاريخ انتهاء</Label>
                    <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
                  </div>
                  
                  {hasExpiry && (
                    <div className="space-y-2">
                      <Label>تاريخ الانتهاء</Label>
                      <Input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={createLink} 
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  إنشاء الرابط
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد روابط حتى الآن</p>
            <p className="text-sm">أنشئ رابطاً جديداً لتسجيل الشحنات بسرعة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => {
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
              const url = `${window.location.origin}/shipment/${link.token}`;
              const generatorName = getGeneratorName(link);
              const recyclerName = getRecyclerName(link);
              const wasteType = link.preset_waste_category || wasteTypeLabels[link.preset_waste_type || ''] || link.preset_waste_type;
              const pickupLocation = parseLocationData(link.preset_pickup_location);
              const deliveryLocation = parseLocationData(link.preset_delivery_location);
              
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    link.is_active && !isExpired 
                      ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium truncate">{link.title || 'رابط شحنة'}</h4>
                        {link.is_active && !isExpired ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            نشط
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            منتهي
                          </Badge>
                        ) : (
                          <Badge variant="secondary">معطل</Badge>
                        )}
                      </div>
                      
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      )}

                      {/* Preset Info */}
                      {(generatorName || recyclerName || wasteType || pickupLocation || deliveryLocation) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {generatorName && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Factory className="h-3 w-3" />
                              {generatorName}
                            </Badge>
                          )}
                          {recyclerName && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Recycle className="h-3 w-3" />
                              {recyclerName}
                            </Badge>
                          )}
                          {wasteType && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Package className="h-3 w-3" />
                              {wasteType}
                            </Badge>
                          )}
                          {pickupLocation && (
                            <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800">
                              <Navigation className="h-3 w-3 text-emerald-600" />
                              <span className="max-w-[100px] truncate">{pickupLocation.address.split(',')[0]}</span>
                            </Badge>
                          )}
                          {deliveryLocation && (
                            <Badge variant="outline" className="text-xs gap-1 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800">
                              <MapPin className="h-3 w-3 text-blue-600" />
                              <span className="max-w-[100px] truncate">{deliveryLocation.address.split(',')[0]}</span>
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <code className="bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                          {url}
                        </code>
                        {link.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            ينتهي: {new Date(link.expires_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => shareLink(link)}
                        title="مشاركة"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(link.token)}
                        title="نسخ"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/shipment/${link.token}`, '_blank')}
                        title="فتح"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={() => toggleLink(link.id, link.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLink(link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentLinksManager;
