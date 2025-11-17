import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

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
      icon: SENTIMENT_MAPPING[score].icon
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          className="backdrop-blur-sm rounded-lg shadow-xl p-3 border"
          style={{
            backgroundColor: isDark ? 'rgba(28, 25, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: '#22c55e'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                {item.label}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {item.count} {item.count === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Dot with Emoji
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.count === 0) return null;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#22c55e"
          stroke={isDark ? '#1c1917' : '#ffffff'}
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize={14}
        >
          {payload.icon}
        </text>
      </g>
    );
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ left: 10, right: 10, top: 40, bottom: 10 }}
        >
          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#44403c' : '#e7e5e4'}
            vertical={false}
          />
          <XAxis
            dataKey="score"
            stroke={isDark ? '#78716c' : '#a8a29e'}
            tick={{ fill: isDark ? '#a8a29e' : '#78716c', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? '#78716c' : '#a8a29e'}
            tick={{ fill: isDark ? '#a8a29e' : '#78716c', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#22c55e', strokeWidth: 2 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#22c55e"
            strokeWidth={3}
            fill="url(#sentimentGradient)"
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 3 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}