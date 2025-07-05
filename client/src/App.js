import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import BloodWorkPage from './pages/BloodWorkPage';
import SupplementsPage from './pages/SupplementsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import EducationPage from './pages/EducationPage';
import ChatPage from './pages/ChatPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Layout for authenticated users
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <Box minH="100vh" bg="health.background">
      <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Box display="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Box
          flex="1"
          ml={{ base: 0, md: sidebarOpen ? "250px" : "60px" }}
          transition="margin-left 0.3s"
          p={6}
          pt={24} // Account for navbar height
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>HealthAI - Personalized Supplement Recommendations</title>
        <meta 
          name="description" 
          content="Get AI-powered personalized supplement recommendations based on your health profile and blood work analysis." 
        />
        <meta name="keywords" content="health, supplements, AI, blood work, wellness, nutrition" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bloodwork" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <BloodWorkPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/supplements" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <SupplementsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recommendations" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <RecommendationsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/education" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <EducationPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;