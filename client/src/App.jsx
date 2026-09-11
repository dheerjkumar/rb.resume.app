import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ResumeProvider } from './contexts/ResumeContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import { HelpDesk, Guide, Contact, Feedback } from './pages/static/StaticPages';
import OnboardingTour from './components/tour/OnboardingTour';
import ReferralTracker from './components/common/ReferralTracker';
import CommunityFeed from './pages/CommunityFeed';
import PostView from './pages/PostView';
import Inbox from './pages/Inbox';

import { Navigate } from 'react-router-dom';

const Home = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">Build your perfect resume</h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">Log in to get started.</p>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <ResumeProvider>
          <Router>
            <ReferralTracker />
            <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <OnboardingTour />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/help" element={<HelpDesk />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/builder/:id"
                  element={
                    <ProtectedRoute>
                      <Builder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community"
                  element={
                    <ProtectedRoute>
                      <CommunityFeed />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community/post/:id"
                  element={<PostView />}
                />
                <Route
                  path="/inbox"
                  element={
                    <ProtectedRoute>
                      <Inbox />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
        </ResumeProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
