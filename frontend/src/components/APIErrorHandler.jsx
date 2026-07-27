import { useState } from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

/**
 * APIErrorHandler - Reusable component for handling API errors with retry logic
 * 
 * Usage:
 * <APIErrorHandler
 *   error={error}
 *   onRetry={fetchData}
 *   message="Failed to load portfolio data"
 * />
 */
const APIErrorHandler = ({
    error,
    onRetry,
    message = 'Something went wrong',
    showDetails = false,
    className = ''
}) => {
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await onRetry();
        } catch (err) {
            console.error('Retry failed:', err);
        } finally {
            setIsRetrying(false);
        }
    };

    if (!error) return null;

    return (
        <div className={`glass-card rounded-2xl p-6 border-2 border-red-200 dark:border-red-900/50 ${className}`}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {message}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        We're having trouble connecting to our servers. Please try again.
                    </p>

                    {showDetails && error?.message && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50">
                            <p className="text-xs font-medium text-red-800 dark:text-red-300 flex items-start gap-2">
                                <XCircle size={14} className="flex-shrink-0 mt-0.5" />
                                <span className="break-all">{error.message}</span>
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {onRetry && (
                            <button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-600/30 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
                                {isRetrying ? 'Retrying...' : 'Try Again'}
                            </button>
                        )}

                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold transition-all"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APIErrorHandler;
