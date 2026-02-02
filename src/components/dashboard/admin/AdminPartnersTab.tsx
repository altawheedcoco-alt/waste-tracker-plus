import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Truck, Recycle, Eye } from 'lucide-react';

interface AdminPartnersTabProps {
  generatorCount: number;
  transporterCount: number;
  recyclerCount: number;
}

const AdminPartnersTab = ({ 
  generatorCount, 
  transporterCount, 
  recyclerCount 
}: AdminPartnersTabProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="text-right">
        <div className="flex items-center justify-between">
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={() => navigate('/dashboard/partners')}
          >
            <Eye className="w-4 h-4" />
            عرض صفحة الشركاء الكاملة
          </Button>
          <div>
            <CardTitle>جميع الجهات والشركاء</CardTitle>
            <CardDescription>عرض سريع لجميع الجهات المسجلة في النظام</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:border-blue-500/50 transition-colors" 
            onClick={() => navigate('/dashboard/partners')}
          >
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الجهات المولدة</p>
                  <p className="text-2xl font-bold">{generatorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:border-amber-500/50 transition-colors" 
            onClick={() => navigate('/dashboard/partners')}
          >
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الجهات الناقلة</p>
                  <p className="text-2xl font-bold">{transporterCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:border-green-500/50 transition-colors" 
            onClick={() => navigate('/dashboard/partners')}
          >
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Recycle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الجهات المدورة</p>
                  <p className="text-2xl font-bold">{recyclerCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            للاطلاع على كافة بيانات الجهات وإدارتها، انتقل إلى صفحة الشركاء
          </p>
          <Button onClick={() => navigate('/dashboard/partners')} className="gap-2">
            <Building2 className="w-4 h-4" />
            عرض جميع الشركاء
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPartnersTab;
