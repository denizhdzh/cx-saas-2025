import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl">

          {/* Orange Pill Badge */}
          <div className="inline-block border border-orange-600 rounded-sm px-3 py-2 mb-6">
            <p className="text-xs font-semibold text-orange-600 tracking-wide">
              SMART SUPPORT. DYNAMIC CONTENT. AI SPEED.
            </p>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-neutral-900 leading-none tracking-tight mb-4">
            AI chatbot that converts your users
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 font-light mb-12 leading-snug tracking-tight max-w-3xl">
            Turn your docs into an AI agent. Embed in minutes. Answer every question, 24/7.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/signin')}
            className="btn-landing mb-3"
          >
            Start Free →
          </button>

          <p className="text-xs text-neutral-500 mb-12">
            100 free messages • No credit card • 2 minute setup
          </p>

          {/* Trusted By Section */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center -space-x-2">
              <img src="/lungoai.webp" alt="LungoAI" className="h-10 w-10 rounded-xl border-2 border-white object-cover" />
              <img src="/simplelister.webp" alt="SimpleLister" className="h-10 w-10 rounded-xl border-2 border-white object-cover" />
              <img src="/toolslash.webp" alt="ToolSlash" className="h-10 w-10 rounded-xl border-2 border-white object-cover" />
              <img src="/unit3media.webp" alt="Unit3Media" className="h-10 w-10 rounded-xl border-2 border-white object-cover" />
            </div>
            <p className="text-xs font-normal text-neutral-400 tracking-wide leading-tight">
              TRUSTED BY<br />100+ COMPANIES
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}