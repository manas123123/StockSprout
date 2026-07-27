import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Wallet, TrendingUp, BarChart3, Activity, ArrowUp, ArrowDown, PieChart, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import StatsCard from '../components/ui/StatsCard';
import StockChart from '../components/StockChart';
import TradePanel from '../components/TradePanel';
import { SkeletonSummaryCard } from '../components/Skeleton';
import { apiUrl } from '../config/api';



const Dashboard = () => {
  const { user } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(true);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [tradeMarkers, setTradeMarkers] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [currentStockPrice, setCurrentStockPrice] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch(apiUrl('/api/portfolio/me'), {
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

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  useEffect(() => {
    const fetchStockPrice = async () => {
      if (!selectedSymbol) return;
      try {
        const response = await fetch(apiUrl(`/api/marketData/currentStockPrice?symbol=${selectedSymbol}`), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentStockPrice(data.price);
        }
      } catch (error) {
        console.error('Error fetching stock price:', error);
      }
    };

    const fetchStockDetails = async () => {
      if (!selectedSymbol) return;
      try {
        const response = await fetch(apiUrl(`/api/marketData/stockData?symbol=${selectedSymbol}`), {
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

    fetchStockPrice();
    fetchStockDetails();
    // Poll every 10 seconds for price updates
    const interval = setInterval(fetchStockPrice, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleTradeSubmit = async (tradeData) => {
    console.log('Dashboard handleTradeSubmit called with:', tradeData);

    if (!tradeData) return;

    if (tradeData.type === 'Buy') {
      try {
        const response = await fetch(apiUrl('/api/portfolio/buy'), {
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
        } else {
          alert(result.message || 'Trade failed');
        }
      } catch (error) {
        console.error('Trade error:', error);
        alert('An error occurred while processing your trade');
      }
    } else if (tradeData.type === 'Sell') {
      try {
        const response = await fetch(apiUrl('/api/portfolio/sell'), {
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
        } else {
          // Handle specific error messages
          if (result.message === 'Holding not found') {
            alert('You do not own any shares of this stock.');
          } else if (result.message === 'Insufficient stock quantity to sell') {
            alert('You do not have enough shares to sell this quantity.');
          } else {
            alert(result.message || 'Trade failed');
          }
        }
      } catch (error) {
        console.error('Trade error:', error);
        alert('An error occurred while processing your trade');
      }
    }

    const newMarker = {
      symbol: tradeData.symbol,
      type: tradeData.type,
      price: parseFloat(tradeData.price),
      timestamp: Date.now()
    };
    setTradeMarkers(prev => [...prev, newMarker]);
  };

  // Calculate stats based on portfolioData
  const calculateStats = () => {
    // Default values if data is missing or loading failed
    const data = portfolioData || {
      cash: 0,
      stockValue: 0,
      invested: 0,
      holdings: []
    };

    const { cash, stockValue, invested, holdings } = data;
    const portfolioValue = cash + stockValue;
    const unrealizedPL = portfolioValue - 100000;
    const unrealizedPLPercent = (unrealizedPL / 100000) * 100;

    return {
      stats: [
        {
          title: 'Cash',
          value: `$${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: '', // No arrow/change for Cash
          changePercent: 'Available',
          label: 'Buying power',
          positive: true, // Always neutral/positive styling
          icon: Wallet,
          gradient: 'from-emerald-500/10 to-teal-500/10',
          hideArrow: true
        },
        {
          title: 'Portfolio Value',
          value: `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: '', // Calculated elsewhere if needed, or left blank for now as per req
          changePercent: 'Total balance',
          label: 'Total balance',
          positive: portfolioValue > 100000,
          icon: DollarSign,
          gradient: 'from-teal-500/10 to-blue-500/10'
        },
        {
          title: 'Unrealized P/L',
          value: `${unrealizedPL >= 0 ? '+' : ''}$${Math.abs(unrealizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: `${unrealizedPLPercent >= 0 ? '+' : ''}${unrealizedPLPercent.toFixed(2)}%`,
          changePercent: 'All time',
          label: 'Total return',
          positive: unrealizedPL >= 0,
          icon: TrendingUp,
          gradient: 'from-blue-500/10 to-indigo-500/10'
        },
        {
          title: 'Investments',
          value: `$${stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: '', // Remove "24change"
          changePercent: 'Market value',
          label: 'Market value',
          positive: stockValue > invested,
          icon: BarChart3,
          gradient: 'from-purple-500/10 to-pink-500/10',
          hideArrow: true
        },
      ],
      holdings: holdings || []
    };
  };

  const { stats: statsCards, holdings } = calculateStats();

  // Find shares owned for selected symbol
  const currentHolding = holdings.find(h => h.symbol === selectedSymbol);
  const sharesOwned = currentHolding ? currentHolding.quantity : 0;

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

  const subContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <DashboardLayout activeMenu="dashboard">
      {/* Background gradient for depth */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-full"
      >
        {/* Header with more spacing */}
        <div className="p-6 md:p-8 pt-10 md:pt-12">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {user.firstName}!</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Here's your portfolio overview for today.
              </p>
            </div>
          </motion.div>

          {/* Stats Cards Grid with improved styling */}
          <motion.div variants={itemVariants} className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-6">
              {loading ? (
                <>
                  <SkeletonSummaryCard />
                  <SkeletonSummaryCard />
                  <SkeletonSummaryCard />
                  <SkeletonSummaryCard />
                </>
              ) : (
                statsCards.map((stat, idx) => (
                  <StatsCard
                    key={idx}
                    title={stat.title}
                    label={stat.label}
                    value={stat.value}
                    change={stat.change}
                    changePercent={stat.changePercent}
                    positive={stat.positive}
                    icon={stat.icon}
                    gradient={stat.gradient}
                    className="hover:shadow-xl"
                    hideArrow={stat.hideArrow}
                  />
                ))
              )}
            </div>
          </motion.div>

          {/* Market Overview Section with Trade Box */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Stock Chart */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Performance</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Track price movements for {selectedSymbol}</p>
              </div>
              <StockChart
                symbol={selectedSymbol}
                onHoverPoint={setHoverPoint}
                tradeMarkers={tradeMarkers.filter(m => m.symbol === selectedSymbol)}
              />

              {/* Stock Details Grid */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <motion.div
                  variants={subContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {[
                    {
                      label: 'Open',
                      value: stockDetails?.open ? `$${stockDetails.open.toFixed(2)}` : '---',
                      icon: Activity,
                      color: 'text-blue-500',
                      bg: 'bg-blue-50 dark:bg-blue-900/20'
                    },
                    {
                      label: 'High',
                      value: stockDetails?.dayHigh ? `$${stockDetails.dayHigh.toFixed(2)}` : '---',
                      icon: ArrowUp,
                      color: 'text-emerald-500',
                      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
                    },
                    {
                      label: 'Low',
                      value: stockDetails?.dayLow ? `$${stockDetails.dayLow.toFixed(2)}` : '---',
                      icon: ArrowDown,
                      color: 'text-red-500',
                      bg: 'bg-red-50 dark:bg-red-900/20'
                    },
                    {
                      label: 'Market Cap',
                      value: stockDetails?.marketCap ? `${(stockDetails.marketCap / 1000000000000).toFixed(2)}T` : '---',
                      icon: PieChart,
                      color: 'text-purple-500',
                      bg: 'bg-purple-50 dark:bg-purple-900/20'
                    },
                    {
                      label: 'Volume',
                      value: stockDetails?.volume ? `${(stockDetails.volume / 1000000).toFixed(1)}M` : '---',
                      icon: BarChart3,
                      color: 'text-orange-500',
                      bg: 'bg-orange-50 dark:bg-orange-900/20'
                    },
                    {
                      label: 'Change %',
                      value: stockDetails?.changePercentage ? `${stockDetails.changePercentage > 0 ? '+' : ''}${stockDetails.changePercentage.toFixed(2)}%` : '---',
                      icon: Percent,
                      color: stockDetails?.changePercentage >= 0 ? 'text-emerald-500' : 'text-red-500',
                      bg: stockDetails?.changePercentage >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</p>
                        <div className={`p-1.5 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.icon size={14} />
                        </div>
                      </div>
                      <p className={`text-lg font-bold text-slate-900 dark:text-white ${item.label === 'Change %' ? item.color : ''}`}>
                        {item.value}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Trade Panel */}
            <div className="glass-panel rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Trade</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Buy or sell assets</p>
              </div>
              <TradePanel
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
                onTradeSubmit={handleTradeSubmit}
                hoverPoint={hoverPoint}
                cash={portfolioData?.cash || 0}
                currentPrice={currentStockPrice || 0}
                sharesOwned={sharesOwned}
              />
            </div>
          </motion.div>

          {/* Portfolio Holdings */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Portfolio */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Portfolio</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Click to view details and trade</p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {holdings.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No holdings yet. Start trading to build your portfolio!
                    </div>
                  ) : (
                    holdings.map((stock, index) => {
                      // Calculate gain/loss if currentPrice is available, otherwise 0
                      const gainLoss = (stock.currentPrice - stock.avgBuyPrice) * stock.quantity;
                      const gainLossPercent = ((stock.currentPrice - stock.avgBuyPrice) / stock.avgBuyPrice) * 100;
                      const isPositive = gainLoss >= 0;

                      return (
                        <motion.button
                          key={stock.symbol}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedSymbol(stock.symbol)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 group ${selectedSymbol === stock.symbol
                            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500/50 shadow-md'
                            : 'bg-white dark:bg-slate-800/50 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 ${isPositive
                              ? 'bg-teal-100 dark:bg-emerald-500/20 text-teal-700 dark:text-emerald-400'
                              : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                              }`}>
                              {stock.symbol.charAt(0)}
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-slate-900 dark:text-white">{stock.symbol}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">{stock.quantity} shares</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white">${stock.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className={`text-xs font-medium ${isPositive ? 'text-teal-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your latest trades</p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {portfolioData?.transactions && portfolioData.transactions.length > 0 ? (
                    portfolioData.transactions.slice().reverse().slice(0, 5).map((activity, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${activity.type === 'BUY'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                            {activity.type}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{activity.symbol}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{activity.quantity} shares @ ${activity.pricePerUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No recent activity.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div >
      </motion.div >

    </DashboardLayout >
  );
};

export default Dashboard;
