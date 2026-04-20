import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // @ts-ignore
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // @ts-ignore
      if (this.state.hasError) {
        let errorMessage = "Something went wrong.";
        let isQuotaError = false;
        try {
          // Try to parse the JSON error from Firestore
          // @ts-ignore
          const firestoreError = JSON.parse(this.state.error?.message || "");
          if (firestoreError.error) {
            if (firestoreError.error.includes("Quota exceeded") || firestoreError.error.includes("Quota limit exceeded")) {
              isQuotaError = true;
              errorMessage = "The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.";
            } else {
              errorMessage = `Firestore Error: ${firestoreError.error} (${firestoreError.operationType} at ${firestoreError.path})`;
            }
          }
        } catch (e) {
          // Not a JSON error, use the raw message
          // @ts-ignore
          errorMessage = this.state.error?.message || errorMessage;
        }

        return (
          <div className="min-h-screen flex items-center justify-center bg-brand-cream p-6">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl border border-brand-red/20 text-center">
              <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-brand-red text-2xl">!</span>
              </div>
              <h2 className="text-2xl font-light text-brand-ink mb-4">
                {isQuotaError ? "Daily Limit Reached" : "Application Error"}
              </h2>
              <p className="text-brand-ink/60 text-sm mb-8 leading-relaxed">
                {errorMessage}
              </p>
              {isQuotaError ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-brand-ink/40 uppercase tracking-widest">
                    Please check back again tomorrow
                  </p>
                  <a 
                    href="https://firebase.google.com/pricing#cloud-firestore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[10px] text-brand-red hover:underline uppercase tracking-widest font-bold"
                  >
                    Learn more about limits
                  </a>
                </div>
              ) : (
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-brand-red text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-red/90 transition-all"
                >
                  Reload Application
                </button>
              )}
            </div>
          </div>
        );
      }

    // @ts-ignore
    return this.props.children;
  }
}

export default ErrorBoundary;
