import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Thermometer, Heart, Wind, Gauge, Wifi, WifiOff } from 'lucide-react';

const mockDevices = [
  { id: 1, name: 'جهاز قياس الضغط', type: 'blood_pressure', icon: Gauge, status: 'online', lastReading: '120/80 mmHg', lastReadingAt: 'منذ 5 دقائق', color: 'text-blue-600 bg-blue-100' },
  { id: 2, name: 'ميزان الحرارة الرقمي', type: 'temperature', icon: Thermometer, status: 'online', lastReading: '36.8°C', lastReadingAt: 'منذ 10 دقائق', color: 'text-red-600 bg-red-100' },
  { id: 3, name: 'مقياس التأكسج النبضي', type: 'pulse_oximeter', icon: Heart, status: 'offline', lastReading: '98% SpO2', lastReadingAt: 'منذ ساعة', color: 'text-pink-600 bg-pink-100' },
  { id: 4, name: 'جهاز قياس وظائف الرئة', type: 'spirometer', icon: Wind, status: 'online', lastReading: 'FEV1: 3.2L', lastReadingAt: 'منذ 30 دقيقة', color: 'text-emerald-600 bg-emerald-100' },
];

const IoTMedicalTab = () => {
  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">الأجهزة الطبية المتصلة (IoT)</h3>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Activity className="h-3 w-3" />
          {mockDevices.filter(d => d.status === 'online').length}/{mockDevices.length} متصل
        </Badge>
      </div>

      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-background">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">كيف يعمل الربط مع أجهزة IoT الطبية؟</span>
          </div>
          <ul className="text-[10px] text-muted-foreground space-y-1 list-disc list-inside">
            <li>يتم ربط الأجهزة الطبية (ضغط، حرارة، أكسجين، رئة) عبر بروتوكول Bluetooth/WiFi</li>
            <li>القراءات تُسجل تلقائياً في ملف الموظف الطبي</li>
            <li>تنبيهات فورية عند قراءات غير طبيعية</li>
            <li>تقارير صحية تلقائية من البيانات المجمعة</li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {mockDevices.map(device => (
          <Card key={device.id} className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl ${device.color} flex items-center justify-center`}>
                    <device.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{device.name}</p>
                    <p className="text-[10px] text-muted-foreground">{device.lastReadingAt}</p>
                  </div>
                </div>
                <div className="text-left">
                  <Badge className={`text-[9px] mb-1 ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {device.status === 'online' ? <><Wifi className="h-2.5 w-2.5 mr-0.5" />متصل</> : <><WifiOff className="h-2.5 w-2.5 mr-0.5" />غير متصل</>}
                  </Badge>
                  <p className="text-xs font-bold text-foreground">{device.lastReading}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IoTMedicalTab;
