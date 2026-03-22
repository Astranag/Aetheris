import React from 'react';
import { WarningCircle } from '@phosphor-icons/react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: '#030303' }}
          role="alert"
          aria-live="assertive"
          data-testid="error-boundary"
        >
          <div className="text-center max-w-md">
            <WarningCircle size={48} className="text-[#FF0055] mx-auto mb-4" aria-hidden="true" />
            <h1 className="font-['Unbounded'] text-xl font-bold text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] mb-6">
              An unexpected error occurred. Your data is safe. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#00F0FF] text-black font-['Outfit'] font-semibold text-sm hover:bg-[#66F6FF] transition-colors duration-300"
              data-testid="error-reload-btn"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
