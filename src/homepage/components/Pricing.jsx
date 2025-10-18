import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "$20",
      period: "month",
      description: "For small businesses",
      features: [
        "~1,500 messages/month",
        "1 AI agent",
        "Unlimited training data",
        "Advanced analytics",
        "Email support"
      ],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Growth",
      price: "$60",
      period: "month",
      description: "Most popular choice",
      features: [
        "~7,500 messages/month",
        "5 AI agents",
        "Unlimited training data",
        "Advanced analytics",
        "White-label branding",
        "Priority support"
      ],
      cta: "Get Started",
      highlighted: true
    },
    {
      name: "Scale",
      price: "$200",
      period: "month",
      description: "For growing teams",
      features: [
        "~50,000 messages/month",
        "Unlimited AI agents",
        "Unlimited training data",
        "Advanced analytics",
        "White-label branding",
        "Priority support",
        "Export data (CSV/JSON)"
      ],
      cta: "Get Started",
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="relative py-16 lg:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="text-sm text-orange-500 font-semibold mb-2">Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Start for free. Upgrade when you're ready. All plans include unlimited training data.
          </p>
        </div>

        {/* Single Unified Card */}
        <div className="bg-gradient-to-br from-white to-neutral-50/80 rounded-3xl border border-neutral-200/60 shadow-2xl shadow-neutral-900/5">

          {/* 3 Column Grid Inside Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 lg:p-12 flex flex-col ${
                  index < plans.length - 1 ? 'border-b lg:border-b-0 lg:border-r border-neutral-200/50' : ''
                }`}
              >
                {/* Badge - Fixed at top */}
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                    Popular
                  </div>
                )}

                {/* Top section with plan info */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {plan.description}
                  </p>
                </div>

                {/* Price Card */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-neutral-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-neutral-500">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* Features Card */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5 mb-4 flex-grow">
                  <div className="text-xs font-medium text-neutral-500 mb-3">What's included</div>
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
                        <span className="text-xs text-neutral-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/signin')}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs transition-all ${
                    plan.highlighted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
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
          <p className="text-xs text-neutral-500">
            Free plan available with 100 message credits
          </p>
        </div>

      </div>
    </section>
  );
}
