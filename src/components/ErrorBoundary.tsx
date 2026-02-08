import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-bold text-destructive mb-2">오류가 발생했습니다</h1>
            <p className="text-muted-foreground mb-4">페이지를 새로고침 해 주세요.</p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
