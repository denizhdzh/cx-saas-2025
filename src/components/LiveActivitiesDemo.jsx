import { useState, useEffect } from 'react';

export default function LiveActivitiesDemo() {
  const [currentActivity, setCurrentActivity] = useState(0);
  
  const activities = [
    {
      icon: '💬',
      title: 'New Message',
      subtitle: 'Customer support',
      content: '"Thanks for the quick help with my billing question! Your AI agent was incredibly helpful."',
      metric: 'SATISFACTION',
      value: '★★★★★',
      progress: 100,
      color: 'blue'
    },
    {
      icon: '📊',
      title: 'Usage Alert',
      subtitle: 'API limits',
      content: 'You\'re approaching 80% of your monthly API quota. Consider upgrading to avoid interruptions.',
      metric: 'USAGE',
      value: '8.2K/10K',
      progress: 82,
      color: 'orange'
    },
    {
      icon: '🚀',
      title: 'Deployment',
      subtitle: 'Production',
      content: 'Your latest model update has been successfully deployed. Performance improved by 15%.',
      metric: 'UPTIME',
      value: '99.98%',
      progress: 99,
      color: 'green'
    },
    {
      icon: '⚡',
      title: 'Performance',
      subtitle: 'Response time',
      content: 'Average response time decreased to 120ms. Your users are experiencing faster interactions.',
      metric: 'SPEED',
      value: '120ms',
      progress: 90,
      color: 'purple'
    },
    {
      icon: '🎯',
      title: 'Goal Achieved',
      subtitle: 'Monthly target',
      content: 'Congratulations! You\'ve reached 95% customer satisfaction this month. Keep up the great work!',
      metric: 'TARGET',
      value: '95%',
      progress: 95,
      color: 'emerald'
    }
  ];

  const colorClasses = {
    blue: {
      accent: 'bg-blue-500',
      text: 'text-blue-400',
      textSecondary: 'text-blue-300',
      progress: 'bg-blue-500'
    },
    orange: {
      accent: 'bg-orange-500',
      text: 'text-orange-400',
      textSecondary: 'text-orange-300',
      progress: 'bg-orange-500'
    },
    green: {
      accent: 'bg-green-500',
      text: 'text-green-400',
      textSecondary: 'text-green-300',
      progress: 'bg-green-500'
    },
    purple: {
      accent: 'bg-purple-500',
      text: 'text-purple-400',
      textSecondary: 'text-purple-300',
      progress: 'bg-purple-500'
    },
    emerald: {
      accent: 'bg-emerald-500',
      text: 'text-emerald-400',
      textSecondary: 'text-emerald-300',
      progress: 'bg-emerald-500'
    }
  };

  const current = activities[currentActivity];
  const colors = colorClasses[current.color];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentActivity(prev => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-3 w-full max-w-sm transition-all duration-700 ease-out" style={{boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'}}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
        </div>
        <div className="flex-1">
          <div className="text-white text-xs font-medium transition-all duration-300">{current.title}</div>
          <div className="text-neutral-400 text-xs transition-all duration-300">{current.subtitle}</div>
        </div>
        <div className={`w-1.5 h-1.5 ${colors.accent} rounded-full animate-pulse`}></div>
      </div>
      <div className="text-neutral-300 text-xs leading-relaxed mb-3 transition-all duration-500">
        {current.content}
      </div>
      <div className="rounded-xl p-2">
        <div className="flex items-center justify-between">
          <div className={`${colors.text} text-xs font-medium transition-all duration-300`}>{current.metric}</div>
          <div className={`${colors.textSecondary} text-xs font-mono transition-all duration-300`}>{current.value}</div>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-1 mt-2">
          <div 
            className={`${colors.progress} h-1 rounded-full transition-all duration-1000 ease-out`} 
            style={{width: `${current.progress}%`}}
          ></div>
        </div>
      </div>
    </div>
  );
}