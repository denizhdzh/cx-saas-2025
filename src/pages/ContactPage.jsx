import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Envelope, Warning, CheckCircle } from 'phosphor-react';
import { db } from '../firebase'; // Firebase db import
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Firestore functions

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        submittedAt: serverTimestamp()
      });
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitError('Failed to send message. Please try again later.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | tool/</title>
        <meta name="description" content="Get in touch with the tool/ team. We'd love to hear your feedback, suggestions, or partnership inquiries." />
      </Helmet>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-stone-100 sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-300">
            Have questions, suggestions, or want to partner with us? We're here to help.
          </p>
        </div>

        {submitSuccess ? (
          <div className="bg-lime-900/30 border border-lime-700/50 text-lime-200 px-6 py-5 rounded-lg text-center shadow-md">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-lime-400" />
            <h3 className="text-xl font-semibold text-stone-100">Message Sent!</h3>
            <p className="text-lime-300 mt-2">Thank you for reaching out. We'll get back to you as soon as possible.</p>
            <button 
              onClick={() => setSubmitSuccess(false)} 
              className="mt-6 bg-lime-500 hover:bg-lime-600 text-stone-900 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <div className="bg-stone-800/50 p-8 rounded-lg shadow-md border border-stone-700/60">
            <h2 className="text-2xl font-semibold text-stone-100 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-stone-700/60 border border-stone-600 rounded-md py-2.5 px-3 text-sm text-stone-200 focus:ring-lime-500 focus:border-lime-500 transition-colors placeholder-stone-500 disabled:opacity-50"
                  placeholder="Your Name"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-stone-700/60 border border-stone-600 rounded-md py-2.5 px-3 text-sm text-stone-200 focus:ring-lime-500 focus:border-lime-500 transition-colors placeholder-stone-500 disabled:opacity-50"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-stone-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-stone-700/60 border border-stone-600 rounded-md py-2.5 px-3 text-sm text-stone-200 focus:ring-lime-500 focus:border-lime-500 transition-colors placeholder-stone-500 disabled:opacity-50"
                  placeholder="What is this about?"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-stone-300 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-stone-700/60 border border-stone-600 rounded-md py-2.5 px-3 text-sm text-stone-200 focus:ring-lime-500 focus:border-lime-500 transition-colors placeholder-stone-500 disabled:opacity-50"
                  placeholder="Your message..."
                  disabled={isSubmitting}
                />
              </div>
              {submitError && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-md text-sm flex items-start gap-3">
                  <Warning className="w-5 h-5 mt-0.5 text-red-400 flex-shrink-0"/>
                  <p>{submitError}</p>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-3 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-lime-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Envelope className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
} 