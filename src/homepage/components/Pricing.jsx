import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Starter",
      priceMonthly: "$20",
      priceYearly: "$200",
      yearlyDiscount: "Save $40",
      description: "For small businesses",
      features: [
        "~1,500 messages/month",
        "1 AI agent",
        "Unlimited training data",
        "Session intelligence",
        "Page awareness",
        "Advanced analytics",
        "Email support"
      ],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Growth",
      priceMonthly: "$60",
      priceYearly: "$600",
      yearlyDiscount: "Save $120",
      description: "Most popular choice",
      features: [
        "~7,500 messages/month",
        "5 AI agents",
        "Unlimited training data",
        "Session intelligence",
        "Page awareness",
        "Personalized messaging",
        "Advanced analytics",
        "White-label branding",
        "Priority support"
      ],
      cta: "Get Started",
      highlighted: true
    },
    {
      name: "Scale",
      priceMonthly: "$200",
      priceYearly: "$2,000",
      yearlyDiscount: "Save $400",
      description: "For growing teams",
      features: [
        "~50,000 messages/month",
        "Unlimited AI agents",
        "Unlimited training data",
        "Session intelligence",
        "Page awareness",
        "Personalized messaging",
        "Advanced analytics",
        "White-label branding",
        "Priority support",
        "Export data (CSV/JSON)",
        "Custom integrations"
      ],
      cta: "Get Started",
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="relative py-16 lg:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">Pricing</div>
          <h2 className="text-5xl font-extralight text-neutral-50 mb-6 leading-tight">
            Simple, transparent pricing
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto mb-8"></div>
          <p className="text-base text-neutral-400 max-w-3xl mx-auto mb-8 font-light leading-relaxed">
            Start for free. Upgrade when you're ready. All plans include unlimited training data.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-light transition-colors ${!isYearly ? 'text-neutral-200' : 'text-neutral-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
              style={{ backgroundColor: isYearly ? '#22c55e' : '#404040' }}
            >
              <span
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform"
                style={{ transform: isYearly ? 'translateX(28px)' : 'translateX(0)' }}
              />
            </button>
            <span className={`text-sm font-light transition-colors ${isYearly ? 'text-neutral-200' : 'text-neutral-600'}`}>
              Yearly
              <span className="ml-1.5 text-xs text-green-400 font-light">Save up to 17%</span>
            </span>
          </div>
        </div>

        {/* Single Unified Card */}
        <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-3xl border border-neutral-800/30">

          {/* 3 Column Grid Inside Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 lg:p-10 flex flex-col ${
                  index < plans.length - 1 ? 'border-b lg:border-b-0 lg:border-r border-neutral-800/50' : ''
                }`}
              >
                {/* Badge - Fixed at top */}
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-[10px] font-light px-3 py-1 rounded-lg uppercase tracking-widest">
                    Popular
                  </div>
                )}

                {/* Top section with plan info */}
                <div className="mb-5">
                  <h3 className="text-base font-extralight text-neutral-50 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-600 font-light">
                    {plan.description}
                  </p>
                </div>

                {/* Price Card */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-5 mb-4">
                  {isYearly && (
                    <div className="text-xs text-green-400 font-light mb-2">
                      {plan.yearlyDiscount}
                    </div>
                  )}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extralight text-neutral-50">
                      {isYearly ? `$${Math.round(parseInt(plan.priceYearly.replace('$', '').replace(',', '')) / 12)}` : plan.priceMonthly}
                    </span>
                    <span className="text-xs text-neutral-600 font-light">
                      /month
                    </span>
                  </div>
                  {isYearly && (
                    <div className="text-xs text-neutral-600 font-light">
                      Billed yearly {plan.priceYearly}
                    </div>
                  )}
                </div>

                {/* Features Card */}
                <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-xl p-5 mb-5 flex-grow">
                  <div className="text-[10px] font-light text-neutral-600 mb-3 uppercase tracking-widest">What's included</div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-left">
                        <svg
                          className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-neutral-400 font-light">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/signin')}
                  className={`w-full py-3 px-4 rounded-lg font-light text-sm transition-all ${
                    plan.highlighted
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-neutral-100 text-neutral-900 hover:bg-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}

          </div>

        </div>

        {/* Bottom Info */}
        <div className="text-center mt-8">
          <p className="text-xs text-neutral-600 font-light">
            Free plan available with 100 message credits
          </p>
        </div>

      </div>
    </section>
  );
}
