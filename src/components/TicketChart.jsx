import React, { useState, useEffect } from 'react';
import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = {
  analyzed: {
    light: '#f43f5e',     // rose-500 (full opacity)
    dark: '#fb7185',      // rose-400 (full opacity)
    lightBg: '#f43f5e80', // rose-500 with 50% opacity for bars
    darkBg: '#fb718580'   // rose-400 with 50% opacity for bars
  },
  nonAnalyzed: {
    light: '#f97316',     // violet-500 (full opacity)
    dark: '#f97316',      // violet-400 (full opacity)
    lightBg: '#f9731680', // violet-500 with 50% opacity for bars
    darkBg: '#f9731680'   // violet-400 with 50% opacity for bars
  }
};

export default function TicketChart({
  chartData,
  showOpened = true,
  showResolved = true,
  timeRange = 'daily'
}) {
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
  // Transform chartData object to array format for Recharts
  const data = Object.keys(chartData).sort().map(date => ({
    date,
    analyzed: chartData[date]?.analyzed || 0,
    nonAnalyzed: (chartData[date]?.total || 0) - (chartData[date]?.analyzed || 0)
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
        analyzed: 0,
        nonAnalyzed: 0
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
                  const date = new Date(value + 'T00:00:00');
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else if (timeRange === 'weekly') {
                  // Show date (e.g., "Jan 1")
                  const date = new Date(value + 'T00:00:00');
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else if (timeRange === 'quarterly') {
                  // Show "Week of Jan 1"
                  const date = new Date(value + 'T00:00:00');
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } else if (timeRange === 'alltime') {
                  // Show month-year (e.g., "Jan 2025")
                  const [year, month] = value.split('-');
                  const date = new Date(year, parseInt(month) - 1, 1);
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
              contentStyle={{
                backgroundColor: isDark ? '#1c1917' : '#f5f5f4',
                border: `1px solid ${isDark ? '#44403c' : '#e7e5e4'}`,
                borderRadius: '8px',
                color: isDark ? '#fafaf9' : '#1c1917',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              itemStyle={{
                color: isDark ? '#fafaf9' : '#1c1917',
                fontWeight: '500'
              }}
              formatter={(value, name, props) => {
                const label = name === 'analyzed' ? 'Analyzed' : 'Non-Analyzed';
                // Use full opacity colors for the dot indicator
                const color = name === 'analyzed'
                  ? (isDark ? COLORS.analyzed.dark : COLORS.analyzed.light)
                  : (isDark ? COLORS.nonAnalyzed.dark : COLORS.nonAnalyzed.light);
                return [
                  <span style={{ color, fontWeight: '600' }}>{Number(value).toLocaleString()}</span>,
                  label
                ];
              }}
              labelFormatter={(value) => {
                if (timeRange === 'hourly') {
                  return value;
                } else if (timeRange === 'alltime') {
                  const [year, month] = value.split('-');
                  const date = new Date(year, parseInt(month) - 1, 1);
                  return date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long'
                  });
                } else {
                  const date = new Date(value + 'T00:00:00');
                  return date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }
              }}
            />

            <Bar
              dataKey="analyzed"
              name="Analyzed"
              fill={isDark ? COLORS.analyzed.darkBg : COLORS.analyzed.lightBg}
              stackId="a"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="nonAnalyzed"
              name="Non-Analyzed"
              fill={isDark ? COLORS.nonAnalyzed.darkBg : COLORS.nonAnalyzed.lightBg}
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
                const date = new Date(value + 'T00:00:00');
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (timeRange === 'weekly') {
                // Show date (e.g., "Jan 1")
                const date = new Date(value + 'T00:00:00');
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (timeRange === 'quarterly') {
                // Show "Week of Jan 1"
                const date = new Date(value + 'T00:00:00');
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (timeRange === 'alltime') {
                // Show month-year (e.g., "Jan 2025")
                const [year, month] = value.split('-');
                const date = new Date(year, parseInt(month) - 1, 1);
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
            contentStyle={{
              backgroundColor: isDark ? '#1c1917' : '#f5f5f4',
              border: `1px solid ${isDark ? '#44403c' : '#e7e5e4'}`,
              borderRadius: '8px',
              color: isDark ? '#fafaf9' : '#1c1917',
              fontSize: '12px',
              padding: '8px 12px'
            }}
            itemStyle={{
              color: isDark ? '#fafaf9' : '#1c1917',
              fontWeight: '500'
            }}
            formatter={(value, name, props) => {
              const label = name === 'Analyzed' ? 'Analyzed' : 'Non-Analyzed';
              // Use full opacity colors for the dot indicator
              const color = name === 'Analyzed'
                ? (isDark ? COLORS.analyzed.dark : COLORS.analyzed.light)
                : (isDark ? COLORS.nonAnalyzed.dark : COLORS.nonAnalyzed.light);
              return [
                <span style={{ color, fontWeight: '600' }}>{Number(value).toLocaleString()}</span>,
                label
              ];
            }}
            labelFormatter={(value) => {
              if (timeRange === 'hourly') {
                return value;
              } else if (timeRange === 'alltime') {
                const [year, month] = value.split('-');
                const date = new Date(year, parseInt(month) - 1, 1);
                return date.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long'
                });
              } else {
                const date = new Date(value + 'T00:00:00');
                return date.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }
            }}
          />

          <Bar
            dataKey="analyzed"
            name="Analyzed"
            fill={isDark ? COLORS.analyzed.darkBg : COLORS.analyzed.lightBg}
            stackId="a"
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="nonAnalyzed"
            name="Non-Analyzed"
            fill={isDark ? COLORS.nonAnalyzed.darkBg : COLORS.nonAnalyzed.lightBg}
            stackId="a"
            radius={[4, 4, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}