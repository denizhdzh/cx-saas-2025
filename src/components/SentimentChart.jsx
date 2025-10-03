import React from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#f59e0b',
  confused: '#8b5cf6',
  frustrated: '#f97316'
};

const SENTIMENT_ICONS = {
  positive: '😊',
  negative: '😞', 
  neutral: '😐',
  confused: '😕',
  frustrated: '😤'
};

export default function SentimentChart({ data }) {
  const chartData = data?.map((item) => ({
    sentiment: item.sentiment,
    count: item.count,
    color: SENTIMENT_COLORS[item.sentiment] || SENTIMENT_COLORS.neutral,
    icon: SENTIMENT_ICONS[item.sentiment] || '😐'
  })) || [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-orange-200 rounded-lg shadow-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800 capitalize">
                {data.sentiment}
              </p>
              <p className="text-xs text-gray-600">
                {data.count} conversations
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-orange-400 text-sm">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-3/4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              stroke="#fff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="h-1/4 flex items-center justify-center">
        <div className="flex flex-wrap gap-3 justify-center">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-xs border border-gray-200">
              <span className="text-sm">{item.icon}</span>
              <span className="font-medium text-gray-700 capitalize">
                {item.sentiment}
              </span>
              <span className="font-bold text-gray-800">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}