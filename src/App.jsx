import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SignInPage from './pages/SignInPage';
import RoadmapPage from './pages/RoadmapPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import BlogIndex from './blog/components/BlogIndex';
import BlogPost from './blog/components/BlogPost';
import ConversationHistoryPage from './pages/ConversationHistoryPage';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { AgentProvider } from './contexts/AgentContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AgentProvider>
          <NotificationProvider>
            <BrowserRouter>
          <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/:agentId" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/conversations" element={
                <ProtectedRoute>
                  <ConversationHistoryPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
            </BrowserRouter>
          </NotificationProvider>
        </AgentProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
