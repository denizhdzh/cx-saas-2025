import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import InsightsPage from './pages/InsightsPage';
import EditAgentPage from './pages/EditAgentPage';
import ConfigurationPage from './pages/ConfigurationPage';
import CreateAgentPage from './pages/CreateAgentPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';
import NotFoundPage from './pages/NotFoundPage';
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
          <div className="min-h-screen bg-neutral-100">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/insights" element={
                <ProtectedRoute>
                  <InsightsPage />
                </ProtectedRoute>
              } />
              <Route path="/edit-agent" element={
                <ProtectedRoute>
                  <EditAgentPage />
                </ProtectedRoute>
              } />
              <Route path="/configuration" element={
                <ProtectedRoute>
                  <ConfigurationPage />
                </ProtectedRoute>
              } />
              <Route path="/create-agent" element={
                <ProtectedRoute>
                  <CreateAgentPage />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
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
