import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { Toaster } from 'sonner';

/* Pages that include their own footer or shouldn't have one */
const NO_FOOTER_PATHS = ['/', '/admin'];

const AppRouter = () => {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  const showFooter = !NO_FOOTER_PATHS.includes(location.pathname);

  return (
    <>
      {/* WCAG 2.4.1: Skip navigation link */}
      <a href="#main-content" className="skip-to-main" data-testid="skip-to-main">
        Skip to main content
      </a>

      {location.pathname !== '/admin' && <Navbar />}

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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {showFooter && <Footer />}

      {/* GDPR: Cookie consent banner */}
      <CookieConsent />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
