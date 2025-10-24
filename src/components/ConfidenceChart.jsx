import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';

const CONFIDENCE_RANGES = {
  '0-20': { label: 'Very Low', icon: '😰' },
  '21-40': { label: 'Low', icon: '😟' },
  '41-60': { label: 'Medium', icon: '😐' },
  '61-80': { label: 'High', icon: '😊' },
  '81-100': { label: 'Very High', icon: '🤩' }
};

const COLORS = {
  light: '#f973164a', // violet-500 with opacity
  dark: '#f973164a'   // violet-400 with opacity
};

export default function ConfidenceChart({ data = [], avgConfidence = 0 }) {
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

  // Process confidence data into ranges
  const processedData = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  if (data && data.length > 0) {
    data.forEach(item => {
      const range = item.range;
      const count = item.count || item.value || 0;

      if (processedData.hasOwnProperty(range)) {
        processedData[range] = count;
      }
    });
  }

  const chartData = Object.entries(CONFIDENCE_RANGES).map(([range, config]) => ({
    range,
    label: config.label,
    icon: config.icon,
    count: processedData[range],
    color: isDark ? COLORS.dark : COLORS.light
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          className="backdrop-blur-sm rounded-lg shadow-xl p-3"
          style={{
            backgroundColor: isDark ? '#1c1917' : '#f5f5f4',
            border: `1px solid ${isDark ? '#44403c' : '#e7e5e4'}`
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: isDark ? '#fafaf9' : '#1c1917' }}>
                {item.label} ({item.range}%)
              </p>
              <p className="text-xs" style={{ color: item.color }}>
                {item.count} {item.count === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.every(item => item.count === 0)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 dark:text-stone-500 text-sm">No confidence data yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs mt-1">AI confidence tracking will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">

      <style>{`
        .confidence-bar {
          transition: opacity 0.2s ease;
        }
        .confidence-bar:hover {
          opacity: 0.7;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%" key={isDark ? 'dark' : 'light'}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="count" radius={10} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="confidence-bar"
              />
            ))}
            <LabelList
              dataKey="label"
              position="insideLeft"
              offset={8}
              style={{ fill: isDark ? '#ffffff' : '#1c1917', fontSize: 12, fontWeight: 600 }}
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
