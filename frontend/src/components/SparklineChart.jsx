import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { apiUrl } from '../config/api';

const SparklineChart = ({ symbol, range = '3M', height = 'h-48' }) => {
    const [data, setData] = useState([]);
    const [trend, setTrend] = useState('neutral'); // 'up', 'down', 'neutral'

    useEffect(() => {
        const fetchChartData = async () => {
            const endDate = new Date();
            const startDate = new Date();

            // Calculate start date based on range
            switch (range) {
                case '1W':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '1M':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case '3M':
                    startDate.setMonth(endDate.getMonth() - 3);
                    break;
                case '1Y':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                case 'ALL':
                    startDate.setFullYear(endDate.getFullYear() - 5);
                    break;
                default:
                    startDate.setMonth(endDate.getMonth() - 3);
            }

            const formatDate = (date) => date.toISOString().split('T')[0];

            try {
                const response = await fetch(
                    apiUrl(`/api/marketData/StockPriceHistory?symbol=${symbol}&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`),
                    { credentials: 'include' }
                );

                if (response.ok) {
                    const apiData = await response.json();
                    // Format data for Recharts and reverse to be chronological
                    const formattedData = apiData.map(item => ({
                        price: item.price,
                        date: item.date
                    })).reverse();

                    setData(formattedData);

                    if (formattedData.length > 0) {
                        const startPrice = formattedData[0].price;
                        const endPrice = formattedData[formattedData.length - 1].price;
                        if (endPrice > startPrice) setTrend('up');
                        else if (endPrice < startPrice) setTrend('down');
                        else setTrend('neutral');
                    }
                }
            } catch (error) {
                console.error('Error fetching sparkline data:', error);
                setData([]);
            }
        };

        fetchChartData();
    }, [symbol, range]);

    const getColor = () => {
        if (trend === 'up') return '#10b981'; // Emerald 500
        if (trend === 'down') return '#ef4444'; // Red 500
        return '#64748b'; // Slate 500
    };

    const color = getColor();

    if (data.length === 0) return <div className={`${height} w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse`} />;

    return (
        <div className={`w-full ${height} relative`}>
            <div className="absolute top-0 right-0 z-10 px-2 py-1 rounded-bl-xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-l border-slate-200 dark:border-slate-700">
                {range}
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`colorGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Area
                        type="linear"
                        dataKey="price"
                        stroke={color}
                        fill={`url(#colorGradient-${symbol})`}
                        strokeWidth={2}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SparklineChart;
