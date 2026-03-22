import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './pages/AuthCallback';
import Landing from './pages/Landing';
import DiscoveryHub from './pages/DiscoveryHub';
import ProductDetail from './pages/ProductDetail';
import CreatorStudio from './pages/CreatorStudio';
import DesignVault from './pages/DesignVault';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFound from './pages/NotFound';
import { Toaster } from 'sonner';

const AppRouter = () => {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      {/* WCAG 2.4.1: Skip navigation link */}
      <a href="#main-content" className="skip-to-main" data-testid="skip-to-main">
        Skip to main content
      </a>

      <Navbar />

      <div id="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><DiscoveryHub /></ProtectedRoute>} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/studio" element={<ProtectedRoute><CreatorStudio /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><DesignVault /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* GDPR: Cookie consent banner */}
      <CookieConsent />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
