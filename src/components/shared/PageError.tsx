import { XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PageErrorProps {
  title?: string;
  message?: string;
  variant?: 'error' | 'warning';
  showHomeButton?: boolean;
}

/**
 * Unified full-page error state — theme-compatible.
 */
const PageError = ({ 
  title = 'حدث خطأ', 
  message = 'يرجى المحاولة مرة أخرى', 
  variant = 'error',
  showHomeButton = true 
}: PageErrorProps) => {
  const Icon = variant === 'error' ? XCircle : AlertTriangle;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 text-center">
          <Icon className={`h-16 w-16 mx-auto mb-4 ${variant === 'error' ? 'text-destructive' : 'text-accent-foreground'}`} />
          <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          {showHomeButton && (
            <Link to="/">
              <Button variant="outline">العودة للرئيسية</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PageError;
