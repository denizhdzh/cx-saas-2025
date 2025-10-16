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
    <section className="relative py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-2 relative">
        <div className="mx-4 sm:mx-6">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">PRICING</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-4 leading-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-sm text-neutral-600 max-w-2xl mx-auto">
              Start for free. Upgrade when you're ready.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border p-6 transition-all ${
                  plan.highlighted
                    ? 'border-orange-600 shadow-lg'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Most Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <div className="mb-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-600">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-medium text-neutral-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-neutral-500">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-left">
                      <svg
                        className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-neutral-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/signin')}
                  className={`w-full py-2.5 px-5 rounded-lg font-medium text-xs transition-all ${
                    plan.highlighted
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Info */}
          <div className="text-center space-y-3">
            <p className="text-xs text-neutral-500">
              Free plan available with 100 message credits • All plans include unlimited training data
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
