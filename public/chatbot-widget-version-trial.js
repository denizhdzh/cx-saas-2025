// Orchis Chatbot Widget - Standalone Version
(function() {
  'use strict';

  // Widget configuration
  let instances = {};

  // Comprehensive Chat Session Manager
  class ChatSessionManager {
    constructor(agentId) {
      this.agentId = agentId;
      this.pageLoadTime = Date.now();

      // IMPORTANT: Generate anonymousUserId FIRST before session!
      this.anonymousUserId = this.generateAnonymousUserId();

      // Now we can use anonymousUserId in getOrCreateSessionId
      this.sessionId = this.getOrCreateSessionId();

      this.sessionData = this.initializeSessionData();
      this.chatStartTime = null;
    }

    generateAnonymousUserId() {
      // Create persistent anonymous ID based on browser fingerprint
      const fingerprint = [
        window.location.hostname,
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      ].join('-');
      
      // Simple hash function for anonymous ID
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return 'anon_' + Math.abs(hash).toString(36);
    }

    getOrCreateSessionId() {
      // Key based on agentId for site-specific tracking
      const lastVisitKey = `orchis_last_visit_${this.agentId}`;
      const sessionKey = `orchis_session_${this.anonymousUserId}`;

      let sessionId = localStorage.getItem(sessionKey);
      const lastVisit = localStorage.getItem(lastVisitKey);
      const now = Date.now();

      // Check if return user based on AGENT-SPECIFIC last visit
      // Each agent has its own tracking - so user can be new on site A but return user on site B
      const ONE_HOUR = 60 * 60 * 1000;

      if (lastVisit) {
        const timeSinceLastVisit = now - parseInt(lastVisit);

        if (timeSinceLastVisit > ONE_HOUR) {
          // More than 1 hour passed - this is a return user
          this.isReturnUser = true;
          console.log('🔄 Return user detected for agent ' + this.agentId);
          console.log('   Last visit: ' + new Date(parseInt(lastVisit)).toLocaleString());
          console.log('   Time since: ' + Math.round(timeSinceLastVisit / 1000 / 60) + ' minutes');

          // NOW update the last visit timestamp (only for return users after 1h gap)
          localStorage.setItem(lastVisitKey, now.toString());
        } else {
          // Less than 1 hour - same session
          this.isReturnUser = false;
          console.log('⏰ Same session for agent ' + this.agentId + ' (within 1 hour)');
          // DON'T update lastVisit - keep the session active
        }
      } else {
        // First time visiting this agent/site
        this.isReturnUser = false;
        console.log('✨ New user for agent ' + this.agentId);

        // Set first visit timestamp
        localStorage.setItem(lastVisitKey, now.toString());
      }

      // Create or get session ID (user-specific, not agent-specific)
      if (!sessionId) {
        sessionId = this.anonymousUserId;
        localStorage.setItem(sessionKey, sessionId);
      }

      return sessionId;
    }

    initializeSessionData() {
      return {
        // User Identity
        userId: this.anonymousUserId,
        sessionId: this.sessionId,
        agentId: this.agentId,

        // User Info
        userInfo: {
          location: {
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            referrer: document.referrer || 'direct',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          device: {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            browser: this.getBrowserInfo(),
            deviceType: this.getDeviceType()
          },
          language: navigator.language || 'en',
          isReturnUser: this.isReturnUser,
          firstVisit: !this.isReturnUser ? new Date().toISOString() : null,
          lastVisit: new Date().toISOString(),
          totalVisits: this.getPageViewCount()
        },

        // Page content (lightweight scrape for context)
        pageContent: this.scrapePageContent(),

        // Current Conversation
        currentConversation: {
          conversationId: 'conv_' + Date.now(),
          startedAt: new Date().toISOString(),
          messages: [],
          analysis: null, // Will be populated by AI
          metrics: {
            messageCount: 0,
            duration: 0,
            avgResponseTime: 0,
            responseTimes: []
          }
        }
      };
    }

    getPageViewCount() {
      const key = `orchis_pageviews_${this.anonymousUserId}`;
      let count = parseInt(localStorage.getItem(key) || '0');
      count++;
      localStorage.setItem(key, count.toString());
      return count;
    }

    isReturnVisitor() {
      const key = `orchis_visitor_${this.anonymousUserId}`;
      const hasVisited = localStorage.getItem(key);
      if (!hasVisited) {
        localStorage.setItem(key, Date.now().toString());
        return false;
      }
      return true;
    }

    getDeviceType() {
      const width = window.innerWidth;
      if (width <= 768) return 'mobile';
      if (width <= 1024) return 'tablet';
      return 'desktop';
    }

    getBrowserInfo() {
      const ua = navigator.userAgent;
      let browser = 'Unknown';
      
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      
      return browser;
    }

    startChat() {
      if (!this.chatStartTime) {
        this.chatStartTime = Date.now();
        this.sessionData.currentConversation.startedAt = new Date().toISOString();
        const timeOnPage = this.chatStartTime - this.pageLoadTime;
        console.log(`💬 Chat started after ${Math.round(timeOnPage / 1000)}s on page`);
        this.saveSession();
      }
    }

    addMessage(message, isUser = true) {
      const messageData = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(7),
        content: message,
        isUser: isUser,
        timestamp: new Date().toISOString(),
        responseTime: isUser ? null : (this.lastUserMessageTime ? Date.now() - this.lastUserMessageTime : null)
      };

      this.sessionData.currentConversation.messages.push(messageData);
      this.sessionData.currentConversation.metrics.messageCount++;

      if (isUser) {
        this.lastUserMessageTime = Date.now();
      } else {
        // Track response time
        if (messageData.responseTime) {
          this.sessionData.currentConversation.metrics.responseTimes.push(messageData.responseTime);
          const times = this.sessionData.currentConversation.metrics.responseTimes;
          this.sessionData.currentConversation.metrics.avgResponseTime =
            Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000);
        }
      }

      this.saveSession();
    }

    // All analysis is now done by AI in the backend
    // No client-side keyword analysis needed

    scrapePageContent() {
      try {
        // Lightweight page context - just title, URL and main headings
        const title = document.title || '';
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).join(', ');

        return {
          title,
          headings: h1s,
          url: window.location.href
        };
      } catch (error) {
        console.error('Error scraping page:', error);
        return {
          title: document.title || '',
          url: window.location.href
        };
      }
    }

    saveSession() {
      // Save to localStorage for persistence
      localStorage.setItem(`orchis_session_${this.sessionId}`, JSON.stringify(this.sessionData));

      // Session will be synced to Firestore when messages are sent
      console.log('💾 Session saved:', {
        userId: this.sessionData.userId,
        conversationId: this.sessionData.currentConversation.conversationId,
        messageCount: this.sessionData.currentConversation.metrics.messageCount
      });
    }
  }

  // Domain validation helper
  function isValidDomain(allowedDomains, currentDomain) {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // Allow all if no restrictions
    }
    
    for (let domain of allowedDomains) {
      domain = domain.trim().toLowerCase();
      const current = currentDomain.toLowerCase();
      
      if (domain.startsWith('*.')) {
        // Wildcard subdomain check
        const baseDomain = domain.slice(2);
        if (current === baseDomain || current.endsWith('.' + baseDomain)) {
          return true;
        }
      } else if (domain === current) {
        // Exact match
        return true;
      }
    }
    
    return false;
  }

  // Main widget class
  function OrchisChatWidget(config) {
    this.config = {
      agentId: config.agentId,
      projectName: config.projectName || '',
      logoUrl: config.logoUrl || null,
      primaryColor: config.primaryColor || '#f97316',
      position: config.position || 'bottom-right',
      allowedDomains: config.allowedDomains || [],
      apiUrl: 'https://us-central1-candelaai.cloudfunctions.net/chatWithAgentExternal',
      secretKey: config.secretKey || null
    };
    
    // Initialize comprehensive session manager
    this.sessionManager = new ChatSessionManager(this.config.agentId);
    
    this.messages = [];
    this.isLoading = false;
    this.isTyping = false;
    this.userName = localStorage.getItem(`chatbot_user_${this.config.agentId}`) || '';
    this.agentData = null; // Store agent data for logo
    
    // Domain validation
    const currentDomain = window.location.hostname;
    if (!isValidDomain(this.config.allowedDomains, currentDomain)) {
      console.warn('Orchis Widget: Domain not allowed:', currentDomain);
      return; // Don't initialize widget
    }

    this.init();
  }

  OrchisChatWidget.prototype = {
    init: async function() {
      // Show chat UI immediately for faster loading
      this.injectStyles();
      this.createWidget();
      this.bindEvents();

      // Start minimized (Apple-style)
      this.isMinimized = true;
      this.currentView = 'chat'; // 'chat' or 'popup'
      this.activePopup = null;

      // Load config in background
      this.fetchAgentConfig().then(() => {
        // Update UI with loaded config
        this.updateWidgetWithConfig();

        // Trigger popups
        this.handlePopupTriggers();
      });
    },

    handlePopupTriggers: function() {
      const popups = this.config.popups;

      console.log('🎯 handlePopupTriggers called');
      console.log('🔍 DEBUG: popups:', popups);
      console.log('🔍 DEBUG: isReturnUser:', this.sessionManager.isReturnUser);

      // If no popups configured, return
      if (!popups || popups.length === 0) {
        console.log('⚠️ No popups configured');
        return;
      }

      console.log(`✅ Found ${popups.length} popup(s) to process`);

      // Process each popup
      popups.forEach((popup, index) => {
        console.log(`🔄 Processing popup #${index + 1}:`, popup);
        const trigger = popup.trigger;
        const triggerValue = popup.triggerValue || 3;

        // Check if THIS specific popup was already shown AND not expired
        const shownKey = `orchis_popup_shown_${popup.id}_${this.sessionManager.anonymousUserId}`;
        const expiryKey = `orchis_popup_expiry_${popup.id}_${this.sessionManager.anonymousUserId}`;
        const savedExpiry = localStorage.getItem(expiryKey);

        // If manually closed (no expiry), don't show again
        if (localStorage.getItem(shownKey) && !savedExpiry) {
          console.log('🚫 Popup manually closed:', popup.id);
          return;
        }

        // If expired, clean up and allow re-showing
        if (savedExpiry && Date.now() > parseInt(savedExpiry)) {
          console.log('⏰ Popup expired, cleaning up:', popup.id);
          localStorage.removeItem(shownKey);
          localStorage.removeItem(expiryKey);
          // Continue to show popup
        }

        // If still active (shown + not expired), skip
        if (localStorage.getItem(shownKey) && savedExpiry && Date.now() <= parseInt(savedExpiry)) {
          console.log('✅ Popup still active, re-showing:', popup.id);
          // Re-show the popup with remaining time
          setTimeout(() => this.showPopup(popup), 1500);
          return;
        }

        console.log(`🎯 Setting up trigger: ${trigger} for popup: ${popup.title}`);

        switch (trigger) {
          case 'first_visit':
            if (!this.sessionManager.isReturnUser) {
              console.log('✅ First visit trigger matched, showing popup in 1.5s');
              setTimeout(() => this.showPopup(popup), 1500);
            } else {
              console.log('❌ First visit trigger NOT matched (user is returning)');
            }
            break;

          case 'return_visit':
            if (this.sessionManager.isReturnUser) {
              console.log('✅ Return visit trigger matched, showing popup in 1.5s');
              setTimeout(() => this.showPopup(popup), 1500);
            } else {
              console.log('❌ Return visit trigger NOT matched (user is new)');
            }
            break;

          case 'exit_intent':
            console.log('✅ Setting up exit intent listener');
            this.setupExitIntentListener(popup);
            break;

          case 'time_delay':
            console.log(`✅ Setting up time delay: ${triggerValue}s`);
            setTimeout(() => this.showPopup(popup), triggerValue * 1000);
            break;

          case 'scroll_depth':
            console.log(`✅ Setting up scroll depth: ${triggerValue}%`);
            this.setupScrollDepthListener(popup, triggerValue);
            break;

          default:
            console.warn('⚠️ Unknown trigger type:', trigger);
        }
      });
    },

    setupExitIntentListener: function(popup) {
      console.log('🚪 Exit intent listener setup for:', popup.title);
      let triggered = false;
      document.addEventListener('mouseleave', (e) => {
        console.log('👆 Mouse leave detected at Y:', e.clientY);
        if (!triggered && e.clientY < 10) {
          console.log('✅ Exit intent TRIGGERED! Showing popup');
          triggered = true;
          this.showPopup(popup);
        }
      });
    },

    setupScrollDepthListener: function(popup, targetPercent) {
      let triggered = false;
      const checkScroll = () => {
        if (triggered) return;
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= targetPercent) {
          triggered = true;
          this.showPopup(popup);
          window.removeEventListener('scroll', checkScroll);
        }
      };
      window.addEventListener('scroll', checkScroll);
    },

    fetchAgentConfig: async function() {
      try {
        // Fetch from secure backend endpoint - NO Firebase credentials exposed!
        const response = await fetch(`https://us-central1-candelaai.cloudfunctions.net/getAgentConfig?agentId=${this.config.agentId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent config');
        }

        const agentData = await response.json();

        // Update config with backend values
        this.config.projectName = agentData.projectName || this.config.projectName;
        this.config.logoUrl = agentData.logoUrl || this.config.logoUrl;
        this.config.userIcon = agentData.userIcon || 'alien';
        this.config.primaryColor = agentData.primaryColor || this.config.primaryColor;
        this.config.returnUserDiscount = agentData.returnUserDiscount || null;
        this.config.firstTimeDiscount = agentData.firstTimeDiscount || null;
        this.config.popup = agentData.popup || null; // Old popup configuration (backward compat)
        this.config.popups = agentData.popups || []; // New popups array
        this.config.whitelabel = agentData.whitelabel || false; // Growth/Scale plans get whitelabel

        console.log('✅ Agent config loaded securely from backend:', this.config.projectName);
        console.log('🔍 DEBUG: popups array:', this.config.popups);
        console.log('🔍 DEBUG: popups length:', this.config.popups ? this.config.popups.length : 0);
        if (this.config.whitelabel) {
          console.log('🎨 Whitelabel mode enabled (Growth/Scale plan)');
        }
      } catch (error) {
        console.warn('Failed to fetch agent config, using defaults:', error);
      }
    },

    updateWidgetWithConfig: function() {
      // Logo'yu güncelle (header)
      const avatarContainer = this.container.querySelector('.orchis-agent-avatar');
      if (avatarContainer && this.config.logoUrl) {
        avatarContainer.innerHTML = `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />`;
      }

      // Logo'yu güncelle (minimized)
      const minimizedLogo = this.container.querySelector('.orchis-minimized-logo');
      if (minimizedLogo && this.config.logoUrl) {
        minimizedLogo.innerHTML = `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />`;
      }

      // Proje adını güncelle (header)
      const agentName = this.container.querySelector('.orchis-agent-name');
      if (agentName) {
        agentName.textContent = this.config.projectName;
      }

      // Proje adını güncelle (minimized view)
      const minimizedProjectName = this.container.querySelector('.orchis-minimized-project-name');
      if (minimizedProjectName) {
        minimizedProjectName.textContent = this.config.projectName;
      }

      // Placeholder'ı güncelle
      const input = this.container.querySelector('.orchis-input');
      if (input) {
        input.placeholder = `Ask anything about ${this.config.projectName}...`;
      }

      // Whitelabel durumunu güncelle
      if (this.config.whitelabel) {
        const poweredBy = this.container.querySelector('.orchis-powered-by');
        if (poweredBy) {
          poweredBy.remove();
        }
      }

      console.log('🎨 Widget UI updated with config');
    },

    injectStyles: function() {
      if (document.getElementById('orchis-widget-styles')) return;

      const styles = `
        /* Apple-Style Widget Container */
        .orchis-widget-container {
          position: fixed;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .orchis-position-bottom-right { bottom: 20px; right: 20px; }
        .orchis-position-bottom-left { bottom: 20px; left: 20px; }
        .orchis-position-top-right { top: 20px; right: 20px; }
        .orchis-position-top-left { top: 20px; left: 20px; }

        /* Main Widget - Dark Glass Apple Style */
        .orchis-chat-widget {
          background: linear-gradient(180deg, rgba(45, 45, 45, 1) 50%, rgba(5, 5, 5, 1) 100%);
          backdrop-filter: blur(60px) saturate(180%);
          -webkit-backdrop-filter: blur(60px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 0 0.5px rgba(255, 255, 255, 0.08) inset,
            0 1px 0 0 rgba(255, 255, 255, 0.12) inset;
          display: flex;
          flex-direction: column;
          transition: all 0.6s cubic-bezier(0.34, 1.1, 0.4, 1);
          position: relative;
        }

        /* Minimized State - Apple Widget Style */
        .orchis-chat-widget.orchis-minimized {
          width: 160px;
          height: 160px;
          border-radius: 24px;
          cursor: pointer;
        }

        .orchis-chat-widget.orchis-minimized:hover {
          transform: scale(1.03);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.7),
            0 0 0 0.5px rgba(255, 255, 255, 0.12) inset,
            0 1px 0 0 rgba(255, 255, 255, 0.15) inset;
        }

        .orchis-chat-widget.orchis-minimized:active {
          transform: scale(0.98);
        }

        /* Expanded Chat - Horizontal Minimal (like minimized but 2x wider) */
        .orchis-chat-widget.orchis-expanded-chat {
          width: 320px;
          height: 160px;
          border-radius: 24px;
        }

        /* Hide messages area in expanded-chat mode */
        .orchis-chat-widget.orchis-expanded-chat .orchis-messages {
          display: none;
        }

        /* Compact header in expanded-chat mode */
        .orchis-chat-widget.orchis-expanded-chat .orchis-top-bar {
          padding: 12px;
          height: auto;
        }

        .orchis-chat-widget.orchis-expanded-chat .orchis-agent-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
        }

        .orchis-chat-widget.orchis-expanded-chat .orchis-agent-name {
          font-size: 14px;
        }

        .orchis-chat-widget.orchis-expanded-chat .orchis-close-btn {
          width: 28px;
          height: 28px;
          font-size: 16px;
        }

        /* Compact input area in expanded-chat mode */
        .orchis-chat-widget.orchis-expanded-chat .orchis-input-container {
          padding: 12px 16px;
        }

        .orchis-chat-widget.orchis-expanded-chat .orchis-input {
          font-size: 13px;
          padding: 10px 14px;
        }

        /* Expanded Popup - Large Square Widget */
        .orchis-chat-widget.orchis-expanded-popup {
          width: 380px;
          height: 400px;
          border-radius: 36px;
        }

        /* Full Chat Mode - Horizontal Minimal (like minimized but wider) */
        .orchis-chat-widget.orchis-full-chat {
          width: 320px;
          height: 130px;
          border-radius: 24px;
        }

        /* Hide messages area in full-chat mode */
        .orchis-chat-widget.orchis-full-chat .orchis-messages {
          display: none;
        }

        /* Compact header in full-chat mode */
        .orchis-chat-widget.orchis-full-chat .orchis-top-bar {
          padding: 12px 16px;
          min-height: auto;
        }

        .orchis-chat-widget.orchis-full-chat .orchis-agent-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
        }

        .orchis-chat-widget.orchis-full-chat .orchis-agent-name {
          font-size: 14px;
        }

        .orchis-chat-widget.orchis-full-chat .orchis-close-btn {
          width: 28px;
          height: 28px;
          font-size: 16px;
        }

        /* Compact input area in full-chat mode */
        .orchis-chat-widget.orchis-full-chat .orchis-input-container {
          padding: 12px 16px;
        }

        .orchis-chat-widget.orchis-full-chat .orchis-input {
          font-size: 13px;
          padding: 10px 14px;
        }
        
        @keyframes orchis-slideIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Widget Content Container */
        .orchis-widget-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          height: 100%;
          position: relative;
          opacity: 1;
          transition: opacity 0.4s cubic-bezier(0.34, 1.1, 0.4, 1);
        }

        .orchis-minimized .orchis-widget-content {
          opacity: 0;
          pointer-events: none;
        }

        /* Hide widget content when popup is active */
        .orchis-expanded-popup .orchis-widget-content {
          opacity: 0;
          pointer-events: none;
        }

        /* Compact layout for chat view - Clean padding */
        .orchis-expanded-chat .orchis-top-bar {
          padding: 16px 20px;
          min-height: unset;
          flex-shrink: 0;
        }

        .orchis-expanded-chat .orchis-agent-avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
        }

        .orchis-expanded-chat .orchis-agent-name {
          font-size: 16px;
          font-weight: 700;
        }

        .orchis-expanded-chat .orchis-close-btn {
          width: 32px;
          height: 32px;
          font-size: 20px;
        }

        .orchis-expanded-chat .orchis-messages {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .orchis-expanded-chat .orchis-input-section {
          padding: 8px;
          flex-shrink: 0;
        }

        .orchis-expanded-chat .orchis-input-wrapper {
          padding: 6px 12px;
          border-radius: 22px;
        }

        .orchis-expanded-chat .orchis-input {
          font-size: 15px;
        }

        .orchis-expanded-chat .orchis-send-button {
          width: 34px;
          height: 34px;
          font-size: 17px;
        }

        /* Minimized Icon Container - Apple Layout */
        .orchis-minimized-icon {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.5s cubic-bezier(0.34, 1.1, 0.4, 1);
          cursor: pointer;
          padding: 16px;
          pointer-events: none;
        }

        .orchis-minimized .orchis-minimized-icon {
          transform: scale(1);
          opacity: 1;
          pointer-events: all;
        }

        .orchis-minimized-logo {
          position: fixed;
          top: 16px;
          right: 16px;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 9999; /* Üstte kalması için */
}

        .orchis-minimized-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Main Content Area in Minimized */
        .orchis-minimized-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: end;
          width: 100%;
          gap: 4px;
        }

        /* Bottom Info in Minimized */
        .orchis-minimized-footer {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Minimized Popup Preview - Apple Widget Layout */
        .orchis-minimized-popup-preview {
          display: flex;
          flex-direction: column;
          align-items: flex-start;  /* sola hizalama */
          justify-content: flex-end;  /* içerikler alta yaslı */
          width: 100%;
          height: 100%;
          padding: 10px;
          pointer-events: none;
          transform-origin: bottom left;
        }


          /* Ayırıcı çizgi (bottom info'nun üstüne) */
          .orchis-minimized-popup-preview .divider {
            width: 100%;
            height: 1px;
            background: rgba(255, 255, 255, 0.1); /* ince ve soft çizgi */
            margin: 8px 0 4px 0;
          }

        .orchis-minimized.orchis-has-popup .orchis-minimized-icon {
          display: none;
        }

        .orchis-minimized.orchis-has-popup .orchis-minimized-popup-preview {
          display: flex;
          pointer-events: all;
        }

        /* Hide minimized preview when expanded */
        .orchis-expanded-popup .orchis-minimized-popup-preview,
        .orchis-expanded-chat .orchis-minimized-popup-preview {
          display: none !important;
        }

        /* Discount Preview - Apple Style */
        .orchis-mini-discount-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .orchis-mini-discount-icon {
          font-size: 20px;
        }

        .orchis-mini-discount-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .orchis-mini-discount-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .orchis-mini-discount-value {
          font-size: 52px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.98);
          letter-spacing: -2px;
          line-height: 0.9;
        }

        .orchis-mini-discount-label {
          font-size: 17px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .orchis-mini-discount-footer {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Video Preview - Apple Style */
        .orchis-mini-video-thumb {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 36px;
          object-fit: cover;
        }

        .orchis-mini-video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
          border-radius: 36px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .orchis-mini-video-title {
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.3;
        }

        /* Announcement Preview - Apple Style */
        .orchis-mini-announcement-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .orchis-mini-announcement-icon {
          font-size: 18px;
        }

        .orchis-mini-announcement-badge {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .orchis-mini-announcement-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .orchis-mini-announcement-title {
          font-size: 17px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.25;
          margin-bottom: 4px;
        }

        .orchis-mini-announcement-text {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Top Bar - Apple Style Header */
        .orchis-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          flex-shrink: 0;
        }

        .orchis-agent-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orchis-agent-avatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
        }

        .orchis-agent-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .orchis-agent-name {
          color: rgba(255, 255, 255, 0.98);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.4px;
        }

        .orchis-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.1, 0.4, 1);
          font-size: 20px;
          line-height: 1;
        }

        .orchis-close-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: rgba(255, 255, 255, 0.98);
          transform: scale(1.05);
        }

        .orchis-close-btn:active {
          transform: scale(0.95);
        }
        
        /* Messages Container - Apple iMessage Style */
        .orchis-messages {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        /* When no messages, take minimal space */
        .orchis-messages:empty {
          padding: 0;
          min-height: 0;
        }

        .orchis-messages::-webkit-scrollbar {
          width: 7px;
        }

        .orchis-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .orchis-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 4px;
        }

        .orchis-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        /* Message Bubbles - Apple iMessage Style */
        .orchis-message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: orchis-message-in 0.4s cubic-bezier(0.34, 1.1, 0.4, 1);
        }

        @keyframes orchis-message-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .orchis-message-content {
          max-width: 82%;
          padding: 12px 16px;
          border-radius: 20px;
          font-size: 15px;
          line-height: 1.5;
          letter-spacing: -0.2px;
        }

        .orchis-user-message .orchis-message-content {
          background: rgba(0, 122, 255, 0.9);
          color: rgba(255, 255, 255, 0.98);
          align-self: flex-end;
          border-bottom-right-radius: 6px;
        }

        .orchis-assistant-message .orchis-message-content {
          background: rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.95);
          align-self: flex-start;
          border-bottom-left-radius: 6px;
        }

        /* Input Section - Apple Style */
        .orchis-input-section {
          padding: 4px;
          border-top: 0.5px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .orchis-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 22px;
          padding: 4px;
          transition: all 0.3s cubic-bezier(0.34, 1.1, 0.4, 1);
        }

        .orchis-input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.14);
        }

        .orchis-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: rgba(255, 255, 255, 0.98);
          font-size: 14px;
          font-weight: 400;
          letter-spacing: -0.3px;
          padding: 4px;
        }

        .orchis-input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        .orchis-send-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 1);
          border: none;
          color: black;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.1, 0.4, 1);
          font-size: 18px;
          flex-shrink: 0;
        }

        .orchis-send-button:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 16px rgba(255, 255, 255, 0.45);
        }

        .orchis-send-button:active {
          transform: scale(0.96);
        }

        .orchis-send-button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Loading Animation - Apple Style */
        .orchis-loading {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-self: flex-start;
        }

        .orchis-typing-dots {
          display: flex;
          gap: 5px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          border-bottom-left-radius: 5px;
        }

        .orchis-dot {
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          animation: orchis-bounce 1.4s ease-in-out infinite both;
        }

        .orchis-dot:nth-child(1) { animation-delay: -0.32s; }
        .orchis-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes orchis-bounce {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        /* Popup View Container - Replaces Chat */
        .orchis-popup-view {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.34, 1.1, 0.4, 1);
        }

        .orchis-popup-view.active {
          opacity: 1;
          transform: scale(1);
          pointer-events: all;
        }

        .orchis-popup-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
        }

        /* Popup Layout for 3x3 (360x360) */
        .orchis-expanded-popup .orchis-popup-content {
          padding: 20px;
          gap: 14px;
          justify-content: flex-start;
          margin-top: 20px;
        }

        .orchis-expanded-popup .orchis-top-bar {
          padding: 14px 20px;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
        }

        .orchis-expanded-popup .orchis-popup-view {
          padding: 0;
        }

        .orchis-expanded-popup .orchis-agent-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
        }

        .orchis-expanded-popup .orchis-agent-name {
          font-size: 15px;
        }

        .orchis-expanded-popup .orchis-close-btn {
          width: 30px;
          height: 30px;
          font-size: 19px;
        }

        .orchis-popup-title {
          font-size: 20px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.5px;
          line-height: 1.3;
        }

        .orchis-expanded-popup .orchis-popup-title {
          font-size: 18px;
        }

        .orchis-popup-message {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
          letter-spacing: -0.2px;
        }

        .orchis-expanded-popup .orchis-popup-message {
          font-size: 14px;
        }

        .orchis-popup-code {
          padding: 16px 28px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          font-size: 28px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.1, 0.4, 1);
        }

        .orchis-expanded-popup .orchis-popup-code {
          padding: 14px 24px;
          font-size: 24px;
        }

        .orchis-popup-code:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: scale(1.05);
        }

        .orchis-popup-code:active {
          transform: scale(0.95);
        }

        .orchis-popup-timer {
          font-size: 17px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          font-family: 'SF Mono', 'Monaco', monospace;
        }

        .orchis-expanded-popup .orchis-popup-timer {
          font-size: 15px;
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .orchis-chat-widget.orchis-full-chat {
            width: calc(100vw - 60px);
            height: 130px;
            max-width: 320px;
          }

          .orchis-chat-widget.orchis-minimized {
            width: 110px;
            height: 110px;
          }

          .orchis-chat-widget.orchis-expanded-chat {
            width: calc(100vw - 80px);
            height: 130px;
            max-width: 300px;
          }

          .orchis-chat-widget.orchis-expanded-popup {
            width: 330px;
            height: 330px;
          }

          .orchis-minimized-logo {
            width: 55px;
            height: 55px;
          }

          .orchis-mini-video-thumb {
            width: 90px;
            height: 90px;
          }

          .orchis-mini-discount-value {
            font-size: 30px;
          }
        }
      `;
      
      const styleSheet = document.createElement('style');
      styleSheet.id = 'orchis-widget-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    },

    createWidget: function() {
      const container = document.createElement('div');
      container.className = `orchis-widget-container orchis-position-${this.config.position}`;
      container.innerHTML = this.getWidgetHTML();
      
      document.body.appendChild(container);
      this.container = container;
    },

    getWidgetHTML: function() {
      return `
        <div class="orchis-chat-widget orchis-minimized">
          <!-- Minimized Icon - Apple Widget Layout -->
          <div class="orchis-minimized-icon">
            <!-- Header with Logo -->
            <div class="orchis-minimized-logo">
              ${this.config.logoUrl ?
                `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />` :
                '<div style="width:100%;height:100%;background:rgba(255,255,255,0.15);border-radius:8px;"></div>'
              }
            </div>

            <!-- Main Content Area -->
            <div class="orchis-minimized-main" style="gap: 2px; margin:0px 0px 10px 0px;">
              <div style="font-size: 13px; font-weight: 700; color: lime; letter-spacing: -0.3px; line-height: 1.2;">
                CHAT
              </div>
              <div class="orchis-minimized-project-name" style="font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.98); letter-spacing: -1.5px; line-height: 0.7; margin-top: 4px; text-transform: uppercase;">
                ${this.config.projectName}
              </div>
              <div style="font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.98); letter-spacing: -1.5px; line-height: 0.7; margin-top: 4px; text-transform: uppercase;">
                ASSISTANT
              </div>
            </div>

            <!-- Footer Info -->
            <div class="orchis-minimized-footer">
              <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.5px;">Tap to chat</div>
            </div>
          </div>

          <!-- Popup Preview (shown when popup is active) -->
          <div class="orchis-minimized-popup-preview">
            <!-- Content will be dynamically inserted -->
          </div>

          <!-- Chat View - Main Content -->
          <div class="orchis-widget-content">
            <!-- Top Bar -->
            <div class="orchis-top-bar">
              <div class="orchis-agent-info">
                <div class="orchis-agent-avatar">
                  ${this.config.logoUrl ?
                    `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />` :
                    ''
                  }
                </div>
                <div class="orchis-agent-name">${this.config.projectName || 'Assistant'}</div>
              </div>
              <button class="orchis-close-btn">−</button>
            </div>

            <!-- Messages Container -->
            <div class="orchis-messages"></div>

            <!-- Input Section -->
            <div class="orchis-input-section">
              <div class="orchis-input-wrapper">
                <input
                  type="text"
                  class="orchis-input"
                  placeholder="Message..."
                />
                <button class="orchis-send-button">➚</button>
              </div>
            </div>
          </div>

          <!-- Popup View - Replaces Chat -->
          <div class="orchis-popup-view">
            <div class="orchis-top-bar">
              <div class="orchis-agent-info">
                <div class="orchis-agent-avatar">
                  ${this.config.logoUrl ?
                    `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />` :
                    ''
                  }
                </div>
                <div class="orchis-agent-name">${this.config.projectName || 'Assistant'}</div>
              </div>
              <button class="orchis-close-popup-btn orchis-close-btn">×</button>
            </div>
            <div class="orchis-popup-content">
              <!-- Popup content will be dynamically inserted here -->
            </div>
          </div>
        </div>
      `;
    },

    bindEvents: function() {
      const sendBtn = this.container.querySelector('.orchis-send-button');
      const input = this.container.querySelector('.orchis-input');
      const closeBtn = this.container.querySelector('.orchis-close-btn');
      const minimizedIcon = this.container.querySelector('.orchis-minimized-icon');
      const closePopupBtn = this.container.querySelector('.orchis-close-popup-btn');

      // Send message
      sendBtn.addEventListener('click', () => this.sendMessage());

      // Enter key to send
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Only expand from minimized when input is focused
      input.addEventListener('focus', () => {
        if (this.isMinimized) {
          this.expandToChat();
        }
        // Don't auto-expand to full size - let messages grow widget naturally
      });

      // Minimize button (close in expanded view)
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimize();
      });

      // Click minimized icon to expand
      minimizedIcon.addEventListener('click', () => {
        // If there's an active popup, open it
        if (this.activePopup) {
          this.expandWithPopup();
        } else {
          this.expandToChat();
        }
      });

      // Close popup button
      closePopupBtn.addEventListener('click', () => {
        this.closePopup();
      });
    },

    expand: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      widget.classList.remove('orchis-minimized');
      widget.classList.remove('orchis-expanded-popup');
      widget.classList.remove('orchis-full-chat');
      widget.classList.add('orchis-expanded-chat');
      this.isMinimized = false;

      // Focus input after expansion
      setTimeout(() => {
        const input = this.container.querySelector('.orchis-input');
        if (input) input.focus();
      }, 400);
    },

    expandToChat: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      widget.classList.remove('orchis-minimized');
      widget.classList.remove('orchis-full-chat');
      widget.classList.remove('orchis-expanded-popup');
      widget.classList.add('orchis-expanded-chat');
      this.isMinimized = false;
    },

    expandWithPopup: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      const popupView = this.container.querySelector('.orchis-popup-view');

      widget.classList.remove('orchis-minimized');
      widget.classList.remove('orchis-full-chat');
      widget.classList.remove('orchis-expanded-chat');
      widget.classList.add('orchis-expanded-popup');
      this.isMinimized = false;

      // Show popup view
      setTimeout(() => {
        popupView.classList.add('active');
      }, 100);
    },

    minimize: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      const popupView = this.container.querySelector('.orchis-popup-view');

      widget.classList.add('orchis-minimized');
      widget.classList.remove('orchis-expanded-chat');
      widget.classList.remove('orchis-expanded-popup');
      widget.classList.remove('orchis-full-chat');
      this.isMinimized = true;

      // Hide popup view but keep activePopup for preview
      popupView.classList.remove('active');
    },

    closePopup: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      const popupView = this.container.querySelector('.orchis-popup-view');

      // Remove has-popup class
      widget.classList.remove('orchis-has-popup');

      // Hide popup view
      popupView.classList.remove('active');

      // Back to minimized or chat
      if (this.isMinimized) {
        this.minimize();
      } else {
        widget.classList.remove('orchis-expanded-popup');
        widget.classList.add('orchis-expanded-chat');
      }

      this.currentView = 'chat';
      this.activePopup = null;
    },

    openPopup: function(popup) {
      this.activePopup = popup;
      this.currentView = 'popup';

      const widget = this.container.querySelector('.orchis-chat-widget');
      const contentType = popup.contentType || 'discount';

      // Add has-popup class for minimized preview
      widget.classList.add('orchis-has-popup');

      // Build minimized preview
      this.buildMinimizedPreview(popup, contentType);

      // Build popup content (but don't show yet)
      const popupView = this.container.querySelector('.orchis-popup-view');
      const popupContent = popupView.querySelector('.orchis-popup-content');

      let html = '';
      switch (contentType) {
        case 'discount':
          html = this.buildPopupDiscountContent(popup);
          break;
        case 'announcement':
          html = this.buildPopupAnnouncementContent(popup);
          break;
        case 'video':
          html = this.buildPopupVideoContent(popup);
          break;
        case 'link':
          html = this.buildPopupLinkContent(popup);
          break;
      }

      popupContent.innerHTML = html;

      // Setup interactions
      this.setupPopupInteractions(popup, contentType);

      // DON'T auto-expand - user will click to expand
    },

    buildMinimizedPreview: function(popup, contentType) {
      const previewContainer = this.container.querySelector('.orchis-minimized-popup-preview');
      let html = '';

      switch (contentType) {
        case 'discount':
          // Extract percentage from message or title
          const discountMatch = (popup.title + popup.message).match(/(\d+)%/);
          const percentage = discountMatch ? discountMatch[1] : '20';
          html = `
            <!-- Inner content -->
<div style="display: flex; flex-direction: column; align-items: left; justify-content: space-between; height: 100%; padding: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;">

  <!-- Promo code -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="font-size: 12px; font-weight: 700; color: #facc15; letter-spacing: 0.5px;">FIRST20</div>
  </div>

  <!-- Percentage -->
  <div style="font-size: 36px; font-weight: 900; color: white; letter-spacing: -2px; line-height: 1;">
    ${percentage}%
  </div>

<div class="divider"></div>

  <!-- Bottom info -->
<div style="
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
">
  <div style="display: flex; align-items: baseline; gap: 4px;">
    <div style="font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85);">
      6.49
    </div>
    <div style="font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.55);">
      Minute
    </div>
  </div>

  <div style="font-size: 10px; font-weight: 700; color: #10b981; letter-spacing: 0.5px;">
    LIMITED
  </div>
</div>
</div>
          `;
          break;

        case 'video':
          let videoId = '';
          const videoUrl = popup.videoUrl || '';
          if (videoUrl.includes('youtube.com/watch')) {
            videoId = new URL(videoUrl).searchParams.get('v');
          } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
          }
          const videoTitle = popup.title || 'Watch Now';
          html = `
            <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg"
                 class="orchis-mini-video-thumb" alt="Video" />
            <div class="orchis-mini-video-overlay">
              <!-- Top corner badge -->
              <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.6); backdrop-filter: blur(20px); padding: 6px 10px; border-radius: 12px; align-self: flex-start;">
                <div style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite;"></div>
                <div style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.95); letter-spacing: 0.3px;">LIVE</div>
              </div>

              <!-- Center play button -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
                  <div style="font-size: 24px; margin-left: 3px;">▶️</div>
                </div>
              </div>

              <!-- Bottom title -->
              <div style="background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%); padding: 12px 0 0 0; width: 100%;">
                <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.98); line-height: 1.3;">${videoTitle}</div>
              </div>
            </div>
          `;
          break;

        case 'announcement':
          const message = popup.message || '';
          html = `
            <!-- Top badge with gradient -->
            <div style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.3) 100%); padding: 6px 12px; border-radius: 14px; border: 1px solid rgba(139,92,246,0.4);">
              <div style="font-size: 16px; line-height: 1;">⭐</div>
              <div style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.95); letter-spacing: 0.5px;">NEW</div>
            </div>

            <!-- Main content with icon -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px;">
              <div style="font-size: 19px; font-weight: 800; color: rgba(255,255,255,0.98); line-height: 1.2; letter-spacing: -0.5px;">${popup.title || 'Announcement'}</div>
              ${message ? `<div style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.65); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${message}</div>` : ''}
            </div>

            <!-- Bottom action hint -->
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); letter-spacing: 0.3px;">TAP TO READ</div>
              <div style="font-size: 18px; line-height: 1;">📰</div>
            </div>
          `;
          break;

        case 'link':
          html = `
            <!-- Rocket animation top corner -->
            <div style="position: absolute; top: 16px; right: 16px; font-size: 32px; line-height: 1; animation: float 3s ease-in-out infinite;">🚀</div>

            <!-- Main content -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 8px; padding-right: 40px;">
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.2); padding: 6px 12px; border-radius: 12px; align-self: flex-start; border: 1px solid rgba(16,185,129,0.3);">
                <div style="font-size: 11px; font-weight: 800; color: #10b981; letter-spacing: 0.5px;">EXPLORE</div>
              </div>
              <div style="font-size: 18px; font-weight: 800; color: rgba(255,255,255,0.98); line-height: 1.25; letter-spacing: -0.5px;">${popup.title || 'New Link'}</div>
              ${popup.message ? `<div style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); line-height: 1.3;">${popup.message}</div>` : ''}
            </div>

            <!-- Bottom CTA -->
            <div style="width: 100%; padding: 10px 14px; background: rgba(16,185,129,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid rgba(16,185,129,0.2);">
              <div style="font-size: 12px; font-weight: 800; color: #10b981; letter-spacing: 0.3px;">VISIT NOW</div>
              <div style="font-size: 14px;">→</div>
            </div>
          `;
          break;
      }

      previewContainer.innerHTML = html;

      // Start countdown if discount
      if (contentType === 'discount') {
        this.startMiniCountdown();
      }
    },

    startMiniCountdown: function() {
      const countdownEl = this.container.querySelector('#mini-countdown');
      if (!countdownEl) return;

      let timeLeft = 60 * 60; // 60 minutes in seconds

      const updateCountdown = () => {
        if (timeLeft <= 0) {
          countdownEl.textContent = '00:00';
          countdownEl.style.color = '#ef4444';
          return;
        }

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Change color when less than 5 minutes
        if (timeLeft < 300) {
          countdownEl.style.color = '#f59e0b';
        }
        if (timeLeft < 60) {
          countdownEl.style.color = '#ef4444';
        }

        timeLeft--;
        setTimeout(updateCountdown, 1000);
      };

      updateCountdown();
    },

    buildPopupDiscountContent: function(popup) {
      const code = popup.code || 'SAVE20';
      return `
        <div class="orchis-popup-title">${popup.title || 'Special Offer'}</div>
        <div class="orchis-popup-message">${popup.message || 'Get a discount on your purchase'}</div>
        <div class="orchis-popup-code" data-code="${code}">${code}</div>
        <div class="orchis-popup-timer" id="popup-timer">60:00</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px;">Tap to copy</div>
      `;
    },

    buildPopupAnnouncementContent: function(popup) {
      return `
        <div class="orchis-popup-title">${popup.title || 'Announcement'}</div>
        <div class="orchis-popup-message">${popup.message || ''}</div>
      `;
    },

    buildPopupVideoContent: function(popup) {
      let videoUrl = popup.videoUrl || '';
      let videoId = '';

      if (videoUrl.includes('youtube.com/watch')) {
        videoId = new URL(videoUrl).searchParams.get('v');
        videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&mute=1`;
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&mute=1`;
      }

      return `
        ${popup.title ? `<div class="orchis-popup-title">${popup.title}</div>` : ''}
        ${popup.message ? `<div class="orchis-popup-message">${popup.message}</div>` : ''}
        <iframe
          class="orchis-video-iframe"
          width="100%"
          height="200"
          src="${videoUrl}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          style="border-radius: 16px; margin-top: 8px;">
        </iframe>
      `;
    },

    buildPopupLinkContent: function(popup) {
      const buttonLink = popup.buttonLink || '#';
      return `
        <div class="orchis-popup-title">${popup.title || 'Check this out!'}</div>
        ${popup.message ? `<div class="orchis-popup-message">${popup.message}</div>` : ''}
        <a href="${buttonLink}" target="_blank"
           style="padding: 14px 28px; background: rgba(0,122,255,1); color: white;
                  border-radius: 14px; text-decoration: none; font-weight: 600;
                  font-size: 15px; margin-top: 10px; display: inline-block;
                  transition: all 0.3s cubic-bezier(0.34, 1.1, 0.4, 1);"
           onmouseover="this.style.transform='scale(1.05)'"
           onmouseout="this.style.transform='scale(1)'"
           onmousedown="this.style.transform='scale(0.95)'"
           onmouseup="this.style.transform='scale(1.05)'">
          Visit Link
        </a>
      `;
    },

    setupPopupInteractions: function(popup, contentType) {
      if (contentType === 'discount') {
        const codeEl = this.container.querySelector('.orchis-popup-code');
        const timerEl = this.container.querySelector('#popup-timer');

        if (codeEl) {
          const code = popup.code;
          codeEl.addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
              codeEl.style.background = 'rgba(34, 197, 94, 0.3)';
              setTimeout(() => {
                codeEl.style.background = 'rgba(255, 255, 255, 0.15)';
              }, 1000);
            });
          });
        }

        // Start timer
        if (timerEl) {
          const shownKey = `orchis_popup_shown_${popup.id}_${this.sessionManager.anonymousUserId}`;
          const expiryKey = `orchis_popup_expiry_${popup.id}_${this.sessionManager.anonymousUserId}`;
          const savedExpiry = localStorage.getItem(expiryKey);

          let expiryTime;
          if (savedExpiry) {
            expiryTime = parseInt(savedExpiry);
          } else {
            expiryTime = Date.now() + (60 * 60 * 1000);
            localStorage.setItem(expiryKey, expiryTime.toString());
            localStorage.setItem(shownKey, 'true');
          }

          this.startPopupCountdown(timerEl, expiryTime, shownKey, expiryKey);
        }
      }
    },

    startPopupCountdown: function(timerEl, expiryTime, shownKey, expiryKey) {
      const update = () => {
        const remaining = expiryTime - Date.now();

        if (remaining <= 0) {
          this.closePopup();
          localStorage.removeItem(shownKey);
          localStorage.removeItem(expiryKey);
          return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining < 5 * 60 * 1000) {
          timerEl.style.color = 'rgba(239, 68, 68, 0.9)';
        }

        requestAnimationFrame(update);
      };

      update();
    },

    addWelcomeMessage: function() {
      // Context-aware welcome based on current page
      const currentPath = window.location.pathname.toLowerCase();
      const currentURL = window.location.href.toLowerCase();

      let welcomeMessage = '';
      let contextualSuggestions = [];

      // Smart context detection
      if (currentPath.includes('pricing') || currentURL.includes('pricing')) {
        welcomeMessage = `Hi! I see you're checking out pricing. I can help you find the perfect plan for your needs!`;
        contextualSuggestions = ['Compare plans', 'Enterprise pricing', 'Free trial details'];
      } else if (currentPath.includes('features') || currentURL.includes('features')) {
        welcomeMessage = `Hey! Exploring our features? I'd love to show you what ${this.config.projectName} can do!`;
        contextualSuggestions = ['Key features', 'Integrations', 'See demo'];
      } else if (currentPath.includes('about') || currentPath.includes('contact')) {
        welcomeMessage = `Hi there! Looking to get in touch? I can help answer questions or schedule a call!`;
        contextualSuggestions = ['Book a demo', 'Talk to sales', 'Contact support'];
      } else if (currentPath.includes('blog') || currentPath.includes('resources')) {
        welcomeMessage = `Hey! Reading our content? Feel free to ask me anything about ${this.config.projectName}!`;
        contextualSuggestions = ['Getting started', 'Use cases', 'Documentation'];
      } else if (this.userName) {
        welcomeMessage = `Welcome back, ${this.userName}! What would you like to know about ${this.config.projectName}?`;
      } else {
        welcomeMessage = `Hi! I'm ${this.config.projectName}'s AI assistant. What's your name so I can personalize our session?`;
      }

      this.messages.push({
        id: 1,
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        suggestions: contextualSuggestions
      });

      this.updateMessages();
    },


    // HMAC generation helper
    async generateHMAC(payload, secretKey) {
      if (!secretKey || typeof crypto === 'undefined' || !crypto.subtle) {
        return null; // No HMAC if no secret or no crypto support
      }
      
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secretKey);
        const messageData = encoder.encode(payload);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('HMAC generation failed:', error);
        return null;
      }
    },

    async sendMessage() {
      const input = this.container.querySelector('.orchis-input');
      const message = input.value.trim();

      if (!message || this.isLoading || this.isTyping) return;

      // Expand when sending message
      this.expand();

      // Start chat session if first message
      if (this.messages.length === 0) {
        this.sessionManager.startChat();
      }

      // Add user message to both local and session manager
      this.addMessage('user', message);
      this.sessionManager.addMessage(message, true);

      input.value = '';
      this.setLoading(true);

      try {
        // Enhanced prompt for better conversation
        const enhancedMessage = this.userName 
          ? `User ${this.userName} asks: ${message}`
          : message;

        // Send conversation history with token limit (~2000 tokens = ~8000 chars)
        let recentMessages = [];
        let totalChars = 0;
        const maxChars = 8000;

        // Add messages from newest to oldest until we hit limit
        for (let i = this.messages.length - 1; i >= 0; i--) {
          const msg = this.messages[i];
          const msgLength = msg.content.length;

          if (totalChars + msgLength > maxChars) break;

          recentMessages.unshift({
            role: msg.role,
            content: msg.content
          });
          totalChars += msgLength;
        }

        // Prepare request data
        const timestamp = Date.now();
        const requestData = {
          agentId: this.config.agentId,
          message: enhancedMessage,
          sessionId: this.sessionManager.sessionId,
          anonymousUserId: this.sessionManager.anonymousUserId,
          conversationHistory: recentMessages,
          timestamp: timestamp,
          sessionData: this.sessionManager.sessionData // Include comprehensive session data
        };

        // Generate HMAC if secret key is provided
        if (this.config.secretKey) {
          const payload = `${this.config.agentId}:${enhancedMessage}:${timestamp}`;
          const hmac = await this.generateHMAC(payload, this.config.secretKey);
          if (hmac) {
            requestData.hmac = hmac;
          }
        }

        console.log('🚀 Making request to:', this.config.apiUrl);
        console.log('📦 Request data:', requestData);
        
        const requestBody = JSON.stringify({ data: requestData });
        console.log('📤 Full request body:', requestBody);
        
        const response = await fetch(this.config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);

        const result = await response.json();

        // Check for limit error (429 status)
        if (response.status === 429 && result.error === 'LIMIT_REACHED') {
          this.setLoading(false);
          const limitMsg = `You've reached your monthly message limit. Please upgrade your plan to continue chatting. 🚀`;
          this.addMessage('assistant', limitMsg);
          this.sessionManager.addMessage(limitMsg, false);
          console.warn('📊 Token limit reached:', result.details);
          return;
        }

        if (result.data && result.data.response) {
          this.setLoading(false);
          this.addMessage('assistant', result.data.response);

          // Add assistant response to session manager
          this.sessionManager.addMessage(result.data.response, false);

          // Handle AI analysis if available
          if (result.data.analysis) {
            console.log('🧠 AI Analysis received:', result.data.analysis);
            this.handleAIAnalysis(result.data.analysis);
          }
        } else {
          const errorMsg = 'Sorry, I encountered an error. Please try again.';
          this.addMessage('assistant', errorMsg);
          this.sessionManager.addMessage(errorMsg, false);
          this.setLoading(false);
        }
      } catch (error) {
        console.error('Orchis Widget Error:', error);
        this.sessionManager.trackError(error);
        const errorMsg = 'Sorry, I encountered an error. Please try again.';
        this.addMessage('assistant', errorMsg);
        this.sessionManager.addMessage(errorMsg, false);
        this.setLoading(false);
      }
    },

    handleAIAnalysis: function(analysis) {
      // Store AI analysis in current conversation
      this.sessionManager.sessionData.currentConversation.analysis = analysis;

      console.log('🧠 AI Analysis stored:', {
        mainCategory: analysis.mainCategory,
        subCategory: analysis.subCategory,
        sentiment: analysis.sentimentScore
      });

      // Save updated session
      this.sessionManager.saveSession();
    },

    addMessage: function(role, content) {
      this.messages.push({
        id: Date.now(),
        role,
        content,
        timestamp: new Date()
      });
      
      this.updateMessages();
    },


    updateMessages: function() {
      const messagesContainer = this.container.querySelector('.orchis-messages');
      const html = this.messages.map(message => {
        return `
          <div class="orchis-message orchis-${message.role}-message">
            <div class="orchis-message-content">${message.content}</div>
          </div>
        `;
      }).join('');

      messagesContainer.innerHTML = html + (this.isLoading ? this.getLoadingHTML() : '');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    typeMessage: function(content) {
      this.isTyping = true;
      let currentText = '';
      let index = 0;
      
      const typingInterval = setInterval(() => {
        if (index < content.length) {
          currentText += content[index];
          index++;
          
          // Update the last message content
          if (this.messages.length > 0) {
            this.messages[this.messages.length - 1].content = currentText;
            this.updateMessages();
          }
        } else {
          clearInterval(typingInterval);
          this.isTyping = false;
          this.updateMessages();
        }
      }, 30);
    },

    setLoading: function(loading) {
      this.isLoading = loading;
      const sendBtn = this.container.querySelector('.orchis-send-button');
      sendBtn.disabled = loading;
      this.updateMessages();
    },

    getLoadingHTML: function() {
      return `
        <div class="orchis-loading">
          <div class="orchis-typing-dots">
            <div class="orchis-dot"></div>
            <div class="orchis-dot"></div>
            <div class="orchis-dot"></div>
          </div>
        </div>
      `;
    },

    // Old discount systems removed - now using new popup system

    showPopup: function(popup) {
      if (!popup) return;

      // Simply call openPopup with the new system
      this.openPopup(popup);

      console.log('✨ Popup shown:', popup.contentType, popup.trigger);
    },

    // Old popup builder functions removed - now using new popup view system
  };

  // Global API
  window.OrchisChatbot = {
    init: function(config) {
      if (!config.agentId) {
        console.error('OrchisChatbot: agentId is required');
        return;
      }
      
      if (instances[config.agentId]) {
        console.warn('OrchisChatbot: Widget already initialized for agentId:', config.agentId);
        return instances[config.agentId];
      }
      
      const widget = new OrchisChatWidget(config);
      instances[config.agentId] = widget;
      return widget;
    }
  };

  console.log('🌸 Orchis Chatbot Widget loaded');
})();