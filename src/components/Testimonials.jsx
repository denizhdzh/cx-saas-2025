import React from 'react';

export default function Testimonials() {
  const testimonials = [
    {
      text: "Setup took literally 45 seconds. Our resolution rate went from 60% to 95% overnight. This is the future of customer support.",
      author: "Sarah Chen",
      title: "Head of Support, TechFlow",
      company: "500+ employees"
    },
    {
      text: "We were spending $50k/month on support staff. Now we spend $2k and get better results. ROI was immediate.",
      author: "Marcus Rodriguez", 
      title: "COO, RetailPlus",
      company: "E-commerce"
    },
    {
      text: "Our customers actually prefer the AI. Response time went from 4 hours to 4 seconds. NPS score up 40 points.",
      author: "Emily Watson",
      title: "Customer Success, FinanceApp",
      company: "FinTech Startup"
    }
  ];

  return (
    <section className="relative">
      {/* Section separator line */}
      <div className="w-full h-px bg-neutral-200 mb-16 lg:mb-24"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-2 py-16 lg:py-24 relative">
        {/* Vertical lines - hidden on mobile */}
        <div className="hidden lg:block absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="hidden lg:block absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-4 sm:mx-6">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-4 lg:mb-6">
              What Our Customers Say
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 max-w-2xl mx-auto">
              Real results from real businesses who made the switch to AI-powered support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="relative">
                {/* Quote mark */}
                <div className="text-5xl lg:text-6xl text-neutral-200 font-serif absolute -top-3 lg:-top-4 -left-1 lg:-left-2">
                  "
                </div>
                
                <div className="relative z-10">
                  <p className="text-base lg:text-lg text-neutral-700 mb-6 lg:mb-8 leading-relaxed italic">
                    {testimonial.text}
                  </p>
                  
                  <div className="flex items-center gap-3 lg:gap-4">
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 border-2 border-dashed border-neutral-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-neutral-500 font-mono">IMG</span>
                    </div>
                    
                    <div>
                      <div className="font-semibold text-neutral-900 text-sm lg:text-base">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {testimonial.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative line */}
                <div className="absolute top-0 left-0 w-1 h-12 lg:h-16 bg-neutral-900"></div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12 lg:mt-16">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 text-sm text-neutral-600">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-7 h-7 lg:w-8 lg:h-8 border-2 border-dashed border-neutral-300 rounded-full flex items-center justify-center text-xs font-mono">
                    {i}
                  </div>
                ))}
              </div>
              <span className="sm:ml-2">Join 2,500+ businesses using our AI platform</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}