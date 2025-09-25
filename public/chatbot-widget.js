(function() {
  'use strict';

  // Chatbot Widget Library
  window.OrchisChatbot = {
    instances: {},
    
    init: function(config) {
      const {
        agentId,
        projectName = 'Assistant',
        primaryColor = '#2563eb',
        position = 'bottom-right',
        targetElement = null
      } = config;

      if (!agentId) {
        console.error('OrchisChatbot: agentId is required');
        return;
      }

      const chatbot = new ChatbotInstance(config);
      this.instances[agentId] = chatbot;
      
      if (targetElement) {
        chatbot.renderInElement(targetElement);
      } else {
        chatbot.renderAsFloating();
      }
      
      return chatbot;
    }
  };

  function ChatbotInstance(config) {
    this.config = config;
    this.isOpen = false;
    this.messages = [];
    this.sessionId = Math.random().toString(36).substring(7);
    this.isLoading = false;
    
    this.init();
  }

  ChatbotInstance.prototype = {
    init: function() {
      this.createStyles();
      this.messages = [{
        id: 1,
        role: 'assistant',
        content: `Hi! I'm ${this.config.projectName || 'Assistant'}'s helper. How can I help you today?`,
        timestamp: new Date()
      }];
    },

    createStyles: function() {
      if (document.getElementById('orchis-chatbot-styles')) return;
      
      const styles = `
        .orchis-chatbot-container {
          position: fixed;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .orchis-chatbot-bottom-right { bottom: 20px; right: 20px; }
        .orchis-chatbot-bottom-left { bottom: 20px; left: 20px; }
        .orchis-chatbot-top-right { top: 20px; right: 20px; }
        .orchis-chatbot-top-left { top: 20px; left: 20px; }
        
        .orchis-chatbot-window {
          width: 384px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }
        
        .orchis-chatbot-window.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .orchis-chatbot-header {
          padding: 16px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .orchis-chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .orchis-chatbot-message {
          display: flex;
          max-width: 80%;
        }
        
        .orchis-chatbot-message.user {
          align-self: flex-end;
        }
        
        .orchis-chatbot-message.assistant {
          align-self: flex-start;
        }
        
        .orchis-chatbot-message-content {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .orchis-chatbot-message.user .orchis-chatbot-message-content {
          color: white;
        }
        
        .orchis-chatbot-message.assistant .orchis-chatbot-message-content {
          background: #f3f4f6;
          color: #1f2937;
        }
        
        .orchis-chatbot-input-area {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }
        
        .orchis-chatbot-input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          outline: none;
        }
        
        .orchis-chatbot-input:focus {
          border-color: ${this.config.primaryColor};
          box-shadow: 0 0 0 3px ${this.config.primaryColor}33;
        }
        
        .orchis-chatbot-send-btn {
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .orchis-chatbot-send-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        .orchis-chatbot-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .orchis-chatbot-toggle {
          width: 56px;
          height: 56px;
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .orchis-chatbot-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
        }
        
        .orchis-chatbot-loading {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: #f3f4f6;
          border-radius: 12px;
          align-self: flex-start;
        }
        
        .orchis-chatbot-loading-dot {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: orchis-bounce 1.4s ease-in-out both infinite;
        }
        
        .orchis-chatbot-loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .orchis-chatbot-loading-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes orchis-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        @media (max-width: 480px) {
          .orchis-chatbot-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 120px);
            max-height: 600px;
          }
        }
      `;
      
      const styleSheet = document.createElement('style');
      styleSheet.id = 'orchis-chatbot-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    },

    renderAsFloating: function() {
      const container = document.createElement('div');
      container.className = `orchis-chatbot-container orchis-chatbot-${this.config.position}`;
      container.innerHTML = this.getHTML();
      
      document.body.appendChild(container);
      this.bindEvents(container);
    },

    renderInElement: function(elementId) {
      const targetElement = document.getElementById(elementId);
      if (!targetElement) {
        console.error(`OrchisChatbot: Element with id "${elementId}" not found`);
        return;
      }
      
      targetElement.innerHTML = this.getHTML();
      targetElement.className = 'orchis-chatbot-container';
      this.bindEvents(targetElement);
    },

    getHTML: function() {
      return `
        <div class="orchis-chatbot-window" style="display: none;">
          <div class="orchis-chatbot-header" style="background: ${this.config.primaryColor};">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>✨</span>
              <span style="font-weight: 600;">${this.config.projectName}</span>
            </div>
            <button class="orchis-chatbot-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px;">×</button>
          </div>
          
          <div class="orchis-chatbot-messages">
            ${this.renderMessages()}
          </div>
          
          <div class="orchis-chatbot-input-area">
            <input type="text" class="orchis-chatbot-input" placeholder="Type your message..." />
            <button class="orchis-chatbot-send-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
            </button>
          </div>
        </div>
        
        <button class="orchis-chatbot-toggle">
          <span class="orchis-chatbot-icon-chat">💬</span>
          <span class="orchis-chatbot-icon-close" style="display: none;">×</span>
        </button>
      `;
    },

    renderMessages: function() {
      return this.messages.map(message => `
        <div class="orchis-chatbot-message ${message.role}">
          <div class="orchis-chatbot-message-content" ${message.role === 'user' ? `style="background: ${this.config.primaryColor};"` : ''}>
            ${message.content}
          </div>
        </div>
      `).join('');
    },

    bindEvents: function(container) {
      const toggleBtn = container.querySelector('.orchis-chatbot-toggle');
      const closeBtn = container.querySelector('.orchis-chatbot-close');
      const sendBtn = container.querySelector('.orchis-chatbot-send-btn');
      const input = container.querySelector('.orchis-chatbot-input');
      const window = container.querySelector('.orchis-chatbot-window');
      
      toggleBtn.addEventListener('click', () => this.toggle(container));
      closeBtn.addEventListener('click', () => this.close(container));
      sendBtn.addEventListener('click', () => this.sendMessage(container));
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage(container);
        }
      });
    },

    toggle: function(container) {
      const window = container.querySelector('.orchis-chatbot-window');
      const chatIcon = container.querySelector('.orchis-chatbot-icon-chat');
      const closeIcon = container.querySelector('.orchis-chatbot-icon-close');
      
      if (this.isOpen) {
        this.close(container);
      } else {
        this.open(container);
      }
    },

    open: function(container) {
      const window = container.querySelector('.orchis-chatbot-window');
      const chatIcon = container.querySelector('.orchis-chatbot-icon-chat');
      const closeIcon = container.querySelector('.orchis-chatbot-icon-close');
      
      window.style.display = 'flex';
      setTimeout(() => window.classList.add('show'), 10);
      
      chatIcon.style.display = 'none';
      closeIcon.style.display = 'block';
      
      this.isOpen = true;
    },

    close: function(container) {
      const window = container.querySelector('.orchis-chatbot-window');
      const chatIcon = container.querySelector('.orchis-chatbot-icon-chat');
      const closeIcon = container.querySelector('.orchis-chatbot-icon-close');
      
      window.classList.remove('show');
      setTimeout(() => window.style.display = 'none', 300);
      
      chatIcon.style.display = 'block';
      closeIcon.style.display = 'none';
      
      this.isOpen = false;
    },

    sendMessage: function(container) {
      const input = container.querySelector('.orchis-chatbot-input');
      const message = input.value.trim();
      
      if (!message || this.isLoading) return;
      
      this.addMessage('user', message);
      input.value = '';
      this.updateMessages(container);
      
      this.isLoading = true;
      this.showLoading(container);
      
      // Simulate API call (replace with actual API call)
      fetch('https://your-firebase-function-url/chatWithAgent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            agentId: this.config.agentId,
            message: message,
            sessionId: this.sessionId
          }
        })
      })
      .then(response => response.json())
      .then(data => {
        this.hideLoading(container);
        this.addMessage('assistant', data.result.response);
        this.updateMessages(container);
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Chat error:', error);
        this.hideLoading(container);
        this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        this.updateMessages(container);
        this.isLoading = false;
      });
    },

    addMessage: function(role, content) {
      this.messages.push({
        id: Date.now(),
        role,
        content,
        timestamp: new Date()
      });
    },

    updateMessages: function(container) {
      const messagesContainer = container.querySelector('.orchis-chatbot-messages');
      messagesContainer.innerHTML = this.renderMessages();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    showLoading: function(container) {
      const messagesContainer = container.querySelector('.orchis-chatbot-messages');
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'orchis-chatbot-loading';
      loadingDiv.innerHTML = '<div class="orchis-chatbot-loading-dot"></div><div class="orchis-chatbot-loading-dot"></div><div class="orchis-chatbot-loading-dot"></div>';
      messagesContainer.appendChild(loadingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    hideLoading: function(container) {
      const loading = container.querySelector('.orchis-chatbot-loading');
      if (loading) loading.remove();
    }
  };

})();