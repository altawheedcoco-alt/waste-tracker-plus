import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Bookmark,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SavedLocationsManager from '@/components/locations/SavedLocationsManager';
import AddLocationForm from '@/components/locations/AddLocationForm';

export default function SavedLocationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  const handleLocationAdded = () => {
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-primary" />
              المواقع المحفوظة
            </h1>
            <p className="text-muted-foreground">
              إدارة المواقع المفضلة والمتكررة الاستخدام
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <Bookmark className="h-4 w-4" />
            المواقع المحفوظة
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة موقع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <SavedLocationsManager />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                إضافة موقع جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddLocationForm onSuccess={handleLocationAdded} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            كيفية استخدام المواقع المحفوظة
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium">📍 الحفظ التلقائي</p>
              <p className="text-muted-foreground">
                يتم حفظ مواقع الاستلام والتسليم تلقائياً من الشحنات
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">🔖 الحفظ اليدوي</p>
              <p className="text-muted-foreground">
                أضف مواقعك المفضلة باستخدام الخريطة أو البحث
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">⚡ الوصول السريع</p>
              <p className="text-muted-foreground">
                اختر من المواقع المحفوظة عند إنشاء شحنة جديدة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
