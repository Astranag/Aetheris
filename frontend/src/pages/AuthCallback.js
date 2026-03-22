import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser, checkAuth } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/');
      return;
    }

    const processAuth = async () => {
      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        setUser(res.data);
        navigate('/dashboard', { state: { user: res.data }, replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/');
      }
    };
    processAuth();
  }, [navigate, setUser, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#030303' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-t-[#00F0FF] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#A1A1AA] font-['Outfit']">Establishing secure connection...</p>
      </div>
    </div>
  );
}
