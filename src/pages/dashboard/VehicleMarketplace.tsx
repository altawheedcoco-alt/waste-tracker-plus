import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Truck, Search, MapPin, DollarSign, Package, Calendar, Loader2, Send } from 'lucide-react';

const VehicleMarketplace = () => {
  const { organization } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    booking_type: 'single_trip',
    start_date: '',
    pickup_location: '',
    delivery_location: '',
    waste_type: '',
    estimated_weight: '',
    requester_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fleet_vehicles')
      .select('*, organization:organizations!fleet_vehicles_organization_id_fkey(name, city)')
      .eq('is_available', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    // Filter out own org vehicles
    setVehicles((data || []).filter(v => v.organization_id !== organization?.id));
    setLoading(false);
  };

  const filteredVehicles = vehicles.filter(v => {
    if (typeFilter !== 'all' && v.vehicle_type !== typeFilter) return false;
    if (searchQuery && !v.plate_number?.includes(searchQuery) && !v.brand?.includes(searchQuery) && !v.organization?.name?.includes(searchQuery)) return false;
    return true;
  });

  const handleBooking = async () => {
    if (!selectedVehicle || !organization?.id || !bookingForm.start_date) {
      toast.error('يرجى ملء البيانات المطلوبة');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('vehicle_bookings').insert({
        vehicle_id: selectedVehicle.id,
        fleet_owner_org_id: selectedVehicle.organization_id,
        requester_org_id: organization.id,
        booking_type: bookingForm.booking_type,
        start_date: bookingForm.start_date,
        pickup_location: bookingForm.pickup_location || null,
        delivery_location: bookingForm.delivery_location || null,
        waste_type: bookingForm.waste_type || null,
        estimated_weight: bookingForm.estimated_weight ? parseFloat(bookingForm.estimated_weight) : null,
        requester_notes: bookingForm.requester_notes || null,
        agreed_price: selectedVehicle.per_trip_rate || null,
      });
      if (error) throw error;
      toast.success('تم إرسال طلب الحجز بنجاح');
      setShowBookingDialog(false);
      setBookingForm({ booking_type: 'single_trip', start_date: '', pickup_location: '', delivery_location: '', waste_type: '', estimated_weight: '', requester_notes: '' });
    } catch (err: any) {
      toast.error(err.message || 'خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleTypeLabel = (type: string) => {
    const map: Record<string, string> = { truck: 'شاحنة', pickup: 'بيك أب', tanker: 'صهريج', trailer: 'مقطورة' };
    return map[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/dashboard" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              بورصة العربيات المتاحة
            </h1>
            <p className="text-muted-foreground">تصفح واحجز مركبات النقل من مكاتب النقل المعتمدة</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="نوع المركبة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="truck">شاحنة</SelectItem>
              <SelectItem value="pickup">بيك أب</SelectItem>
              <SelectItem value="tanker">صهريج</SelectItem>
              <SelectItem value="trailer">مقطورة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : filteredVehicles.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد مركبات متاحة حالياً</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(v => (
              <Card key={v.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{v.plate_number}</h3>
                        <p className="text-xs text-muted-foreground">{vehicleTypeLabel(v.vehicle_type)}</p>
                      </div>
                    </div>
                    <Badge variant="default">متاحة</Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {v.brand && <p>الماركة: {v.brand} {v.model || ''} {v.year ? `(${v.year})` : ''}</p>}
                    {v.capacity_tons && <p className="flex items-center gap-1"><Package className="w-3 h-3" /> الحمولة: {v.capacity_tons} طن</p>}
                    {v.organization?.name && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {v.organization.name} {v.organization.city ? `- ${v.organization.city}` : ''}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="space-y-0.5">
                      {v.per_trip_rate && <p className="text-sm font-bold flex items-center gap-1"><DollarSign className="w-3 h-3" /> {v.per_trip_rate} ج.م/رحلة</p>}
                      {v.daily_rate && <p className="text-xs text-muted-foreground">{v.daily_rate} ج.م/يوم</p>}
                    </div>
                    <Button size="sm" onClick={() => { setSelectedVehicle(v); setShowBookingDialog(true); }} className="gap-1">
                      <Send className="w-3 h-3" /> احجز
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>طلب حجز مركبة - {selectedVehicle?.plate_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>نوع الحجز</Label>
                <Select value={bookingForm.booking_type} onValueChange={v => setBookingForm(p => ({ ...p, booking_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_trip">رحلة واحدة</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>تاريخ البدء *</Label>
                <Input type="date" value={bookingForm.start_date} onChange={e => setBookingForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div><Label>موقع التحميل</Label><Input value={bookingForm.pickup_location} onChange={e => setBookingForm(p => ({ ...p, pickup_location: e.target.value }))} /></div>
              <div><Label>موقع التسليم</Label><Input value={bookingForm.delivery_location} onChange={e => setBookingForm(p => ({ ...p, delivery_location: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>نوع المخلف</Label><Input value={bookingForm.waste_type} onChange={e => setBookingForm(p => ({ ...p, waste_type: e.target.value }))} /></div>
                <div><Label>الوزن التقديري (طن)</Label><Input type="number" value={bookingForm.estimated_weight} onChange={e => setBookingForm(p => ({ ...p, estimated_weight: e.target.value }))} /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={bookingForm.requester_notes} onChange={e => setBookingForm(p => ({ ...p, requester_notes: e.target.value }))} rows={2} /></div>
              <Button onClick={handleBooking} disabled={submitting} className="w-full gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال طلب الحجز
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default VehicleMarketplace;
