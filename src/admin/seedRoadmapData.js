// Firestore'a başlangıç roadmap ve changelog verilerini eklemek için
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const seedRoadmapData = async () => {
  try {
    // Next updates (roadmap items)
    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Analytics Dashboard & Performance Insights',
      description: 'Comprehensive analytics dashboard showing conversation volume, resolution rates, user satisfaction scores, and AI performance metrics with exportable reports.',
      status: 'upcoming',
      priority: 1,
      expectedDate: new Date('2025-02-10'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'admin/roadmap/items'), {
      title: 'Team Collaboration & Multi-User Support',
      description: 'Add team member management, role-based permissions, shared agent access, and collaborative training workflows for enterprise customers.',
      status: 'upcoming',
      priority: 2,
      expectedDate: new Date('2025-02-20'),
      category: 'feature',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Sample changelog entries
    const changelogItems = [
      {
        title: 'Enhanced Chat Widget Experience',
        description: 'Major update to the chat widget with improved user experience, better AI responses, and modern dark theme design.',
        version: '1.4.0',
        type: 'minor',
        releaseDate: new Date('2025-01-28'),
        features: [
          'Modern dark theme chat interface',
          'Multi-language response support',
          'Better casual conversation handling',
          'Improved name recognition and memory',
          'Smoother typing animations',
          'Mobile-optimized chat experience'
        ],
        published: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Embed Code Generator & Website Integration',
        description: 'New embed code generator allowing users to easily integrate their AI agents into any website with customization options.',
        version: '1.3.0',
        type: 'minor',
        releaseDate: new Date('2025-01-25'),
        features: [
          'One-click embed code generation',
          'Live preview functionality',
          'Customizable widget positioning',
          'Color theme options',
          'Installation instructions',
          'Copy-to-clipboard functionality'
        ],
        published: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Enhanced Chat Experience',
        description: 'Improved chat functionality with better AI responses, multi-language support, and personality enhancements.',
        version: '1.1.5',
        type: 'patch',
        releaseDate: new Date('2025-01-20'),
        features: [
          'Multi-language response support',
          'More conversational AI personality',
          'Better casual question handling',
          'Improved name recognition and capitalization'
        ],
        published: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Embed Code Generator',
        description: 'Launch of the embed code generator allowing users to easily integrate chat widgets into their websites.',
        version: '1.1.0',
        type: 'minor',
        releaseDate: new Date('2025-01-15'),
        features: [
          'One-click embed code generation',
          'Customizable widget positioning',
          'Color theme options',
          'Live preview functionality'
        ],
        published: true,
        createdAt: serverTimestamp()
      },
      {
        title: 'Initial Platform Launch',
        description: 'Official launch of Orchis AI customer support platform with core features including AI training, document processing, and chat functionality.',
        version: '1.0.0',
        type: 'major',
        releaseDate: new Date('2025-01-01'),
        features: [
          'AI agent training system',
          'Document upload and processing',
          'Real-time chat functionality',
          'Dashboard and analytics',
          'User authentication'
        ],
        published: true,
        createdAt: serverTimestamp()
      }
    ];

    for (const item of changelogItems) {
      await addDoc(collection(db, 'admin/changelog/items'), item);
    }

    console.log('✅ Roadmap and changelog data seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
};

// Sadece admin panelinden çağırmak için
export const seedDataFromAdmin = async () => {
  if (window.confirm('Bu işlem örnek roadmap ve changelog verilerini ekleyecek. Devam etmek istediğinizden emin misiniz?')) {
    return await seedRoadmapData();
  }
  return false;
};