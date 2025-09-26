import { useState, useEffect } from 'react';

export default function ToastOffer() {
  const [colorScheme, setColorScheme] = useState(0);
  
  const schemes = [
    {
      bg: 'bg-neutral-900',
      border: 'border-neutral-700',
      accent: 'bg-orange-500',
      accentText: 'text-orange-400',
      text: 'text-white',
      subtext: 'text-neutral-300',
      logoIcon: 'bg-neutral-800',
      progressBg: 'bg-neutral-800',
      progressBar: 'bg-orange-500'
    },
    {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      accent: 'bg-blue-500',
      accentText: 'text-blue-600',
      text: 'text-blue-900',
      subtext: 'text-blue-700',
      logoIcon: 'bg-blue-100',
      progressBg: 'bg-blue-200',
      progressBar: 'bg-blue-500'
    },
    {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      accent: 'bg-purple-500',
      accentText: 'text-purple-600',
      text: 'text-purple-900',
      subtext: 'text-purple-700',
      logoIcon: 'bg-purple-100',
      progressBg: 'bg-purple-200',
      progressBar: 'bg-purple-500'
    }
  ];

  const currentScheme = schemes[colorScheme];

  useEffect(() => {
    const timer = setInterval(() => {
      setColorScheme(prev => (prev + 1) % schemes.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className={`${currentScheme.bg} ${currentScheme.border} border rounded-3xl w-full mx-auto overflow-hidden transition-all duration-1000 ease-out relative`} 
      style={{
        aspectRatio: '4/3',
        maxWidth: '320px',
        boxShadow: colorScheme === 0 
          ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          : colorScheme === 1
          ? '0 20px 40px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.1)'
          : '0 20px 40px rgba(147, 51, 234, 0.2), 0 0 0 1px rgba(147, 51, 234, 0.1)'
      }}
    >
      {/* Dynamic Island style background blur */}
      <div className="absolute inset-0 backdrop-blur-xl"></div>
      
      <div className="relative z-10 p-5 h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 ${currentScheme.logoIcon} rounded-full flex items-center justify-center flex-shrink-0`}>
              <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            <div>
              <div className={`${currentScheme.text} text-xs font-semibold`}>Special Offer</div>
              <div className={`${currentScheme.subtext} text-xs opacity-70`}>Limited time</div>
            </div>
          </div>
          <div className={`w-2 h-2 ${currentScheme.accent} rounded-full animate-pulse`}></div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className={`${currentScheme.subtext} text-xs leading-relaxed mb-4 opacity-80`}>
            Get 20% off your first month of Orchis AI! Perfect time to upgrade your customer support.
          </div>
          
          {/* Offer Display */}
          <div className={`rounded-2xl p-4 mb-4`} style={{
            background: colorScheme === 0 
              ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)'
              : colorScheme === 1
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(126, 34, 206, 0.15) 100%)',
            border: `1px solid ${colorScheme === 0 ? 'rgba(234, 88, 12, 0.2)' : colorScheme === 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(147, 51, 234, 0.2)'}`
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${currentScheme.accentText} text-lg font-bold`}>20% OFF</div>
              <div className={`${currentScheme.subtext} text-sm font-mono`}>29:45</div>
            </div>
            
            {/* Progress bar with glow effect */}
            <div className={`w-full ${currentScheme.progressBg} rounded-full h-1.5 relative overflow-hidden`}>
              <div 
                className={`${currentScheme.progressBar} h-1.5 rounded-full w-3/4 transition-all duration-1000 relative`}
                style={{
                  boxShadow: colorScheme === 0 
                    ? '0 0 8px rgba(234, 88, 12, 0.6)'
                    : colorScheme === 1
                    ? '0 0 8px rgba(59, 130, 246, 0.6)'
                    : '0 0 8px rgba(147, 51, 234, 0.6)'
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Input */}
        <div className={`${currentScheme.logoIcon} rounded-2xl p-3 flex items-center gap-3 backdrop-blur-sm`} style={{
          border: `1px solid ${colorScheme === 0 ? 'rgba(255, 255, 255, 0.1)' : colorScheme === 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(147, 51, 234, 0.2)'}`
        }}>
          <div className={`w-5 h-5 ${currentScheme.accent} rounded-full flex items-center justify-center flex-shrink-0`}>
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <span className={`${currentScheme.subtext} text-xs flex-1 opacity-70`}>Ask anything about Orchis...</span>
        </div>
      </div>
    </div>
  );
}