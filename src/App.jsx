import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';
import CreateAgentPage from './pages/CreateAgentPage';
import TrainPage from './pages/TrainPage';
import EmbedPage from './pages/EmbedPage';
import RoadmapPage from './pages/RoadmapPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import BlogIndex from './blog/components/BlogIndex';
import BlogPost from './blog/components/BlogPost';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { AgentProvider } from './contexts/AgentContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AgentProvider>
          <BrowserRouter>
          <div className="min-h-screen bg-stone-100">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/blog" element={<BlogIndex />} />
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
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/create-agent" element={
                <ProtectedRoute>
                  <CreateAgentPage />
                </ProtectedRoute>
              } />
              <Route path="/train-agent" element={
                <ProtectedRoute>
                  <TrainPage />
                </ProtectedRoute>
              } />
              <Route path="/embed" element={
                <ProtectedRoute>
                  <EmbedPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          </BrowserRouter>
        </AgentProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
