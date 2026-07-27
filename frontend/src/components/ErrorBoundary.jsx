import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="glass-card rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="mb-6 text-left">
                                    <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Error Details (Development Only)
                                    </summary>
                                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-xs overflow-auto max-h-48">
                                        <p className="text-red-600 dark:text-red-400 font-mono mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        <pre className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </div>
                                </details>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold transition-all"
                                >
                                    <RefreshCw size={18} />
                                    Reload Page
                                </button>
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-600/30"
                                >
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
