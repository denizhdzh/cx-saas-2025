import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../homepage/components/Header';
import Footer from '../homepage/components/Footer';
import { 
  DocumentCheckIcon,
  UsersIcon,
  ShieldExclamationIcon,
  BanknotesIcon,
  NoSymbolIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

export default function TermsPage() {
  const sections = [
    {
      icon: DocumentCheckIcon,
      title: "Acceptance of Terms",
      content: [
        {
          subtitle: "Agreement to Terms",
          text: "By creating an account and using Orchis, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you may not access or use our service."
        },
        {
          subtitle: "Changes to Terms",
          text: "We reserve the right to modify these terms at any time. We will notify you of any material changes via email or through the platform. Your continued use of Orchis after changes constitutes acceptance of the new terms."
        },
        {
          subtitle: "Eligibility",
          text: "You must be at least 18 years old and have the legal capacity to enter into binding contracts to use Orchis. By using our service, you represent that you meet these requirements."
        }
      ]
    },
    {
      icon: UsersIcon,
      title: "Account & Registration",
      content: [
        {
          subtitle: "Google Authentication",
          text: "You must sign up using a valid Google account. You are responsible for maintaining the security of your Google account and for all activities that occur under your Orchis account."
        },
        {
          subtitle: "Account Information",
          text: "You agree to provide accurate and current information during registration. Your account name, email, and profile photo are obtained from your Google account and stored in our database."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for safeguarding your account credentials. Notify us immediately of any unauthorized access or security breach. We are not liable for losses resulting from unauthorized use of your account."
        },
        {
          subtitle: "Account Termination",
          text: "You may delete your account at any time through your account settings. We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities."
        }
      ]
    },
    {
      icon: ShieldExclamationIcon,
      title: "Acceptable Use",
      content: [
        {
          subtitle: "Permitted Use",
          text: "Orchis is designed for creating and deploying AI-powered customer support chatbots. You may upload documents to train your chatbot and integrate it into your business workflows."
        },
        {
          subtitle: "Prohibited Content",
          text: "You may not upload or train chatbots with content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. This includes hate speech, violence, adult content, or content that infringes on intellectual property rights."
        },
        {
          subtitle: "Prohibited Activities",
          text: "You may not use Orchis to spam, phish, distribute malware, engage in fraudulent activities, or attempt to gain unauthorized access to our systems or other users' accounts."
        },
        {
          subtitle: "Compliance",
          text: "You are responsible for ensuring your use of Orchis complies with all applicable laws, regulations, and third-party rights in your jurisdiction."
        }
      ]
    },
    {
      icon: BanknotesIcon,
      title: "Payments & Subscriptions",
      content: [
        {
          subtitle: "Pricing",
          text: "Orchis offers various subscription plans with different features and usage limits. Current pricing is available on our website and may change with prior notice."
        },
        {
          subtitle: "Billing",
          text: "Subscription fees are billed in advance on a recurring basis (monthly or annually). You authorize us to charge your payment method automatically for each billing period."
        },
        {
          subtitle: "Cancellation",
          text: "You may cancel your subscription at any time. Cancellations take effect at the end of your current billing period. No refunds are provided for partial billing periods."
        },
        {
          subtitle: "Payment Failures",
          text: "If a payment fails, we may suspend your access to premium features until payment is resolved. Continued payment failures may result in account termination."
        }
      ]
    },
    {
      icon: NoSymbolIcon,
      title: "Content & Intellectual Property",
      content: [
        {
          subtitle: "Your Content",
          text: "You retain all ownership rights to the documents and data you upload to Orchis. By uploading content, you grant us a limited license to process and store it solely for providing our services."
        },
        {
          subtitle: "Training Data",
          text: "Original documents are deleted after training. The resulting AI training data (embeddings and knowledge base) is stored to power your chatbot and remains your property."
        },
        {
          subtitle: "Our Intellectual Property",
          text: "Orchis, including its software, algorithms, design, and branding, is owned by us and protected by copyright and intellectual property laws. You may not copy, modify, or reverse engineer our platform."
        },
        {
          subtitle: "Feedback",
          text: "Any feedback, suggestions, or ideas you provide about Orchis may be used by us without compensation or attribution."
        }
      ]
    },
    {
      icon: ScaleIcon,
      title: "Disclaimers & Limitations",
      content: [
        {
          subtitle: "Service Availability",
          text: 'Orchis is provided "as is" without warranties of any kind. We do not guarantee uninterrupted, error-free, or secure service. We may modify, suspend, or discontinue features at any time.'
        },
        {
          subtitle: "AI Accuracy",
          text: "While we strive for accuracy, AI-generated responses may contain errors or inaccuracies. You are responsible for reviewing and verifying chatbot responses before deployment."
        },
        {
          subtitle: "Limitation of Liability",
          text: "To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of Orchis, including data loss, business interruption, or lost profits."
        },
        {
          subtitle: "Maximum Liability",
          text: "Our total liability for any claims related to Orchis is limited to the amount you paid us in the 12 months preceding the claim."
        },
        {
          subtitle: "Indemnification",
          text: "You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of Orchis, your violation of these terms, or your infringement of any rights of others."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Terms of Service - Orchis</title>
        <meta name="description" content="Read Orchis Terms of Service. Understand your rights and responsibilities when using our AI customer support platform." />
        <meta name="keywords" content="terms of service, terms and conditions, user agreement, legal" />
        <link rel="canonical" href="https://orchis.app/terms" />
      </Helmet>
      
      <div className="min-h-screen bg-neutral-100">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 mb-8">
              <ScaleIcon className="w-4 h-4" />
              Last Updated: October 3, 2025
            </div>
            
            <h1 className="text-4xl md:text-5xl font-light text-neutral-900 mb-6 leading-tight">
              Terms of <span className="font-medium">Service</span>
            </h1>
            
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              These terms govern your use of Orchis. Please read them carefully to understand your rights and responsibilities.
            </p>
          </div>
        </section>

        {/* Introduction */}
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-neutral-200">
              <h2 className="text-2xl font-light text-neutral-900 mb-4">
                Welcome to Orchis
              </h2>
              <p className="text-neutral-600 leading-relaxed font-light mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and Orchis regarding your access to and use of our AI-powered customer support platform.
              </p>
              <p className="text-neutral-600 leading-relaxed font-light">
                By accessing or using Orchis, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using Orchis on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
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

        {/* Governing Law */}
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-neutral-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ScaleIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-light text-neutral-900">
                  Governing Law & Disputes
                </h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Applicable Law
                  </h3>
                  <p className="text-neutral-600 leading-relaxed font-light">
                    These Terms are governed by and construed in accordance with the laws of the jurisdiction in which Orchis operates, without regard to conflict of law principles.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Dispute Resolution
                  </h3>
                  <p className="text-neutral-600 leading-relaxed font-light">
                    Any disputes arising from these Terms or your use of Orchis shall be resolved through good faith negotiations. If negotiations fail, disputes will be resolved through binding arbitration or in the courts of competent jurisdiction.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Severability
                  </h3>
                  <p className="text-neutral-600 leading-relaxed font-light">
                    If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden border border-neutral-700/50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-light mb-4 text-white">
                  Questions About These Terms?
                </h2>
                <p className="text-lg text-neutral-300 mb-6 leading-relaxed max-w-2xl font-light">
                  If you have any questions about these Terms of Service or need clarification, please don't hesitate to reach out.
                </p>
                <a 
                  href="mailto:deniz@orchis.app"
                  className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-medium hover:bg-neutral-100 transition-colors"
                >
                  Contact Legal Team
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