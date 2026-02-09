import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransporterDriverTracking = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          تتبع السائقين
        </CardTitle>
        <CardDescription>عرض مواقع السائقين على الخريطة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 rounded-lg bg-muted flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">خريطة تتبع السائقين</p>
            <Button variant="eco" className="mt-4" onClick={() => navigate('/dashboard/driver-tracking')}>
              فتح التتبع الكامل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransporterDriverTracking;
