import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

export default function ChatWidget({ agentId, projectName = "Assistant", logoUrl = null, primaryColor = "#2563eb", position = "bottom-right" }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [userName, setUserName] = useState(() => localStorage.getItem(`chatbot_user_${agentId}`) || '');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const chatWithAgent = httpsCallable(functions, 'chatWithAgent');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = userName 
        ? `Welcome back, ${userName}! What would you like to know about ${projectName}?`
        : `Hi! I'm ${projectName}'s AI assistant. What's your name so I can personalize our session?`;
      
      setMessages([{
        id: 1,
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [projectName, userName]);

  // Typing animation effect
  const typeMessage = (content, callback) => {
    setIsTyping(true);
    let currentText = '';
    let index = 0;
    
    const typingInterval = setInterval(() => {
      if (index < content.length) {
        currentText += content[index];
        index++;
        // Update the last message with current text
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === 'assistant') {
            newMessages[newMessages.length - 1].content = currentText;
          }
          return newMessages;
        });
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        if (callback) callback();
      }
    }, 30); // Typing speed
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isTyping) return;

    const userMessageContent = inputMessage;
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };

    // Check if user is providing their name
    if (!userName && userMessageContent.length < 50) {
      const possibleName = userMessageContent.trim().split(' ')[0];
      if (possibleName.length > 1 && !possibleName.includes('?') && !possibleName.includes('.')) {
        const capitalizedName = possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
        setUserName(capitalizedName);
        localStorage.setItem(`chatbot_user_${agentId}`, capitalizedName);
      }
    }

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Enhanced prompt for better conversation
      const enhancedMessage = userName 
        ? `User ${userName} asks: ${userMessageContent}`
        : userMessageContent;

      const result = await chatWithAgent({
        agentId,
        message: enhancedMessage,
        sessionId
      });

      // Add empty assistant message first, then type it out
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Type out the response
      typeMessage(result.data.response);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      typeMessage('Sorry, I encountered an error. Please try again.');
    }
  };


  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const chatPosition = positionClasses[position] || positionClasses['bottom-right'];

  // Calculate dynamic height based on messages
  const calculateHeight = () => {
    const baseHeight = 72; // h-72 = 288px converted to h units
    const messageCount = messages.length;
    if (messageCount <= 1) return baseHeight;
    
    // Expand height gradually with more messages
    const extraHeight = Math.min(messageCount * 8, 32); // Max extra 32 (128px)
    return baseHeight + extraHeight;
  };

  return (
    <div className={`fixed ${chatPosition} z-50`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast-style Chat Widget with dynamic height */}
      <div 
        className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-md overflow-hidden transition-all duration-700 ease-out" 
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          height: `${calculateHeight() * 4}px` // Convert h units to px
        }}
      >
        <div className="h-full flex flex-col">
          
          {/* Header with agent logo and customer name */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={projectName} className="w-6 h-6 object-contain" />
              ) : (
                <SparklesIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium">
                {projectName} AI{userName && ` & ${userName.charAt(0).toUpperCase() + userName.slice(1)}`}
              </div>
              <div className="text-neutral-400 text-xs">Online now</div>
            </div>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
          </div>
          
          {/* Messages Area - Q&A Format */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-2">
                {message.role === 'user' && (
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">You</div>
                    <div className="text-white text-sm font-medium">
                      {message.content}
                    </div>
                  </div>
                )}
                {message.role === 'assistant' && (
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">{projectName} AI</div>
                    <div className="text-neutral-200 text-sm leading-relaxed">
                      {message.content}
                      {isTyping && messages[messages.length - 1].id === message.id && (
                        <span className="animate-pulse">|</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div>
                <div className="text-xs text-neutral-400 mb-2 font-medium">{projectName} AI</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section like ToastDemo */}
          <div className="p-4">
            <div className="border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-400 mb-2 font-medium">Ask {projectName} AI</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={`Ask anything about ${projectName}...`}
                  className="flex-1 px-3 py-2 text-sm bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 rounded-lg focus:outline-none"
                  disabled={isLoading || isTyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || isTyping}
                  className="p-2 text-white bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}