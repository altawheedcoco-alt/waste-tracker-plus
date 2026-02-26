import Header from "@/components/Header";
import MapDisabledPlaceholder from "@/components/maps/MapDisabledPlaceholder";
import { Map } from "lucide-react";

const MapPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Map className="w-7 h-7 text-primary" />
        خريطة المجتمع التفاعلية
      </h1>
      <p className="text-sm text-muted-foreground">الخرائط معطلة حالياً</p>
      <MapDisabledPlaceholder height="500px" />
    </div>
  </div>
);

export default MapPage;
