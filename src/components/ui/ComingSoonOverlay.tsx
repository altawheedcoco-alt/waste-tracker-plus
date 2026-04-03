import { memo } from 'react';
import { Construction, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ComingSoonOverlayProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const ComingSoonOverlay = memo(({ title, description, children }: ComingSoonOverlayProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blurred content behind */}
      <div className="blur-[2px] opacity-40 pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {description || 'هذا المديول قيد التطوير وسيكون متاحاً قريباً. ترقبوا التحديثات!'}
          </p>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
            🚧 قريباً
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-4 h-4 ml-1" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

ComingSoonOverlay.displayName = 'ComingSoonOverlay';
export default ComingSoonOverlay;
