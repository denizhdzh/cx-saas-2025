import React from 'react';

export default function ChatbotStyles() {
  const styles = [
    { name: "Dark Modern", category: "Popular" },
    { name: "Light Toast", category: "Minimal" },
    { name: "Gradient Pop", category: "Creative" },
    { name: "Glass Effect", category: "Premium" },
    { name: "Neon Chat", category: "Bold" },
    { name: "Clean Pro", category: "Business" }
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
          <div className="mb-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div>
                <h2 className="text-4xl font-semibold text-neutral-900 mb-6">
                  Stunning Chatbot Styles
                </h2>
                <p className="text-lg text-neutral-600 max-w-lg">
                  Choose from dozens of beautiful, modern chatbot designs. Or customize your own to match your brand perfectly.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  All
                </button>
                <button className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  Popular
                </button>
                <button className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  Premium
                </button>
                <button className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  Custom
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {styles.map((style, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-[4/3] border-2 border-dashed border-neutral-300 rounded-lg mb-4 flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                  <p className="text-neutral-500 font-mono text-sm text-center px-4">
                    [IMAGE: {style.name} chatbot preview]
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold text-neutral-900">
                    {style.name}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {style.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-neutral-600 mb-6">
              Want a completely custom design? Our team can create one for you.
            </p>
            <button className="px-8 py-3 text-sm font-medium border border-neutral-900 rounded-xl hover:bg-neutral-900 hover:text-white transition-colors">
              Request Custom Design
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}