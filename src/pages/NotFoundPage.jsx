import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found</title>
        <meta name="description" content="The page you're looking for could not be found." />
      </Helmet>
      <div className="min-h-screen bg-neutral-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-6">Page Not Found</h2>
            <p className="text-neutral-600 mb-8 max-w-md">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}