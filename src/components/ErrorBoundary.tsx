import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background text-foreground"
        >
          <div className="text-5xl">⚠️</div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-muted-foreground">
              يرجى إعادة تحميل الصفحة للمتابعة
            </p>
          </div>
          {this.state.error && (
            <pre className="text-xs text-destructive bg-destructive/10 rounded-lg p-4 max-w-sm overflow-auto text-left">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            إعادة التحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
