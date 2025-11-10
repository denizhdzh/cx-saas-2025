import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';

const COLORS = {
  light: '#f973164a', // violet-500 with opacity
  dark: '#f973164a'   // violet-400 with opacity
};

export default function CategoryDonutChart({ data = [] }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark') || mediaQuery.matches);

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listen for system theme changes
    mediaQuery.addEventListener('change', checkDark);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDark);
    };
  }, []);

  const total = data?.reduce((sum, item) => sum + (item.value || item.count || 0), 0) || 0;

  const chartData = data?.map((item, index) => ({
    category: (item.name || item.category || 'Unknown').replace(/_/g, ' '),
    count: item.value || item.count || 0,
    percentage: total > 0 ? (((item.value || item.count || 0) / total) * 100).toFixed(1) : 0,
    fill: isDark ? COLORS.dark : COLORS.light
  })) || [];

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
          <p className="text-xs mt-1" style={{ color: isDark ? COLORS.dark : COLORS.light }}>
            {data.count} conversations ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 dark:text-stone-500 text-sm">Not enough data yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs mt-1">Start getting conversations to see insights</div>
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
          fill: ${isDark ? 'rgba(255, 119, 0, 0.8)' : 'rgba(255, 119, 0, 0.8)'} !important;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%" key={isDark ? 'dark' : 'light'}>
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
