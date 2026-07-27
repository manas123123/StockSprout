import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Check, TrendingUp, TrendingDown, Eye, List } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatsCard from '../components/ui/StatsCard';
import { SkeletonSummaryCard, SkeletonWatchlistCard } from '../components/Skeleton';
import TradeModal from '../components/TradeModal';
import SparklineChart from '../components/SparklineChart';
import StockChart from '../components/StockChart';
import { apiUrl } from '../config/api';

const POPULAR_STOCKS = [
    'AAPL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX', 'JPM', 'V', 'BAC', 'AMD', 'PYPL', 'DIS', 'T', 'PFE', 'COST', 'INTC', 'KO', 'TGT', 'NKE', 'SPY', 'BA', 'BABA', 'XOM', 'WMT', 'GE', 'CSCO', 'VZ', 'JNJ', 'CVX', 'PLTR', 'SQ', 'SHOP', 'SBUX', 'SOFI', 'HOOD', 'RBLX', 'SNAP', 'UBER', 'FDX', 'ABBV', 'ETSY', 'MRNA', 'LMT', 'GM', 'F', 'RIVN', 'LCID', 'CCL', 'DAL', 'UAL', 'AAL', 'TSM', 'SONY', 'ET', 'NOK', 'MRO', 'COIN', 'SIRI', 'RIOT', 'CPRX', 'VWO', 'SPYG', 'ROKU', 'VIAC', 'ATVI', 'BIDU', 'DOCU', 'ZM', 'PINS', 'TLRY', 'WBA', 'MGM', 'NIO', 'C', 'GS', 'WFC', 'ADBE', 'PEP', 'UNH', 'CARR', 'FUBO', 'HCA', 'TWTR', 'BILI', 'RKT'
];

const formatMarketCap = (value) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    return value.toString();
};

const WatchlistPage = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [portfolioData, setPortfolioData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [addSymbolQuery, setAddSymbolQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeType, setTradeType] = useState('Buy');
    const [stockDetails, setStockDetails] = useState(null);

    // Dropdown state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Error state
    const [addError, setAddError] = useState('');

    const fetchWatchlist = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/api/portfolio/watchList'), {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                // Deduplicate based on symbol to prevent duplicate cards
                const uniqueData = Array.from(new Map(data.map(item => [item.symbol, item])).values());

                const formattedData = uniqueData.map(stock => ({
                    ...stock,
                    marketCap: formatMarketCap(stock.marketCap),
                    positive: stock.change >= 0
                }));
                setWatchlist(formattedData);
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPortfolioData = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/api/portfolio/me'), {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setPortfolioData(data);
            }
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
        }
    }, []);

    useEffect(() => {
        fetchWatchlist();
        fetchPortfolioData();
    }, [fetchWatchlist, fetchPortfolioData]);

    // Filter suggestions when addSymbolQuery changes
    useEffect(() => {
        if (addSymbolQuery) {
            const filtered = POPULAR_STOCKS.filter(stock =>
                stock.toLowerCase().includes(addSymbolQuery.toLowerCase()) &&
                stock !== addSymbolQuery.toUpperCase()
            ).slice(0, 5);
            setSuggestions(filtered);
            setSelectedIndex(-1);
        } else {
            setSuggestions([]);
            setSelectedIndex(-1);
        }
    }, [addSymbolQuery]);

    const filteredWatchlist = watchlist.filter(stock => {
        const symbol = stock.symbol || '';
        const name = stock.name || '';
        const query = searchQuery.toLowerCase();
        return symbol.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    });

    const addToWatchlist = async (symbol) => {
        setAddError(''); // Clear previous errors

        const upperSymbol = symbol.toUpperCase();

        // Validate against popular stocks list
        if (!POPULAR_STOCKS.includes(upperSymbol)) {
            setAddError(`Stock "${upperSymbol}" is not available for trading.`);
            return;
        }

        // Check if already in watchlist
        if (watchlist.some(stock => stock.symbol === upperSymbol)) {
            setAddError(`${upperSymbol} is already in your watchlist`);
            return;
        }

        try {
            const response = await fetch(apiUrl(`/api/portfolio/watchlist?symbol=${upperSymbol}`), {
                method: 'POST',
                credentials: 'include',
            });
            const result = await response.json();

            if (response.ok) {
                if (result.status === 'error') {
                    setAddError(result.message);
                } else {
                    fetchWatchlist(); // Refresh list
                    setShowAddModal(false);
                    setAddSymbolQuery(''); // Clear search in modal
                    setShowSuggestions(false);
                }
            } else {
                setAddError(result.message || 'Failed to add to watchlist');
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            setAddError('Network error. Please try again.');
        }
    };

    const removeFromWatchlist = async (e, symbol) => {
        if (e) e.stopPropagation();

        // Find the item to be removed to save it for potential rollback
        const itemToRemove = watchlist.find(s => s.symbol === symbol);
        if (!itemToRemove) return;

        // Optimistic update
        setWatchlist(prev => prev.filter(s => s.symbol !== symbol));

        try {
            const response = await fetch(apiUrl(`/api/portfolio/watchlist?symbol=${symbol}`), {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                // Revert if failed: Add the item back
                setWatchlist(prev => [...prev, itemToRemove]);
                console.error('Failed to remove from watchlist');
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            // Revert on error: Add the item back
            setWatchlist(prev => [...prev, itemToRemove]);
        }
    };

    const fetchStockDetails = async (symbol) => {
        setStockDetails(null);
        try {
            const response = await fetch(apiUrl(`/api/marketData/stockData?symbol=${symbol}`), {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setStockDetails(data);
            }
        } catch (error) {
            console.error('Error fetching stock details:', error);
        }
    };

    const viewStockDetails = (stock) => {
        setSelectedStock(stock);
        fetchStockDetails(stock.symbol);
        setShowDetailModal(true);
    };

    const handleTrade = (stock, type) => {
        // Find current holding for this stock to pass sharesOwned
        const currentHolding = portfolioData?.holdings?.find(h => h.symbol === stock.symbol);
        const sharesOwned = currentHolding ? currentHolding.quantity : 0;

        setSelectedStock({
            ...stock,
            shares: sharesOwned // Pass shares owned to TradeModal via stock object
        });
        setTradeType(type);
        setShowDetailModal(false); // Close detail modal if open
        setShowTradeModal(true);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (addSymbolQuery.trim()) {
            addToWatchlist(addSymbolQuery.toUpperCase());
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    setAddSymbolQuery(suggestions[selectedIndex]);
                    addToWatchlist(suggestions[selectedIndex]);
                    setShowSuggestions(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    const handleSelectSuggestion = (symbol) => {
        setAddSymbolQuery(symbol);
        addToWatchlist(symbol);
        setShowSuggestions(false);
    };

    const handleTradeSubmit = async (tradeData) => {
        if (!tradeData) return;

        const endpoint = tradeData.type === 'Buy' ? '/api/portfolio/buy' : '/api/portfolio/sell';

        try {
            const response = await fetch(apiUrl(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    symbol: tradeData.symbol,
                    quantity: parseInt(tradeData.quantity)
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setShowTradeModal(false);
                setSelectedStock(null);
                // Refresh both watchlist (for potential price updates if we were fetching live) 
                // and portfolio data (for cash/holdings updates)
                fetchWatchlist();
                fetchPortfolioData();
            } else {
                // Handle specific error messages consistent with Dashboard
                if (result.message === 'Holding not found') {
                    alert('You do not own any shares of this stock.');
                } else if (result.message === 'Insufficient stock quantity to sell') {
                    alert('You do not have enough shares to sell this quantity.');
                } else if (result.message === 'Insufficient funds') {
                    alert('Insufficient funds to complete this purchase.');
                } else {
                    alert(result.message || 'Trade failed');
                }
            }
        } catch (error) {
            console.error('Trade error:', error);
            alert('An error occurred while processing your trade');
        }
    };

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
        <DashboardLayout activeMenu="watchlist">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-h-full"
            >
                {/* Header */}
                <div className="p-6 md:p-8 pt-10 md:pt-12">
                    <motion.div variants={itemVariants} className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Watchlist</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Track stocks you're interested in
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setAddSymbolQuery('');
                                setAddError('');
                                setShowAddModal(true);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-600/30"
                        >
                            <Plus size={18} />
                            Add Stock
                        </button>
                    </motion.div>

                    {/* Stats Summary */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Overview</h2>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SkeletonSummaryCard />
                                <SkeletonSummaryCard />
                                <SkeletonSummaryCard />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatsCard
                                    title="Watching"
                                    label="Total stocks"
                                    value={watchlist.length.toString()}
                                    icon={Eye}
                                    gradient="from-teal-500/10 to-blue-500/10"
                                />

                                <StatsCard
                                    title="Gainers"
                                    label="Positive today"
                                    value={watchlist.filter(s => s.positive).length.toString()}
                                    icon={TrendingUp}
                                    gradient="from-emerald-500/10 to-teal-500/10"
                                />

                                <StatsCard
                                    title="Losers"
                                    label="Negative today"
                                    value={watchlist.filter(s => !s.positive).length.toString()}
                                    icon={TrendingDown}
                                    gradient="from-red-500/10 to-orange-500/10"
                                />
                            </div>
                        )}
                    </motion.div>

                    {/* Search */}
                    <motion.div variants={itemVariants} className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search watchlist..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </motion.div>

                    {/* Watchlist Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <SkeletonWatchlistCard />
                            <SkeletonWatchlistCard />
                            <SkeletonWatchlistCard />
                            <SkeletonWatchlistCard />
                            <SkeletonWatchlistCard />
                            <SkeletonWatchlistCard />
                        </div>
                    ) : (
                        <motion.div
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {filteredWatchlist.map((stock) => (
                                <div
                                    key={stock.symbol}
                                    className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all group relative overflow-hidden"
                                >
                                    <button
                                        onClick={(e) => removeFromWatchlist(e, stock.symbol)}
                                        className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Remove from watchlist"
                                    >
                                        <X size={16} />
                                    </button>

                                    <div className="mb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stock.symbol}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stock.name}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${stock.change >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {stock.changePercentage ? Math.abs(stock.changePercentage).toFixed(2) : '0.00'}%
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                            Market Cap: {stock.marketCap}
                                        </p>

                                        {/* Mini Chart */}
                                        <div className="mb-3 rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                                            <SparklineChart symbol={stock.symbol} range="1W" height="h-16" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                                ${stock.price ? stock.price.toFixed(2) : '0.00'}
                                            </span>
                                            <div className={`flex items-center gap-1 text-sm font-semibold ${stock.positive
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {stock.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                <span>{stock.positive ? '+' : ''}{stock.change ? stock.change.toFixed(2) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => viewStockDetails(stock)}
                                        className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Empty State - when watchlist is truly empty */}
                    {!loading && watchlist.length === 0 && (
                        <div className="text-center py-20 glass-card rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-50 animate-pulse"></div>
                                <div className="relative z-10 bg-white dark:bg-slate-800 p-8 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                                    <List size={64} className="text-blue-500 dark:text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your Watchlist is Empty</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                                Keep track of your favorite stocks by adding them here.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-600/30 hover:shadow-teal-600/40 hover:-translate-y-1"
                            >
                                <Plus size={20} />
                                Add First Stock
                            </button>
                        </div>
                    )}

                    {/* Empty State - when search returns no results */}
                    {!loading && watchlist.length > 0 && filteredWatchlist.length === 0 && (
                        <div className="text-center py-12 px-6 glass-card rounded-2xl">
                            <Search size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 font-medium">No stocks found</p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                Try adjusting your search query
                            </p>
                        </div>
                    )}
                </div>
            </motion.div >

            {/* Add Stock Modal */}
            {
                showAddModal && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setShowAddModal(false)}
                        />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
                            <div className="glass-card rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add to Watchlist</h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddSubmit}>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Enter stock symbol (e.g. AAPL)..."
                                            value={addSymbolQuery}
                                            onChange={(e) => {
                                                setAddSymbolQuery(e.target.value);
                                                setAddError(''); // Clear error on typing
                                                setShowSuggestions(true);
                                            }}
                                            onKeyDown={handleKeyDown}
                                            onFocus={() => setShowSuggestions(true)}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${addError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                                                }`}
                                            autoFocus
                                        />

                                        {/* Autocomplete Dropdown */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                                                {suggestions.map((symbol, index) => {
                                                    const isAdded = watchlist.some(s => s.symbol === symbol);
                                                    return (
                                                        <button
                                                            key={symbol}
                                                            type="button"
                                                            onClick={() => handleSelectSuggestion(symbol)}
                                                            onMouseEnter={() => setSelectedIndex(index)}
                                                            className={`w-full text-left px-4 py-3 transition-all duration-150 flex items-center justify-between group ${index === selectedIndex
                                                                ? 'bg-teal-50 dark:bg-teal-900/30 border-l-2 border-teal-500'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                                }`}
                                                        >
                                                            <span className={`font-bold transition-colors ${index === selectedIndex
                                                                ? 'text-teal-700 dark:text-teal-300'
                                                                : 'text-slate-900 dark:text-white'
                                                                }`}>{symbol}</span>

                                                            {isAdded ? (
                                                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                                    Added
                                                                </span>
                                                            ) : (
                                                                <Check
                                                                    size={18}
                                                                    className={`transition-all duration-200 ${index === selectedIndex
                                                                        ? 'text-teal-600 dark:text-teal-400 opacity-100 scale-100'
                                                                        : 'text-slate-400 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                                                                        }`}
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {addError && (
                                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            {addError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-600/30"
                                    >
                                        Add Stock
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Stock Detail Modal */}
            {
                showDetailModal && selectedStock && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setShowDetailModal(false)}
                        />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto z-50 p-4">
                            <div className="glass-card rounded-2xl p-5 shadow-2xl">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStock.symbol}</h2>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">{selectedStock.name}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>

                                {/* Price Chart */}
                                <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <StockChart
                                        symbol={selectedStock.symbol}
                                        height="h-[250px]"
                                        color={selectedStock.positive ? '#10b981' : '#ef4444'}
                                    />
                                </div>

                                {/* Holdings + Price */}
                                <div className="grid gap-4 lg:grid-cols-2 mb-5">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold uppercase tracking-wide">Your Holdings</p>
                                        {(() => {
                                            const holding = portfolioData?.holdings?.find(h => h.symbol === selectedStock.symbol);
                                            const shares = holding ? holding.quantity : 0;
                                            const avgCost = holding ? holding.avgBuyPrice : 0;
                                            const value = holding ? (holding.quantity * holding.currentPrice) : 0;

                                            return (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Shares</p>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{shares}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Cost</p>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">${avgCost.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Value</p>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Current Price</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                                ${stockDetails?.price ? stockDetails.price.toFixed(2) : selectedStock.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className={`text-right ${stockDetails?.change >= 0 || (!stockDetails && selectedStock.positive) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            <div className="flex items-center gap-2 justify-end">
                                                {stockDetails?.change >= 0 || (!stockDetails && selectedStock.positive) ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                <span className="text-xl font-bold">
                                                    {stockDetails?.changePercentage ? (stockDetails.changePercentage > 0 ? '+' : '') + stockDetails.changePercentage.toFixed(2) + '%' : (selectedStock.changePercentage ? selectedStock.changePercentage.toFixed(2) + '%' : '0.00%')}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold mt-1">Return</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Day High</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                            ${stockDetails?.dayHigh ? stockDetails.dayHigh.toFixed(2) : (selectedStock.dayHigh ? selectedStock.dayHigh.toFixed(2) : 'N/A')}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Day Low</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                            ${stockDetails?.dayLow ? stockDetails.dayLow.toFixed(2) : (selectedStock.dayLow ? selectedStock.dayLow.toFixed(2) : 'N/A')}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Volume</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                            {stockDetails?.volume ? (stockDetails.volume / 1000000).toFixed(1) + 'M' : (selectedStock.volume ? (selectedStock.volume / 1e6).toFixed(1) + 'M' : 'N/A')}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Market Cap</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                            {stockDetails?.marketCap ? (stockDetails.marketCap / 1000000000000).toFixed(2) + 'T' : (selectedStock.marketCap || 'N/A')}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleTrade(selectedStock, 'Buy')}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg shadow-emerald-600/30"
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => handleTrade(selectedStock, 'Sell')}
                                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all shadow-lg shadow-red-600/30"
                                    >
                                        Sell
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            removeFromWatchlist(e, selectedStock.symbol);
                                            setShowDetailModal(false);
                                        }}
                                        className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Trade Modal */}
            {
                showTradeModal && selectedStock && (
                    <TradeModal
                        isOpen={showTradeModal}
                        onClose={() => {
                            setShowTradeModal(false);
                            setSelectedStock(null);
                        }}
                        stock={selectedStock}
                        type={tradeType}
                        onConfirm={handleTradeSubmit}
                        cash={portfolioData?.cash || 0}
                    />
                )
            }
        </DashboardLayout >
    );
};

export default WatchlistPage;
