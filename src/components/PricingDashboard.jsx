import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Tick01Icon,
  CreditCardIcon,
  ArrowLeft01Icon
} from '@hugeicons/core-free-icons';

export default function PricingDashboard() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [usedEvents, setUsedEvents] = useState(2);
  const [planLimit, setPlanLimit] = useState(10000);
  
  const plans = [
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

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-12">
        <button className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors mb-6">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="text-xs text-neutral-400 mb-2 tracking-wider">BILLING</div>
        <h1 className="text-3xl font-thin text-neutral-900">Billing & Usage</h1>
        <div className="w-12 h-px bg-neutral-900 mt-4"></div>
      </div>

      {/* Usage Section */}
      <div className="mb-16">
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">Current Usage</h3>
              <p className="text-sm text-neutral-600">Track your monthly events</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-thin text-neutral-900">{usedEvents}</div>
              <div className="text-xs text-neutral-500">of {formatNumber(planLimit)} events</div>
            </div>
          </div>
          
          <div className="w-full bg-neutral-100 rounded-full h-2">
            <div 
              className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((usedEvents / planLimit) * 100, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-neutral-500 mt-2">
            <span>0</span>
            <span>{formatNumber(planLimit)}+</span>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="mb-12">
        <div className="text-center">
          <p className="text-neutral-600">
            You're currently on the <span className="font-medium text-neutral-900">Free Plan</span>
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div key={index} className={`relative ${
            plan.popular ? 'transform scale-105' : ''
          }`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-neutral-900 text-white px-4 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              </div>
            )}
            
            <div className={`bg-white rounded-2xl border-2 p-8 h-full ${
              plan.popular ? 'border-neutral-900' : 'border-neutral-200'
            }`}>
              <div className="text-center mb-8">
                <div className="text-2xl mb-3">{plan.emoji}</div>
                <h3 className="text-xl font-medium text-neutral-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-neutral-600 mb-6">{plan.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-thin text-neutral-900">{plan.price}</span>
                    <span className="text-neutral-500 text-sm">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <span className="text-sm line-through text-neutral-400">{plan.originalPrice}</span>
                      <span className="text-xs bg-neutral-900 text-white px-2 py-1 rounded-full">
                        {Math.round((1 - parseInt(plan.price.slice(1)) / parseInt(plan.originalPrice.slice(1))) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-neutral-700 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
              
              {plan.note && (
                <div className="mb-6 p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-600 italic">{plan.note}</p>
                </div>
              )}
              
              <button className={`w-full py-3 px-6 text-sm font-medium rounded-lg transition-all duration-200 ${
                plan.popular 
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-200'
              }`}>
                {plan.popular ? 'Get Started' : 'Choose Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-thin text-neutral-900">Questions?</h2>
          <div className="w-8 h-px bg-neutral-900 mx-auto mt-4"></div>
        </div>
        <div className="text-center">
          <p className="text-neutral-600">Need help choosing a plan? Contact our team.</p>
        </div>
      </div>
    </div>
  );
}