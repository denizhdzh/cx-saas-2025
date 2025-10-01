import React from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TicketChart({ 
  chartData, 
  showOpened = true, 
  showResolved = true, 
  timeRange = 'daily'
}) {
  // Transform chartData object to array format for Recharts
  const data = Object.keys(chartData).sort().map(date => ({
    date,
    opened: chartData[date]?.opened || 0,
    resolved: chartData[date]?.resolved || 0
  }));

  // If no data, create empty array
  if (data.length === 0) {
    const today = new Date();
    const emptyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      emptyData.push({
        date: date.toISOString().split('T')[0],
        opened: 0,
        resolved: 0
      });
    }
    return (
      <div className="h-full focus:outline-none">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <ComposedChart
            data={emptyData}
            margin={{
              left: 4,
              right: 20,
              top: 12,
              bottom: 18,
            }}
            className="text-stone-500 [&_.recharts-text]:text-xs focus:outline-none [&>*]:focus:outline-none"
          >
            <CartesianGrid vertical={false} stroke="currentColor" className="text-stone-200" />
            
            <XAxis
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                if (timeRange === 'daily') {
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else if (timeRange === 'weekly') {
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else {
                  return date.toLocaleDateString(undefined, { month: 'short' });
                }
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => Number(value).toLocaleString()}
            />

            <Tooltip
              formatter={(value, name) => [Number(value).toLocaleString(), name === 'opened' ? 'Tickets Opened' : 'Tickets Resolved']}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />

            {showOpened && (
              <Bar
                dataKey="opened"
                name="Tickets Opened"
                fill="#f97316"
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
              />
            )}
            
            {showResolved && (
              <Line
                dataKey="resolved"
                name="Tickets Resolved"
                type="monotone"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-full focus:outline-none">
      <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
        <ComposedChart
          data={data}
          margin={{
            left: 4,
            right: 20,
            top: 12,
            bottom: 18,
          }}
          className="text-stone-500 [&_.recharts-text]:text-xs focus:outline-none [&>*]:focus:outline-none"
        >
          <CartesianGrid vertical={false} stroke="currentColor" className="text-stone-200" />
          
          <XAxis
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              if (timeRange === 'daily') {
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (timeRange === 'weekly') {
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else {
                return date.toLocaleDateString(undefined, { month: 'short' });
              }
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => Number(value).toLocaleString()}
          />

          <Tooltip
            formatter={(value, name) => [Number(value).toLocaleString(), name === 'opened' ? 'Tickets Opened' : 'Tickets Resolved']}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString(undefined, { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />

          {showOpened && (
            <Bar
              dataKey="opened"
              name="Tickets Opened"
              fill="#f97316"
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
            />
          )}
          
          {showResolved && (
            <Line
              dataKey="resolved"
              name="Tickets Resolved"
              type="monotone"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4, fill: '#f97316' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}