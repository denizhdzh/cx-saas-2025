import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload Your Data",
      description: "Drag and drop your PDFs, docs, website content, or FAQs. Your AI instantly learns everything about your business.",
      placeholder: "[IMAGE: Files being uploaded and AI processing them]"
    },
    {
      number: "02", 
      title: "Train Your AI",
      description: "Test conversations, refine responses, set personality. Your AI gets smarter with every interaction.",
      placeholder: "[IMAGE: AI agent training interface with conversation examples]"
    },
    {
      number: "03",
      title: "Customize Design", 
      description: "Pick colors, avatar, position. Make it look exactly like your brand. No design skills needed.",
      placeholder: "[IMAGE: AI agent customization interface with style options]"
    },
    {
      number: "04",
      title: "Go Live",
      description: "Copy one line of code, paste on your site. Your beautiful, smart AI agent is now live and helping customers.",
      placeholder: "[IMAGE: Live AI agent on website with happy customers chatting]"
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
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold text-neutral-900 mb-6">
              Build Your AI Website Agent
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              From data upload to live AI agent in minutes. No coding required.
            </p>
          </div>
          
          {/* Horizontal Steps */}
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-6 left-12 right-12 h-px bg-neutral-200 hidden lg:block"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="group">
                  {/* Step Number */}
                  <div className="relative mb-8">
                    <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center font-mono text-sm font-bold mx-auto relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {step.number}
                    </div>
                    {/* Connecting dot for mobile */}
                    <div className="lg:hidden w-4 h-px bg-neutral-200 mx-auto mt-4"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed mb-6">
                      {step.description}
                    </p>
                    
                    {/* Image */}
                    <div className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center group-hover:border-neutral-400 transition-colors duration-300">
                      <p className="text-neutral-500 font-mono text-xs text-center px-4">
                        {step.placeholder}
                      </p>
                    </div>
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