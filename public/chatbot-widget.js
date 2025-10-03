// Orchis Chatbot Widget - Standalone Version
(function() {
  'use strict';

  // Widget configuration
  let instances = {};

  // Comprehensive Chat Session Manager
  class ChatSessionManager {
    constructor(agentId) {
      this.agentId = agentId;
      this.sessionId = this.getOrCreateSessionId();
      this.anonymousUserId = this.generateAnonymousUserId();
      this.sessionData = this.initializeSessionData();
      this.pageLoadTime = Date.now();
      this.chatStartTime = null;
      this.behaviorTracker = new UserBehaviorTracker();
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
      let sessionId = sessionStorage.getItem('orchis_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        sessionStorage.setItem('orchis_session_id', sessionId);
      }
      return sessionId;
    }

    initializeSessionData() {
      return {
        // Identity & Session
        sessionId: this.sessionId,
        anonymousUserId: this.anonymousUserId,
        agentId: this.agentId,
        
        // Location & Context
        userLocation: {
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          referrer: document.referrer || 'direct',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userAgent: navigator.userAgent
        },
        
        // Conversation Metadata
        language: navigator.language || 'en',
        startedAt: null,
        lastMessageAt: null,
        status: 'initialized',
        
        // Content Analysis (will be populated)
        topic: null,
        category: null,
        subCategory: null,
        sentiment: 'neutral',
        intentDetection: null,
        
        // Ticket Integration
        ticketCreated: false,
        ticketId: null,
        ticketStatus: null,
        resolutionTime: null,
        
        // Performance Metrics
        messageCount: 0,
        avgResponseTime: 0,
        userSatisfaction: null,
        responseTimes: [],
        
        // Messages Array
        messages: [],
        
        // User Behavior Analytics
        behaviorMetrics: {
          scrollDepth: 0,
          timeOnPageBeforeChat: 0,
          clicksBeforeChat: 0,
          pageViewCount: this.getPageViewCount(),
          returnVisitor: this.isReturnVisitor(),
          bounceRate: false,
          engagementLevel: 'low',
          deviceType: this.getDeviceType(),
          browserInfo: this.getBrowserInfo()
        },
        
        // Conversation Quality Metrics
        qualityMetrics: {
          emotionProgression: ['neutral'],
          topicSwitchCount: 0,
          clarificationNeeded: 0,
          misunderstandingCount: 0,
          urgencyLevel: 'low'
        },
        
        // Business Intelligence
        businessMetrics: {
          leadQuality: 'unknown',
          productInterest: [],
          pricePoint: null,
          competitorMentioned: false,
          conversionEvent: null
        },
        
        // Technical Performance
        technicalMetrics: {
          responseLatency: [],
          widgetLoadTime: 0,
          errorCount: 0,
          disconnectionCount: 0
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
        this.sessionData.startedAt = new Date().toISOString();
        this.sessionData.status = 'active';
        this.sessionData.behaviorMetrics.timeOnPageBeforeChat = this.chatStartTime - this.pageLoadTime;
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

      this.sessionData.messages.push(messageData);
      this.sessionData.messageCount++;
      this.sessionData.lastMessageAt = messageData.timestamp;

      if (isUser) {
        this.lastUserMessageTime = Date.now();
        this.analyzeUserMessage(message);
        this.detectMisunderstanding(message);
      } else {
        // Track response time
        if (messageData.responseTime) {
          this.sessionData.technicalMetrics.responseLatency.push(messageData.responseTime);
          this.updateAvgResponseTime();
        }
      }

      this.updateEngagementLevel();
      this.saveSession();
    }

    detectMisunderstanding(message) {
      const misunderstandingPhrases = [
        'that\'s not what i meant', 'you misunderstood', 'that\'s not right',
        'no, i meant', 'that\'s not what i asked', 'wrong answer',
        'not what i wanted', 'misunderstood my question'
      ];
      
      if (misunderstandingPhrases.some(phrase => message.toLowerCase().includes(phrase))) {
        this.sessionData.qualityMetrics.misunderstandingCount++;
        console.log('🤔 Misunderstanding detected, count:', this.sessionData.qualityMetrics.misunderstandingCount);
      }
    }

    analyzeUserMessage(message) {
      const text = message.toLowerCase();
      
      // Only trigger AI analysis for important cases
      const shouldAnalyze = this.shouldTriggerAIAnalysis(message);
      console.log('🤖 AI Analysis decision:', shouldAnalyze, 'for message:', message.substring(0, 50));
      
      if (shouldAnalyze) {
        this.queueAIAnalysis(message);
      }
      
      // AI will handle all analysis - no need for manual keywords!
    }

    shouldTriggerAIAnalysis(message) {
      const text = message.toLowerCase();
      const messageCount = this.sessionData.messageCount;
      
      // Always analyze first message
      if (messageCount <= 1) return true;
      
      // Analyze every 5th message to track conversation flow
      if (messageCount % 5 === 0) return true;
      
      // Analyze if critical keywords detected
      const criticalKeywords = [
        'problem', 'issue', 'bug', 'error', 'broken', 'not working',
        'billing', 'payment', 'charge', 'refund', 'cancel',
        'support', 'help', 'urgent', 'asap',
        'price', 'cost', 'demo', 'trial', 'enterprise',
        'competitor', 'alternative', 'vs', 'compare'
      ];
      
      const hasCriticalKeyword = criticalKeywords.some(keyword => 
        text.includes(keyword)
      );
      
      if (hasCriticalKeyword) return true;
      
      // Analyze if negative sentiment detected in keyword analysis
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'frustrated', 'angry'];
      const hasNegative = negativeWords.some(word => text.includes(word));
      
      return hasNegative;
    }

    shouldCreateTicket(message, conversationHistory) {
      const text = message.toLowerCase();
      const messageCount = this.sessionData.messageCount;
      
      // Immediate ticket triggers (high priority)
      const immediateTicketKeywords = [
        'not working', 'broken', 'error', 'bug', 'crash',
        'billing issue', 'payment problem', 'charged wrong',
        'refund', 'cancel subscription', 'account locked',
        'urgent', 'emergency', 'asap', 'critical'
      ];
      
      const hasImmediateTrigger = immediateTicketKeywords.some(keyword => 
        text.includes(keyword)
      );
      
      if (hasImmediateTrigger) {
        console.log('🎫 Immediate ticket trigger:', text.substring(0, 50));
        return { shouldCreate: true, priority: 'high', reason: 'immediate_issue' };
      }
      
      // Support-related issues
      const supportKeywords = [
        'problem', 'issue', 'help', 'support', 'trouble',
        'doesnt work', "doesn't work", 'failed', 'wrong'
      ];
      
      const hasSupportKeyword = supportKeywords.some(keyword => 
        text.includes(keyword)
      );
      
      // Check if negative sentiment + support keyword
      const negativeWords = ['bad', 'terrible', 'awful', 'frustrated', 'angry', 'disappointed'];
      const hasNegative = negativeWords.some(word => text.includes(word));
      
      if (hasSupportKeyword && (hasNegative || messageCount >= 3)) {
        console.log('🎫 Support + negative/long conversation ticket');
        return { shouldCreate: true, priority: 'medium', reason: 'support_issue' };
      }
      
      // Long unresolved conversation (5+ messages with confusion)
      if (messageCount >= 5 && this.sessionData.qualityMetrics.misunderstandingCount >= 2) {
        console.log('🎫 Unresolved conversation ticket');
        return { shouldCreate: true, priority: 'medium', reason: 'unresolved' };
      }
      
      return { shouldCreate: false, reason: 'no_trigger' };
    }


    detectTopic(text) {
      if (text.includes('pricing') || text.includes('cost') || text.includes('plan')) return 'pricing';
      if (text.includes('features') || text.includes('functionality')) return 'features';
      if (text.includes('integration') || text.includes('api')) return 'integration';
      if (text.includes('support') || text.includes('help')) return 'support';
      if (text.includes('security') || text.includes('privacy')) return 'security';
      if (text.includes('setup') || text.includes('installation')) return 'setup';
      return null;
    }

    createTicket() {
      this.sessionData.ticketCreated = true;
      this.sessionData.ticketId = 'TKT_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      this.sessionData.ticketStatus = 'open';
      
      console.log('🎫 Auto-created ticket:', this.sessionData.ticketId, 'for session:', this.sessionData.sessionId);
      this.saveSession();
    }

    createSmartTicket(analysis) {
      this.sessionData.ticketCreated = true;
      this.sessionData.ticketId = 'TKT_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      this.sessionData.ticketStatus = 'open';
      this.sessionData.ticketPriority = analysis.urgency;
      this.sessionData.ticketReason = analysis.ticketReason;
      this.sessionData.aiAnalysis = analysis;
      
      console.log('🎫 AI-powered ticket created:', this.sessionData.ticketId, 'Reason:', analysis.ticketReason);
      this.saveSession();
    }

    updateLeadQuality(text) {
      // AI handles all analysis now - no manual keywords needed
      return;
    }

    queueAIAnalysis(message) {
      // Debounce AI calls to avoid too many requests
      clearTimeout(this.aiAnalysisTimeout);
      this.aiAnalysisTimeout = setTimeout(() => {
        this.performAIAnalysis(message);
      }, 2000); // Wait 2 seconds before AI analysis
    }

    async performAIAnalysis(message) {
      // AI analysis now happens in the main chat response
      // This is just for backward compatibility
      console.log('🤖 AI Analysis called for:', message.substring(0, 50));
      return;
    }

    getExistingCategories() {
      const competitors = ['chatbase', 'intercom', 'zendesk', 'crisp', 'tidio', 'drift', 'hubspot'];
      if (competitors.some(comp => text.includes(comp)) || text.includes('competitor') || text.includes('alternative')) {
        this.sessionData.businessMetrics.competitorMentioned = true;
      }

      // Product interest detection
      if (text.includes('api') || text.includes('integration')) {
        if (!this.sessionData.businessMetrics.productInterest.includes('api')) {
          this.sessionData.businessMetrics.productInterest.push('api');
        }
      }
      if (text.includes('analytics') || text.includes('reporting')) {
        if (!this.sessionData.businessMetrics.productInterest.includes('analytics')) {
          this.sessionData.businessMetrics.productInterest.push('analytics');
        }
      }
      if (text.includes('chatbot') || text.includes('widget')) {
        if (!this.sessionData.businessMetrics.productInterest.includes('chatbot')) {
          this.sessionData.businessMetrics.productInterest.push('chatbot');
        }
      }

      // Price point detection - Enhanced
      const priceMatch = text.match(/\$(\d+)/);
      if (priceMatch) {
        this.sessionData.businessMetrics.pricePoint = parseInt(priceMatch[1]);
      }
      
      // Lead quality scoring
      this.updateLeadQuality(text);

      // Conversion events
      if (text.includes('sign up') || text.includes('register') || text.includes('create account')) {
        this.sessionData.businessMetrics.conversionEvent = 'signup_intent';
      } else if (text.includes('trial') || text.includes('try')) {
        this.sessionData.businessMetrics.conversionEvent = 'trial_intent';
      } else if (text.includes('demo') || text.includes('show me')) {
        this.sessionData.businessMetrics.conversionEvent = 'demo_intent';
      }

      // Emotion progression tracking
      this.sessionData.qualityMetrics.emotionProgression.push(this.sessionData.sentiment);

      // Auto-ticket creation logic
      this.checkAutoTicketCreation(text);
    }

    performKeywordAnalysis(text) {
      // Immediate keyword-based analysis for fallback
      if (text.includes('help') || text.includes('support') || text.includes('problem')) {
        this.sessionData.intentDetection = 'support';
        this.sessionData.category = 'support';
      } else if (text.includes('price') || text.includes('cost') || text.includes('buy')) {
        this.sessionData.intentDetection = 'sales';
        this.sessionData.category = 'sales';
      } else if (text.includes('how') || text.includes('what') || text.includes('info')) {
        this.sessionData.intentDetection = 'information';
        this.sessionData.category = 'information';
      }
    }

    queueAIAnalysis(message) {
      // Debounce AI calls to avoid too many requests
      clearTimeout(this.aiAnalysisTimeout);
      this.aiAnalysisTimeout = setTimeout(() => {
        this.performAIAnalysis(message);
      }, 2000); // Wait 2 seconds before AI analysis
    }

    async performAIAnalysis(message) {
      try {
        // Get conversation history for context
        const recentMessages = this.sessionData.messages.slice(-6);
        const conversationContext = recentMessages.map(msg => 
          `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');

        // Get existing categories from previous sessions for consistency
        const existingCategories = this.getExistingCategories();

        const analysisPrompt = `
Analyze this customer service conversation and provide JSON output ONLY:

CONVERSATION CONTEXT:
${conversationContext}

LATEST MESSAGE TO ANALYZE: "${message}"

EXISTING CATEGORIES (use these for consistency): ${JSON.stringify(existingCategories)}

Provide JSON with:
{
  "intent": "support|sales|information|general",
  "category": "specific category from existing or new",
  "subCategory": "specific subcategory",
  "sentiment": "positive|negative|neutral|frustrated|confused",
  "topic": "main topic discussed",
  "urgencyLevel": "low|medium|high",
  "leadQuality": "low|medium|high",
  "productInterest": ["array", "of", "interests"],
  "businessContext": {
    "isPotentialCustomer": true/false,
    "budgetIndicated": true/false,
    "timeframe": "immediate|short_term|long_term|unknown",
    "competitorMentioned": true/false
  },
  "emotionalState": "calm|excited|frustrated|confused|satisfied",
  "conversationFlow": "smooth|needs_clarification|off_topic|escalating"
}`;

        // Send to AI for analysis
        const aiResponse = await this.callAIForAnalysis(analysisPrompt);
        
        if (aiResponse) {
          this.applyAIAnalysis(aiResponse);
        }

      } catch (error) {
        console.error('AI Analysis error:', error);
        // Fallback to keyword analysis already done
      }
    }

    async callAIForAnalysis(prompt) {
      try {
        // Use dedicated analysis endpoint
        const analysisUrl = 'https://us-central1-candelaai.cloudfunctions.net/analyzeMessage';
        const response = await fetch(analysisUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              agentId: this.agentId,
              message: prompt,
              sessionId: this.sessionId,
              analysisMode: true
            }
          })
        });

        const result = await response.json();
        if (result.data && result.data.response) {
          try {
            return JSON.parse(result.data.response);
          } catch (e) {
            // Extract JSON from response if it's wrapped in text
            const jsonMatch = result.data.response.match(/\{.*\}/s);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
          }
        }
      } catch (error) {
        console.error('AI API call failed:', error);
        return null;
      }
    }

    applyAIAnalysis(analysis) {
      console.log('🤖 AI Analysis Result:', analysis);

      // Apply AI analysis with validation
      if (analysis.intent) this.sessionData.intentDetection = analysis.intent;
      if (analysis.category) this.sessionData.category = analysis.category;
      if (analysis.subCategory) this.sessionData.subCategory = analysis.subCategory;
      if (analysis.sentiment) this.sessionData.sentiment = analysis.sentiment;
      if (analysis.topic) this.sessionData.topic = analysis.topic;
      if (analysis.urgencyLevel) this.sessionData.qualityMetrics.urgencyLevel = analysis.urgencyLevel;
      if (analysis.leadQuality) this.sessionData.businessMetrics.leadQuality = analysis.leadQuality;
      
      if (analysis.productInterest && Array.isArray(analysis.productInterest)) {
        this.sessionData.businessMetrics.productInterest = [
          ...new Set([...this.sessionData.businessMetrics.productInterest, ...analysis.productInterest])
        ];
      }

      if (analysis.businessContext) {
        if (analysis.businessContext.competitorMentioned) {
          this.sessionData.businessMetrics.competitorMentioned = true;
        }
      }

      // Save updated analysis
      this.saveSession();
      
      // Store category for future consistency
      this.storeCategory(analysis.category, analysis.subCategory);
    }

    getExistingCategories() {
      const stored = localStorage.getItem(`orchis_categories_${this.agentId}`);
      return stored ? JSON.parse(stored) : {
        support: ['technical_support', 'billing_support', 'account_support'],
        sales: ['pricing_inquiry', 'demo_request', 'trial_inquiry'],
        information: ['feature_inquiry', 'integration_info', 'general_info']
      };
    }

    storeCategory(category, subCategory) {
      const existing = this.getExistingCategories();
      if (category && subCategory) {
        if (!existing[category]) existing[category] = [];
        if (!existing[category].includes(subCategory)) {
          existing[category].push(subCategory);
        }
        localStorage.setItem(`orchis_categories_${this.agentId}`, JSON.stringify(existing));
      }
    }

    checkAutoTicketCreation(text) {
      // Auto-create ticket for support requests or negative sentiments
      if (!this.sessionData.ticketCreated) {
        const shouldCreateTicket = 
          this.sessionData.intentDetection === 'support' ||
          this.sessionData.sentiment === 'negative' ||
          this.sessionData.qualityMetrics.urgencyLevel === 'high' ||
          text.includes('bug') || text.includes('problem') || text.includes('issue');

        if (shouldCreateTicket) {
          this.createTicket();
        }
      }
    }

    createTicket() {
      this.sessionData.ticketCreated = true;
      this.sessionData.ticketId = 'TKT_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      this.sessionData.ticketStatus = 'open';
      
      console.log('🎫 Auto-created ticket:', this.sessionData.ticketId, 'for session:', this.sessionData.sessionId);
      this.saveSession();
    }

    createSmartTicket(analysis) {
      this.sessionData.ticketCreated = true;
      this.sessionData.ticketId = 'TKT_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      this.sessionData.ticketStatus = 'open';
      this.sessionData.ticketPriority = analysis.urgency;
      this.sessionData.ticketReason = analysis.ticketReason;
      this.sessionData.aiAnalysis = analysis;
      
      // Store ticket data in Firestore via sessionData
      console.log('🎫 AI-powered ticket created:', this.sessionData.ticketId, 'Reason:', analysis.ticketReason);
      this.saveSession();
    }

    detectTopic(text) {
      if (text.includes('pricing') || text.includes('cost') || text.includes('plan')) return 'pricing';
      if (text.includes('features') || text.includes('functionality')) return 'features';
      if (text.includes('integration') || text.includes('api')) return 'integration';
      if (text.includes('support') || text.includes('help')) return 'support';
      if (text.includes('security') || text.includes('privacy')) return 'security';
      if (text.includes('setup') || text.includes('installation')) return 'setup';
      return null;
    }

    updateLeadQuality(text) {
      let score = 0;
      
      // High-value indicators
      if (text.includes('enterprise') || text.includes('business') || text.includes('company')) score += 3;
      if (text.includes('team') || text.includes('multiple users')) score += 2;
      if (text.includes('integration') || text.includes('api')) score += 2;
      if (text.includes('security') || text.includes('compliance')) score += 2;
      if (this.sessionData.businessMetrics.pricePoint > 100) score += 3;
      
      // Medium-value indicators
      if (text.includes('trial') || text.includes('demo')) score += 1;
      if (text.includes('features') || text.includes('capabilities')) score += 1;
      
      // Low-value indicators
      if (text.includes('free') || text.includes('cheapest')) score -= 1;
      if (text.includes('just looking') || text.includes('browsing')) score -= 2;

      if (score >= 5) this.sessionData.businessMetrics.leadQuality = 'high';
      else if (score >= 2) this.sessionData.businessMetrics.leadQuality = 'medium';
      else this.sessionData.businessMetrics.leadQuality = 'low';
    }

    updateAvgResponseTime() {
      const times = this.sessionData.technicalMetrics.responseLatency;
      if (times.length > 0) {
        this.sessionData.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000); // Convert to seconds
      }
    }

    updateEngagementLevel() {
      const messageCount = this.sessionData.messageCount;
      const timeSpent = this.chatStartTime ? (Date.now() - this.chatStartTime) / 1000 : 0;
      
      if (messageCount >= 10 || timeSpent >= 300) {
        this.sessionData.behaviorMetrics.engagementLevel = 'high';
      } else if (messageCount >= 5 || timeSpent >= 120) {
        this.sessionData.behaviorMetrics.engagementLevel = 'medium';
      } else {
        this.sessionData.behaviorMetrics.engagementLevel = 'low';
      }
    }

    trackError(error) {
      this.sessionData.technicalMetrics.errorCount++;
      console.error('Chat Widget Error:', error);
      this.saveSession();
    }

    saveSession() {
      // Save to localStorage for offline persistence
      localStorage.setItem(`orchis_session_${this.sessionId}`, JSON.stringify(this.sessionData));
      
      // Queue for server sync
      this.queueServerSync();
    }

    queueServerSync() {
      // Debounced server sync to avoid too many requests
      clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => {
        this.syncToServer();
      }, 5000); // Sync every 5 seconds
    }

    async syncToServer() {
      // Session data is already sent with each chat message
      // No separate sync needed as it's included in the chat API call
      console.log('📊 Session data updated:', {
        sessionId: this.sessionData.sessionId,
        messageCount: this.sessionData.messageCount,
        engagement: this.sessionData.behaviorMetrics.engagementLevel,
        sentiment: this.sessionData.sentiment,
        topic: this.sessionData.topic
      });
    }
  }

  // User Behavior Tracker
  class UserBehaviorTracker {
    constructor() {
      this.clickCount = 0;
      this.maxScrollDepth = 0;
      this.startTracking();
    }

    startTracking() {
      // Track clicks
      document.addEventListener('click', () => {
        this.clickCount++;
      });

      // Track scroll depth
      window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent || 0);
      });
    }

    getMetrics() {
      return {
        clicksBeforeChat: this.clickCount,
        scrollDepth: this.maxScrollDepth
      };
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
    
    // Track widget load time
    this.sessionManager.sessionData.technicalMetrics.widgetLoadTime = Date.now() - this.sessionManager.pageLoadTime;
    
    this.init();
  }

  OrchisChatWidget.prototype = {
    init: async function() {
      // Fetch agent config from database
      await this.fetchAgentConfig();

      this.injectStyles();
      this.createWidget();
      this.bindEvents();
      this.addWelcomeMessage();
    },

    fetchAgentConfig: async function() {
      try {
        // Import Firebase dynamically
        if (!window.firebase) {
          await this.loadFirebase();
        }

        const db = firebase.firestore();

        // Search for agent across all users
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
          const agentRef = await db.collection('users').doc(userDoc.id)
            .collection('agents').doc(this.config.agentId).get();

          if (agentRef.exists) {
            const agentData = agentRef.data();

            // Update config with database values
            this.config.projectName = agentData.projectName || agentData.name || this.config.projectName;
            this.config.logoUrl = agentData.logoUrl || this.config.logoUrl;
            this.config.primaryColor = agentData.primaryColor || this.config.primaryColor;

            console.log('✅ Agent config loaded:', this.config.projectName);
            break;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch agent config, using defaults:', error);
      }
    },

    loadFirebase: async function() {
      return new Promise((resolve, reject) => {
        // Load Firebase SDK
        const script1 = document.createElement('script');
        script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
        script1.onload = () => {
          const script2 = document.createElement('script');
          script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
          script2.onload = () => {
            // Initialize Firebase
            firebase.initializeApp({
              apiKey: "AIzaSyBZi6AjqTkvU-v16ZcYr3T73u7u3SiIMpM",
              authDomain: "candelaai.firebaseapp.com",
              projectId: "candelaai",
              storageBucket: "candelaai.firebasestorage.app",
              messagingSenderId: "726655160481",
              appId: "1:726655160481:web:4e133e5bea62b12e7eead0",
              measurementId: "G-LVYP7E1ZTY"
            });
            resolve();
          };
          script2.onerror = reject;
          document.head.appendChild(script2);
        };
        script1.onerror = reject;
        document.head.appendChild(script1);
      });
    },

    injectStyles: function() {
      if (document.getElementById('orchis-widget-styles')) return;
      
      const styles = `
        .orchis-widget-container {
          position: fixed;
          z-index: 999999;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .orchis-position-bottom-right { bottom: 20px; right: 20px; }
        .orchis-position-bottom-left { bottom: 20px; left: 20px; }
        .orchis-position-top-right { top: 20px; right: 20px; }
        .orchis-position-top-left { top: 20px; left: 20px; }
        
        .orchis-chat-widget {
          background: rgba(25, 25, 25, 0.7);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(10px);
          border: 0.5px solid rgba(80, 80, 80, 0.3);
          border-radius: 20px;
          width: 100%;
          max-width: 26rem;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15),
                      0 2px 8px rgba(31, 38, 135, 0.08),
                      inset 0 1px 0 rgba(255, 255, 255, 0.5);
          height: auto;
          min-height: 250px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          transition: all 0.7s ease-out;
          animation: orchis-slideIn 0.3s ease-out;
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
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0);
        }

        .orchis-agent-avatar {
          width: 32px;
          height: 32px;
          border-radius: 12px;
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
          border-radius: 12px;
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
        
        .orchis-close-btn {
          background: none;
          border: none;
          color: #a8a29e;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        
        .orchis-close-btn:hover {
          color: white;
        }
        
        .orchis-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
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
        
        .orchis-input-section {
          padding: 4px;
          background: rgba(255, 255, 255, 0);
        }

        .orchis-input-container {
          background: rgba(255, 255, 255, 0);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 12px;
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
          padding: 8px 12px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0);
          color: rgba(0, 0, 0, 0.85);
          border: 0.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
        }

        .orchis-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .orchis-input:focus {
          background: rgba(255, 255, 255, 0);
          border-color: rgba(255, 255, 255, 1);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }

        .orchis-send-button {
          padding: 8px;
          color: black;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orchis-send-button:hover {
          background: rgba(188, 188, 188, 1);
          transform: scale(1.02);
        }
        
        .orchis-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          background: rgba(0, 0, 0, 0.3);
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
        
        @media (max-width: 480px) {
          .orchis-chat-widget {
            width: calc(100vw - 32px);
            height: 70vh;
            max-height: 500px;
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
                '<div class="orchis-default-avatar">✨</div>'
              }
            </div>
            <div class="orchis-agent-details">
              <div class="orchis-agent-name">${this.config.projectName} AI${this.userName ? ` & ${this.userName.charAt(0).toUpperCase() + this.userName.slice(1)}` : ''}</div>
              <div class="orchis-status">Online now</div>
            </div>
            <div class="orchis-status-dot"></div>
          </div>
          
          <div class="orchis-messages"></div>
          
          <div class="orchis-input-section">
            <div class="orchis-input-container">
              <div class="orchis-input-label">Ask ${this.config.projectName} AI</div>
              <div class="orchis-input-row">
                <input 
                  type="text" 
                  class="orchis-input"
                  placeholder="Ask anything about ${this.config.projectName}..."
                />
                <button class="orchis-send-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    bindEvents: function() {
      const sendBtn = this.container.querySelector('.orchis-send-button');
      const input = this.container.querySelector('.orchis-input');
      
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    },

    addWelcomeMessage: function() {
      const welcomeMessage = this.userName 
        ? `Welcome back, ${this.userName}! What would you like to know about ${this.config.projectName}?`
        : `Hi! I'm ${this.config.projectName}'s AI assistant. What's your name so I can personalize our session?`;
      
      this.messages.push({
        id: 1,
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
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

      // Start chat session if first message
      if (this.messages.length === 0) {
        this.sessionManager.startChat();
        // Update behavior metrics from tracker
        const behaviorMetrics = this.sessionManager.behaviorTracker.getMetrics();
        this.sessionManager.sessionData.behaviorMetrics.clicksBeforeChat = behaviorMetrics.clicksBeforeChat;
        this.sessionManager.sessionData.behaviorMetrics.scrollDepth = behaviorMetrics.scrollDepth;
      }

      // Check if user is providing their name
      if (!this.userName && message.length < 50) {
        const possibleName = message.trim().split(' ')[0];
        if (possibleName.length > 1 && !possibleName.includes('?') && !possibleName.includes('.')) {
          const capitalizedName = possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
          this.userName = capitalizedName;
          localStorage.setItem(`chatbot_user_${this.config.agentId}`, capitalizedName);
          
          // Update header
          const headerName = this.container.querySelector('.orchis-agent-name');
          headerName.textContent = `${this.config.projectName} AI & ${capitalizedName}`;
        }
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

        // Send last 6 messages (3 Q&A pairs) for context
        const recentMessages = this.messages.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

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
      // Update session data with AI analysis
      this.sessionManager.sessionData.sentiment = analysis.sentiment;
      this.sessionManager.sessionData.intentDetection = analysis.intent;
      this.sessionManager.sessionData.category = analysis.category;
      this.sessionManager.sessionData.topic = analysis.topic;
      this.sessionManager.sessionData.qualityMetrics.urgencyLevel = analysis.urgency;
      
      // Smart ticket creation based on AI analysis
      if (analysis.needsTicket && !this.sessionManager.sessionData.ticketCreated) {
        console.log('🎫 AI recommends ticket creation:', analysis.ticketReason);
        this.sessionManager.createSmartTicket(analysis);
      }
      
      // Session data already updated above
      console.log('📊 Session updated with AI analysis');
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
      const html = this.messages.map(message => `
        <div class="orchis-message orchis-${message.role}-message">
          <div class="orchis-message-label">${message.role === 'user' ? 'You' : this.config.projectName + ' AI'}</div>
          <div class="orchis-message-content">${message.content}${this.isTyping && this.messages[this.messages.length - 1].id === message.id ? '<span style="animation: blink 1s infinite;">|</span>' : ''}</div>
        </div>
      `).join('');
      
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
          <div class="orchis-message-label">${this.config.projectName} AI</div>
          <div class="orchis-typing-dots">
            <div class="orchis-dot"></div>
            <div class="orchis-dot"></div>
            <div class="orchis-dot"></div>
          </div>
        </div>
      `;
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
})();