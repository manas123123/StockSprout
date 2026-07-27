import { Home, Search, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                        Oops! The page you're looking for doesn't exist.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        It may have been moved or deleted, or you may have mistyped the URL.
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-6 mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Links</h3>
                    <div className="space-y-2">
                        <Link
                            to={user ? '/dashboard' : '/'}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-600/30"
                        >
                            <Home size={18} />
                            {user ? 'Go to Dashboard' : 'Go to Home'}
                        </Link>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold transition-all"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>
                </div>

                {user && (
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Other Pages</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <Link
                                to="/portfolio"
                                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                Portfolio
                            </Link>
                            <Link
                                to="/watchlist"
                                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                Watchlist
                            </Link>
                            <Link
                                to="/transactions"
                                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                Transactions
                            </Link>
                            <Link
                                to="/faq"
                                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                            >
                                FAQ
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotFoundPage;
