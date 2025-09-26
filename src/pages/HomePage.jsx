import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProblemSolution from '../components/ProblemSolution';
import Features from '../components/Features';
import Stats from '../components/Stats';
import BentoFeatures from '../components/BentoFeatures';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>AI Customer Support Platform</title>
        <meta name="description" content="Next-generation AI agents that solve customer tickets faster with higher success rates. Setup in under a minute." />
      </Helmet>
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <Hero />
        <ProblemSolution />
        <BentoFeatures />
        <Features />
        <Stats />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </div>
    </>
  );
}