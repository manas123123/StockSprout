import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, MoreVertical, Wallet, Activity, Eye, Star, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { SkeletonPortfolioTable, SkeletonSummaryCard, SkeletonMiniSummary } from '../components/Skeleton';
import StatsCard from '../components/ui/StatsCard';
import TradeModal from '../components/TradeModal';
import { apiFetch } from '../config/api';



const PortfolioPage = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('Buy');
  const [watchlist, setWatchlist] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);
  const [chartData, setChartData] = useState([]);

  const fetchPortfolioData = async () => {
    try {
      const response = await apiFetch('/api/portfolio/me', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setPortfolioData(data);
      } catch (e) {
        console.error('JSON Parse Error:', e);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockDetails = async (symbol) => {
    setStockDetails(null);
    try {
      const response = await apiFetch(`/api/marketData/stockData?symbol=${symbol}`, {
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

  const fetchChartData = async (symbol) => {
    setChartData([]);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // 30 days ago

    const formatDate = (date) => date.toISOString().split('T')[0];

    try {
      const response = await apiFetch(
        `/api/marketData/StockPriceHistory?symbol=${symbol}&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        // Format data for Recharts
        const formattedData = data.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: item.price
        })).reverse();
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await apiFetch('/api/portfolio/watchList', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Extract just the symbols for easier checking
        setWatchlist(data.map(item => item.symbol));
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    fetchWatchlist();
  }, []);

  // Process holdings from API data
  const holdings = portfolioData?.holdings || [];

  // Filter holdings based on search
  const filteredStocks = holdings.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(stock => {
    // Calculate derived values for display
    const value = stock.quantity * stock.currentPrice;
    const gainLoss = (stock.currentPrice - stock.avgBuyPrice) * stock.quantity;
    const gainLossPercent = ((stock.currentPrice - stock.avgBuyPrice) / stock.avgBuyPrice) * 100;
    const isPositive = gainLoss >= 0;

    return {
      ...stock,
      value,
      change: `${isPositive ? '+' : ''}${gainLossPercent.toFixed(2)}%`, // Using % as change for now
      changePercent: `${isPositive ? '+' : ''}${gainLossPercent.toFixed(2)}%`,
      positive: isPositive,
      shares: stock.quantity,
      price: stock.currentPrice.toFixed(2)
    };
  });

  const handleAddToWatchlist = async (stock) => {
    const symbol = stock.symbol;
    const isWatched = watchlist.includes(symbol);

    // Optimistic update
    if (isWatched) {
      setWatchlist(watchlist.filter(s => s !== symbol));
    } else {
      setWatchlist([...watchlist, symbol]);
    }

    try {
      if (isWatched) {
        // Remove from watchlist
        const response = await apiFetch(`/api/portfolio/watchlist?symbol=${symbol}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) {
          // Revert if failed
          setWatchlist([...watchlist, symbol]);
          console.error('Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        const response = await apiFetch(`/api/portfolio/watchlist?symbol=${symbol}`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) {
          // Revert if failed
          setWatchlist(watchlist.filter(s => s !== symbol));
          console.error('Failed to add to watchlist');
        }
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      // Revert on error
      if (isWatched) {
        setWatchlist([...watchlist, symbol]);
      } else {
        setWatchlist(watchlist.filter(s => s !== symbol));
      }
    }
  };

  const handleTrade = (stock, type) => {
    setSelectedStock(stock);
    setTradeType(type);
    setShowTradeModal(true);
  };

  // Calculate Portfolio Stats
  const cash = portfolioData?.cash || 0;
  // Calculate stock value from holdings if not provided or 0
  const stockValue = portfolioData?.holdings?.reduce((acc, stock) => acc + (stock.quantity * stock.currentPrice), 0) || 0;
  const invested = portfolioData?.invested || 0;
  const totalGain = stockValue - invested;
  const totalGainPercent = invested > 0 ? (totalGain / invested) * 100 : 0;

  // Mini Summary Stats
  const gainersCount = filteredStocks.filter(s => s.positive).length;
  const losersCount = filteredStocks.filter(s => !s.positive).length;

  const handleTradeSubmit = async (tradeData) => {
    if (!tradeData) return;

    const endpoint = tradeData.type === 'Buy' ? '/api/portfolio/buy' : '/api/portfolio/sell';

    try {
      const response = await apiFetch(endpoint, {
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
        // Refresh portfolio data to show new holdings/cash
        fetchPortfolioData();
        setShowTradeModal(false);
        setSelectedStock(null);
      } else {
        // Handle specific error messages
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
    <DashboardLayout activeMenu="portfolio">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-full"
      >
        <div className="p-6 md:p-8 pt-10 md:pt-12">
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your holdings and track performance</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Stock Value"
              label="Current holdings"
              value={`$${stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={`${totalGain >= 0 ? '+' : ''}$${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              changePercent={`${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%`}
              positive={totalGain >= 0}
              icon={PieChart}
              gradient="from-teal-500/10 to-blue-500/10"
            />
            <StatsCard
              title="Total Gain"
              label="All time"
              value={`${totalGain >= 0 ? '+' : ''}$${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={`${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%`}
              positive={totalGain >= 0}
              icon={TrendingUp}
              gradient="from-emerald-500/10 to-teal-500/10"
            />
            <StatsCard
              title="Available Cash"
              label="Ready to invest"
              value={`$${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change="Paper trading balance"
              positive={true}
              icon={Wallet}
              gradient="from-blue-500/10 to-indigo-500/10"
            />
          </motion.div>

          {/* Mini Summary Row */}
          {loading ? (
            <SkeletonMiniSummary />
          ) : (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="glass-panel rounded-2xl p-4 mb-8 shadow-sm"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Holdings</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{holdings.length} Assets</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Gainers</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{gainersCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Losers</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{losersCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Return</p>
                    <p className={`text-lg font-bold ${totalGain >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Portfolio Table */}
          {loading ? (
            <SkeletonPortfolioTable rows={7} />
          ) : (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="glass-panel rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Holdings</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{filteredStocks.length} assets • Updated just now</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in portfolio..."
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl w-full sm:w-64 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Asset
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Shares
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Total Return
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Watch
                      </th>
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredStocks.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="flex items-center cursor-pointer group/stock"
                            onClick={() => {
                              setSelectedStock(stock);
                              fetchStockDetails(stock.symbol);
                              fetchChartData(stock.symbol);
                              setShowDetailModal(true);
                            }}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-transform group-hover/stock:scale-110 ${stock.positive ? 'bg-teal-100 dark:bg-emerald-500/20 text-teal-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                              {stock.symbol.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="font-bold text-slate-900 dark:text-white group-hover/stock:text-teal-600 dark:group-hover/stock:text-teal-400 transition-colors">{stock.symbol}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-500">{stock.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-medium text-right">{stock.shares}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-bold text-right">${stock.price}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${stock.positive ? 'text-teal-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          <div className="flex items-center justify-end">
                            {stock.positive ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                            {stock.changePercent}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-bold text-right">${stock.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleAddToWatchlist(stock)}
                            className={`p-2 hover:scale-110 transition-all duration-300 rounded-lg cursor-pointer ${watchlist.includes(stock.symbol)
                              ? 'text-yellow-500 hover:text-yellow-400 dark:text-yellow-400 dark:hover:text-yellow-300'
                              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                              }`}
                          >
                            <Star
                              size={20}
                              fill={watchlist.includes(stock.symbol) ? 'currentColor' : 'none'}
                              className="transition-all duration-300"
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Placeholder for other actions if needed, or can be removed if 'Actions' column is not used for anything else */}
                        </td>
                      </tr>

                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State - when no stocks at all */}
              {holdings.length === 0 && (
                <div className="text-center py-16 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="max-w-md mx-auto">

                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Holdings Yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                      Your portfolio is looking a bit empty. Start building your wealth today!
                    </p>
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-600/30 hover:shadow-teal-600/40 hover:-translate-y-1"
                    >
                      <Search size={20} />
                      Browse Stocks
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State - when search returns no results */}
              {holdings.length > 0 && filteredStocks.length === 0 && (
                <div className="text-center py-12 px-6">
                  <Search size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No stocks found</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Try adjusting your search query
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stock Detail Modal */}
      {showDetailModal && selectedStock && (
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
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">30-Day Price Trend</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradient-${selectedStock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={selectedStock.positive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={selectedStock.positive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      itemStyle={{ color: selectedStock.positive ? '#10b981' : '#ef4444' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={selectedStock.positive ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      fill={`url(#gradient-${selectedStock.symbol})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Holdings + Price */}
              <div className="grid gap-4 lg:grid-cols-2 mb-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold uppercase tracking-wide">Your Holdings</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Shares</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedStock.shares}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Cost</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">${selectedStock.avgBuyPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Value</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">${selectedStock.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Current Price</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${stockDetails?.price ? stockDetails.price.toFixed(2) : selectedStock.price}
                    </p>
                  </div>
                  <div className={`text-right ${stockDetails?.change >= 0 || (!stockDetails && selectedStock.positive) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    <div className="flex items-center gap-2 justify-end">
                      {stockDetails?.change >= 0 || (!stockDetails && selectedStock.positive) ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      <span className="text-xl font-bold">
                        {stockDetails?.changePercentage ? (stockDetails.changePercentage > 0 ? '+' : '') + stockDetails.changePercentage.toFixed(2) + '%' : selectedStock.changePercent}
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
                    ${stockDetails?.dayHigh ? stockDetails.dayHigh.toFixed(2) : (parseFloat(selectedStock.price) + 5).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Day Low</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    ${stockDetails?.dayLow ? stockDetails.dayLow.toFixed(2) : (parseFloat(selectedStock.price) - 5).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Volume</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {stockDetails?.volume ? (stockDetails.volume / 1000000).toFixed(1) + 'M' : '12.5M'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Market Cap</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {stockDetails?.marketCap ? (stockDetails.marketCap / 1000000000000).toFixed(2) + 'T' : '2.8T'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleTrade(selectedStock, 'Buy');
                  }}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow-lg shadow-teal-600/30"
                >
                  Buy More
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleTrade(selectedStock, 'Sell');
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all shadow-lg shadow-red-600/30"
                >
                  Sell Shares
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Trade Modal */}
      {showTradeModal && selectedStock && (
        <TradeModal
          isOpen={showTradeModal}
          onClose={() => {
            setShowTradeModal(false);
            setSelectedStock(null);
          }}
          stock={selectedStock}
          type={tradeType}
          cash={cash}
          onConfirm={handleTradeSubmit}
        />
      )}
    </DashboardLayout>
  );
};


export default PortfolioPage;
