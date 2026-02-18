import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EyeOff } from 'lucide-react';
import { 
  Map, 
  Navigation, 
  Route, 
  Eye, 
  Building2, 
  Recycle,
  Shield,
  Settings2,
  Lock,
  Unlock,
  RefreshCw,
  FileText,
  User,
  Truck,
  Clock,
  Bell,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerVisibility } from '@/hooks/usePartnerVisibility';

const PartnerVisibilitySettings = () => {
  const { organization } = useAuth();
  const { 
    partnersWithSettings, 
    isLoading, 
    updateVisibility, 
    isUpdating,
    refetch 
  } = usePartnerVisibility();
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  const handleToggle = (
    partnerId: string, 
    field: 'can_view_maps' | 'can_view_tracking' | 'can_view_routes' | 'can_view_driver_location' | 'can_view_shipment_details' | 'can_view_driver_info' | 'can_view_vehicle_info' | 'can_view_estimated_arrival' | 'can_receive_notifications' | 'can_view_reports' | 'can_view_recycler_info' | 'can_view_generator_info',
    currentValue: boolean
  ) => {
    const newValue = !currentValue;
    
    // Update local state immediately for responsiveness
    setLocalSettings(prev => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        [field]: newValue,
      }
    }));

    // Send update to server
    updateVisibility({
      partner_organization_id: partnerId,
      [field]: newValue,
    });
  };

  const getSettingValue = (partner: any, field: string): boolean => {
    if (localSettings[partner.id]?.[field] !== undefined) {
      return localSettings[partner.id][field];
    }
    return partner.visibility[field] ?? true;
  };

  const toggleAll = (partnerId: string, enable: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [partnerId]: {
        can_view_maps: enable,
        can_view_tracking: enable,
        can_view_routes: enable,
        can_view_driver_location: enable,
        can_view_shipment_details: enable,
        can_view_driver_info: enable,
        can_view_vehicle_info: enable,
        can_view_estimated_arrival: enable,
        can_receive_notifications: enable,
        can_view_reports: enable,
        can_view_recycler_info: enable,
        can_view_generator_info: enable,
      }
    }));

    updateVisibility({
      partner_organization_id: partnerId,
      can_view_maps: enable,
      can_view_tracking: enable,
      can_view_routes: enable,
      can_view_driver_location: enable,
      can_view_shipment_details: enable,
      can_view_driver_info: enable,
      can_view_vehicle_info: enable,
      can_view_estimated_arrival: enable,
      can_receive_notifications: enable,
      can_view_reports: enable,
      can_view_recycler_info: enable,
      can_view_generator_info: enable,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">التحكم في رؤية الجهات المرتبطة</CardTitle>
              <CardDescription>
                إدارة صلاحيات رؤية الخرائط والتتبع للجهات المولدة والمدورة
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()}
            disabled={isUpdating}
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {partnersWithSettings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>لا يوجد جهات مرتبطة حتى الآن</p>
            <p className="text-sm mt-1">ستظهر الجهات المرتبطة هنا بعد إنشاء شحنات معهم</p>
          </div>
        ) : (
          partnersWithSettings.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="pt-4">
                  {/* Partner Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {partner.logo_url ? (
                          <AvatarImage src={partner.logo_url} alt={partner.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10">
                          {partner.organization_type === 'generator' ? (
                            <Building2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Recycle className="w-5 h-5 text-green-600" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{partner.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            partner.organization_type === 'generator' 
                              ? 'border-primary/30 text-primary' 
                              : 'border-green-600/30 text-green-600'
                          }`}
                        >
                          {partner.organization_type === 'generator' ? 'جهة مولدة' : 'جهة تدوير'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Quick Toggle All */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAll(partner.id, false)}
                        className="gap-1 text-xs text-destructive hover:text-destructive"
                        disabled={isUpdating}
                      >
                        <Lock className="w-3 h-3" />
                        إغلاق الكل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAll(partner.id, true)}
                        className="gap-1 text-xs text-green-600 hover:text-green-600"
                        disabled={isUpdating}
                      >
                        <Unlock className="w-3 h-3" />
                        فتح الكل
                      </Button>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* Visibility Toggles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {/* Maps */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_maps') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Map className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">رؤية الخرائط</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_maps')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_maps', getSettingValue(partner, 'can_view_maps'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Tracking */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_tracking') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Navigation className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">التتبع المباشر</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_tracking')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_tracking', getSettingValue(partner, 'can_view_tracking'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Routes */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_routes') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Route className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">مسارات الشحنات</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_routes')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_routes', getSettingValue(partner, 'can_view_routes'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Driver Location */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_driver_location') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Eye className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">موقع السائق</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_driver_location')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_driver_location', getSettingValue(partner, 'can_view_driver_location'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Shipment Details */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_shipment_details') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">تفاصيل الشحنات</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_shipment_details')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_shipment_details', getSettingValue(partner, 'can_view_shipment_details'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Driver Info */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_driver_info') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">بيانات السائق</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_driver_info')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_driver_info', getSettingValue(partner, 'can_view_driver_info'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_vehicle_info') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">بيانات المركبة</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_vehicle_info')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_vehicle_info', getSettingValue(partner, 'can_view_vehicle_info'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Estimated Arrival */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_estimated_arrival') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">وقت الوصول</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_estimated_arrival')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_estimated_arrival', getSettingValue(partner, 'can_view_estimated_arrival'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Notifications */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_receive_notifications') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">الإشعارات</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_receive_notifications')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_receive_notifications', getSettingValue(partner, 'can_receive_notifications'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Reports */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_reports') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <Label className="text-xs text-center">التقارير</Label>
                      <Switch
                        checked={getSettingValue(partner, 'can_view_reports')}
                        onCheckedChange={() => handleToggle(partner.id, 'can_view_reports', getSettingValue(partner, 'can_view_reports'))}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Recycler Info - only show for generator partners */}
                    {partner.organization_type === 'generator' && (
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border-2 border-dashed border-primary/20">
                        <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_recycler_info') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                          <Recycle className="w-4 h-4" />
                        </div>
                        <Label className="text-xs text-center">رؤية جهة التدوير</Label>
                        <Switch
                          checked={getSettingValue(partner, 'can_view_recycler_info')}
                          onCheckedChange={() => handleToggle(partner.id, 'can_view_recycler_info', getSettingValue(partner, 'can_view_recycler_info'))}
                          disabled={isUpdating}
                        />
                      </div>
                    )}

                    {/* Bulk hide recycler from all shipments for this generator */}
                    {partner.organization_type === 'generator' && (
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border-2 border-dashed border-amber-400/40 col-span-2 sm:col-span-1">
                        <div className="p-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <Label className="text-xs text-center">إخفاء المدوّر من كل الشحنات</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1"
                          disabled={bulkUpdating || isUpdating}
                          onClick={async () => {
                            if (!organization?.id) return;
                            setBulkUpdating(true);
                            try {
                              const { error } = await supabase
                                .from('shipments')
                                .update({ hide_recycler_from_generator: true } as any)
                                .eq('transporter_id', organization.id)
                                .eq('generator_id', partner.id);
                              if (error) throw error;
                              toast.success(`تم إخفاء المدوّر من جميع شحنات ${partner.name}`);
                            } catch {
                              toast.error('فشل التحديث الجماعي');
                            } finally {
                              setBulkUpdating(false);
                            }
                          }}
                        >
                          <Lock className="w-3 h-3" />
                          إخفاء الكل
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 text-green-600"
                          disabled={bulkUpdating || isUpdating}
                          onClick={async () => {
                            if (!organization?.id) return;
                            setBulkUpdating(true);
                            try {
                              const { error } = await supabase
                                .from('shipments')
                                .update({ hide_recycler_from_generator: false } as any)
                                .eq('transporter_id', organization.id)
                                .eq('generator_id', partner.id);
                              if (error) throw error;
                              toast.success(`تم إظهار المدوّر في جميع شحنات ${partner.name}`);
                            } catch {
                              toast.error('فشل التحديث الجماعي');
                            } finally {
                              setBulkUpdating(false);
                            }
                          }}
                        >
                          <Unlock className="w-3 h-3" />
                          إظهار الكل
                        </Button>
                      </div>
                    )}

                    {/* Generator Info - only show for recycler partners */}
                    {partner.organization_type === 'recycler' && (
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border-2 border-dashed border-primary/20">
                        <div className={`p-2 rounded-full ${getSettingValue(partner, 'can_view_generator_info') ? 'bg-green-100 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <Label className="text-xs text-center">رؤية جهة التوليد</Label>
                        <Switch
                          checked={getSettingValue(partner, 'can_view_generator_info')}
                          onCheckedChange={() => handleToggle(partner.id, 'can_view_generator_info', getSettingValue(partner, 'can_view_generator_info'))}
                          disabled={isUpdating}
                        />
                      </div>
                    )}

                    {/* Bulk hide generator from all shipments for this recycler */}
                    {partner.organization_type === 'recycler' && (
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border-2 border-dashed border-amber-400/40 col-span-2 sm:col-span-1">
                        <div className="p-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <Label className="text-xs text-center">إخفاء المولّد من كل الشحنات</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1"
                          disabled={bulkUpdating || isUpdating}
                          onClick={async () => {
                            if (!organization?.id) return;
                            setBulkUpdating(true);
                            try {
                              const { error } = await supabase
                                .from('shipments')
                                .update({ hide_generator_from_recycler: true } as any)
                                .eq('transporter_id', organization.id)
                                .eq('recycler_id', partner.id);
                              if (error) throw error;
                              toast.success(`تم إخفاء المولّد من جميع شحنات ${partner.name}`);
                            } catch {
                              toast.error('فشل التحديث الجماعي');
                            } finally {
                              setBulkUpdating(false);
                            }
                          }}
                        >
                          <Lock className="w-3 h-3" />
                          إخفاء الكل
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 text-green-600"
                          disabled={bulkUpdating || isUpdating}
                          onClick={async () => {
                            if (!organization?.id) return;
                            setBulkUpdating(true);
                            try {
                              const { error } = await supabase
                                .from('shipments')
                                .update({ hide_generator_from_recycler: false } as any)
                                .eq('transporter_id', organization.id)
                                .eq('recycler_id', partner.id);
                              if (error) throw error;
                              toast.success(`تم إظهار المولّد في جميع شحنات ${partner.name}`);
                            } catch {
                              toast.error('فشل التحديث الجماعي');
                            } finally {
                              setBulkUpdating(false);
                            }
                          }}
                        >
                          <Unlock className="w-3 h-3" />
                          إظهار الكل
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  {partner.hasCustomSettings && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Settings2 className="w-3 h-3" />
                      <span>إعدادات مخصصة</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">ملاحظة هامة</p>
              <p>
                عند إغلاق صلاحية معينة، لن يتمكن الشريك من رؤية تلك الميزة في الشحنات المشتركة معكم.
                يمكنك تغيير هذه الإعدادات في أي وقت.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerVisibilitySettings;
