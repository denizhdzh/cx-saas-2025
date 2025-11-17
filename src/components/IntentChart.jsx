import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';

const INTENT_CONFIG = {
  question: { label: 'Question', icon: '🤔' },
  complaint: { label: 'Complaint', icon: '😠' },
  browsing: { label: 'Browsing', icon: '👀' },
  purchase: { label: 'Purchase', icon: '🛒' },
  greeting: { label: 'Greeting', icon: '👋' }
};

const COLORS = {
  light: '#22c55e4a', // violet-500
  dark: '#22c55e4a'   // violet-400
};

export default function IntentChart({ data = [] }) {
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

  // Process intent data
  const processedData = {
    question: 0,
    complaint: 0,
    browsing: 0,
    purchase: 0,
    greeting: 0
  };

  if (data && data.length > 0) {
    data.forEach(item => {
      const intent = item.intent || item.name;
      const count = item.count || item.value || 0;

      if (processedData.hasOwnProperty(intent)) {
        processedData[intent] += count;
      }
    });
  }

  const chartData = Object.entries(INTENT_CONFIG).map(([key, config]) => ({
    intent: key,
    label: config.label,
    icon: config.icon,
    count: processedData[key] || 0,
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
                {item.label}
              </p>
              <p className="text-xs" style={{ color: '#22c55e' }}>
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
          <div className="text-neutral-400 dark:text-neutral-500 text-sm">No intent data yet</div>
          <div className="text-neutral-300 dark:text-neutral-600 text-xs mt-1">Intent tracking will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <style>{`
        .intent-bar {
          transition: opacity 0.2s ease;
        }
        .intent-bar:hover {
          opacity: 0.7;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
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
                className="intent-bar"
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
