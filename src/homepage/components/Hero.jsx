import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import ChatWidgetMockup from './ChatWidgetMockup';

export default function Hero() {
  const navigate = useNavigate();
  const [nextFeature, setNextFeature] = useState(null);

  useEffect(() => {
    fetchNextFeature();
  }, []);

  const fetchNextFeature = async () => {
    try {
      const roadmapQuery = query(
        collection(db, 'admin/roadmap/items'),
        where('status', '==', 'upcoming'),
        orderBy('priority', 'asc'),
        limit(1)
      );
      const roadmapSnapshot = await getDocs(roadmapQuery);
      if (!roadmapSnapshot.empty) {
        setNextFeature(roadmapSnapshot.docs[0].data().title);
      }
    } catch (error) {
      console.error('Error fetching next feature:', error);
    }
  };

  return (
    
        <section className="relative">

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-2 pt-32 sm:pt-32 md:pt-32 lg:pt-0 pb-12 lg:pb-16 relative">
        <div className="mx-0 sm:mx-4 lg:mx-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-end lg:min-h-[70vh]">
{/* Left side - Content */}
<div className="text-center lg:text-left pl-0 lg:pl-6">
{/* Live Status Badge */}
  <div className="flex justify-center lg:justify-start mb-6 sm:mb-8">
    <button
      onClick={() => navigate('/roadmap')}
      className="inline-flex items-center gap-2 sm:gap-3 bg-white border border-neutral-200 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2 hover:border-green-600 transition-all duration-200 group max-w-[70%] sm:max-w-none"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
        </div>
      </div>
      {nextFeature && (
        <span className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-900 transition-colors text-left">
          Upcoming! {nextFeature}
        </span>
      )}
    </button>
  </div>

  {/* Content */}
  <div className="max-w-3xl mx-auto lg:mx-0">
    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-neutral-900 leading-tight lg:leading-[0.95] mb-4 sm:mb-6 lg:mb-8">
      AI chatbot that converts your users
    </h1>

    <div className="w-10 sm:w-12 lg:w-16 h-px bg-neutral-900 mb-4 sm:mb-6 lg:mb-8 mx-auto lg:mx-0"></div>

    <p className="text-base sm:text-lg lg:text-xl text-neutral-600 font-light mb-6 sm:mb-8 lg:mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0">
      Turn your docs into an AI agent. Embed in minutes. Answer every question, 24/7.
    </p>

    {/* Get Started Button */}
    <div className="max-w-md mx-auto lg:mx-0">
      <button
        onClick={() => navigate('/signin')}
        className="btn-landing sm:w-auto"
      >
        Start Free →
      </button>
      <p className="text-xs text-neutral-500 mt-3 text-center lg:text-left">
        100 free messages • No credit card • 2 minute setup
      </p>
    </div>
  </div>
</div>

            {/* Right side - Desktop only, bottom aligned */}
            <div className="hidden lg:flex lg:items-end lg:justify-center">
              <div className="w-full max-w-sm xl:max-w-md">
                <ChatWidgetMockup />
              </div>
            </div>
          </div>

          {/* Mobile ChatWidget - Below content */}
          <div className="lg:hidden mt-8 sm:mt-12 flex justify-center">
            <div className="w-full max-w-sm">
              <ChatWidgetMockup />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}