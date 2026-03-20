import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
  dismissed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false, dismissed: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, dismissed: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError && !this.state.dismissed) {
      const title = this.props.fallbackTitle || 'حدث خطأ في هذا القسم';
      const message = this.state.error?.message || 'خطأ غير متوقع';

      return (
        <div className="relative mx-2 my-2">
          {/* Compact toast-style error banner */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{message}</p>
              
              {this.state.showDetails && (
                <div className="mt-2 p-2 bg-background/80 rounded text-xs text-muted-foreground max-h-24 overflow-auto font-mono whitespace-pre-wrap border">
                  {this.state.error?.stack || message}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => this.setState({ hasError: false, error: null, showDetails: false })}
                >
                  <RefreshCw className="ml-1 h-3 w-3" />
                  إعادة المحاولة
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                >
                  {this.state.showDetails ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                  {this.state.showDetails ? 'إخفاء' : 'التفاصيل'}
                </Button>
              </div>
            </div>
            <button
              onClick={() => this.setState({ dismissed: true })}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    // If dismissed, still render children (attempt recovery)
    if (this.state.dismissed) {
      return this.props.children;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
