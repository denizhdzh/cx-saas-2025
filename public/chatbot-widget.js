// Orchis Chatbot Widget - Standalone Version
(function() {
  'use strict';

  // Widget configuration
  let instances = {};

  // Compact Analytics Manager - Optimized for AI Context
  class ChatSessionManager {
    constructor(agentId) {
      this.agentId = agentId;
      this.pageLoadTime = Date.now();
      this.anonymousUserId = this.generateAnonymousUserId();

      // Load compact analytics
      this.analytics = this.loadAnalytics();

      // Init or continue session (30min idle = new session)
      this.currentSession = this.initOrContinueSession();

      // Track visibility for accurate active time
      this.setupVisibilityTracking();

      // Session data for chat (Firebase sync)
      this.sessionId = this.anonymousUserId + '_' + Date.now();
      this.sessionData = this.initializeSessionData();
      this.chatStartTime = null;
      this.isReturnUser = this.analytics.visits.length > 1;
    }

    // ===== ANALYTICS STORAGE (COMPACT) =====
    loadAnalytics() {
      const key = `orchis_analytics_${this.agentId}_${this.anonymousUserId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.warn('Failed to parse analytics', e);
        }
      }

      // Initialize new analytics
      return {
        userId: this.anonymousUserId,
        firstSeen: Date.now(),

        // Visit history (keep last 20 for pattern analysis)
        visits: [],

        // Page stats (compact)
        pages: {},

        // Widget interaction
        widget: {
          views: 0,
          opens: 0,
          closes: 0
        },

        // Popup tracking
        popups: {
          shown: [],
          clicked: [],
          dismissed: []
        }
      };
    }

    saveAnalytics() {
      const key = `orchis_analytics_${this.agentId}_${this.anonymousUserId}`;

      // Keep only last 20 visits to save space
      if (this.analytics.visits.length > 20) {
        this.analytics.visits = this.analytics.visits.slice(-20);
      }

      localStorage.setItem(key, JSON.stringify(this.analytics));
      console.log('💾 Analytics saved');
    }

    // ===== SESSION MANAGEMENT =====
    initOrContinueSession() {
      const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
      const lastSession = this.analytics.visits[this.analytics.visits.length - 1];
      const now = Date.now();

      // Check if continuing existing session or new
      if (lastSession && !lastSession.end && (now - lastSession.start) < SESSION_TIMEOUT) {
        // Continue existing session
        console.log('⏰ Continuing existing session');
        return lastSession;
      }

      // New session - close previous if exists
      if (lastSession && !lastSession.end) {
        lastSession.end = now;
        lastSession.duration = now - lastSession.start;
      }

      // Create new session
      const newSession = {
        start: now,
        end: null,
        pages: [{
          url: window.location.href,
          title: document.title,
          enter: now,
          exit: null,
          active: 0
        }],
        activeTime: 0,
        idleTime: 0,
        referrer: document.referrer || 'direct'
      };

      this.analytics.visits.push(newSession);
      this.saveAnalytics();

      console.log(`📊 New session #${this.analytics.visits.length} started`);
      return newSession;
    }

    // ===== PAGE TRACKING =====
    trackPageView(url, title) {
      const now = Date.now();

      // Close previous page
      if (this.currentSession.pages.length > 0) {
        const lastPage = this.currentSession.pages[this.currentSession.pages.length - 1];
        if (!lastPage.exit) {
          lastPage.exit = now;
          lastPage.duration = now - lastPage.enter;
        }
      }

      // Add new page
      this.currentSession.pages.push({
        url,
        title,
        enter: now,
        exit: null,
        active: 0
      });

      // Update page stats
      if (!this.analytics.pages[url]) {
        this.analytics.pages[url] = {v: 0, t: 0}; // v=views, t=time
      }
      this.analytics.pages[url].v++;

      this.saveAnalytics();
    }

    // ===== VISIBILITY TRACKING =====
    setupVisibilityTracking() {
      this.isVisible = !document.hidden;
      this.lastVisibilityChange = Date.now();

      document.addEventListener('visibilitychange', () => {
        const now = Date.now();
        const elapsed = now - this.lastVisibilityChange;

        if (document.hidden) {
          // Tab became hidden - add to active time
          this.currentSession.activeTime += elapsed;
          const currentPage = this.currentSession.pages[this.currentSession.pages.length - 1];
          if (currentPage) currentPage.active += elapsed;
        } else {
          // Tab became visible - previous time was idle
          this.currentSession.idleTime += elapsed;
        }

        this.isVisible = !document.hidden;
        this.lastVisibilityChange = now;
      });

      // Periodic save (every 10 seconds when active)
      setInterval(() => {
        if (this.isVisible) {
          const now = Date.now();
          const elapsed = now - this.lastVisibilityChange;
          this.currentSession.activeTime += elapsed;

          const currentPage = this.currentSession.pages[this.currentSession.pages.length - 1];
          if (currentPage) {
            currentPage.active += elapsed;

            // Update page stats
            const url = currentPage.url;
            if (this.analytics.pages[url]) {
              this.analytics.pages[url].t = (this.analytics.pages[url].t || 0) + elapsed;
            }
          }

          this.lastVisibilityChange = now;
          this.saveAnalytics();
        }
      }, 10000);
    }

    // ===== WIDGET TRACKING =====
    trackWidgetOpen() {
      this.analytics.widget.opens++;
      this.saveAnalytics();
    }

    trackWidgetClose() {
      this.analytics.widget.closes++;
      this.saveAnalytics();
    }

    // ===== POPUP TRACKING =====
    trackPopupShown(popupId) {
      if (!this.analytics.popups.shown.includes(popupId)) {
        this.analytics.popups.shown.push(popupId);
        this.saveAnalytics();
      }
    }

    trackPopupClicked(popupId) {
      if (!this.analytics.popups.clicked.includes(popupId)) {
        this.analytics.popups.clicked.push(popupId);
        this.saveAnalytics();
      }
    }

    trackPopupDismissed(popupId) {
      if (!this.analytics.popups.dismissed.includes(popupId)) {
        this.analytics.popups.dismissed.push(popupId);
        this.saveAnalytics();
      }
    }

    // ===== COMPUTED METRICS (for AI) =====
    getTotalVisits() {
      return this.analytics.visits.length;
    }

    getTotalActiveTime() {
      return this.analytics.visits.reduce((sum, v) => sum + (v.activeTime || 0), 0);
    }

    getAvgSessionDuration() {
      const completed = this.analytics.visits.filter(v => v.end);
      if (completed.length === 0) return 0;
      const total = completed.reduce((sum, v) => sum + (v.end - v.start), 0);
      return Math.round(total / completed.length / 1000); // seconds
    }

    getDaysSinceFirst() {
      return Math.floor((Date.now() - this.analytics.firstSeen) / (24 * 60 * 60 * 1000));
    }

    getDaysSinceLast() {
      if (this.analytics.visits.length < 2) return 0;
      const lastVisit = this.analytics.visits[this.analytics.visits.length - 2];
      return Math.floor((Date.now() - lastVisit.start) / (24 * 60 * 60 * 1000));
    }

    getReturningPattern() {
      const visits = this.analytics.visits;
      if (visits.length < 2) return 'new';
      if (visits.length < 3) return 'second_time';

      // Calculate avg days between visits
      let totalGap = 0;
      for (let i = 1; i < visits.length; i++) {
        totalGap += visits[i].start - visits[i-1].start;
      }
      const avgGapDays = totalGap / (visits.length - 1) / (24 * 60 * 60 * 1000);

      if (avgGapDays < 1) return 'frequent';      // Multiple times per day
      if (avgGapDays < 7) return 'regular';       // Weekly visitor
      if (avgGapDays < 30) return 'occasional';   // Monthly
      return 'rare';                               // Rare visitor
    }

    getBounceRate() {
      const completed = this.analytics.visits.filter(v => v.end);
      if (completed.length === 0) return 0;

      const bounces = completed.filter(v => {
        const duration = v.end - v.start;
        return duration < 5000 && v.pages.length === 1; // < 5 seconds, 1 page
      }).length;

      return Math.round((bounces / completed.length) * 100);
    }

    getEngagementScore() {
      // 0-100 score based on multiple factors
      let score = 0;

      // Visit frequency (max 30 points)
      const pattern = this.getReturningPattern();
      if (pattern === 'frequent') score += 30;
      else if (pattern === 'regular') score += 25;
      else if (pattern === 'occasional') score += 15;
      else if (pattern === 'second_time') score += 10;

      // Active time (max 25 points)
      const avgSession = this.getAvgSessionDuration();
      if (avgSession > 300) score += 25;        // > 5 min
      else if (avgSession > 120) score += 20;   // > 2 min
      else if (avgSession > 60) score += 15;    // > 1 min
      else if (avgSession > 30) score += 10;    // > 30 sec

      // Page depth (max 20 points)
      const uniquePages = Object.keys(this.analytics.pages).length;
      if (uniquePages >= 5) score += 20;
      else if (uniquePages >= 3) score += 15;
      else if (uniquePages >= 2) score += 10;
      else score += 5;

      // Widget interaction (max 15 points)
      if (this.analytics.widget.opens > 3) score += 15;
      else if (this.analytics.widget.opens > 1) score += 10;
      else if (this.analytics.widget.opens > 0) score += 5;

      // Low bounce rate bonus (max 10 points)
      const bounceRate = this.getBounceRate();
      if (bounceRate < 20) score += 10;
      else if (bounceRate < 50) score += 5;

      return Math.min(100, score);
    }

    getMostVisitedPage() {
      let maxViews = 0;
      let topPage = null;

      for (const [url, stats] of Object.entries(this.analytics.pages)) {
        if (stats.v > maxViews) {
          maxViews = stats.v;
          topPage = url;
        }
      }

      return topPage;
    }

    // ===== AI SUMMARY =====
    getAISummary() {
      // Compact summary for AI context
      return {
        // Identity
        userId: this.anonymousUserId,
        daysSinceFirst: this.getDaysSinceFirst(),
        daysSinceLast: this.getDaysSinceLast(),

        // Behavior
        visits: this.getTotalVisits(),
        returning: this.getReturningPattern(),
        engagement: this.getEngagementScore(),
        bounceRate: this.getBounceRate(),

        // Activity
        avgSession: this.getAvgSessionDuration(),
        totalActive: Math.round(this.getTotalActiveTime() / 1000),
        pagesViewed: Object.keys(this.analytics.pages).length,
        topPage: this.getMostVisitedPage(),

        // Current session
        currentPage: window.location.href,
        timeOnSite: Math.round((Date.now() - this.pageLoadTime) / 1000),

        // Interactions
        widgetOpens: this.analytics.widget.opens,
        popupsSeen: this.analytics.popups.shown.length,

        // Context
        referrer: this.currentSession.referrer,
        device: this.getDeviceType(),
        browser: this.getBrowserInfo()
      };
    }

    // ===== HYBRID USER ID (Device Fingerprint + Cookie + localStorage) =====
    generateAnonymousUserId() {
      const storageKey = `orchis_user_${this.agentId}`;
      const cookieName = `orchis_uid_${this.agentId}`;

      // 1. Try localStorage first (fastest)
      let storedUserId = localStorage.getItem(storageKey);
      if (storedUserId) {
        console.log('✅ User ID from localStorage:', storedUserId);
        this.setCookie(cookieName, storedUserId, 365); // Refresh cookie
        return storedUserId;
      }

      // 2. Try cookie (survives localStorage clear)
      storedUserId = this.getCookie(cookieName);
      if (storedUserId) {
        console.log('✅ User ID from cookie (localStorage cleared):', storedUserId);
        localStorage.setItem(storageKey, storedUserId); // Restore to localStorage
        return storedUserId;
      }

      // 3. Try device fingerprint (survives both clears)
      const deviceId = this.generateDeviceFingerprint();
      const fingerprintKey = `orchis_fp_${this.agentId}_${deviceId}`;
      storedUserId = localStorage.getItem(fingerprintKey);

      if (storedUserId) {
        console.log('✅ User ID from fingerprint:', storedUserId);
        localStorage.setItem(storageKey, storedUserId);
        this.setCookie(cookieName, storedUserId, 365);
        return storedUserId;
      }

      // 4. Generate new user ID
      const newUserId = 'anon_' + deviceId + '_' + Date.now().toString(36);
      console.log('🆕 Generated new user ID:', newUserId);

      // Save to all storage methods
      localStorage.setItem(storageKey, newUserId);
      localStorage.setItem(fingerprintKey, newUserId);
      this.setCookie(cookieName, newUserId, 365);

      return newUserId;
    }

    // Generate robust device fingerprint
    generateDeviceFingerprint() {
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
      ].join('|');

      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }

    // Cookie helpers
    setCookie(name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    getCookie(name) {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }

    // ===== DEVICE & BROWSER =====
    getDeviceType() {
      const width = window.innerWidth;
      if (width <= 768) return 'mobile';
      if (width <= 1024) return 'tablet';
      return 'desktop';
    }

    getBrowserInfo() {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Unknown';
    }

    // ===== CHAT SESSION DATA (Firebase sync) =====
    initializeSessionData() {
      const summary = this.getAISummary();

      return {
        userId: this.anonymousUserId,
        sessionId: this.sessionId,
        agentId: this.agentId,

        // Include AI summary in session data
        userAnalytics: summary,

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
          isReturnUser: this.isReturnUser
        },

        pageContent: this.scrapePageContent(),

        currentConversation: {
          conversationId: 'conv_' + Date.now(),
          startedAt: new Date().toISOString(),
          messages: [],
          analysis: null,
          metrics: {
            messageCount: 0,
            duration: 0,
            avgResponseTime: 0,
            responseTimes: []
          }
        }
      };
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
        if (messageData.responseTime) {
          this.sessionData.currentConversation.metrics.responseTimes.push(messageData.responseTime);
          const times = this.sessionData.currentConversation.metrics.responseTimes;
          this.sessionData.currentConversation.metrics.avgResponseTime =
            Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000);
        }
      }

      this.saveSession();
    }

    scrapePageContent() {
      try {
        const title = document.title || '';
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).join(', ');
        return {
          title,
          headings: h1s,
          url: window.location.href
        };
      } catch (error) {
        return {
          title: document.title || '',
          url: window.location.href
        };
      }
    }

    saveSession() {
      localStorage.setItem(`orchis_session_${this.sessionId}`, JSON.stringify(this.sessionData));
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
      projectName: config.projectName || 'Assistant',
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

      // Start expanded
      this.isMinimized = false;

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

      // Check if ANY popup is already visible in DOM
      const existingBanner = this.container?.querySelector('.orchis-offer-banner');
      if (existingBanner) {
        console.log('⚠️ Popup already visible, skipping all triggers');
        return;
      }

      // If no popups configured, check old discount configs for backward compatibility
      if (!popups || popups.length === 0) {
        console.log('⚠️ No popups found, checking old discount system...');
        // Backward compatibility with old discount system (MUTUALLY EXCLUSIVE)
        if (this.sessionManager.isReturnUser && this.config.returnUserDiscount?.enabled) {
          setTimeout(() => this.showReturnUserDiscount(), 1500);
        } else if (!this.sessionManager.isReturnUser && this.config.firstTimeDiscount?.enabled) {
          setTimeout(() => this.showFirstTimeDiscount(), 1500);
        }
        return;
      }

      console.log(`✅ Found ${popups.length} popup(s) to process`);

      // Track if we've already scheduled a popup to show
      let popupScheduled = false;

      // Process each popup (but only show ONE)
      popups.forEach((popup, index) => {
        if (popupScheduled) {
          console.log(`⏭️ Skipping popup #${index + 1} - another popup already scheduled`);
          return;
        }

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
        } else if (localStorage.getItem(shownKey) && savedExpiry) {
          // Still active - re-show it (handles hard refresh)
          console.log('🔄 Popup active but not in DOM (hard refresh?) - showing again');
          // Continue to show popup
        }

        console.log(`🎯 Setting up trigger: ${trigger} for popup: ${popup.title}`);

        switch (trigger) {
          case 'first_visit':
            if (!this.sessionManager.isReturnUser) {
              console.log('✅ First visit trigger matched, showing popup in 1.5s');
              setTimeout(() => this.showPopup(popup), 1500);
              popupScheduled = true;
            } else {
              console.log('❌ First visit trigger NOT matched (user is returning)');
            }
            break;

          case 'return_visit':
            if (this.sessionManager.isReturnUser) {
              console.log('✅ Return visit trigger matched, showing popup in 1.5s');
              setTimeout(() => this.showPopup(popup), 1500);
              popupScheduled = true;
            } else {
              console.log('❌ Return visit trigger NOT matched (user is new)');
            }
            break;

          case 'exit_intent':
            console.log('✅ Setting up exit intent listener');
            this.setupExitIntentListener(popup);
            popupScheduled = true;
            break;

          case 'time_delay':
            console.log(`✅ Setting up time delay: ${triggerValue}s`);
            setTimeout(() => this.showPopup(popup), triggerValue * 1000);
            popupScheduled = true;
            break;

          case 'scroll_depth':
            console.log(`✅ Setting up scroll depth: ${triggerValue}%`);
            this.setupScrollDepthListener(popup, triggerValue);
            popupScheduled = true;
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

      // Proje adını güncelle
      const agentName = this.container.querySelector('.orchis-agent-name');
      if (agentName) {
        agentName.textContent = this.config.projectName;
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
        .orchis-widget-container {
          position: fixed;
          z-index: 2147483647;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .orchis-position-bottom-right { bottom: 10px; right: 10px; }
        .orchis-position-bottom-left { bottom: 10px; left: 10px; }
        .orchis-position-top-right { top: 10px; right: 10px; }
        .orchis-position-top-left { top: 10px; left: 10px; }
        
        .orchis-chat-widget {
          background: linear-gradient(135deg, rgba(22, 22, 22, 0.70) 0%, rgba(44, 44, 44, 0.92) 100%);
          backdrop-filter: blur(7px) saturate(180%);
          -webkit-backdrop-filter: blur(10px) saturate(180%);
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 25px;
          width: 100%;
          max-width: 22rem;
          min-width: 22rem;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 1px 2px rgba(255, 255, 255, 0.05) inset;
          display: flex;
          flex-direction: column;
          transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          animation: orchis-slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          max-height: 600px;
        }

        .orchis-chat-widget.orchis-minimized {
          max-height: 80px;
          min-width: 22rem;
          max-width: 22rem;
        }
        
        @keyframes orchis-slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .orchis-chat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255, 255, 255, 0);
          opacity: 1;
          max-height: 60px;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          overflow: hidden;
        }

        .orchis-minimized .orchis-chat-header {
          opacity: 0;
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .orchis-agent-avatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(120, 120, 128, 0.16);
          flex-shrink: 0;
        }
        
        .orchis-agent-avatar img {
          width: 32px;
          height: 32px;
          object-fit: cover;
          border-radius: 0px;
        }
        
        .orchis-default-avatar {
          color: white;
          font-size: 16px;
        }
        
        .orchis-agent-details {
          flex: 1;
          min-width: 0;
        }
        
        .orchis-agent-name {
          color: rgba(255, 255, 255, 0.85);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .orchis-status {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }
        
        .orchis-status-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .orchis-minimize-btn {
          background: none;
          border: none;
          color: #a8a29e;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
          line-height: 1;
        }

        .orchis-minimize-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .orchis-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: none;
          opacity: 1;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .orchis-messages:not(:empty) {
          display: block;
        }

        .orchis-minimized .orchis-messages {
          opacity: 0;
          max-height: 0;
          padding: 0;
          display: none !important;
        }
        
        .orchis-message {
          margin-bottom: 0px;
        }
        
        .orchis-message-label {
          color: rgba(255, 255, 255, 0.45);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .orchis-message-content {
          font-size: 14px;
          line-height: 1.5;
        }

        .orchis-assistant-message .orchis-message-content {
          color: rgba(255, 255, 255, 0.75);
        }

        .orchis-user-message .orchis-message-content {
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
        }

        .orchis-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .orchis-suggestion-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .orchis-suggestion-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
        }

        .orchis-suggestion-btn:active {
          transform: translateY(0) scale(0.95);
        }

        .orchis-input-section {
          padding: 2px;
          background: rgba(255, 255, 255, 0);
          border-radius: 0px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .orchis-minimized-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: none;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(120, 120, 128, 0.16);
          flex-shrink: 0;
          margin-left: 3px;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .orchis-minimized .orchis-minimized-logo {
          display: flex;
          opacity: 1;
          transform: scale(1);
        }

        .orchis-minimized-logo img {
          width: 32px;
          height: 32px;
          object-fit: cover;
          border-radius: 10%;
        }

        .orchis-input-container {
          background: rgba(255, 255, 255, 0);
          border: none;
          border-radius: 20px;
          padding: 3px 5px 3px 3px;
          transition: all 0.2s ease;
          flex: 1;
        }

        .orchis-input-container:focus-within {
          border-color: none;
          box-shadow: none;
        }

        .orchis-input-label {
          color: rgba(255, 255, 255, 1);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }

        .orchis-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .orchis-input {
          flex: 1;
          padding: 8px;
          font-size: 15px;
          background: rgba(255, 255, 255, 0);
          color: rgba(255, 255, 255, 0.85);
          border: none;
          border-radius: 8px;
          outline: none;
        }

        /* Mobile zoom fix - 16px prevents auto-zoom on iOS/Android */
        @media (max-width: 768px) {
          .orchis-input {
            font-size: 16px;
            transform-origin: left center;
          }
        }

        .orchis-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .orchis-send-button {
          padding: 8px 16px;
          color: black;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .orchis-send-button:hover {
          background: rgba(188, 188, 188, 1);
          transform: scale(1.02);
        }
        
        .orchis-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .orchis-powered-by {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 2px 2px 8px 2px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          opacity: 1;
          max-height: 30px;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          overflow: hidden;
        }

        .orchis-minimized .orchis-powered-by {
          opacity: 0;
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .orchis-logo {
          width: 12px;
          height: 12px;
          border-radius: 1px;
        }

        .orchis-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: underline;
          font-weight: 700;
          transition: color 0.2s ease;
        }

        .orchis-link:hover {
          color: rgba(255, 255, 255, 1);
        }

        .orchis-loading {
          margin-bottom: 12px;
        }
        
        .orchis-typing-dots {
          display: flex;
          gap: 4px;
        }
        
        .orchis-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: orchis-bounce 1.4s ease-in-out infinite both;
        }
        
        .orchis-dot:nth-child(1) { animation-delay: -0.32s; }
        .orchis-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes orchis-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          } 40% {
            transform: scale(1);
          }
        }
        
        .orchis-toggle-button {
          width: 56px;
          height: 56px;
          background: ${this.config?.primaryColor || '#f97316'};
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .orchis-toggle-button:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }
        
        .orchis-toggle-icon {
          transition: transform 0.3s ease;
        }
        
        .orchis-toggle-button.active .orchis-toggle-icon {
          transform: rotate(180deg);
        }
        
        .orchis-offer-banner {
          padding: 12px 16px;
          animation: orchis-offer-slide-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: top;
        }

        @keyframes orchis-offer-slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px) scaleY(0.8);
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            max-height: 100px;
            padding-top: 12px;
            padding-bottom: 12px;
          }
        }

        @keyframes orchis-offer-slide-out {
          from {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            max-height: 100px;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scaleY(0.8);
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
        }

        .orchis-offer-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orchis-offer-divider {
          width: 1px;
          height: 32px;
          background: white;
          flex-shrink: 0;
        }

        .orchis-offer-text {
          flex: 1;
          min-width: 0;
        }

        .orchis-offer-title {
          color: white;
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 2px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .orchis-timer {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }

        .orchis-timer-urgent {
          animation: orchis-timer-pulse 1s ease-in-out infinite;
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        @keyframes orchis-timer-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .orchis-offer-subtitle {
          color: rgba(255, 255, 255, 0.75);
          font-size: 12px;
          line-height: 1.4;
        }

        .orchis-coupon-code {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .orchis-coupon-code strong {
          color: white;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .orchis-copy-icon {
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .orchis-coupon-code:hover {
          transform: scale(1.05);
        }

        .orchis-coupon-code:hover strong {
          transform: scale(1.05);
        }

        .orchis-coupon-code:hover .orchis-copy-icon {
          opacity: 1;
          transform: scale(1);
        }

        .orchis-coupon-code:active {
          transform: scale(0.95);
        }

        .orchis-coupon-code.orchis-copied {
          animation: orchis-copy-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes orchis-copy-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .orchis-close-offer {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .orchis-close-offer:hover {
          color: white;
          transform: rotate(90deg);
        }

        .orchis-offer-banner {
          opacity: 1;
          max-height: 100px;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          overflow: hidden;
        }

        .orchis-minimized .orchis-offer-banner {
          opacity: 0;
          max-height: 0;
          padding: 0;
        }

        @media (max-width: 768px) {
          .orchis-widget-container {
            display: none !important;
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
        <div class="orchis-chat-widget">
          <div class="orchis-chat-header">
            <div class="orchis-agent-avatar">
              ${this.config.logoUrl ?
                `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />` :
                '<div class="orchis-default-avatar"></div>'
              }
            </div>
            <div class="orchis-agent-details">
              <div class="orchis-agent-name"></div>
              <div class="orchis-status">Online now</div>
            </div>
            <div class="orchis-status-dot"></div>
            <button class="orchis-minimize-btn" title="Minimize">−</button>
          </div>

          <!-- Offer banner will be inserted here for return users -->

          <div class="orchis-messages"></div>

          <div class="orchis-input-section">
            <div class="orchis-minimized-logo">
              ${this.config.logoUrl ?
                `<img src="${this.config.logoUrl}" alt="${this.config.projectName}" />` :
                '<div class="orchis-default-avatar"></div>'
              }
            </div>
            <div class="orchis-input-container">
              <div class="orchis-input-row">
                <input
                  type="text"
                  class="orchis-input"
                  placeholder="Ask me anything..."
                />
                <button class="orchis-send-button">
                  send
                </button>
              </div>
            </div>

          </div>
          ${!this.config.whitelabel ? `
          <div class="orchis-powered-by">
              <img src="https://orchis.app/logo.webp" alt="Orchis" class="orchis-logo" />
              <span>Powered by <a href="https://orchis.app" target="_blank" class="orchis-link">ORCHIS</a></span>
            </div>
          ` : ''}
        </div>
      `;
    },

    bindEvents: function() {
      const sendBtn = this.container.querySelector('.orchis-send-button');
      const input = this.container.querySelector('.orchis-input');
      const minimizeBtn = this.container.querySelector('.orchis-minimize-btn');

      sendBtn.addEventListener('click', () => this.sendMessage());

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Expand when input is focused
      input.addEventListener('focus', () => {
        this.expand();
      });

      // Minimize button
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMinimize();
      });
    },

    expand: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      widget.classList.remove('orchis-minimized');
      this.isMinimized = false;

      // Track widget open
      this.sessionManager.trackWidgetOpen();
    },

    minimize: function() {
      const widget = this.container.querySelector('.orchis-chat-widget');
      widget.classList.add('orchis-minimized');
      this.isMinimized = true;

      // Track widget close
      this.sessionManager.trackWidgetClose();
    },

    toggleMinimize: function() {
      if (this.isMinimized) {
        this.expand();
      } else {
        this.minimize();
      }
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
        // Send last 10 messages (5 user + 5 assistant pairs) for AI continuity
        let recentMessages = [];
        const maxMessages = 10;

        // Get last 10 messages (or all if less than 10)
        const startIndex = Math.max(0, this.messages.length - maxMessages);
        for (let i = startIndex; i < this.messages.length; i++) {
          const msg = this.messages[i];
          recentMessages.push({
            role: msg.role,
            content: msg.content
          });
        }

        console.log(`📚 Sending ${recentMessages.length} messages to AI (last ${Math.min(maxMessages, this.messages.length)} messages)`);

        // Prepare request data
        const timestamp = Date.now();
        const requestData = {
          agentId: this.config.agentId,
          message: message, // Send raw message - AI gets userName from backend savedUserName
          sessionId: this.sessionManager.sessionId,
          anonymousUserId: this.sessionManager.anonymousUserId,
          conversationHistory: recentMessages,
          timestamp: timestamp,
          sessionData: this.sessionManager.sessionData // Include comprehensive session data
        };

        // Generate HMAC if secret key is provided
        if (this.config.secretKey) {
          const payload = `${this.config.agentId}:${message}:${timestamp}`;
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

          // Save userName if AI detected it
          if (result.data.userName && !this.userName) {
            this.userName = result.data.userName;
            localStorage.setItem(`chatbot_user_${this.config.agentId}`, result.data.userName);
            console.log(`👤 User name saved: ${this.userName}`);
          }

          // Warn if question was off-topic
          if (result.data.isRelevant === false) {
            console.log('⚠️ Question was off-topic, AI provided redirect message');
          }

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
        let suggestionsHTML = '';
        if (message.suggestions && message.suggestions.length > 0) {
          suggestionsHTML = `
            <div class="orchis-suggestions">
              ${message.suggestions.map(suggestion => `
                <button class="orchis-suggestion-btn" data-suggestion="${suggestion}">${suggestion}</button>
              `).join('')}
            </div>
          `;
        }

        return `
          <div class="orchis-message orchis-${message.role}-message">
            <div class="orchis-message-label">${message.role === 'user' ? 'You' : this.config.projectName || ''}</div>
            <div class="orchis-message-content">${message.content}${this.isTyping && this.messages[this.messages.length - 1].id === message.id ? '<span style="animation: blink 1s infinite;">|</span>' : ''}</div>
            ${suggestionsHTML}
          </div>
        `;
      }).join('');

      messagesContainer.innerHTML = html + (this.isLoading ? this.getLoadingHTML() : '');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Add click handlers for suggestions
      const suggestionBtns = messagesContainer.querySelectorAll('.orchis-suggestion-btn');
      suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const suggestion = btn.dataset.suggestion;
          this.container.querySelector('.orchis-input').value = suggestion;
          this.sendMessage();
        });
      });
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
          <div class="orchis-message-label">${this.config.projectName}</div>
          <div class="orchis-typing-dots">
            <div class="orchis-dot"></div>
            <div class="orchis-dot"></div>
            <div class="orchis-dot"></div>
          </div>
        </div>
      `;
    },

    showReturnUserDiscount: function() {
      const discountConfig = this.config.returnUserDiscount;

      // Check if discount is enabled and configured
      if (!discountConfig || !discountConfig.enabled) return;

      // Check if already shown and expired
      const shownKey = `orchis_discount_shown_${this.sessionManager.anonymousUserId}`;
      const expiryKey = `orchis_discount_expiry_${this.sessionManager.anonymousUserId}`;
      const savedExpiry = localStorage.getItem(expiryKey);

      if (savedExpiry && Date.now() > parseInt(savedExpiry)) {
        // Offer expired, clean up
        localStorage.removeItem(shownKey);
        localStorage.removeItem(expiryKey);
        return;
      }

      if (localStorage.getItem(shownKey) && !savedExpiry) {
        // Old format (no expiry), don't show again
        return;
      }

      // Insert offer banner after header
      const header = this.container.querySelector('.orchis-chat-header');
      if (!header) return;

      const offerBanner = document.createElement('div');
      offerBanner.className = 'orchis-offer-banner';
      const couponCode = discountConfig.code || 'WELCOME15';
      offerBanner.innerHTML = `
        <div class="orchis-offer-content">
          <div class="orchis-offer-divider"></div>
          <div class="orchis-offer-text">
            <div class="orchis-offer-title">
              ${discountConfig.title || 'Welcome back!'}
              <span class="orchis-timer">10:00</span>
            </div>
            <div class="orchis-offer-subtitle">
              Get 15% off with code
              <span class="orchis-coupon-code" data-code="${couponCode}">
                <strong>${couponCode}</strong>
                <svg class="orchis-copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
            </div>
          </div>
          <button class="orchis-close-offer">×</button>
        </div>
      `;

      // Insert after header
      header.parentNode.insertBefore(offerBanner, header.nextSibling);

      // Add copy functionality
      const couponEl = offerBanner.querySelector('.orchis-coupon-code');
      couponEl.addEventListener('click', () => {
        navigator.clipboard.writeText(couponCode).then(() => {
          couponEl.classList.add('orchis-copied');
          setTimeout(() => couponEl.classList.remove('orchis-copied'), 1500);
        });
      });

      // Add close functionality with animation
      const closeBtn = offerBanner.querySelector('.orchis-close-offer');
      closeBtn.addEventListener('click', () => {
        offerBanner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        setTimeout(() => offerBanner.remove(), 400);
      });

      // Countdown timer (10 minutes)
      const timerEl = offerBanner.querySelector('.orchis-timer');

      // Get or create expiry time
      let expiryTime;
      if (savedExpiry) {
        expiryTime = parseInt(savedExpiry);
        console.log('🔄 Continuing offer timer from localStorage');
      } else {
        expiryTime = Date.now() + (10 * 60 * 1000);
        localStorage.setItem(expiryKey, expiryTime.toString());
      }

      const updateTimer = () => {
        const remaining = expiryTime - Date.now();
        if (remaining <= 0) {
          offerBanner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
          setTimeout(() => {
            offerBanner.remove();
            // Clean up localStorage when expired
            localStorage.removeItem(shownKey);
            localStorage.removeItem(expiryKey);
          }, 400);
          return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Pulse animation when < 1 minute
        if (remaining < 60000) {
          timerEl.classList.add('orchis-timer-urgent');
        }

        requestAnimationFrame(updateTimer);
      };

      updateTimer();

      // Mark as shown
      localStorage.setItem(shownKey, 'true');

      console.log('🎁 Return user discount shown:', discountConfig.code);
    },

    showFirstTimeDiscount: function() {
      const discountConfig = this.config.firstTimeDiscount;

      // Check if discount is enabled and configured
      if (!discountConfig || !discountConfig.enabled) return;

      // Check if already shown and expired
      const shownKey = `orchis_first_discount_shown_${this.sessionManager.anonymousUserId}`;
      const expiryKey = `orchis_first_discount_expiry_${this.sessionManager.anonymousUserId}`;
      const savedExpiry = localStorage.getItem(expiryKey);

      if (savedExpiry && Date.now() > parseInt(savedExpiry)) {
        // Offer expired, clean up
        localStorage.removeItem(shownKey);
        localStorage.removeItem(expiryKey);
        return;
      }

      if (localStorage.getItem(shownKey) && !savedExpiry) {
        // Old format (no expiry), don't show again
        return;
      }

      // Insert offer banner after header
      const header = this.container.querySelector('.orchis-chat-header');
      if (!header) return;

      const offerBanner = document.createElement('div');
      offerBanner.className = 'orchis-offer-banner';
      const couponCode = discountConfig.code || 'FIRST20';
      offerBanner.innerHTML = `
        <div class="orchis-offer-content">
          <div class="orchis-offer-divider"></div>
          <div class="orchis-offer-text">
            <div class="orchis-offer-title">
              ${discountConfig.title || 'Welcome! 👋'}
              <span class="orchis-timer">10:00</span>
            </div>
            <div class="orchis-offer-subtitle">
              ${discountConfig.message || 'Get a special discount on your first purchase'}
              <span class="orchis-coupon-code" data-code="${couponCode}">
                <strong>${couponCode}</strong>
                <svg class="orchis-copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
            </div>
          </div>
          <button class="orchis-close-offer">×</button>
        </div>
      `;

      // Insert after header
      header.parentNode.insertBefore(offerBanner, header.nextSibling);

      // Add copy functionality
      const couponEl = offerBanner.querySelector('.orchis-coupon-code');
      couponEl.addEventListener('click', () => {
        navigator.clipboard.writeText(couponCode).then(() => {
          couponEl.classList.add('orchis-copied');
          setTimeout(() => couponEl.classList.remove('orchis-copied'), 1500);
        });
      });

      // Add close functionality with animation
      const closeBtn = offerBanner.querySelector('.orchis-close-offer');
      closeBtn.addEventListener('click', () => {
        offerBanner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        setTimeout(() => offerBanner.remove(), 400);
      });

      // Countdown timer (10 minutes)
      const timerEl = offerBanner.querySelector('.orchis-timer');

      // Get or create expiry time
      let expiryTime;
      if (savedExpiry) {
        expiryTime = parseInt(savedExpiry);
        console.log('🔄 Continuing offer timer from localStorage');
      } else {
        expiryTime = Date.now() + (10 * 60 * 1000);
        localStorage.setItem(expiryKey, expiryTime.toString());
      }

      const updateTimer = () => {
        const remaining = expiryTime - Date.now();
        if (remaining <= 0) {
          offerBanner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
          setTimeout(() => {
            offerBanner.remove();
            // Clean up localStorage when expired
            localStorage.removeItem(shownKey);
            localStorage.removeItem(expiryKey);
          }, 400);
          return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Pulse animation when < 1 minute
        if (remaining < 60000) {
          timerEl.style.animation = 'orchis-timer-pulse 1s infinite';
        }

        requestAnimationFrame(updateTimer);
      };

      updateTimer();

      // Mark as shown
      localStorage.setItem(shownKey, 'true');

      console.log('🎁 First time discount shown:', discountConfig.code);
    },

    showPopup: function(popup) {
      if (!popup) return;

      const header = this.container.querySelector('.orchis-chat-header');
      if (!header) return;

      // Setup expiry tracking (1 hour)
      const shownKey = `orchis_popup_shown_${popup.id}_${this.sessionManager.anonymousUserId}`;
      const expiryKey = `orchis_popup_expiry_${popup.id}_${this.sessionManager.anonymousUserId}`;

      // Get or create expiry time
      let expiryTime;
      const savedExpiry = localStorage.getItem(expiryKey);
      if (savedExpiry) {
        expiryTime = parseInt(savedExpiry);
        console.log('🔄 Continuing popup timer from localStorage');
      } else {
        expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour
        localStorage.setItem(expiryKey, expiryTime.toString());
        localStorage.setItem(shownKey, 'true');
      }

      const contentType = popup.contentType || 'discount';
      let popupContent = '';

      // Build popup based on content type
      switch (contentType) {
        case 'discount':
          popupContent = this.buildDiscountPopup(popup);
          break;
        case 'announcement':
          popupContent = this.buildAnnouncementPopup(popup);
          break;
        case 'video':
          popupContent = this.buildVideoPopup(popup);
          break;
        case 'link':
          popupContent = this.buildLinkPopup(popup);
          break;
      }

      const offerBanner = document.createElement('div');
      offerBanner.className = 'orchis-offer-banner';
      offerBanner.innerHTML = popupContent;

      // Insert after header
      header.parentNode.insertBefore(offerBanner, header.nextSibling);

      // Track popup shown
      this.sessionManager.trackPopupShown(popup.id);

      // Add close functionality - MANUAL CLOSE (removes expiry)
      const closeBtn = offerBanner.querySelector('.orchis-close-offer');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          offerBanner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
          setTimeout(() => {
            offerBanner.remove();
            // Remove expiry - this marks it as manually closed
            localStorage.removeItem(expiryKey);

            // Track popup dismissed
            this.sessionManager.trackPopupDismissed(popup.id);
            console.log('🚫 Popup manually closed, won\'t show again');
          }, 400);
        });
      }

      // Start countdown timer for discount popups
      if (contentType === 'discount') {
        const timerEl = offerBanner.querySelector('.orchis-timer');
        if (timerEl) {
          this.startPopupTimer(timerEl, expiryTime, offerBanner, shownKey, expiryKey);
        }
      }

      // Handle specific content type interactions
      this.handlePopupInteractions(offerBanner, popup, contentType);

      console.log('✨ Popup shown:', contentType, popup.trigger, 'expires in', Math.round((expiryTime - Date.now()) / 1000 / 60), 'minutes');
    },

    buildDiscountPopup: function(popup) {
      const couponCode = popup.code || 'SAVE20';
      return `
        <div class="orchis-offer-content">
          <div class="orchis-offer-divider"></div>
          <div class="orchis-offer-text">
            <div class="orchis-offer-title">
              ${popup.title || 'Special Offer!'}
              <span class="orchis-timer">60:00</span>
            </div>
            <div class="orchis-offer-subtitle">
              ${popup.message || 'Get a discount with code'}
              <span class="orchis-coupon-code" data-code="${couponCode}">
                <strong>${couponCode}</strong>
                <svg class="orchis-copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </span>
            </div>
          </div>
          <button class="orchis-close-offer">×</button>
        </div>
      `;
    },

    buildAnnouncementPopup: function(popup) {
      const buttonText = popup.buttonText || 'Got it';
      return `
        <div class="orchis-offer-content">
          <div class="orchis-offer-divider"></div>
          <div class="orchis-offer-text">
            <div class="orchis-offer-title">${popup.title || 'Announcement'}</div>
            <div class="orchis-offer-subtitle">${popup.message || ''}</div>
            <button class="orchis-popup-btn">${buttonText}</button>
          </div>
          <button class="orchis-close-offer">×</button>
        </div>
      `;
    },

buildVideoPopup: function(popup) {
  let videoUrl = popup.videoUrl || '';
  let videoId = '';

  if (videoUrl.includes('youtube.com/watch')) {
    videoId = new URL(videoUrl).searchParams.get('v');
    videoUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (videoUrl.includes('youtu.be/')) {
    videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    videoUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return `
    <a href="${videoUrl}" target="_blank" style="text-decoration:none; color:inherit;">
      <div class="orchis-offer-content orchis-video-content" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
        
        <!-- Video Preview -->
        <img 
          src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" 
          alt="Video Preview" 
          style="width:80px; height:60px; border-radius:8px;"
        />

        <!-- Title & Message -->
        <div style="flex:1;">
          <div class="orchis-offer-title" style="margin:0; font-size:14px; font-weight:bold;">
            ${popup.title || 'Watch Video'}
          </div>
          ${popup.message ? `<div class="orchis-offer-subtitle" style="margin:2px 0 0; font-size:12px; color:#ffffff;">
            ${popup.message}
          </div>` : ''}
        </div>

        <button class="orchis-close-offer" style="margin-left:10px;">×</button>
      </div>
    </a>
  `;
},

buildLinkPopup: function(popup) {
  const buttonLink = popup.buttonLink || '#';
  return `
    <div class="orchis-offer-content">
      
      <div class="orchis-offer-text" style="display:flex; flex-direction:column; gap:4px;">
        <div class="orchis-offer-title">${popup.title || 'Check this out!'}</div>
        ${popup.message ? `<div class="orchis-offer-subtitle">${popup.message}</div>` : ''}

        <!-- Link sadece favicon + text -->
        <a href="${buttonLink}" target="_blank" style="display:flex; align-items:center; gap:4px; text-decoration:none; color:#f97316; font-size:12px;">
          <img src="https://www.google.com/s2/favicons?domain=${buttonLink}" style="width:16px; height:16px;" alt="Link icon" />
          ${buttonLink.replace(/^https?:\/\//, '')}
        </a>
      </div>

      <button class="orchis-close-offer">×</button>
    </div>
  `;
},

    startPopupTimer: function(timerEl, expiryTime, banner, shownKey, expiryKey) {
      const updateTimer = () => {
        const remaining = expiryTime - Date.now();

        if (remaining <= 0) {
          // Timer expired, auto-remove popup
          banner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
          setTimeout(() => {
            banner.remove();
            // Clean up localStorage when expired
            localStorage.removeItem(shownKey);
            localStorage.removeItem(expiryKey);
            console.log('⏰ Popup timer expired, cleaned up');
          }, 400);
          return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Pulse animation when < 5 minutes
        if (remaining < 5 * 60 * 1000) {
          timerEl.classList.add('orchis-timer-urgent');
        }

        requestAnimationFrame(updateTimer);
      };

      updateTimer();
    },

    handlePopupInteractions: function(banner, popup, contentType) {
      if (contentType === 'discount') {
        const couponEl = banner.querySelector('.orchis-coupon-code');
        if (couponEl) {
          const couponCode = popup.code;
          couponEl.addEventListener('click', () => {
            // Track popup clicked (coupon copy)
            this.sessionManager.trackPopupClicked(popup.id);

            navigator.clipboard.writeText(couponCode).then(() => {
              couponEl.classList.add('orchis-copied');
              setTimeout(() => couponEl.classList.remove('orchis-copied'), 1500);
            });
          });
        }
      } else if (contentType === 'announcement') {
        const btn = banner.querySelector('.orchis-popup-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            // Track popup clicked
            this.sessionManager.trackPopupClicked(popup.id);

            banner.style.animation = 'orchis-offer-slide-out 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            setTimeout(() => banner.remove(), 400);
          });
        }
      }
    }
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

  // Auto-initialize if data-agent-id attribute is present
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    const scripts = document.querySelectorAll('script[data-agent-id]');
    scripts.forEach(script => {
      const agentId = script.getAttribute('data-agent-id');
      if (agentId && !instances[agentId]) {
        console.log('🚀 Auto-initializing chatbot for agent:', agentId);
        window.OrchisChatbot.init({ agentId: agentId });
      }
    });
  }, 0);
})();