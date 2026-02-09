/**
 * Multi-Storage Manager - إدارة التخزين المتعدد
 * يحفظ الملفات في السحابة + الجهاز المحلي + IndexedDB تلقائياً
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, 
  HardDrive, 
  Database, 
  FolderSync, 
  Check, 
  X,
  Upload,
  Download,
  RefreshCw,
  Settings,
  FileText,
  Loader2,
} from 'lucide-react';
import { useLocalFileSync } from '@/hooks/useLocalFileSync';
import { usePdfStorage } from '@/hooks/usePdfStorage';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { toast } from 'sonner';

interface StorageLocation {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  connected: boolean;
  description: string;
}

export default function MultiStorageManager() {
  const localSync = useLocalFileSync();
  const cloudStorage = usePdfStorage();
  const offlineSync = useOfflineSync();
  
  const [autoSync, setAutoSync] = useState(true);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const storageLocations: StorageLocation[] = [
    {
      id: 'cloud',
      name: 'التخزين السحابي',
      icon: <Cloud className="h-5 w-5" />,
      enabled: true,
      connected: true,
      description: 'Supabase Storage - آمن ومشفر',
    },
    {
      id: 'local',
      name: 'الجهاز المحلي',
      icon: <HardDrive className="h-5 w-5" />,
      enabled: localSync.isConnected,
      connected: localSync.isConnected,
      description: localSync.folderName || 'غير متصل',
    },
    {
      id: 'indexeddb',
      name: 'ذاكرة المتصفح',
      icon: <Database className="h-5 w-5" />,
      enabled: true,
      connected: offlineSync.isOnline,
      description: `${offlineSync.pendingCount} عملية معلقة`,
    },
  ];

  // رفع ملف لجميع مواقع التخزين
  const uploadToAllLocations = async (file: File) => {
    setUploadingFile(file);
    const results: { location: string; success: boolean }[] = [];

    try {
      // 1. رفع للسحابة
      toast.info('جاري الرفع للسحابة...');
      const cloudResult = await cloudStorage.uploadPdf(file);
      results.push({ location: 'السحابة', success: cloudResult.success });

      // 2. حفظ محلياً (إذا متصل)
      if (localSync.isConnected) {
        toast.info('جاري الحفظ على الجهاز...');
        const localResult = await localSync.saveFileLocally(
          file, 
          file.name, 
          'documents',
          cloudResult.url
        );
        results.push({ location: 'الجهاز', success: localResult });
      }

      // 3. حفظ في IndexedDB للوصول السريع
      if (autoSync) {
        await offlineSync.saveDraft(`pdf-${file.name}`, {
          name: file.name,
          size: file.size,
          type: file.type,
          cloudUrl: cloudResult.url,
          savedAt: new Date().toISOString(),
        });
        results.push({ location: 'المتصفح', success: true });
      }

      // عرض النتائج
      const successCount = results.filter(r => r.success).length;
      if (successCount === results.length) {
        toast.success(`تم حفظ الملف في ${successCount} مواقع`);
      } else {
        toast.warning(`تم الحفظ في ${successCount} من ${results.length} مواقع`);
      }
    } catch (error) {
      console.error('Multi-upload error:', error);
      toast.error('حدث خطأ أثناء الرفع');
    } finally {
      setUploadingFile(null);
    }
  };

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        uploadToAllLocations(file);
      } else {
        toast.error('يرجى اختيار ملف PDF');
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="h-5 w-5 text-primary" />
          إدارة التخزين المتعدد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* مواقع التخزين */}
        <div className="space-y-3">
          {storageLocations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${location.connected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {location.icon}
                </div>
                <div>
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-muted-foreground">{location.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {location.connected ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    متصل
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <X className="h-3 w-3" />
                    غير متصل
                  </Badge>
                )}
                {location.id === 'local' && !location.connected && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={localSync.requestFolderAccess}
                  >
                    ربط مجلد
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* إعدادات المزامنة */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span>مزامنة تلقائية</span>
          </div>
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </div>

        {/* رفع ملف */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          {uploadingFile ? (
            <div className="space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p>جاري رفع: {uploadingFile.name}</p>
              <Progress value={cloudStorage.progress} className="w-full" />
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="multi-upload"
              />
              <label htmlFor="multi-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">اسحب ملف PDF أو انقر للاختيار</p>
                <p className="text-sm text-muted-foreground mt-1">
                  سيتم حفظ الملف في جميع مواقع التخزين المتصلة
                </p>
              </label>
            </>
          )}
        </div>

        {/* الملفات المحفوظة محلياً */}
        {localSync.syncedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">الملفات المحفوظة على الجهاز:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {localSync.syncedFiles.slice(-5).map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                  <FileText className="h-4 w-4 text-destructive" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(file.savedAt).toLocaleDateString('ar')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تنبيه للمستخدم */}
        {!localSync.isSupported && (
          <div className="p-3 bg-warning/10 rounded-lg text-sm border border-warning/20">
            <p className="text-warning-foreground">
              ⚠️ متصفحك لا يدعم الحفظ المباشر على الجهاز. استخدم Chrome أو Edge للحصول على هذه الميزة.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
