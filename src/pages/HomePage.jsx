import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Landing Page</title>
        <meta name="description" content="Modern landing page built with React and Tailwind CSS" />
      </Helmet>
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <Hero />
        <Footer />
      </div>
    </>
  );
}