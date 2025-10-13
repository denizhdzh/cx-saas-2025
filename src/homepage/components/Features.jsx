import React from "react";

export default function ThreeFeatureStack() {
  return (
    <section id="features" className="relative py-16 lg:py-24 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-2">

          {/* Feature 1: content on RIGHT */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-32 mt-12 sm:mt-24 lg:mt-48">
            {/* Left: labels */}
            <div className="lg:w-1/2">
              <div className="text-sm text-orange-500 font-semibold mb-2">Brand-aligned AI</div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3">
                Fully branded AI trained on your files
              </h3>
              <p className="text-base text-neutral-700 font-light">
                The AI answers users using only your uploaded and trained documents. When
                required (complaint, feedback, dissatisfaction, etc.) it politely asks the
                user for their email and details, creates a ticket immediately, and logs it
                to the dashboard so your team can follow up in real time.
              </p>
            </div>

            {/* Right: content box */}
                <div className="lg:w-1/2 w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
                    <img
                        src="/docspreview.webp"
                        alt="Orchis AI feature 1"
                        className="w-full rounded-4xl"
                    />
                </div>
          </div>

          {/* Feature 2: content on LEFT */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 sm:gap-12 lg:gap-32 my-12 sm:my-24 lg:my-32">
            {/* Right (visual labels area) */}
            <div className="lg:w-1/2">
              <div className="text-sm text-orange-500 font-semibold mb-2">Dynamic Offer</div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3">
                In-chat dynamic offers that boost conversion
              </h3>
              <p className="text-base text-neutral-700 font-light">
                Our chatbot supports highly dynamic, context-aware offers — similar to Apple
                Live Activities. Configure offers for first-time visitors and returning users
                to increase conversions and engagement.
              </p>
            </div>

            {/* Left: content box */}
                <div className="lg:w-1/2 w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
                    <img
                        src="/orchischatpreview.webp"
                        alt="Orchis AI feature 2"
                        className="w-full rounded-4xl"
                    />
                </div>
          </div>

          {/* Feature 3: content on RIGHT */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-32 mb-12 sm:mb-24 lg:mb-48">
            {/* Left: labels */}
            <div className="lg:w-1/2">
              <div className="text-sm text-orange-500 font-semibold mb-2">Knowledge Gap</div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3">
                Instant knowledge-gap creation & single-click fill
              </h3>
              <p className="text-base text-neutral-700 font-light">
                If a user asks something our knowledge doesn't cover, the system creates a
                knowledge gap entry instantly — you can fill it from the dashboard with a
                single click so the AI learns and improves quickly.
              </p>
            </div>

            {/* Right: content box */}
                <div className="lg:w-1/2 w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
                    <img
                        src="/knowledgegap.webp"
                        alt="Orchis AI feature 3"
                        className="w-full rounded-4xl"
                    />
                </div>
          </div>

        </div>
    </section>
  );
}