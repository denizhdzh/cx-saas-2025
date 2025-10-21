import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';

const SENTIMENT_MAPPING = {
  1: { label: 'Very Angry', icon: '😡' },
  2: { label: 'Angry', icon: '😠' },
  3: { label: 'Frustrated', icon: '😤' },
  4: { label: 'Disappointed', icon: '😞' },
  5: { label: 'Neutral', icon: '😐' },
  6: { label: 'Satisfied', icon: '🙂' },
  7: { label: 'Happy', icon: '😊' },
  8: { label: 'Very Happy', icon: '😄' },
  9: { label: 'Excited', icon: '😁' },
  10: { label: 'Delighted', icon: '🤩' }
};

const COLORS = {
  light: '#8b5cf64a', // violet-500 with opacity
  dark: '#a78bfa4a'   // violet-400 with opacity
};

export default function SentimentChart({ data = [] }) {
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

  // Process sentiment data from messages
  // Initialize with zeros for all sentiment levels
  const processedData = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0
  };

  // Only process if we have actual data
  if (data && data.length > 0) {
    data.forEach(item => {
      // Extract sentiment score and count from aggregated data
      const score = item.score || item.sentiment || item.sentimentScore;
      const count = item.count || item.value || 0;

      if (typeof score === 'number' && score >= 1 && score <= 10) {
        processedData[score] = (processedData[score] || 0) + count;
      }
    });
  }

  // Create chart data for all 10 sentiment levels
  const chartData = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    return {
      score: score,
      label: SENTIMENT_MAPPING[score].label,
      count: processedData[score] || 0,
      icon: SENTIMENT_MAPPING[score].icon,
      color: isDark ? COLORS.dark : COLORS.light
    };
  });

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
                Score {item.score}/10
              </p>
              <p className="text-xs" style={{ color: isDark ? COLORS.dark : COLORS.light }}>
                {item.count} {item.count === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full relative">
      <style>{`
        .sentiment-bar {
          transition: fill 0.2s ease;
        }
        .sentiment-bar:hover {
          fill: ${isDark ? 'rgba(167, 139, 250, 0.6)' : 'rgba(139, 92, 246, 0.6)'} !important;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%" key={isDark ? 'dark' : 'light'}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="score" hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="count" radius={10} barSize={40} key={isDark ? 'dark' : 'light'}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="sentiment-bar"
                style={{ transition: 'fill 0.2s ease' }}
              />
            ))}
            <LabelList
              dataKey="label"
              position="insideLeft"
              offset={8}
              className="sentiment-label"
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