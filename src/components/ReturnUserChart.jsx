import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  light: '#f97316', // violet-500
  dark: '#f97316'   // violet-400
};

export default function ReturnUserChart({ data = [] }) {
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

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  // Create gradient colors based on violet
  const chartData = data.map((item, index) => {
    const opacity = 0.4 + (index * 0.3); // Gradual opacity increase
    const rgb = isDark ? '249, 115, 22' : '249, 115, 22'; // violet colors
    return {
      ...item,
      fill: `rgba(${rgb}, ${opacity})`
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div
          className="backdrop-blur-sm rounded-lg shadow-xl p-3"
          style={{
            backgroundColor: isDark ? '#1c1917' : '#f5f5f4',
            border: `1px solid ${isDark ? '#44403c' : '#e7e5e4'}`
          }}
        >
          <p className="text-sm font-semibold" style={{ color: isDark ? '#fafaf9' : '#1c1917' }}>
            {data.name}
          </p>
          <p className="text-xs mt-1" style={{ color: isDark ? COLORS.dark : COLORS.light }}>
            {data.value} users ({percentage}%)
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
          <div className="text-stone-400 dark:text-stone-500 text-sm">Not enough data yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs mt-1">Start getting conversations to see insights</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="85%" key={isDark ? 'dark' : 'light'}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            cornerRadius="50%"
            paddingAngle={5}
            outerRadius={90}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                stroke={isDark ? '#292524' : '#fafaf9'}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-2">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
