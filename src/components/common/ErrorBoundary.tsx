import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in GATE DA tracker:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Application Interruption
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected state issue occurred. Your study data is safely saved in local storage.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs font-mono text-slate-600 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
