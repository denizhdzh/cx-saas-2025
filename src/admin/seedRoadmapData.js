// Firestore'a başlangıç roadmap verilerini eklemek için
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const seedRoadmapData = async () => {
  try {
    // Recently completed features (mark these as completed to auto-generate changelog)
    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Domain Privacy & Security Controls',
      description: 'Comprehensive security system with domain whitelisting, HMAC cryptographic signatures, replay protection with 5-minute request expiry, and real-time security alerts for unauthorized access attempts.',
      status: 'completed',
      priority: 1,
      expectedDate: new Date('2025-10-20'),
      category: 'security',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Dynamic Content Popups & Engagement Tools',
      description: 'Smart popup system with multiple triggers (first visit, return visit, exit intent, time delay, scroll depth) and content types (discounts, announcements, videos, links) to boost user engagement and conversions.',
      status: 'completed',
      priority: 1,
      expectedDate: new Date('2025-10-22'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Chat Performance Optimization',
      description: 'Achieved sub-50ms widget load times through code splitting, lazy loading, optimized bundle sizes, and improved server response times for lightning-fast chat experience.',
      status: 'completed',
      priority: 1,
      expectedDate: new Date('2025-10-23'),
      category: 'performance',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Session Intelligence & User Recognition',
      description: 'Advanced session tracking system that recognizes returning users, maintains conversation context across sessions, and provides personalized responses based on user history and behavior patterns.',
      status: 'completed',
      priority: 1,
      expectedDate: new Date('2025-10-24'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Enhanced Analytics & Real-time Insights',
      description: 'Enriched chat analytics dashboard with real-time conversation tracking, user journey visualization, message-level insights, and comprehensive performance metrics for better decision-making.',
      status: 'completed',
      priority: 2,
      expectedDate: new Date('2025-10-25'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Future roadmap items
    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Slack Integration & Notifications',
      description: 'Receive real-time chat notifications in Slack channels, forward conversations to team members, and manage customer inquiries directly from Slack workspace.',
      status: 'upcoming',
      priority: 1,
      expectedDate: new Date('2025-11-20'),
      category: 'integration',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Export Chat History to CSV/PDF',
      description: 'Download and archive conversation logs in CSV or PDF format for reporting, analysis, compliance, and record-keeping purposes.',
      status: 'upcoming',
      priority: 2,
      expectedDate: new Date('2025-11-05'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Chat History Search',
      description: 'Powerful search functionality to quickly find specific conversations, messages, or topics across all chat history with advanced filters and keyword matching.',
      status: 'upcoming',
      priority: 3,
      expectedDate: new Date('2025-11-10'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'File & Image Sharing',
      description: 'Allow users to upload and share files, images, and documents directly in chat conversations for better support and communication.',
      status: 'upcoming',
      priority: 4,
      expectedDate: new Date('2025-11-25'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Screenshot Capture Tool',
      description: 'Built-in screenshot tool allowing users to capture and share their screen directly from the chat widget for faster issue resolution.',
      status: 'upcoming',
      priority: 5,
      expectedDate: new Date('2025-12-05'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Rate Limiting & Spam Protection',
      description: 'Intelligent spam detection, message rate limiting, and bot protection to prevent abuse and maintain chat quality.',
      status: 'upcoming',
      priority: 6,
      expectedDate: new Date('2025-12-20'),
      category: 'security',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Roadmap data seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
};

// Sadece admin panelinden çağırmak için
export const seedDataFromAdmin = async () => {
  if (window.confirm('Bu işlem örnek roadmap verilerini ekleyecek (changelog etkilenmez). Devam etmek istediğinizden emin misiniz?')) {
    return await seedRoadmapData();
  }
  return false;
};