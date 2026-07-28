import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';

const SYMBOLS = [
  'AAPL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'GOOGL', 'META', 'NFLX', 'JPM', 'V'
];

// Deduplicate symbols just in case
const UNIQUE_SYMBOLS = [...new Set(SYMBOLS)];
const CACHE_KEY = 'ticker_data_cache_v3'; // Updated cache key
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function TickerBar() {
  // Generate initial mock data so it's never empty
  const generateMockData = () => UNIQUE_SYMBOLS.map(symbol => {
    const mockPrice = Math.random() * 200 + 50;
    const mockChange = Math.random() * 10 - 5;
    const mockChangePercent = (mockChange / mockPrice) * 100;
    return {
      symbol,
      price: mockPrice.toFixed(2),
      change: (mockChange >= 0 ? '+' : '') + mockChange.toFixed(2),
      changePercent: (mockChange >= 0 ? '+' : '') + mockChangePercent.toFixed(2) + '%',
      positive: mockChange >= 0
    };
  });

  const [tickers, setTickers] = useState(generateMockData());

  useEffect(() => {
    const fetchTickerData = async () => {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION && Array.isArray(data) && data.length > 0) {
            setTickers(data);
            return;
          }
        } catch (e) {
          console.error("Error parsing cache", e);
        }
      }

      try {
        // Process symbols in chunks to avoid overwhelming the browser/server
        const chunkSize = 5;
        const results = [];

        for (let i = 0; i < UNIQUE_SYMBOLS.length; i += chunkSize) {
          const chunk = UNIQUE_SYMBOLS.slice(i, i + chunkSize);
          const chunkPromises = chunk.map(async (symbol) => {
            try {
              const response = await apiFetch(`/api/marketData/stockData?symbol=${symbol}`);

              if (!response.ok) throw new Error('Fetch failed');

              const data = await response.json();

              // API returns:
              // {
              //   "symbol": "MSFT",
              //   "price": 472.12,
              //   "change": -6.31,
              //   "changePercentage": -1.3189,
              //   ...
              // }

              const price = data.price;
              const change = data.change;
              const changePercent = data.changePercentage;

              // Determine if positive based on changePercentage (or change)
              const isPositive = changePercent >= 0;

              return {
                symbol,
                price: price.toFixed(2),
                change: (change >= 0 ? '+' : '') + change.toFixed(2),
                changePercent: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%',
                positive: isPositive
              };
            } catch {
              // If fetch fails, return a new mock value for this symbol
              const mockPrice = Math.random() * 200 + 50;
              const mockChange = Math.random() * 10 - 5;
              const mockChangePercent = (mockChange / mockPrice) * 100;
              return {
                symbol,
                price: mockPrice.toFixed(2),
                change: (mockChange >= 0 ? '+' : '') + mockChange.toFixed(2),
                changePercent: (mockChange >= 0 ? '+' : '') + mockChangePercent.toFixed(2) + '%',
                positive: mockChange >= 0
              };
            }
          });

          const chunkResults = await Promise.all(chunkPromises);
          results.push(...chunkResults.filter(r => r !== null));

          // Small delay between chunks
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (results.length > 0) {
          setTickers(results);
          // Save to cache
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: results
          }));
        }

      } catch (error) {
        console.error("Error fetching ticker data:", error);
        // We already have mock data, so no need to do anything else
      }
    };

    fetchTickerData();
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden py-2 relative z-40">
      <div className="flex whitespace-nowrap">
        <motion.div
          // Move by 1/3 of the width (since we have 3 sets of data)
          animate={{ x: ['0%', '-33.33%'] }}
          transition={{
            repeat: Infinity,
            duration: Math.max(60, tickers.length * 5), // Slower animation
            ease: "linear"
          }}
          className="flex items-center gap-8 px-4"
        >
          {/* Render 3 copies for seamless looping */}
          {[...tickers, ...tickers, ...tickers].map((ticker, index) => (
            <div key={`${ticker.symbol}-${index}`} className="flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-900 dark:text-white">{ticker.symbol}</span>
              <span className="text-slate-600 dark:text-slate-400">{ticker.price}</span>
              <span className={ticker.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {ticker.change} ({ticker.changePercent})
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
