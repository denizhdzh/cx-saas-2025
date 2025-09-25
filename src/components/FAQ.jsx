import React, { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  
  const faqs = [
    {
      question: "How quickly can I set up my AI support system?",
      answer: "Most customers are up and running in under 60 seconds. Simply upload your knowledge base, choose a template, and your AI agent is ready to handle tickets. No technical setup or coding required."
    },
    {
      question: "What happens if the AI can't resolve a customer issue?",
      answer: "Our AI has a 98% success rate, but when it encounters complex issues, it seamlessly escalates to your human support team with full context and conversation history. You get the best of both worlds."
    },
    {
      question: "Can I customize the AI responses to match my brand voice?",
      answer: "Absolutely. You can train the AI with your brand guidelines, tone of voice, and specific responses. The AI learns from your previous support interactions to maintain consistency with your brand."
    },
    {
      question: "Is my customer data secure?",
      answer: "Security is our top priority. We're SOC2 compliant, GDPR ready, and use enterprise-grade encryption. Your data is never shared with third parties and is stored in secure, audited data centers."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer 24/7 support for all plans. Starter gets email support, Professional gets priority support, and Enterprise customers get a dedicated success manager plus phone support."
    },
    {
      question: "Can I try before I buy?",
      answer: "Yes! All plans come with a 14-day free trial. No credit card required. You can test the full functionality and see how it works with your actual customer data."
    }
  ];

  return (
    <section className="relative">
      {/* Section separator line */}
      <div className="w-full h-px bg-neutral-200 mb-24"></div>
      
      <div className="max-w-6xl mx-auto px-2 py-24 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left side - Heading and description */}
            <div className="lg:sticky lg:top-8">
              <h2 className="text-4xl font-semibold text-neutral-900 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Everything you need to know about our AI customer support platform. 
                Can't find what you're looking for?
              </p>
              
              <button className="px-6 py-3 text-sm font-medium border border-neutral-900 rounded-xl hover:bg-neutral-900 hover:text-white transition-colors">
                Contact Support
              </button>
              
              {/* IMAGE PLACEHOLDER */}
              <div className="mt-8 p-8 border-2 border-dashed border-neutral-300 rounded-lg text-center">
                <p className="text-neutral-500 font-mono text-sm">[IMAGE: Support team illustration]</p>
              </div>
            </div>
            
            {/* Right side - FAQ items */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-neutral-200 last:border-b-0">
                  <button
                    className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  >
                    <span className="font-semibold text-neutral-900 pr-4">
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 border border-neutral-400 rounded-full flex items-center justify-center transition-transform ${
                        openIndex === index ? 'rotate-45' : ''
                      }`}>
                        <div className="w-3 h-px bg-neutral-400"></div>
                        <div className={`w-px h-3 bg-neutral-400 absolute transition-opacity ${
                          openIndex === index ? 'opacity-0' : 'opacity-100'
                        }`}></div>
                      </div>
                    </div>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 pb-6' : 'max-h-0'
                  }`}>
                    <p className="text-neutral-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}