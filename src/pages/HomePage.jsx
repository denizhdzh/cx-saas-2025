import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../homepage/components/Header';
import Hero from '../homepage/components/Hero';
import ProblemSolution from '../homepage/components/ProblemSolution';
import CTA from '../homepage/components/CTA';
import Footer from '../homepage/components/Footer';
import Features from '../homepage/components/Features';
import FAQ from '../homepage/components/FAQ';
import Pricing from '../homepage/components/Pricing';
import SessionIntelligence from '../homepage/components/SessionIntelligence';


export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Orchis - AI Customer Support | 0.8s Response Time</title>
        <meta name="description" content="AI support agent that never sleeps, never forgets, and keeps learning. Track knowledge gaps, run discount campaigns, analyze every conversation. 60-second setup." />
        <meta name="keywords" content="AI customer support, chatbot, knowledge gap tracking, customer service automation, AI agents, conversational AI, support analytics" />

        {/* Open Graph */}
        <meta property="og:title" content="Orchis - AI Customer Support Platform" />
        <meta property="og:description" content="AI that learns from knowledge gaps, not just logs messages. 0.8s response time, 60-second setup." />
        <meta property="og:image" content="https://orchis.app/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://orchis.app" />
        <meta property="og:site_name" content="Orchis" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Orchis - AI Customer Support Platform" />
        <meta name="twitter:description" content="AI that learns from knowledge gaps. 0.8s response time." />
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
            "description": "AI customer support platform with knowledge gap tracking and advanced analytics",
            "url": "https://orchis.app",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free tier available"
            }
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-neutral-50 relative">

        {/* Content */}
        <div className="relative z-10">
          <Header />
          <Hero />
          <Features/>
          <SessionIntelligence />
          <ProblemSolution />
          <Pricing />
          <FAQ/>
          <CTA />
          <Footer />
        </div>
      </div>
    </>
  );
}