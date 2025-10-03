import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export default function CategoryDonutChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = data?.reduce((sum, item) => sum + item.count, 0) || 0;
  
  const chartData = data?.map((item, index) => ({
    name: item.category,
    value: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
    color: COLORS[index % COLORS.length]
  })) || [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-orange-200 rounded-lg shadow-xl p-3">
          <p className="text-sm font-semibold text-orange-900 capitalize">
            {data.name.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {data.value} conversations ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

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
    <div className="h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={45}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{
                  filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                  transition: 'filter 0.2s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{total}</div>
          <div className="text-xs text-orange-500 font-medium">Total</div>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 right-2">
        <div className="flex flex-wrap justify-center gap-1">
          {chartData.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-orange-800 font-medium capitalize">
                {item.name.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}