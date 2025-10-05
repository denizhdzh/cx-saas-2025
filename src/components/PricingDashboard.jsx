import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Tick01Icon,
  CreditCardIcon,
  ArrowLeft01Icon,
  Cancel01Icon,
  SuperMarioToadIcon,
  PokemonIcon,
  Pacman01Icon
} from '@hugeicons/core-free-icons';

export default function PricingDashboard() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [usedEvents, setUsedEvents] = useState(2);
  const [planLimit, setPlanLimit] = useState(10000);
  const [isYearly, setIsYearly] = useState(false);
  
  const allFeatures = [
    { name: "Monthly tokens", starter: "50,000", growth: "200,000", scale: "1,000,000" },
    { name: "AI Agents", starter: "1", growth: "3", scale: "Unlimited" },
    { name: "Unlimited training data", starter: true, growth: true, scale: true },
    { name: "Advanced analytics", starter: true, growth: true, scale: true },
    { name: "Ticket tracking", starter: true, growth: true, scale: true },
    { name: "Email support", starter: true, growth: true, scale: true },
    { name: "White-label branding", starter: false, growth: true, scale: true },
    { name: "Priority support", starter: false, growth: true, scale: true },
    { name: "Export data (CSV/JSON)", starter: false, growth: false, scale: true }
  ];

  const getYearlyPrice = (monthlyPrice) => {
    return monthlyPrice * 10; // 2 months free (10 months price for 12 months)
  };

  const plans = [
    {
      icon: SuperMarioToadIcon,
      name: "Starter",
      monthlyPrice: 20,
      monthlyOriginalPrice: 30,
      description: "For small businesses",
      planKey: "starter",
      popular: false
    },
    {
      icon: PokemonIcon,
      name: "Growth",
      monthlyPrice: 60,
      monthlyOriginalPrice: 90,
      description: "Most popular",
      planKey: "growth",
      popular: true,
    },
    {
      icon: Pacman01Icon,
      name: "Scale",
      monthlyPrice: 200,
      monthlyOriginalPrice: 300,
      description: "For growing teams",
      planKey: "scale",
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
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-50 transition-colors mb-6"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-thin text-stone-900 dark:text-stone-50">Billing & Usage</h1>
        <div className="w-12 h-px bg-stone-900 dark:bg-stone-50 mt-4"></div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <button
          onClick={() => setIsYearly(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isYearly
              ? 'bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsYearly(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            isYearly
              ? 'bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Yearly
          <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
            2 months free
          </span>
        </button>
      </div>

      {/* Current Plan */}
      <div className="mb-12">
        <div className="text-center">
          <p className="text-stone-600 dark:text-stone-400">
            You're currently on the <span className="font-medium text-stone-900 dark:text-stone-50">Free Plan</span>
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          return (
            <div key={index} className="relative">
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`bg-white dark:bg-stone-800/50 rounded-xl border p-6 h-full flex flex-col ${
                plan.popular ? 'border-orange-500' : 'border-stone-200 dark:border-stone-700'
              }`}>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <HugeiconsIcon icon={Icon} className="w-8 h-8 text-stone-900 dark:text-stone-50" />
                    <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-50">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-stone-900 dark:text-stone-50 transition-all duration-300">
                      ${isYearly ? Math.round(getYearlyPrice(plan.monthlyPrice) / 12) : plan.monthlyPrice}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 text-sm">
                      /month
                    </span>
                  </div>
                  {isYearly && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 animate-slide-down">
                      ${getYearlyPrice(plan.monthlyPrice)} billed yearly
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 flex-1">
                  {allFeatures.map((feature, fIndex) => {
                    const value = feature[plan.planKey];
                    const isEnabled = value === true || (typeof value === 'string');
                    const displayValue = typeof value === 'string' ? value : null;

                    return (
                      <div key={fIndex} className={`flex items-start gap-2 ${!isEnabled ? 'opacity-40' : ''}`}>
                        <HugeiconsIcon
                          icon={isEnabled ? Tick01Icon : Cancel01Icon}
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            isEnabled ? 'text-green-600 dark:text-green-400' : 'text-stone-400'
                          }`}
                        />
                        <span className="text-sm text-stone-700 dark:text-stone-300">
                          {displayValue ? `${displayValue} ${feature.name}` : feature.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Note */}
                {plan.note && (
                  <div className="mb-4 p-2 bg-orange-500/5 rounded-lg">
                    <p className="text-xs text-stone-600 dark:text-stone-400 text-center">{plan.note}</p>
                  </div>
                )}

                {/* Button */}
                <button className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  Choose Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-thin text-stone-900 dark:text-stone-50">Questions?</h2>
          <div className="w-8 h-px bg-stone-900 dark:bg-stone-50 mx-auto mt-4"></div>
        </div>
        <div className="text-center">
          <p className="text-stone-600 dark:text-stone-400">Need help choosing a plan? Contact our team.</p>
        </div>
      </div>
    </div>
  );
}