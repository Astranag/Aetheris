import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './pages/AuthCallback';
import Landing from './pages/Landing';
import DiscoveryHub from './pages/DiscoveryHub';
import ProductDetail from './pages/ProductDetail';
import CreatorStudio from './pages/CreatorStudio';
import DesignVault from './pages/DesignVault';
import Settings from './pages/Settings';
import { Toaster } from 'sonner';

const AppRouter = () => {
  const location = useLocation();

  // Detect session_id during render (NOT in useEffect) — prevents race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute><DiscoveryHub /></ProtectedRoute>} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/studio" element={<ProtectedRoute><CreatorStudio /></ProtectedRoute>} />
        <Route path="/vault" element={<ProtectedRoute><DesignVault /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

function App() {
  return (
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
  );
}

export default App;
