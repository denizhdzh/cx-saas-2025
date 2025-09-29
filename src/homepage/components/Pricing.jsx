import React from 'react';

export default function Pricing() {
  const plans = [
    {
      emoji: "🌱",
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Try it out",
      features: [
        "10 message credits / month",
        "1 AI agent",
        "1 MB training data limit",
        "Embed on unlimited sites",
        "No backup or tickets"
      ],
      popular: false,
      note: "Perfect to test and see if you want to upgrade"
    },
    {
      emoji: "⭐",
      name: "Starter", 
      price: "$20",
      originalPrice: "$30",
      period: "/month",
      description: "For small businesses",
      features: [
        "3,000 message credits / month",
        "1 AI agent",
        "10 MB training data",
        "Ticket tracking",
        "Basic analytics (messages, users)",
        "Email support"
      ],
      popular: false
    },
    {
      emoji: "🔥",
      name: "Growth",
      price: "$60",
      originalPrice: "$90",
      period: "/month",
      description: "Most popular",
      features: [
        "15,000 message credits / month",
        "2 AI agents",
        "50 MB training data",
        "Ticket tracking",
        "Advanced analytics & insights",
        "White-label (remove logo & branding)",
        "Priority support"
      ],
      popular: true,
      note: "Best value for money, most users stay here"
    },
    {
      emoji: "🚀",
      name: "Scale",
      price: "$199",
      period: "/month",
      description: "For growing teams",
      features: [
        "60,000 message credits / month",
        "5 AI agents",
        "200 MB training data",
        "Ticket tracking",
        "Advanced dashboard + export (CSV/JSON)",
        "White-label (remove logo & branding)",
        "99.9% uptime SLA guarantee",
        "API control over chatbot behavior"
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="relative py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-2 relative">
        {/* Vertical lines - hidden on mobile */}
        <div className="hidden lg:block absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="hidden lg:block absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-4 sm:mx-6">
          <div className="text-center mb-12 lg:mb-20">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">PRICING</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 lg:mb-8 leading-tight">
              Transparent pricing<br />
              for when we launch
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              Join our waitlist now for early access and special launch pricing.
            </p>
          </div>
          
          {/* Simple pricing table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
              {plans.map((plan, index) => (
                <div key={index} className={`p-6 lg:p-8 flex flex-col h-full ${
                  plan.popular ? 'bg-neutral-900' : ''
                }`}>
                  
                  <div className="mb-4 lg:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{plan.emoji}</span>
                      <h3 className={`text-lg font-thin ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                        {plan.name}
                      </h3>
                    </div>
                    <p className={`text-xs mb-4 ${plan.popular ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {plan.description}
                    </p>
                  </div>
                  
                  <div className="mb-4 lg:mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className={`text-2xl lg:text-3xl font-thin ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm ${plan.popular ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {plan.period}
                      </span>
                    </div>
                    {plan.originalPrice && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm line-through ${plan.popular ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {plan.originalPrice}
                        </span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          SAVE {Math.round((1 - parseInt(plan.price.slice(1)) / parseInt(plan.originalPrice.slice(1))) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4 lg:mb-6 flex-grow">
                    {plan.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start gap-2">
                        <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${plan.popular ? 'bg-neutral-500' : 'bg-neutral-400'}`}></div>
                        <span className={`text-xs ${plan.popular ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.note && (
                    <div className={`mb-4 text-xs italic ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {plan.note}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`w-full py-2 lg:py-2 px-3 text-xs font-medium rounded-lg transition-colors mt-auto cursor-pointer ${
                      plan.popular 
                        ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                        : 'border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                    }`}>
                    Join Waitlist
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12 lg:mt-16">
            <p className="text-neutral-500 text-sm mb-4">
              All plans require no credit card • Cancel anytime
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-xs text-neutral-400">
              <span>✓ 99.9% uptime</span>
              <span>✓ GDPR compliant</span>
              <span>✓ 24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}