import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, TrendingUp, TrendingDown, Wallet, ArrowRight, Minus, Plus } from 'lucide-react';

const TradeModal = ({ isOpen, onClose, stock, type = 'Buy', onConfirm, cash = 0 }) => {
    const [quantity, setQuantity] = useState(1);
    const [success, setSuccess] = useState(false);
    const [failed, setFailed] = useState(false);

    // Handle both direct stock objects and trade request objects
    const stockSymbol = stock?.symbol || stock?.ticker || '';
    const stockPrice = parseFloat(stock?.price || 0);
    const stockShares = stock?.shares || 0;

    // Use passed cash for buying power
    const buyingPower = cash;

    useEffect(() => {
        if (isOpen) {
            setQuantity(stock?.quantity || 1);
            setSuccess(false);
            setFailed(false);
        }
    }, [isOpen, stock]);

    console.log('TradeModal render:', { isOpen, stock });

    if (!isOpen || !stock) return null;

    const total = (stockPrice * quantity).toFixed(2);
    const totalNum = parseFloat(total);

    // Calculate portfolio effects
    const newBuyingPower = type === 'Buy'
        ? buyingPower - totalNum
        : buyingPower + totalNum;

    const handleConfirm = () => {
        if (type === 'Sell' && quantity > stockShares) {
            setFailed(true);
            return;
        }

        setSuccess(true);
        if (onConfirm) {
            onConfirm({
                symbol: stockSymbol,
                type,
                quantity,
                price: stockPrice,
                total: totalNum
            });
        }
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[9999] transition-opacity duration-300"
                onClick={onClose}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[10000] p-4">
                <div className="glass-card rounded-3xl p-0 shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {success ? 'Order Executed' : failed ? 'Order Failed' : `Confirm ${type}`}
                            </h2>
                            {!success && !failed && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {type === 'Buy' ? 'Purchase' : 'Sell'} {stockSymbol} stock
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-900">
                        {failed ? (
                            <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-full bg-red-400/10 animate-ping" />
                                    <X size={48} className="text-red-600 dark:text-red-400 relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Trade Failed</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-[80%] mx-auto leading-relaxed">
                                    You cannot sell <span className="font-bold text-slate-900 dark:text-white">{quantity}</span> shares because you only own <span className="font-bold text-slate-900 dark:text-white">{stockShares}</span> shares of <span className="font-bold text-slate-900 dark:text-white">{stockSymbol}</span>.
                                </p>
                                <button
                                    onClick={() => setFailed(false)}
                                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold text-lg transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : success ? (
                            <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping" />
                                    <Check size={48} className="text-emerald-600 dark:text-emerald-400 relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Trade Successful!</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-[80%] mx-auto leading-relaxed">
                                    You have successfully {type === 'Buy' ? 'bought' : 'sold'} <span className="font-bold text-slate-900 dark:text-white">{quantity}</span> shares of <span className="font-bold text-slate-900 dark:text-white">{stockSymbol}</span> for <span className="font-bold text-slate-900 dark:text-white">${total}</span>.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 hover:-translate-y-0.5"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Stock Info Card */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${type === 'Buy'
                                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}>
                                            {stockSymbol.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{stockSymbol}</h3>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Price: ${stockPrice.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total {type === 'Buy' ? 'Cost' : 'Value'}</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">${total}</p>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Quantity
                                        </label>
                                        {type === 'Sell' && (
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Available: {stockShares} shares
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shadow-inner h-16">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Minus size={20} />
                                        </button>

                                        <div className="flex-1 px-4">
                                            <input
                                                type="number"
                                                min="1"
                                                max={type === 'Sell' ? stockShares : undefined}
                                                value={quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 1) {
                                                        if (type === 'Sell' && val > stockShares) {
                                                            setQuantity(stockShares);
                                                        } else {
                                                            setQuantity(val);
                                                        }
                                                    } else if (e.target.value === '') {
                                                        setQuantity('');
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (quantity === '' || quantity < 1) setQuantity(1);
                                                }}
                                                className="w-full text-center bg-transparent border-none outline-none text-slate-900 dark:text-white font-bold text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (type === 'Sell' && quantity >= stockShares) return;
                                                setQuantity((parseInt(quantity) || 0) + 1);
                                            }}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Portfolio Effects */}
                                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Wallet size={14} /> Portfolio Impact
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Buying Power</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-500 dark:text-slate-500 line-through decoration-slate-400/50">
                                                    ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <ArrowRight size={14} className="text-slate-400" />
                                                <span className={`text-sm font-bold ${newBuyingPower >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                                                    ${newBuyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">New Position Size</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {type === 'Buy' ? (stockShares + quantity) : (stockShares - quantity)} shares
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition-all font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={type === 'Buy' && newBuyingPower < 0}
                                        className={`flex-[2] px-4 py-3.5 text-white rounded-2xl transition-all font-bold text-sm shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${type === 'Buy'
                                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/20'
                                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-600/20'
                                            }`}
                                    >
                                        {type === 'Buy' && newBuyingPower < 0
                                            ? 'Insufficient Funds'
                                            : `Confirm ${type}`
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default TradeModal;
