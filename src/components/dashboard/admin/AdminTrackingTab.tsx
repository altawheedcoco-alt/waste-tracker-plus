import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';

interface AdminTrackingTabProps {
  activeDrivers: number;
  totalDrivers: number;
}

const AdminTrackingTab = ({ activeDrivers, totalDrivers }: AdminTrackingTabProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="text-right">
        <div className="flex items-center justify-between">
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={() => navigate('/dashboard/driver-tracking')}
          >
            <MapPin className="w-4 h-4" />
            خريطة التتبع
          </Button>
          <div>
            <CardTitle>تتبع السائقين</CardTitle>
            <CardDescription>خريطة مواقع السائقين في الوقت الفعلي</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السائقون النشطون</p>
                  <p className="text-2xl font-bold">{activeDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
                  <p className="text-2xl font-bold">{totalDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            انتقل إلى صفحة التتبع لمشاهدة خريطة السائقين في الوقت الفعلي
          </p>
          <Button onClick={() => navigate('/dashboard/driver-tracking')}>
            <MapPin className="w-4 h-4 ml-2" />
            فتح خريطة التتبع
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTrackingTab;
