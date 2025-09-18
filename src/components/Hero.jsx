import React from 'react';

export default function Hero() {
  return (
    <section className="relative">
      <div className="max-w-5xl mx-auto px-8 py-24 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="my-6">
          <div className="bg-white rounded-lg p-8 mx-6">
            <h1 className="text-6xl font-semibold text-neutral-900 leading-tight mb-6">
              Build something amazing with our platform
            </h1>
            
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
              A simple, powerful solution that helps you create, manage, and scale your business. 
              No complexity, just results.
            </p>
            
            <div className="flex flex-col space-y-3">
              <button 
                className="w-full px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white flex items-center justify-center gap-3"
                style={{
                  borderWidth: '0.5px',
                  borderStyle: 'solid',
                  borderColor: 'rgb(20, 20, 20)',
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC04"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
              
              <button 
                className="w-full px-6 py-3 text-sm font-medium transition-colors rounded-xl text-neutral-700"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgb(225, 226, 227)',
                  background: 'linear-gradient(rgb(247, 247, 248) 0%, rgb(234, 234, 235) 100%)',
                  boxShadow: 'rgb(255, 255, 255) 0px 2px 0px 0px inset'
                }}
              >
                Sign in with Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}