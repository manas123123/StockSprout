import { useState, useEffect, useCallback } from 'react';
import StockChart from '../components/StockChart';

const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY;

function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!API_KEY) {
      setError('API key missing in .env');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&start_date=2024-01-01&apikey=${API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch data');
      }

      const res = await response.json();

      if (res.status === 'error') throw new Error(res.message);

      if (!res.values || res.values.length === 0) {
        throw new Error('No data returned');
      }

      const formatted = res.values
        .slice(-252)
        .reverse()
        .map((c) => ({
          date: c.datetime.split(' ')[0],
          close: parseFloat(c.close),
        }))
        .filter((d) => d.close > 0);

      setData(formatted);
    } catch (err) {
      setError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData(); // Load once

    // Auto-refresh every 5 minutes (300,000 ms)
    const interval = setInterval(fetchData, 300000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="p-8 bg-gray-900 text-gray-200 min-h-screen font-sans">
      <h1 className="text-center text-blue-400 text-3xl mb-4">
        Historical Stock Chart
      </h1>

      <div className="text-center mb-6">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol (e.g., AAPL)"
          className="p-2 w-32 bg-gray-800 text-white border border-gray-600 rounded-md mr-2"
        />
        <span className="text-gray-400 text-sm">
          Auto-updates every 5 min (safe for limits)
        </span>
      </div>

      <StockChart data={data} loading={loading} error={error} />

      <p className="text-center text-gray-500 text-xs mt-4">
        {data.length} data points • 1 call/5 min • Under 8/min limit
      </p>
    </div>
  );
}

export default App;
