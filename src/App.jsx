import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SubmitToolPage from './pages/SubmitToolPage';
import SearchPage from './pages/SearchPage';
import BrowsePage from './pages/BrowsePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAddToolPage from './pages/admin/AdminAddToolPage';
import ToolDetailPage from './pages/ToolDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import NotFoundPage from './pages/NotFoundPage';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-stone-900 text-stone-200">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/submit" element={<SubmitToolPage />} />
            <Route path="/submit-tool" element={<SubmitToolPage />} />
            <Route path="/search/:searchTerm" element={<SearchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/browse/:filter" element={<BrowsePage />} />
            <Route path="/browse/:filter/:sort" element={<BrowsePage />} />
            <Route path="/tool/:slug" element={<ToolDetailPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-cancel" element={<PaymentCancelPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/add-tool" element={<AdminAddToolPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
