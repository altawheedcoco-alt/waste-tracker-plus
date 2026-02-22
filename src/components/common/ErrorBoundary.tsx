import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isChunkError = (error: Error | null) => {
  if (!error) return false;
  const msg = error.message || '';
  return msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Importing a module script failed');
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    // Auto-reload on chunk load errors
    if (isChunkError(error)) {
      const lastReload = Number(sessionStorage.getItem('__chunk_reload_ts') || '0');
      if (Date.now() - lastReload > 30000) {
        sessionStorage.setItem('__chunk_reload_ts', String(Date.now()));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-lg">
              {this.props.fallbackTitle || 'حدث خطأ في هذا القسم'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message || 'خطأ غير متوقع'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isChunkError(this.state.error)) {
                  window.location.reload();
                } else {
                  this.setState({ hasError: false, error: null });
                }
              }}
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
