import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Siren, Phone, MapPin, Clock, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyIncident {
  id: string;
  type: 'spill' | 'accident' | 'fire' | 'theft' | 'breakdown' | 'medical';
  severity: 'minor' | 'major' | 'critical';
  driverName: string;
  vehiclePlate: string;
  location: string;
  time: string;
  status: 'reported' | 'responding' | 'contained' | 'resolved';
  description: string;
}

const TYPE_LABELS: Record<string, string> = {
  spill: 'تسرب مواد', accident: 'حادث مروري', fire: 'حريق',
  theft: 'سرقة', breakdown: 'عطل ميكانيكي', medical: 'حالة طبية',
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  reported: { label: 'تم الإبلاغ', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  responding: { label: 'جاري الاستجابة', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  contained: { label: 'تحت السيطرة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

const EMERGENCY_CONTACTS = [
  { name: 'الدفاع المدني', phone: '180', type: 'fire' },
  { name: 'الإسعاف', phone: '123', type: 'medical' },
  { name: 'النجدة', phone: '122', type: 'accident' },
  { name: 'جهاز شؤون البيئة', phone: '19808', type: 'spill' },
  { name: 'مدير العمليات', phone: '01001234567', type: 'all' },
];

const MOCK_INCIDENTS: EmergencyIncident[] = [
  {
    id: '1', type: 'spill', severity: 'critical',
    driverName: 'محمد أحمد', vehiclePlate: 'أ ب ج 1234',
    location: 'طريق القاهرة - الإسكندرية الصحراوي كم 85',
    time: 'منذ 15 دقيقة', status: 'responding',
    description: 'تسرب محدود لمادة كيميائية من الحاوية الخلفية',
  },
  {
    id: '2', type: 'breakdown', severity: 'minor',
    driverName: 'عبدالله حسن', vehiclePlate: 'د هـ و 5678',
    location: 'المنطقة الصناعية بالعاشر من رمضان',
    time: 'منذ ساعة', status: 'contained',
    description: 'عطل في نظام التبريد - تم إيقاف المركبة',
  },
];

const EMERGENCY_PROCEDURES = [
  { step: 1, action: 'إيقاف المركبة فوراً في مكان آمن' },
  { step: 2, action: 'تأمين المنطقة ووضع مثلث التحذير' },
  { step: 3, action: 'الإبلاغ عبر التطبيق أو الهاتف' },
  { step: 4, action: 'اتباع إجراءات السلامة حسب نوع المخلفات' },
  { step: 5, action: 'عدم مغادرة الموقع حتى وصول فريق الاستجابة' },
  { step: 6, action: 'توثيق الحادث بالصور والتقارير' },
];

export default function EmergencyResponseCenter() {
  const activeIncidents = MOCK_INCIDENTS.filter(i => i.status !== 'resolved');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-500" />
          مركز الاستجابة للطوارئ
          {activeIncidents.length > 0 && (
            <Badge variant="destructive" className="mr-auto animate-pulse">{activeIncidents.length} حادث نشط</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="incidents" dir="rtl">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="incidents">الحوادث</TabsTrigger>
            <TabsTrigger value="contacts">أرقام الطوارئ</TabsTrigger>
            <TabsTrigger value="procedures">الإجراءات</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {MOCK_INCIDENTS.map(incident => (
                  <div key={incident.id} className={`p-3 border rounded-lg space-y-2 ${incident.severity === 'critical' ? 'border-red-300 dark:border-red-800' : ''}`}>
                    <div className="flex items-start justify-between">
                      <Badge className={STATUS_INFO[incident.status].color}>
                        {STATUS_INFO[incident.status].label}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{TYPE_LABELS[incident.type]}</p>
                        <p className="text-xs text-muted-foreground">{incident.driverName} • {incident.vehiclePlate}</p>
                      </div>
                    </div>
                    <p className="text-xs bg-muted/50 p-2 rounded text-right">{incident.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{incident.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contacts">
            <div className="space-y-2">
              {EMERGENCY_CONTACTS.map((contact, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-primary text-sm font-mono">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </a>
                  <span className="text-sm font-medium">{contact.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="procedures">
            <div className="space-y-2">
              {EMERGENCY_PROCEDURES.map(proc => (
                <div key={proc.step} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <p className="text-sm flex-1 text-right">{proc.action}</p>
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {proc.step}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
