import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';

export default function ReferrerChart({ data = {} }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark') || mediaQuery.matches);

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const chartDataArray = Object.entries(data).map(([source, count]) => ({
    category: source === 'direct' ? 'Direct' : source.charAt(0).toUpperCase() + source.slice(1),
    count: count
  })).filter(item => item.count > 0);

  const total = chartDataArray.reduce((sum, item) => sum + item.count, 0);

  const chartData = chartDataArray.map((item) => ({
    category: item.category,
    count: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
    fill: '#f973161a' // orange-500 with 10% opacity
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="backdrop-blur-sm rounded-lg shadow-xl p-3"
          style={{
            backgroundColor: isDark ? '#1c1917' : '#f5f5f4',
            border: `1px solid ${isDark ? '#44403c' : '#e7e5e4'}`
          }}
        >
          <p className="text-sm font-semibold capitalize" style={{ color: isDark ? '#fafaf9' : '#1c1917' }}>
            {data.category}
          </p>
          <p className="text-xs mt-1" style={{ color: '#f97316' }}>
            {data.count} visitors ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">No referrer data yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs">Data will appear as users arrive</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <style>{`
        .category-bar {
          transition: fill 0.2s ease;
        }
        .category-bar:hover {
          fill: rgba(249, 115, 22, 0.2) !important;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="category" hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="count" radius={10} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                className="category-bar"
                style={{ transition: 'fill 0.2s ease' }}
              />
            ))}
            <LabelList
              dataKey="category"
              position="insideLeft"
              offset={8}
              className="category-label"
              style={{ fill: isDark ? '#ffffff' : '#1c1917', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Count numbers on the right edge */}
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-around py-1">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center h-[40px]">
            <span
              className="text-xs font-semibold"
              style={{ color: isDark ? '#f5f5f4' : '#292524' }}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
