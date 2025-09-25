import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Bell, Shield, CreditCard, Palette, Globe, Moon, Sun } from 'phosphor-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState('free');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true
  });
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserPlan(data.plan || 'free');
            setNotifications(data.notifications || { email: true, push: false, updates: true });
            setTheme(data.theme || 'light');
            setLanguage(data.language || 'en');
          }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [user]);

  const updateSetting = async (field, value) => {
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          [field]: value
        });
      } catch (error) {
        console.error('Error updating setting:', error);
      }
    }
  };

  const handleNotificationChange = (type, value) => {
    const newNotifications = { ...notifications, [type]: value };
    setNotifications(newNotifications);
    updateSetting('notifications', newNotifications);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateSetting('theme', newTheme);
  };

  const SettingSection = ({ icon: Icon, title, children }) => (
    <div className="border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-gray-900' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <>
      <Helmet>
        <title>Settings - Orchis</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Sidebar />
        
        <div className="ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="text-xs text-neutral-400 mb-8">Settings</div>
              <h1 className="text-2xl font-thin text-neutral-900">Account preferences</h1>
              <div className="w-12 h-px bg-neutral-900 mt-4"></div>
            </div>

            <div className="max-w-6xl space-y-6">
              {/* Profile */}
              <SettingSection icon={User} title="Profile">
                <SettingRow 
                  label="Display name"
                  description="This is your display name across the platform"
                >
                  <div className="text-sm text-gray-600">
                    {user?.displayName || 'User'}
                  </div>
                </SettingRow>
                <SettingRow 
                  label="Email address"
                  description="Used for authentication and notifications"
                >
                  <div className="text-sm text-gray-600">
                    {user?.email}
                  </div>
                </SettingRow>
                <SettingRow 
                  label="Plan"
                  description="Your current subscription plan"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {userPlan}
                    </span>
                    {userPlan === 'free' && (
                      <button 
                        className="text-xs font-medium px-3 py-1.5 transition-colors rounded-lg text-white hover:opacity-90"
                        style={{
                          borderWidth: '0.5px',
                          borderStyle: 'solid',
                          borderColor: 'rgb(20, 20, 20)',
                          backgroundColor: 'rgba(0, 0, 0, 0)',
                          boxShadow: 'rgba(255, 255, 255, 0.15) 0px 1px 0px 0px inset',
                          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                        }}
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </SettingRow>
              </SettingSection>

              {/* Notifications */}
              <SettingSection icon={Bell} title="Notifications">
                <SettingRow 
                  label="Email notifications"
                  description="Receive important updates via email"
                >
                  <Toggle 
                    checked={notifications.email}
                    onChange={(value) => handleNotificationChange('email', value)}
                  />
                </SettingRow>
                <SettingRow 
                  label="Push notifications"
                  description="Get notified about real-time events"
                >
                  <Toggle 
                    checked={notifications.push}
                    onChange={(value) => handleNotificationChange('push', value)}
                  />
                </SettingRow>
                <SettingRow 
                  label="Product updates"
                  description="Stay informed about new features"
                >
                  <Toggle 
                    checked={notifications.updates}
                    onChange={(value) => handleNotificationChange('updates', value)}
                  />
                </SettingRow>
              </SettingSection>

              {/* Appearance */}
              <SettingSection icon={Palette} title="Appearance">
                <SettingRow 
                  label="Theme"
                  description="Choose your preferred interface theme"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`p-2 rounded-md transition-colors ${
                        theme === 'light' ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Sun size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`p-2 rounded-md transition-colors ${
                        theme === 'dark' ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Moon size={14} className="text-gray-600" />
                    </button>
                  </div>
                </SettingRow>
                <SettingRow 
                  label="Language"
                  description="Select your preferred language"
                >
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      updateSetting('language', e.target.value);
                    }}
                    className="text-sm border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="en">English</option>
                    <option value="tr">Türkçe</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </SettingRow>
              </SettingSection>

              {/* Security */}
              <SettingSection icon={Shield} title="Security">
                <SettingRow 
                  label="Two-factor authentication"
                  description="Add an extra layer of security to your account"
                >
                  <button className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors">
                    Enable
                  </button>
                </SettingRow>
                <SettingRow 
                  label="Password"
                  description="Change your account password"
                >
                  <button className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors">
                    Update
                  </button>
                </SettingRow>
                <SettingRow 
                  label="Active sessions"
                  description="Manage your active login sessions"
                >
                  <button className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors">
                    View all
                  </button>
                </SettingRow>
              </SettingSection>

              {/* Billing */}
              {userPlan === 'pro' && (
                <SettingSection icon={CreditCard} title="Billing">
                  <SettingRow 
                    label="Payment method"
                    description="Manage your payment information"
                  >
                    <button className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors">
                      Update
                    </button>
                  </SettingRow>
                  <SettingRow 
                    label="Billing history"
                    description="View your past invoices and receipts"
                  >
                    <button className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors">
                      View history
                    </button>
                  </SettingRow>
                </SettingSection>
              )}

              {/* Danger Zone */}
              <div className="border border-red-200 rounded-lg">
                <div className="px-6 py-4 border-b border-red-100">
                  <h3 className="text-sm font-medium text-red-900">Danger Zone</h3>
                </div>
                <div className="p-6">
                  <SettingRow 
                    label="Delete account"
                    description="Permanently delete your account and all associated data"
                  >
                    <button className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
                      Delete
                    </button>
                  </SettingRow>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}