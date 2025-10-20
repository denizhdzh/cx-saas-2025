import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../homepage/components/Header';
import Footer from '../homepage/components/Footer';
import { 
  ShieldCheckIcon,
  LockClosedIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  TrashIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  const sections = [
    {
      icon: UserCircleIcon,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Google Account Information",
          text: "When you sign up with Google OAuth, we collect only your display name, email address, and profile photo from your Google account. This information is stored in our Firebase Firestore database."
        },
        {
          subtitle: "Training Documents",
          text: "When you upload documents to train your AI chatbot, these files are temporarily processed for training purposes only. Original documents are permanently deleted after the training process is complete."
        },
        {
          subtitle: "Chatbot Data",
          text: "We store your chatbot configurations, training data, and conversation settings in Firebase Firestore. This data is isolated to your account and used solely to power your custom chatbot."
        }
      ]
    },
    {
      icon: CloudArrowUpIcon,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Account Management",
          text: "Your Google name, email, and photo are used to create and manage your Orchis account, personalize your experience, and enable authentication."
        },
        {
          subtitle: "AI Training",
          text: "Uploaded documents are processed to train your custom AI chatbot. The training process extracts knowledge and creates embeddings, which are then stored securely in your isolated Firestore documents."
        },
        {
          subtitle: "Service Delivery",
          text: "We use your data to provide, maintain, and improve the Orchis platform, including chatbot performance, response accuracy, and feature development."
        }
      ]
    },
    {
      icon: LockClosedIcon,
      title: "Data Security & Isolation",
      content: [
        {
          subtitle: "Firebase Security",
          text: "All data is stored in Google Firebase Firestore with enterprise-grade security, including encryption at rest and in transit using industry-standard protocols."
        },
        {
          subtitle: "Isolated Access Controls",
          text: "Each user's training data and chatbot configurations are stored with strict isolation. Your data can only be accessed through your authenticated account - no other users or accounts can access your information."
        },
        {
          subtitle: "Google OAuth Authentication",
          text: "We use Google's secure OAuth 2.0 for authentication. We never see, store, or have access to your Google password. All authentication is handled by Google's infrastructure."
        }
      ]
    },
    {
      icon: TrashIcon,
      title: "Data Retention & Deletion",
      content: [
        {
          subtitle: "Original Documents",
          text: "Uploaded training documents are automatically and permanently deleted from our systems immediately after the AI training process is complete. We retain no copies of your original files."
        },
        {
          subtitle: "Training Data",
          text: "The processed training data (embeddings and knowledge base) is stored securely in Firebase Firestore and retained to power your chatbot. This data is deleted when you delete your chatbot or account."
        },
        {
          subtitle: "Account Deletion",
          text: "When you delete your account, all associated data including your profile information, training data, and chatbot configurations are permanently removed from our systems."
        }
      ]
    },
    {
      icon: DocumentTextIcon,
      title: "Information Sharing",
      content: [
        {
          subtitle: "No Third-Party Selling",
          text: "We never sell, rent, or trade your personal information or training data to third parties. Your data belongs to you."
        },
        {
          subtitle: "Service Providers",
          text: "We use Google Firebase and related Google Cloud services to store and process your data. These services comply with strict data protection standards and agreements."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information only if required by law, court order, or government request, or to protect the security and rights of Orchis and its users."
        }
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: "Your Rights & Controls",
      content: [
        {
          subtitle: "Access Your Data",
          text: "You can access all your account information and chatbot data at any time through your Orchis dashboard."
        },
        {
          subtitle: "Update Information",
          text: "Your profile information syncs with your Google account. Any changes to your Google profile will be reflected in Orchis."
        },
        {
          subtitle: "Delete Your Data",
          text: "You have the right to delete your chatbot training data or your entire account at any time. Upon deletion, all your data is permanently removed from our systems."
        },
        {
          subtitle: "Data Portability",
          text: "You can export your chatbot configurations and training data at any time by contacting our support team."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Privacy Policy - Orchis</title>
        <meta name="description" content="Learn how Orchis collects, uses, and protects your data. We're committed to transparency and security." />
        <meta name="keywords" content="privacy policy, data protection, security, GDPR, privacy" />
        <link rel="canonical" href="https://orchis.app/privacy" />
      </Helmet>
      
      <div className="min-h-screen bg-neutral-100">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 mb-8">
              <ShieldCheckIcon className="w-4 h-4" />
              Last Updated: October 3, 2025
            </div>
            
            <h1 className="text-4xl md:text-5xl font-light text-neutral-900 mb-6 leading-tight">
              Privacy <span className="font-medium">Policy</span>
            </h1>
            
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Your privacy matters to us. This policy explains how we collect, use, and protect your information when you use Orchis.
            </p>
          </div>
        </section>

        {/* Introduction */}
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-neutral-200">
              <h2 className="text-2xl font-light text-neutral-900 mb-4">
                Our Commitment to Your Privacy
              </h2>
              <p className="text-neutral-600 leading-relaxed font-light mb-4">
                At Orchis, we believe in transparency and security. We collect only what's necessary to provide you with an exceptional AI customer support experience, and we protect your data with enterprise-grade security measures.
              </p>
              <p className="text-neutral-600 leading-relaxed font-light">
                This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using Orchis, you agree to the practices described in this policy.
              </p>
            </div>
          </div>
        </section>

        {/* Sections */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 md:p-10 border border-neutral-200">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-light text-neutral-900">
                    {section.title}
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed font-light">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden border border-neutral-700/50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-light mb-4 text-white">
                  Questions About Your Privacy?
                </h2>
                <p className="text-lg text-neutral-300 mb-6 leading-relaxed max-w-2xl font-light">
                  If you have any questions about this Privacy Policy or how we handle your data, we're here to help.
                </p>
                <a 
                  href="mailto:deniz@orchis.app"
                  className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-medium hover:bg-neutral-100 transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}