import React from 'react';
import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TicketChart({
  chartData,
  showOpened = true,
  showResolved = true,
  timeRange = 'daily'
}) {
  // Transform chartData object to array format for Recharts
  const data = Object.keys(chartData).sort().map(date => ({
    date,
    resolved: chartData[date]?.resolved || 0,
    unresolved: (chartData[date]?.analyzed || 0) - (chartData[date]?.resolved || 0)
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
        resolved: 0,
        unresolved: 0
      });
    }
    return (
      <div className="h-full focus:outline-none">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <ComposedChart
            data={emptyData}
            margin={{
              left: -20,
              right: 10,
              top: 5,
              bottom: 5,
            }}
            className="text-stone-500 [&_.recharts-text]:text-xs focus:outline-none [&>*]:focus:outline-none"
          >
            <CartesianGrid vertical={false} stroke="currentColor" className="text-stone-200" />
            
            <XAxis
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              dataKey="date"
              angle={timeRange === 'weekly' || timeRange === 'quarterly' ? -45 : 0}
              textAnchor={timeRange === 'weekly' || timeRange === 'quarterly' ? 'end' : 'middle'}
              height={timeRange === 'weekly' || timeRange === 'quarterly' ? 80 : 60}
              tickFormatter={(value) => {
                if (timeRange === 'hourly') {
                  // Show hour only (e.g., "14:00")
                  return value.split(' ')[1] || value;
                } else if (timeRange === 'daily') {
                  // Show day (e.g., "Jan 1")
                  const date = new Date(value);
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else if (timeRange === 'weekly') {
                  // Show date (e.g., "Jan 1")
                  const date = new Date(value);
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else if (timeRange === 'quarterly') {
                  // Show "Week of Jan 1"
                  return value.replace('Week of ', '');
                } else if (timeRange === 'alltime') {
                  // Show month-year (e.g., "Jan 2025")
                  const [year, month] = value.split('-');
                  const date = new Date(year, parseInt(month) - 1);
                  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                }
                return value;
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => Number(value).toLocaleString()}
            />

            <Tooltip
              formatter={(value, name) => {
                const label = name === 'resolved' ? 'Resolved' : 'Unresolved';
                return [Number(value).toLocaleString(), label];
              }}
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

            <Bar
              dataKey="resolved"
              name="Resolved"
              fill="#22c55e"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="unresolved"
              name="Unresolved"
              fill="#ef4444"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
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
            left: -20,
            right: 10,
            top: 5,
            bottom: 5,
          }}
          className="text-stone-500 [&_.recharts-text]:text-xs focus:outline-none [&>*]:focus:outline-none"
        >
          <CartesianGrid vertical={false} stroke="currentColor" className="text-stone-200 dark:text-stone-800" />
          
          <XAxis
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            dataKey="date"
            angle={timeRange === 'weekly' || timeRange === 'quarterly' ? -45 : 0}
            textAnchor={timeRange === 'weekly' || timeRange === 'quarterly' ? 'end' : 'middle'}
            height={timeRange === 'weekly' || timeRange === 'quarterly' ? 80 : 60}
            tickFormatter={(value) => {
              if (timeRange === 'hourly') {
                // Show hour only (e.g., "14:00")
                return value.split(' ')[1] || value;
              } else if (timeRange === 'daily') {
                // Show day (e.g., "Jan 1")
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (timeRange === 'weekly') {
                // Show date (e.g., "Jan 1")
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (timeRange === 'quarterly') {
                // Show "Week of Jan 1"
                return value.replace('Week of ', '');
              } else if (timeRange === 'alltime') {
                // Show month-year (e.g., "Jan 2025")
                const [year, month] = value.split('-');
                const date = new Date(year, parseInt(month) - 1);
                return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
              }
              return value;
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => Number(value).toLocaleString()}
          />

          <Tooltip
            formatter={(value, name) => {
              const label = name === 'resolved' ? 'Resolved' : 'Unresolved';
              return [Number(value).toLocaleString(), label];
            }}
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

          <Bar
            dataKey="resolved"
            name="Resolved"
            fill="#22c55e"
            stackId="a"
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="unresolved"
            name="Unresolved"
            fill="#ef4444"
            stackId="a"
            radius={[4, 4, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}