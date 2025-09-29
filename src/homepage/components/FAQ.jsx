import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  
  const faqs = [
    {
      question: "When will Orchis be available to use?",
      answer: "We're currently in development and accepting waitlist signups for early access. Join our waitlist to be among the first to try Orchis when we launch and get special early access pricing."
    },
    {
      question: "How does the 60-second setup work?",
      answer: "Once we launch, you'll be able to upload your knowledge base, customize your AI agent's responses, and embed it on your website in under 60 seconds. No coding or technical setup required."
    },
    {
      question: "What's included in the Free plan?",
      answer: "Our Free plan includes 10 message credits per month, 1 AI agent, 1 MB training data limit, and the ability to embed on unlimited sites. Perfect for testing our platform."
    },
    {
      question: "How do message credits work?",
      answer: "Each conversation exchange between a customer and your AI agent counts as one message credit. Our plans range from 10 credits (Free) to 60,000 credits (Scale) per month."
    },
    {
      question: "Will my data be secure?",
      answer: "We use enterprise-grade encryption and follow GDPR compliance standards. Your knowledge base data is used to train and improve your AI agent's responses. Data is processed securely and never shared with other customers or third parties."
    },
    {
      question: "How can I get early access?",
      answer: "Simply join our waitlist by entering your email above. We'll notify you as soon as Orchis is ready to launch, and you'll get priority access to our platform."
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
            <div className="lg:sticky lg:top-28">
              <h2 className="text-4xl font-semibold text-neutral-900 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Everything you need to know about our AI customer support platform. 
                Can't find what you're looking for?
              </p>
              

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
      
      {/* FAQ Schema Markup */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>
    </section>
  );
}