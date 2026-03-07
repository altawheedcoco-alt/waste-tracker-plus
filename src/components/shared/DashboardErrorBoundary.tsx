import React, { Component, ErrorInfo, ReactNode } from 'react';
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

/**
 * Error Boundary wrapper for dashboard pages.
 * Catches rendering errors and shows a recovery UI instead of crashing the whole app.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DashboardErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6" dir="rtl">
          <Card className="max-w-md w-full border-destructive/30">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold text-foreground">
                {this.props.fallbackTitle || 'حدث خطأ غير متوقع'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة المحاولة
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                  العودة للوحة التحكم
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
