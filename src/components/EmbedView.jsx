import React, { useState, useEffect } from 'react';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BinaryCodeIcon,
  Tick01Icon,
  PencilEdit01Icon,
  Store01Icon,
  Copy01Icon,
  ArrowLeft01Icon,
  GiftIcon,
  Alert02Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';


export default function EmbedView({ agent, onBack }) {
  const { updateAgent } = useAgent();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [copied, setCopied] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    projectName: '',
    logoUrl: '',
    userIcon: 'alien'
  });
  const [securityForm, setSecurityForm] = useState({
    allowedDomains: ''
  });
  const [discountForm, setDiscountForm] = useState({
    enabled: false,
    title: 'Welcome back! 🎉',
    message: 'We have a special offer just for you',
    code: 'WELCOME15',
    discountPercent: 15
  });
  const [newLogo, setNewLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeSection, setActiveSection] = useState('branding');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (agent) {
      setBrandingForm({
        projectName: agent.projectName || '',
        logoUrl: agent.logoUrl || '',
        userIcon: agent.userIcon || 'alien'
      });
      setSecurityForm({
        allowedDomains: agent.allowedDomains ? agent.allowedDomains.join('\n') : ''
      });
      setDiscountForm({
        enabled: agent.returnUserDiscount?.enabled || false,
        title: agent.returnUserDiscount?.title || 'Welcome back! 🎉',
        message: agent.returnUserDiscount?.message || 'We have a special offer just for you',
        code: agent.returnUserDiscount?.code || 'WELCOME15',
        discountPercent: agent.returnUserDiscount?.discountPercent || 15
      });
      setLogoPreview(agent.logoUrl || null);
    }
  }, [agent]);

  // Listen for alerts
  useEffect(() => {
    if (!user || !agent) return;

    const alertsRef = collection(db, 'users', user.uid, 'agents', agent.id, 'alerts');
    const q = query(alertsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, [user, agent]);

  const embedCode = agent ? `<!-- Orchis Chatbot -->
<script>
(function(){
  if(!window.OrchisChatbot){
    const script = document.createElement('script');
    script.src = 'https://orchis.app/chatbot-widget.js';
    script.onload = function() {
      if(window.OrchisChatbot) {
        window.OrchisChatbot.init({
          agentId: '${agent.id}'
        });
      }
    };
    document.head.appendChild(script);
  }
})();
</script>` : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      showNotification('Embed code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  const handleBrandingSave = async () => {
    try {
      let logoUrlToSave = brandingForm.logoUrl;

      // If user uploaded a new logo, use the preview (base64)
      if (newLogo && logoPreview) {
        logoUrlToSave = logoPreview;
      }

      const updatedAgentData = {
        projectName: brandingForm.projectName,
        logoUrl: logoUrlToSave,
        userIcon: brandingForm.userIcon,
        updatedAt: new Date().toISOString()
      };

      // Update the agent using the context function
      await updateAgent(agent.id, updatedAgentData);

      setNewLogo(null);

      showNotification('Branding updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating branding:', error);
      showNotification('Error updating branding: ' + error.message, 'error');
    }
  };

  const handleSecuritySave = async () => {
    try {
      // Process allowed domains
      const allowedDomains = securityForm.allowedDomains
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

      const updatedAgentData = {
        allowedDomains: allowedDomains,
        updatedAt: new Date().toISOString()
      };

      // Update the agent using the context function
      await updateAgent(agent.id, updatedAgentData);

      showNotification('Security settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating security settings:', error);
      showNotification('Error updating security settings: ' + error.message, 'error');
    }
  };

  const handleDiscountSave = async () => {
    try {
      const updatedAgentData = {
        returnUserDiscount: {
          enabled: discountForm.enabled,
          title: discountForm.title,
          message: discountForm.message,
          code: discountForm.code,
          discountPercent: discountForm.discountPercent
        },
        updatedAt: new Date().toISOString()
      };

      await updateAgent(agent.id, updatedAgentData);

      showNotification('Discount settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating discount settings:', error);
      showNotification('Error updating discount settings: ' + error.message, 'error');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewLogo(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };


  const handleMarkAlertAsRead = async (alertId) => {
    if (!user || !agent) return;

    try {
      const alertRef = doc(db, 'users', user.uid, 'agents', agent.id, 'alerts', alertId);
      await updateDoc(alertRef, { read: true });
      showNotification('Alert marked as read', 'success');
    } catch (error) {
      console.error('Error marking alert as read:', error);
      showNotification('Error marking alert as read', 'error');
    }
  };

  const handleMarkAllAlertsAsRead = async () => {
    if (!user || !agent) return;

    try {
      const unreadAlerts = alerts.filter(alert => !alert.read);
      for (const alert of unreadAlerts) {
        const alertRef = doc(db, 'users', user.uid, 'agents', agent.id, 'alerts', alert.id);
        await updateDoc(alertRef, { read: true });
      }
      showNotification('All alerts marked as read', 'success');
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      showNotification('Error marking all alerts as read', 'error');
    }
  };

  const sections = [
    { id: 'branding', title: 'Branding', icon: Store01Icon },
    { id: 'security', title: 'Allowed Domains', icon: BinaryCodeIcon },
    { id: 'discount', title: 'Return User Discount', icon: GiftIcon },
    { id: 'alerts', title: 'Security Alerts', icon: Alert02Icon },
    { id: 'embed', title: 'Embed Code', icon: Copy01Icon }
  ];

  const renderBrandingSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Agent Name
          </label>
          <input
            type="text"
            value={brandingForm.projectName}
            onChange={(e) => setBrandingForm({...brandingForm, projectName: e.target.value})}
            className="form-input text-sm bg-transparent border border-stone-300 dark:border-stone-700 text-neutral-900 dark:text-neutral-100"
            placeholder="My Company"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-500 mb-2">
            Project Logo
          </label>
          <div className="flex items-center space-x-3">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-10 h-10 rounded-lg object-cover border border-stone-200"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload-branding"
            />
            <label
              htmlFor="logo-upload-branding"
              className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
            >
              <HugeiconsIcon icon={Store01Icon} className="w-3 h-3" />
              Upload Logo
            </label>
          </div>
        </div>

        <div>

        </div>

        <div className="pt-4">
          <button
            onClick={handleBrandingSave}
            className="btn-primary text-sm py-2 px-4"
          >
            Save Branding
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-black dark:text-white mb-1">
            Allowed Domains
          </label>
          <textarea
            value={securityForm.allowedDomains}
            onChange={(e) => setSecurityForm({...securityForm, allowedDomains: e.target.value})}
            className="form-textarea bg-transparent text-black dark:text-white border border-stone-200 dark:border-stone-700 text-sm h-24"
            placeholder="example.com&#10;mysite.org&#10;*.mydomain.com"
            rows={4}
          />
          <p className="text-xs text-stone-500 mt-1">
            One domain per line. Use * for subdomains (*.example.com). Leave empty to allow all domains.
          </p>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-black dark:text-white mb-2">🔒 Security Features</h4>
          <ul className="text-xs text-black dark:text-white space-y-1">
            <li>• <strong>Domain Restriction:</strong> Widget only works on allowed domains</li>
            <li>• <strong>HMAC Security:</strong> Cryptographic signatures prevent unauthorized use</li>
            <li>• <strong>Replay Protection:</strong> Requests expire after 5 minutes</li>
          </ul>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSecuritySave}
            className="btn-primary text-sm py-2 px-4"
          >
            Save Security Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderDiscountSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              Enable Return User Discount
            </label>
            <p className="text-xs text-stone-500 mt-1">
              Show special discount popup to returning visitors
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={discountForm.enabled}
              onChange={(e) => setDiscountForm({...discountForm, enabled: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {discountForm.enabled && (
          <>
            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                Popup Title
              </label>
              <input
                type="text"
                value={discountForm.title}
                onChange={(e) => setDiscountForm({...discountForm, title: e.target.value})}
                className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                placeholder="Welcome back! 🎉"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black dark:text-white mb-1">
                Popup Message
              </label>
              <textarea
                value={discountForm.message}
                onChange={(e) => setDiscountForm({...discountForm, message: e.target.value})}
                className="form-textarea bg-transparent text-black dark:text-white border border-stone-200 dark:border-stone-700 text-sm"
                placeholder="We have a special offer just for you"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Discount Code
                </label>
                <input
                  type="text"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({...discountForm, code: e.target.value})}
                  className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white font-mono"
                  placeholder="WELCOME15"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black dark:text-white mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  value={discountForm.discountPercent}
                  onChange={(e) => setDiscountForm({...discountForm, discountPercent: parseInt(e.target.value)})}
                  className="form-input text-sm bg-transparent border border-stone-200 dark:border-stone-700 text-black dark:text-white"
                  placeholder="15"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            
          </>
        )}

        <div className="pt-4">
          <button
            onClick={handleDiscountSave}
            className="btn-primary text-sm py-2 px-4"
          >
            Save Discount Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmbedSection = () => (
    <div className="space-y-6">
      {/* Copy Button */}
      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="btn-primary flex items-center gap-2"
        >
          {copied ? (
            <>
              <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
              Copy Code
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <div className="bg-stone-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
          {embedCode}
        </pre>
      </div>

      {/* Installation Instructions */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
        <h4 className="text-sm font-bold text-black dark:text-white mb-2">Installation</h4>
        <ol className="text-xs text-black dark:text-white space-y-1 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Paste before the closing &lt;/body&gt; tag (not in &lt;head&gt;)</li>
          <li>The chatbot will appear automatically on your site</li>
          <li>Test on your website to ensure it's working</li>
        </ol>
        <div className="mt-2 text-xs font-bold text-black dark:text-white">
          💡 Place in body for better performance and SEO
        </div>
      </div>
    </div>
  );


  const renderAlertsSection = () => {
    const unreadAlerts = alerts.filter(alert => !alert.read);
    const readAlerts = alerts.filter(alert => alert.read);

    return (
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {unreadAlerts.length > 0 ? (
              <span className="text-red-500 font-medium">
                {unreadAlerts.length} unread alert{unreadAlerts.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span>No unread alerts</span>
            )}
          </div>
          {unreadAlerts.length > 0 && (
            <button
              onClick={handleMarkAllAlertsAsRead}
              className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-3 h-3" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <HugeiconsIcon icon={Alert02Icon} className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No security alerts yet</p>
            <p className="text-xs text-stone-400 mt-1">You'll be notified here when unauthorized access is attempted</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unread alerts */}
            {unreadAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <HugeiconsIcon icon={Alert02Icon} className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                        {alert.type === 'domain_blocked' ? '🚫 Unauthorized Domain Access' : 'Security Alert'}
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Domain: <span className="font-mono">{alert.requestDomain}</span>
                      </p>
                      {alert.message && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Message preview: "{alert.message}"
                        </p>
                      )}
                      <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkAlertAsRead(alert.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
                  >
                    Mark as read
                  </button>
                </div>
              </div>
            ))}

            {/* Read alerts */}
            {readAlerts.length > 0 && (
              <>
                <div className="text-xs text-stone-400 font-medium mt-6 mb-2">Read Alerts</div>
                {readAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-stone-100 dark:bg-stone-700 rounded-lg">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-4 h-4 text-stone-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                          {alert.type === 'domain_blocked' ? '🚫 Unauthorized Domain Access' : 'Security Alert'}
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                          Domain: <span className="font-mono">{alert.requestDomain}</span>
                        </p>
                        <p className="text-xs text-stone-500 mt-2">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Info box */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-black dark:text-white mb-2">ℹ️ About Security Alerts</h4>
          <ul className="text-xs text-black dark:text-white space-y-1">
            <li>• Alerts are triggered when someone tries to use your widget from an unauthorized domain</li>
            <li>• Configure allowed domains in the <strong>Security</strong> section</li>
            <li>• All blocked attempts are logged here for your review</li>
          </ul>
        </div>
      </div>
    );
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <HugeiconsIcon icon={BinaryCodeIcon} className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-2">No Agent Selected</h2>
          <p className="text-stone-600 dark:text-stone-400">Please select an agent to generate embed code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 p-2 text-stone-900 dark:text-stone-50 hover:text-stone-500 transition-colors rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 cursor-pointer"
            title="Back to Analytics"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
            <span className="text-xs text-stone-500">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-thin text-stone-900 dark:text-stone-50">Embed Settings</h1>
            <div className="w-12 h-px bg-stone-900 dark:bg-stone-100 mt-4"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Left Sidebar - Section Navigation */}
        <div className="w-64 bg-transparent p-1">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-1 px-4 py-2 text-left rounded-lg hover:bg-stone-800 dark:md:hover:bg-stone-100 hover:text-white dark:md:hover:text-stone-900 transition-colors group ${
                    activeSection === section.id ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-black' : ''
                  }`}
                >
                  <HugeiconsIcon 
                    icon={Icon} 
                    className={`w-4 h-4 transition-colors ${
                      activeSection === section.id ? 'text-white dark:text-black' : 'text-stone-500 group-hover:text-white dark:md:group-hover:text-stone-900'
                    }`} 
                  />
                  <span className={`text-sm font-medium transition-colors ${
                    activeSection === section.id ? 'text-white dark:text-black' : 'text-stone-900 dark:text-stone-50 dark:md:group-hover:text-stone-900 group-hover:text-white'
                  }`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content - Section Content */}
        <div className="flex-1 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="text-lg font-medium text-stone-900 dark:text-stone-50 mb-6">
            {sections.find(s => s.id === activeSection)?.title}
          </h2>
          
          {activeSection === 'branding' && renderBrandingSection()}
          {activeSection === 'security' && renderSecuritySection()}
          {activeSection === 'discount' && renderDiscountSection()}
          {activeSection === 'alerts' && renderAlertsSection()}
          {activeSection === 'embed' && renderEmbedSection()}
        </div>
      </div>
    </div>
  );
}