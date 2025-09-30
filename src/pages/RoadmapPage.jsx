import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../homepage/components/Header';
import Footer from '../homepage/components/Footer';
import { 
  CalendarIcon, 
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function RoadmapPage() {
  const [nextFeature, setNextFeature] = useState(null);
  const [changelog, setChangelog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmapData();
  }, []);

  const fetchRoadmapData = async () => {
    try {
      // Fetch next feature (roadmap)
      const roadmapQuery = query(
        collection(db, 'admin/roadmap/items'),
        where('status', '==', 'upcoming'),
        orderBy('priority', 'asc')
      );
      const roadmapSnapshot = await getDocs(roadmapQuery);
      if (!roadmapSnapshot.empty) {
        setNextFeature({ id: roadmapSnapshot.docs[0].id, ...roadmapSnapshot.docs[0].data() });
      }

      // Fetch changelog
      const changelogQuery = query(
        collection(db, 'admin/changelog/items'),
        where('published', '==', true),
        orderBy('releaseDate', 'desc')
      );
      const changelogSnapshot = await getDocs(changelogQuery);
      const changelogData = changelogSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChangelog(changelogData);
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getVersionBadgeColor = (type) => {
    switch (type) {
      case 'major': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Roadmap & Changelog - Orchis</title>
        <meta name="description" content="See what's coming next and track our latest updates. Follow Orchis development roadmap and feature releases." />
        <meta name="keywords" content="roadmap, changelog, updates, features, releases, development" />
        <link rel="canonical" href="https://orchis.app/roadmap" />
      </Helmet>
      
      <div className="min-h-screen bg-neutral-100">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 mb-8">
              <SparklesIcon className="w-4 h-4" />
              Product Development
            </div>
            
            <h1 className="text-4xl md:text-5xl font-light text-neutral-900 mb-6 leading-tight">
              What's <span className="font-medium">Next</span> &<br />
              What's <span className="font-medium">New</span>
            </h1>
            
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Follow our journey as we build the future of AI customer support. 
              See what's coming next and track our latest updates.
            </p>
          </div>
        </section>

        {/* Next Feature Section */}
        {nextFeature && (
          <section className="pb-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden border border-neutral-700/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                      <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-400">Next Up</div>
                      <div className="text-lg font-medium text-white">Coming Soon</div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-light mb-4 leading-tight text-white">
                    {nextFeature.title}
                  </h2>
                  
                  <p className="text-lg text-neutral-300 mb-6 leading-relaxed max-w-2xl">
                    {nextFeature.description}
                  </p>
                  
                  {nextFeature.expectedDate && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">Expected: {formatDate(nextFeature.expectedDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Current Time Indicator */}
        <section className="pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-full px-6 py-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-neutral-700">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <ClockIcon className="w-4 h-4 text-neutral-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Changelog Section */}
        <section className="pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
                Recent <span className="font-medium">Updates</span>
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Track our progress and see the latest features we've shipped.
              </p>
            </div>

            <div className="space-y-6">
              {changelog.map((item, index) => (
                <div key={item.id} className="group relative">
                  {/* Timeline line */}
                  {index !== changelog.length - 1 && (
                    <div className="absolute left-6 top-14 w-px h-full bg-neutral-200 group-hover:bg-neutral-300 transition-colors"></div>
                  )}
                  
                  <div className="flex items-start gap-6">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-3 h-3 bg-neutral-900 rounded-full border-4 border-neutral-100 shadow-sm"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getVersionBadgeColor(item.type)}`}>
                          v{item.version}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {formatDate(item.releaseDate)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-light text-neutral-900 mb-3">
                        {item.title}
                      </h3>
                      
                      <p className="text-neutral-600 mb-4 leading-relaxed font-light">
                        {item.description}
                      </p>
                      
                      {item.features && item.features.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2 text-sm text-neutral-600">
                              <div className="w-1 h-1 bg-neutral-900 rounded-full flex-shrink-0"></div>
                              <span className="font-light">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {changelog.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-light text-neutral-900 mb-2">No updates yet</h3>
                <p className="text-neutral-600 font-light">Check back soon for our latest releases.</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}