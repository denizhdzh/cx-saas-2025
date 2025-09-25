import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';
import CreateAgentPage from './pages/CreateAgentPage';
import TrainPage from './pages/TrainPage';
import EmbedPage from './pages/EmbedPage';
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
