import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  
  const faqs = [
    {
      question: "What makes Orchis different from other chatbots?",
      answer: "Most chatbots fail silently. Orchis tracks every question it can't answer as a 'knowledge gap'—you see exactly what docs to write, fill gaps with one click, and AI learns instantly. We also include built-in discount campaign systems (return user & first-time visitor offers) and advanced analytics that auto-categorize conversations by intent, sentiment, and urgency."
    },
    {
      question: "How does knowledge gap detection work?",
      answer: "When AI can't confidently answer a question, it automatically flags it as a knowledge gap in your dashboard. You see all unanswered questions, how many times each was asked, and can fill them with one click. Once filled, AI learns immediately and handles that question perfectly for every future customer."
    },
    {
      question: "What are discount campaigns?",
      answer: "Discount campaigns let you show time-limited discount popups to visitors. Set up return user discounts (triggers after 1+ hour gap) or first-time visitor offers. Each includes custom title, message, discount code, and countdown timer. No coding required—configure everything in your dashboard."
    },
    {
      question: "Can I customize the widget design?",
      answer: "Yes! Customize colors, logo, position, and messaging. Growth and Scale plans include white-label branding (removes all Orchis branding). The widget uses a modern Live Activity-style interface that feels native to your website, not like a traditional chatbot popup."
    },
    {
      question: "How does the 60-second setup work?",
      answer: "Upload your docs (PDF, DOCX, TXT), AI processes them in seconds. Optionally set up discount campaigns. Copy one line of code, paste it in your website. Done. Your AI agent is live and answering customer questions immediately."
    },
    {
      question: "What's included in the Free plan?",
      answer: "100 messages per month, 1 AI agent, 3 document uploads, basic analytics, and 7 days conversation history. Perfect for testing the platform. No credit card required."
    },
    {
      question: "How do the analytics work?",
      answer: "Every conversation is automatically analyzed by AI. You see category breakdowns (Question, Support, Sales, Bug Report, Feedback), sentiment scores (0-10), urgency levels (low/medium/high), topics, user locations, devices, browsers, languages, and return vs new user rates. All in real-time."
    },
    {
      question: "Will my data be secure?",
      answer: "Yes. Enterprise-grade encryption, GDPR compliant, 99.9% uptime SLA. Your documents are used only to train your AI agent—never shared with other customers or third parties. Scale plan includes custom widget domain and full data export."
    }
  ];

  return (
    <section className="relative">

      <div className="max-w-7xl mx-auto px-2 py-24 relative">

        <div className="mx-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left side - Heading and description */}
            <div className="lg:sticky lg:top-28">
              <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">FAQ</div>
              <h2 className="text-4xl font-extralight text-neutral-50 mb-6 leading-tight">
                Frequently Asked Questions
              </h2>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-700 to-transparent mb-6"></div>
              <p className="text-base text-neutral-400 mb-8 leading-relaxed font-light">
                Everything you need to know about our AI customer support platform.
                Can't find what you're looking for?
              </p>


            </div>

            {/* Right side - FAQ items */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-neutral-800/50 last:border-b-0">
                  <button
                    className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  >
                    <span className="font-light text-neutral-200 pr-4">
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 border border-neutral-700 rounded-full flex items-center justify-center transition-transform ${
                        openIndex === index ? 'rotate-45' : ''
                      }`}>
                        <div className="w-3 h-px bg-neutral-700"></div>
                        <div className={`w-px h-3 bg-neutral-700 absolute transition-opacity ${
                          openIndex === index ? 'opacity-0' : 'opacity-100'
                        }`}></div>
                      </div>
                    </div>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 pb-6' : 'max-h-0'
                  }`}>
                    <p className="text-neutral-500 leading-relaxed font-light">
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