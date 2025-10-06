import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PricingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  const allFeatures = [
    { name: "messages/month", starter: "~1,000", growth: "~5,000", scale: "~40,000" },
    { name: "AI Agents", starter: "1", growth: "3", scale: "Unlimited" },
    { name: "Unlimited training data", starter: true, growth: true, scale: true },
    { name: "Advanced analytics", starter: true, growth: true, scale: true },
    { name: "Ticket tracking", starter: true, growth: true, scale: true },
    { name: "Email support", starter: true, growth: true, scale: true },
    { name: "White-label branding", starter: false, growth: true, scale: true },
    { name: "Priority support", starter: false, growth: true, scale: true },
    { name: "Export data (CSV/JSON)", starter: false, growth: false, scale: true }
  ];

  // Fetch user subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSubscriptionData({
            status: userData.subscriptionStatus || 'free',
            plan: userData.subscriptionPlan || 'free',
            tokenLimit: userData.tokenLimit || 0,
            tokensUsed: userData.tokensUsed || 0,
            agentLimit: userData.agentLimit || 0
          });
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const getYearlyPrice = (monthlyPrice) => {
    return monthlyPrice * 10; // 2 months free (10 months price for 12 months)
  };

  const STRIPE_PRICES = {
    starter_monthly: 'price_1SEtjICw3gxLTtQCr7xvDdR0',
    starter_yearly: 'price_1SEtjICw3gxLTtQCC6fIugqt',
    growth_monthly: 'price_1SEtjuCw3gxLTtQChEonKkz1',
    growth_yearly: 'price_1SEtjuCw3gxLTtQCa4MZ13YJ',
    scale_monthly: 'price_1SEtkRCw3gxLTtQCXUDDMDiD',
    scale_yearly: 'price_1SEtkRCw3gxLTtQCtNWV255C'
  };

  const handleSubscribe = async (planKey) => {
    if (!user) {
      showNotification('Please sign in to subscribe', 'error');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

      const priceKey = `${planKey}_${isYearly ? 'yearly' : 'monthly'}`;
      const priceId = STRIPE_PRICES[priceKey];

      const result = await createCheckoutSession({
        priceId,
        userId: user.uid
      });

      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      showNotification('Failed to start checkout: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) {
      showNotification('Please sign in to manage billing', 'error');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const createPortalSession = httpsCallable(functions, 'createPortalSession');

      const result = await createPortalSession({
        userId: user.uid
      });

      // Redirect to Stripe Customer Portal
      window.location.href = result.data.url;
    } catch (error) {
      console.error('Portal error:', error);
      showNotification('No active subscription found', 'error');
    } finally {
      setLoading(false);
    }
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
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const hasActiveSubscription = subscriptionData?.status === 'active' && subscriptionData?.plan !== 'free';

  if (dataLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-50"></div>
        </div>
      </div>
    );
  }

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

      {/* Usage Progress Bar - Only show if has active subscription */}
      {hasActiveSubscription && (
        <div className="mb-12 p-6 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-stone-900 dark:text-stone-50">
                Monthly Usage
              </h3>
              <span className="text-sm text-stone-600 dark:text-stone-400 capitalize">
                {subscriptionData.plan} Plan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-stone-600 dark:text-stone-400 mb-3">
              <span>{formatNumber(subscriptionData.tokensUsed)} tokens (~{Math.floor(subscriptionData.tokensUsed / 100)} messages)</span>
              <span>{formatNumber(subscriptionData.tokenLimit)} tokens limit</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((subscriptionData.tokensUsed / subscriptionData.tokenLimit) * 100, 100)}%`
                }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              {((subscriptionData.tokensUsed / subscriptionData.tokenLimit) * 100).toFixed(1)}% used this month
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle - Only show if NO active subscription */}
      {!hasActiveSubscription && (
        <>
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
        </>
      )}

      {/* Plans Grid - Only show if NO active subscription */}
      {!hasActiveSubscription && (
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
                <button
                  onClick={() => handleSubscribe(plan.planKey)}
                  disabled={loading}
                  className={plan.popular ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {loading ? 'Loading...' : 'Choose Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Manage Billing Section - Only show if HAS active subscription */}
      {hasActiveSubscription && (
      <div className="mt-12 p-6 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-50 mb-1">
              Manage Your Subscription
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              View invoices, update payment method, or cancel your subscription
            </p>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <HugeiconsIcon icon={CreditCardIcon} className="w-4 h-4" />
            {loading ? 'Loading...' : 'Manage Billing'}
          </button>
        </div>
      </div>
      )}

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