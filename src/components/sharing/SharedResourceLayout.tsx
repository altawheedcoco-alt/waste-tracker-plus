import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import IRecycleLogo from '@/components/common/IRecycleLogo';

interface SharedResourceLayoutProps {
  children: ReactNode;
  title?: string | null;
  resourceType?: string;
}

const SharedResourceLayout = ({ children, title, resourceType }: SharedResourceLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <IRecycleLogo variant="full" size={32} />
          </Link>
          <Link to="/auth" className="text-sm text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        )}
        {children}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          تمت المشاركة عبر منصة{' '}
          <Link to="/" className="text-primary hover:underline">
            iRecycle
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default SharedResourceLayout;
