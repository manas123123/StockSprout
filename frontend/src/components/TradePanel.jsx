import { useState, useEffect, useRef, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Info, Search, Check, Star } from 'lucide-react';
import TradeModal from './TradeModal';
import { apiFetch } from '../config/api';

const POPULAR_STOCKS = [
    'AAPL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX', 'JPM', 'V', 'BAC', 'AMD', 'PYPL', 'DIS', 'T', 'PFE', 'COST', 'INTC', 'KO', 'TGT', 'NKE', 'SPY', 'BA', 'BABA', 'XOM', 'WMT', 'GE', 'CSCO', 'VZ', 'JNJ', 'CVX', 'PLTR', 'SQ', 'SHOP', 'SBUX', 'SOFI', 'HOOD', 'RBLX', 'SNAP', 'UBER', 'FDX', 'ABBV', 'ETSY', 'MRNA', 'LMT', 'GM', 'F', 'RIVN', 'LCID', 'CCL', 'DAL', 'UAL', 'AAL', 'TSM', 'SONY', 'ET', 'NOK', 'MRO', 'COIN', 'SIRI', 'RIOT', 'CPRX', 'VWO', 'SPYG', 'ROKU', 'VIAC', 'ATVI', 'BIDU', 'DOCU', 'ZM', 'PINS', 'TLRY', 'WBA', 'MGM', 'NIO', 'C', 'GS', 'WFC', 'ADBE', 'PEP', 'UNH', 'CARR', 'FUBO', 'HCA', 'TWTR', 'BILI', 'RKT'
];

const TradePanel = ({ selectedSymbol = "AAPL", onSymbolChange, onTradeSubmit, hoverPoint = null, cash = 0, currentPrice = 0, sharesOwned = 0 }) => {
    const [type, setType] = useState('Buy');
    const [quantity, setQuantity] = useState(1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [watchlist, setWatchlist] = useState([]);
    const wrapperRef = useRef(null);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

    const total = (quantity * currentPrice);
    // Use cash from props as portfolioValue for calculation context
    const portfolioValue = cash;
    const portfolioAfter = type === 'Buy' ? portfolioValue - total : portfolioValue + total;

    const isInWatchlist = watchlist.includes(selectedSymbol);
    const canAfford = type === 'Buy' ? total <= cash : true; // Simple validation

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const response = await apiFetch('/api/portfolio/watchList', {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setWatchlist(data.map(item => item.symbol));
                }
            } catch (error) {
                console.error('Error fetching watchlist:', error);
            }
        };
        fetchWatchlist();
    }, []);

    useEffect(() => {
        // Filter suggestions when selectedSymbol changes
        if (selectedSymbol) {
            const filtered = POPULAR_STOCKS.filter(stock =>
                stock.toLowerCase().includes(selectedSymbol.toLowerCase()) &&
                stock !== selectedSymbol
            ).slice(0, 5); // Limit to 5 suggestions
            setSuggestions(filtered);
            setSelectedIndex(-1); // Reset selection when suggestions change
        } else {
            setSuggestions([]);
            setSelectedIndex(-1);
        }
    }, [selectedSymbol]);

    useEffect(() => {
        // Handle clicking outside to close suggestions
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSymbolChange = (e) => {
        const value = e.target.value.toUpperCase();
        if (onSymbolChange) {
            onSymbolChange(value);
        }
        setShowSuggestions(true);
        setSelectedIndex(-1);
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
                    handleSelectSuggestion(suggestions[selectedIndex]);
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
        if (onSymbolChange) {
            onSymbolChange(symbol);
        }
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (type === 'Buy' && !canAfford) {
            alert("Insufficient funds");
            return;
        }

        setIsTradeModalOpen(true);
    };

    const handleConfirmTrade = (tradeData) => {
        console.log('TradePanel handleConfirmTrade called. onTradeSubmit exists:', !!onTradeSubmit);
        if (onTradeSubmit && tradeData) {
            onTradeSubmit(tradeData);
        }
        // Do not close modal here, let TradeModal handle success state
        // setIsTradeModalOpen(false);
    };

    const toggleWatchlist = async () => {
        const isWatched = watchlist.includes(selectedSymbol);

        // Optimistic update
        if (isWatched) {
            setWatchlist(prev => prev.filter(s => s !== selectedSymbol));
        } else {
            setWatchlist(prev => [...prev, selectedSymbol]);
        }

        try {
            if (isWatched) {
                const response = await apiFetch(`/api/portfolio/watchlist?symbol=${selectedSymbol}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!response.ok) {
                    // Revert if failed
                    setWatchlist(prev => [...prev, selectedSymbol]);
                    console.error('Failed to remove from watchlist');
                }
            } else {
                const response = await apiFetch(`/api/portfolio/watchlist?symbol=${selectedSymbol}`, {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!response.ok) {
                    // Revert if failed
                    setWatchlist(prev => prev.filter(s => s !== selectedSymbol));
                    console.error('Failed to add to watchlist');
                }
            }
        } catch (error) {
            console.error('Error updating watchlist:', error);
            // Revert on error
            if (isWatched) {
                setWatchlist(prev => [...prev, selectedSymbol]);
            } else {
                setWatchlist(prev => prev.filter(s => s !== selectedSymbol));
            }
        }
    };

    const modalStockData = useMemo(() => ({
        symbol: selectedSymbol,
        price: currentPrice,
        quantity: quantity, // Pass initial quantity
        shares: sharesOwned // Pass real shares owned
    }), [selectedSymbol, currentPrice, quantity, sharesOwned]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Trade Stock</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Paper trading • No fees</p>
                </div>
                <div className="flex bg-gradient-to-br from-slate-100/80 via-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 backdrop-blur-xl rounded-xl p-1 shadow-lg shadow-slate-300/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-600/50 relative">
                    {/* Sliding background indicator */}
                    <div
                        className={`absolute top-1 bottom-1 w-1/2 bg-white/90 dark:bg-slate-700/90 backdrop-blur-md rounded-lg shadow-lg transition-all duration-200 ease-out ${type === 'Buy'
                            ? 'left-1 shadow-teal-500/20 dark:shadow-teal-400/20 border border-teal-200/50 dark:border-teal-600/50'
                            : 'left-[calc(50%-0.25rem)] shadow-red-500/20 dark:shadow-red-400/20 border border-red-200/50 dark:border-red-600/50'
                            }`}
                    />
                    <button
                        onClick={() => setType('Buy')}
                        className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-out ${type === 'Buy'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setType('Sell')}
                        className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-out ${type === 'Sell'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Sell
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Symbol Input */}
                <div className="relative" ref={wrapperRef}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Symbol
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={selectedSymbol}
                            onChange={handleSymbolChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(true)}
                            className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-bold text-lg uppercase placeholder-slate-300 dark:placeholder-slate-600"
                            placeholder="e.g. AAPL"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Search size={20} />
                        </div>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                            {suggestions.map((symbol, index) => (
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
                                    <Check
                                        size={18}
                                        className={`transition-all duration-200 ${index === selectedIndex
                                            ? 'text-teal-600 dark:text-teal-400 opacity-100 scale-100'
                                            : 'text-slate-400 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chart Hover Point Display */}
                {hoverPoint && (
                    <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Chart Point</span>
                            <span className="text-xs text-blue-500 dark:text-blue-400">Hover</span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-3">
                            <div>
                                <span className="text-xs text-blue-600 dark:text-blue-400">Time:</span>
                                <span className="ml-1 text-sm font-bold text-blue-700 dark:text-blue-300">{hoverPoint.time}</span>
                            </div>
                            <div className="h-4 w-px bg-blue-300 dark:bg-blue-700"></div>
                            <div>
                                <span className="text-xs text-blue-600 dark:text-blue-400">Price:</span>
                                <span className="ml-1 text-sm font-bold text-blue-700 dark:text-blue-300">${hoverPoint.price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Price Display */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Price</span>
                        {/* Removed static change percentage as we don't have it from simple price API yet */}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Quantity Input */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Quantity
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900/50">
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, (parseInt(quantity) || 0) - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setQuantity('');
                                    } else {
                                        const parsed = parseInt(val);
                                        if (!isNaN(parsed) && parsed >= 0) {
                                            setQuantity(parsed);
                                        }
                                    }
                                }}
                                onBlur={() => {
                                    if (quantity === '' || quantity < 1) {
                                        setQuantity(1);
                                    }
                                }}
                                className="w-12 text-center bg-transparent border-none outline-none text-slate-900 dark:text-white font-semibold text-lg no-spinner appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity((parseInt(quantity) || 0) + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Shares</span>
                    </div>
                </div>

                {/* Total, Impact & Watchlist */}
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Estimated Cost</span>
                        <span className={`text-xl font-bold ${!canAfford ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Buying Power</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Shares Owned</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {sharesOwned}
                        </span>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 bg-blue-100 dark:bg-blue-800 rounded-full p-1">
                                <Info size={14} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-xs">
                                <p className="text-blue-700 dark:text-blue-300 font-semibold mb-1">Portfolio Impact</p>
                                <p className="text-blue-600 dark:text-blue-400">
                                    New Cash Balance: ${portfolioAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Watchlist CTA */}
                    <button
                        type="button"
                        onClick={toggleWatchlist}
                        className={`w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isInWatchlist ? 'ring-1 ring-emerald-400/40' : ''}`}
                    >
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isInWatchlist ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-900/10 dark:bg-white/10 text-slate-500 dark:text-slate-200'}`}>
                                    <Star
                                        size={18}
                                        className={`${isInWatchlist ? 'fill-current drop-shadow' : ''}`}
                                    />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Watchlist</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                        {isInWatchlist ? `${selectedSymbol} saved for quick access` : 'Add this stock for quick access'}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${isInWatchlist ? 'text-emerald-500' : 'text-teal-500'}`}>
                                {isInWatchlist ? 'Added' : 'Add'}
                            </span>
                        </div>
                    </button>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-base shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${type === 'Buy'
                        ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/30'
                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                        }`}
                >
                    {type === 'Buy' ? 'Buy' : 'Sell'} {selectedSymbol}
                </button>
            </form>

            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                onConfirm={handleConfirmTrade}
                stock={modalStockData}
                type={type}
                cash={cash}
            />
        </div >
    );
};

export default TradePanel;
