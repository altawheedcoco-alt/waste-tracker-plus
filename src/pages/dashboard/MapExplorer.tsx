import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';
import BackButton from '@/components/ui/back-button';
import { Map } from 'lucide-react';

const MapExplorer = () => (
  <div className="space-y-6 p-4 md:p-6">
    <div className="flex items-center gap-3">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Map className="w-7 h-7 text-primary" />
          خريطة المجتمع
        </h1>
        <p className="text-sm text-muted-foreground mt-1">الخرائط معطلة حالياً</p>
      </div>
    </div>
    <MapDisabledPlaceholder height="500px" />
  </div>
);

export default MapExplorer;
