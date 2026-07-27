import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Download, TrendingUp, TrendingDown, Search, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatsCard from '../components/ui/StatsCard';
import { SkeletonSummaryCard, SkeletonTransactionTable } from '../components/Skeleton';
import { apiUrl } from '../config/api';

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTrades: 0,
        totalVolume: 0,
        avgTradeSize: 0
    });

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(apiUrl('/api/portfolio/me'), {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    const fetchedTransactions = data.transactions || [];

                    // Map API data to UI format
                    const formattedTransactions = fetchedTransactions.map(t => {
                        const dateObj = new Date(t.timestamp);
                        return {
                            id: t.id,
                            type: t.type === 'BUY' ? 'Buy' : 'Sell',
                            symbol: t.symbol,
                            name: t.symbol, // API doesn't provide name in transaction object yet
                            shares: t.quantity,
                            price: t.pricePerUnit,
                            total: t.totalAmount,
                            date: dateObj.toLocaleDateString(),
                            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            rawDate: dateObj // For sorting if needed
                        };
                    }).sort((a, b) => b.rawDate - a.rawDate); // Sort by newest first

                    setTransactions(formattedTransactions);

                    // Calculate stats
                    const totalTrades = formattedTransactions.length;
                    const totalVolume = formattedTransactions.reduce((acc, curr) => acc + curr.total, 0);
                    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

                    setStats({
                        totalTrades,
                        totalVolume,
                        avgTradeSize
                    });
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'All' || transaction.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <DashboardLayout activeMenu="transactions">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-h-full"
            >
                {/* Header */}
                <div className="p-6 md:p-8 pt-10 md:pt-12">
                    <motion.div variants={itemVariants} className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View all your trading activity and transactions.
                        </p>
                    </motion.div>

                    {/* Stats Summary */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Summary</h2>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SkeletonSummaryCard />
                                <SkeletonSummaryCard />
                                <SkeletonSummaryCard />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatsCard
                                    title="Total Trades"
                                    label="All time"
                                    value={stats.totalTrades.toString()}
                                    icon={ArrowUpRight}
                                    gradient="from-teal-500/10 to-blue-500/10"
                                />

                                <StatsCard
                                    title="Total Volume"
                                    label="Bought + Sold"
                                    value={`$${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    icon={TrendingUp}
                                    gradient="from-emerald-500/10 to-teal-500/10"
                                />

                                <StatsCard
                                    title="Avg. Trade Size"
                                    label="Per transaction"
                                    value={`$${stats.avgTradeSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    icon={Calendar}
                                    gradient="from-blue-500/10 to-indigo-500/10"
                                />
                            </div>
                        )}
                    </motion.div>

                    {/* Filters and Search */}
                    <motion.div variants={itemVariants} className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex items-center gap-2">
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                    {['All', 'Buy', 'Sell'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === type
                                                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <Download size={18} className="text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Transactions Table */}
                    {loading ? (
                        <SkeletonTransactionTable />
                    ) : (
                        <motion.div
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            className="glass-card rounded-2xl overflow-hidden"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Stock</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Shares</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Price</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {filteredTransactions.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${transaction.type === 'Buy'
                                                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            }`}
                                                    >
                                                        {transaction.type === 'Buy' ? (
                                                            <ArrowUpRight size={12} />
                                                        ) : (
                                                            <ArrowDownRight size={12} />
                                                        )}
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">{transaction.symbol}</p>
                                                        {/* <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.name}</p> */}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-medium text-slate-900 dark:text-white">{transaction.shares}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-medium text-slate-900 dark:text-white">${transaction.price.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-slate-900 dark:text-white">${transaction.total.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="font-medium text-slate-900 dark:text-white">{transaction.date}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.time}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Empty State - when no transactions at all */}
                            {!loading && transactions.length === 0 && (
                                <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
                                        <div className="absolute inset-0 bg-teal-500/10 dark:bg-teal-500/20 blur-2xl rounded-full"></div>
                                        <div className="relative z-10 bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                                            <Receipt size={48} className="text-teal-500 dark:text-teal-400" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No transactions yet</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Your trading history will appear here
                                    </p>
                                </div>
                            )}

                            {/* Empty State - when search/filter returns no results */}
                            {!loading && transactions.length > 0 && filteredTransactions.length === 0 && (
                                <div className="text-center py-12 px-6">
                                    <Search size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">No transactions found</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                        Try adjusting your filters
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default TransactionsPage;
