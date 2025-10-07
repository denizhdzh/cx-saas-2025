import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../homepage/components/Header';
import Hero from '../homepage/components/Hero';
import ProblemSolution from '../homepage/components/ProblemSolution';
import Features from '../homepage/components/Features';
import Stats from '../homepage/components/Stats';
import BentoFeatures from '../homepage/components/BentoFeatures';
import Pricing from '../homepage/components/Pricing';
import FAQ from '../homepage/components/FAQ';
import CTA from '../homepage/components/CTA';
import Footer from '../homepage/components/Footer';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Orchis - AI Customer Support Platform | 94% Resolution Rate</title>
        <meta name="description" content="Orchis AI agents understand context and speak like humans. 94% resolution rate, 60-second setup. Join the waitlist for the future of customer support." />
        <meta name="keywords" content="AI customer support, chatbot, customer service automation, AI agents, conversational AI, customer support platform" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Orchis - AI Customer Support Platform" />
        <meta property="og:description" content="AI agents that understand context and speak like humans. 94% resolution rate, 60-second setup." />
        <meta property="og:image" content="https://orchis.app/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://orchis.app" />
        <meta property="og:site_name" content="Orchis" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Orchis - AI Customer Support Platform" />
        <meta name="twitter:description" content="AI agents that understand context and speak like humans. 94% resolution rate." />
        <meta name="twitter:image" content="https://orchis.app/og-image.jpg" />
        
        {/* Additional SEO */}
        <meta name="author" content="Orchis" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://orchis.app" />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Orchis",
            "description": "AI customer support platform with 94% resolution rate",
            "url": "https://orchis.app",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free tier available"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "127"
            }
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <Hero />
        <ProblemSolution />
        <BentoFeatures />
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </div>
    </>
  );
}