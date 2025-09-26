import { useState, useEffect } from 'react';

export default function ToastDemo() {
  const [step, setStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const fullQuestion = "How do I set up SSO authentication for my team?";
  const fullResponse = "Enable SSO in your admin dashboard under Security Settings. Choose your identity provider (Google, Azure AD, Okta), configure the SAML endpoints, and invite team members. They'll automatically use company credentials to sign in.";

  useEffect(() => {
    const sequence = async () => {
      // Reset everything
      setStep(0);
      setInputText('');
      setShowResponse(false);
      setResponseText('');
      
      // Wait 1s, then start typing in input
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep(1);
      
      // Type the question in input
      for (let i = 0; i <= fullQuestion.length; i++) {
        setInputText(fullQuestion.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Wait 1s, then show response container
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowResponse(true);
      
      // Wait 500ms, then start typing response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Type the response
      for (let i = 0; i <= fullResponse.length; i++) {
        setResponseText(fullResponse.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      // Wait 3s, then restart loop
      await new Promise(resolve => setTimeout(resolve, 3000));
      sequence(); // Restart the loop
    };

    sequence();
  }, []);

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-md lg:max-w-sm xl:max-w-md mx-auto h-72 lg:h-auto lg:min-h-0 overflow-hidden transition-all duration-700 ease-out" style={{
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
    }}>
      <div className="h-full flex flex-col">
        
        {/* Mobile: Two step animation */}
        <div className="lg:hidden h-full p-4 flex flex-col">
          
          {/* STEP 1: Feature Update + Input */}
          {!showResponse && (
            <div className={`h-full flex flex-col transition-all duration-700 ease-out ${
              showResponse ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
            }`}>
              {/* Feature Update Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium">Feature Update</div>
                  <div className="text-neutral-400 text-xs">Just now</div>
                </div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
              </div>
              
              {/* Feature Update Message */}
              <div className="text-neutral-300 text-sm leading-relaxed mb-6">
                Smart Auto-replies now available! Your AI can automatically suggest responses based on conversation context.
              </div>
              
              {/* Input for typing question */}
              <div className="mt-auto">
                <div className="text-xs text-neutral-400 mb-2 font-medium">Ask Orchis AI</div>
                <div className="relative">
                  <input
                    type="text"
                    value={inputText}
                    placeholder="Ask anything about Orchis..."
                    className="w-full px-3 py-2 text-sm bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 rounded-lg focus:outline-none"
                    readOnly
                  />
                  {step === 1 && inputText.length < fullQuestion.length && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-pulse text-white">|</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* STEP 2: Logo + Question + Answer */}
          {showResponse && (
            <div className={`h-full flex flex-col transition-all duration-700 ease-out ${
              showResponse ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
            }`}>
              {/* Logo + Question */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex-1 text-white text-sm">
                  {fullQuestion}
                </div>
              </div>
              
              {/* Answer */}
              <div className="flex-1">
                <div className="text-xs text-neutral-400 mb-2 font-medium">Orchis AI</div>
                <div className="text-neutral-200 text-sm leading-relaxed mb-3">
                  {responseText}
                  {responseText.length < fullResponse.length && (
                    <span className="animate-pulse">|</span>
                  )}
                </div>
                {responseText === fullResponse && (
                  <div className="text-neutral-400 text-xs">
                    → orchisai.com/docs/sso-setup
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Original behavior with feature update + expanding input */}
        <div className="hidden lg:flex lg:flex-col lg:h-auto p-4">
          {/* Feature Update Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">Feature Update</div>
                <div className="text-neutral-400 text-xs mt-0.5">Just now</div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            </div>
            
            <div className="text-neutral-300 text-sm leading-relaxed">
              Smart Auto-replies now available! Your AI can automatically suggest responses based on conversation context.
            </div>
          </div>
          
          {/* AI Input Section */}
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
            <div className="text-xs text-neutral-400 mb-4 font-medium">Orchis AI</div>
            <div className="relative">
              <input
                type="text"
                value={inputText}
                placeholder="Ask anything about Orchis..."
                className="w-full px-2 py-2 text-xs bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-600 rounded-lg focus:outline-none focus:border-neutral-500"
                readOnly
              />
              {step === 1 && inputText.length < fullQuestion.length && (
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-pulse text-white">|</span>
              )}
            </div>
            
            {/* AI Response */}
            <div className={`overflow-hidden transition-all duration-800 ease-out ${
              showResponse ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
            }`}>
              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="text-xs text-neutral-400 mb-3 font-medium">Orchis AI</div>
                <div className="text-neutral-200 text-sm leading-relaxed mb-4">
                  {responseText}
                  {responseText.length < fullResponse.length && (
                    <span className="animate-pulse">|</span>
                  )}
                </div>
                {responseText === fullResponse && (
                  <div className="text-neutral-400 text-xs">
                    → orchisai.com/docs/sso-setup
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}