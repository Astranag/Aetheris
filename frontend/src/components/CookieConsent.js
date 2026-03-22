import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from '@phosphor-icons/react';

const CONSENT_KEY = 'aetheris_cookie_consent';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-4xl mx-auto liquid-glass rounded-2xl p-5 md:p-6 relative">
        <button
          onClick={decline}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/10 transition-colors duration-300"
          aria-label="Dismiss cookie notice"
          data-testid="cookie-dismiss-btn"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <ShieldCheck size={24} className="text-[#E0FF00] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-['Unbounded'] text-xs font-bold text-white mb-1">Cookie Notice</h2>
              <p className="text-xs text-[#A1A1AA] font-['Outfit'] leading-relaxed">
                We use strictly necessary session cookies for authentication only. No tracking, advertising, or analytics cookies.{' '}
                <Link to="/privacy" className="text-[#00F0FF] hover:underline focus-visible:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={accept}
              data-testid="cookie-accept-btn"
              className="px-5 py-2 rounded-full text-xs font-['Outfit'] font-semibold bg-[#00F0FF] text-black hover:bg-[#66F6FF] transition-colors duration-300"
            >
              Accept
            </button>
            <button
              onClick={decline}
              data-testid="cookie-decline-btn"
              className="px-5 py-2 rounded-full text-xs font-['Outfit'] font-medium border border-white/10 text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-colors duration-300"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
