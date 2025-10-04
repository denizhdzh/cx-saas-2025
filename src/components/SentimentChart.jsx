import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';

const SENTIMENT_MAPPING = {
  1: { label: 'Very Angry', icon: '😡', color: 'rgba(249, 115, 22, 0.1)' },
  2: { label: 'Angry', icon: '😠', color: 'rgba(249, 115, 22, 0.1)' },
  3: { label: 'Frustrated', icon: '😤', color: 'rgba(249, 115, 22, 0.1)' },
  4: { label: 'Disappointed', icon: '😞', color: 'rgba(249, 115, 22, 0.1)' },
  5: { label: 'Neutral', icon: '😐', color: 'rgba(249, 115, 22, 0.1)' },
  6: { label: 'Satisfied', icon: '🙂', color: 'rgba(249, 115, 22, 0.1)' },
  7: { label: 'Happy', icon: '😊', color: 'rgba(249, 115, 22, 0.1)' },
  8: { label: 'Very Happy', icon: '😄', color: 'rgba(249, 115, 22, 0.1)' },
  9: { label: 'Excited', icon: '😁', color: 'rgba(249, 115, 22, 0.1)' },
  10: { label: 'Delighted', icon: '🤩', color: 'rgba(249, 115, 22, 0.1)' }
};

export default function SentimentChart({ data }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark') || mediaQuery.matches);

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  console.log('SentimentChart data:', data);

  // Process sentiment data - expecting data with sentiment scores 1-10
  const processedData = {};

  // Only process if we have actual data
  if (data && data.length > 0) {
    data.forEach(item => {
      // Data format: {sentiment: 1-10, count: number}
      const sentimentScore = item.sentiment || item.sentimentScore || item.score;
      const count = item.count || 0;

      if (typeof sentimentScore === 'number' && sentimentScore >= 1 && sentimentScore <= 10) {
        processedData[sentimentScore] = (processedData[sentimentScore] || 0) + count;
      }
    });
  }

  console.log('Processed sentiment data:', processedData);

  // Create chart data for all 10 sentiment levels
  const chartData = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    return {
      score: score,
      label: SENTIMENT_MAPPING[score].label,
      count: processedData[score] || 0,
      icon: SENTIMENT_MAPPING[score].icon,
      color: SENTIMENT_MAPPING[score].color
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
              <p className="text-xs" style={{ color: '#f97316' }}>
                {item.count} {item.count === 1 ? 'conversation' : 'conversations'}
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
          <YAxis type="category" dataKey="score" hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="count" radius={10} barSize={40}>
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
              {item.count > 0 ? item.count : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}