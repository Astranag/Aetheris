import React from 'react';
import { Link } from 'react-router-dom';
import { Cube, ShieldCheck } from '@phosphor-icons/react';

export const Footer = () => (
  <footer className="border-t border-[var(--border-subtle)] py-10 px-6 bg-[var(--bg-surface)]" role="contentinfo" data-testid="global-footer">
    <div className="max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Cube size={18} weight="bold" className="text-[var(--brand-primary)]" />
            <span className="font-['Unbounded'] text-xs font-bold text-[var(--text-primary)]">AETHERIS SPATIAL</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-['Outfit'] leading-relaxed max-w-xs">
            The AI-native spatial commerce platform. Explore, customize, and own modular products across dimensions.
          </p>
        </div>

        {/* Legal */}
        <div>
          <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-3">Legal & Compliance</p>
          <nav aria-label="Legal links" className="flex flex-col gap-2">
            <Link to="/privacy" className="text-xs text-[var(--text-secondary)] font-['Outfit'] hover:text-[var(--brand-primary)] transition-colors" data-testid="footer-privacy-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-[var(--text-secondary)] font-['Outfit'] hover:text-[var(--brand-primary)] transition-colors" data-testid="footer-terms-link">
              Terms of Service
            </Link>
            <span className="text-[10px] text-[var(--text-muted)] font-['Outfit']">
              GDPR & CCPA Compliant
            </span>
          </nav>
        </div>

        {/* Standards */}
        <div>
          <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-3">Standards</p>
          <div className="flex flex-col gap-2 text-[10px] text-[var(--text-muted)] font-['Outfit']">
            <span>WCAG 2.2 AA Accessible</span>
            <span>Strictly Necessary Cookies Only</span>
            <span>End-to-End Encrypted Sessions</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-muted)] font-['Outfit']">
          &copy; {new Date().getFullYear()} Aetheris Spatial. All rights reserved.
        </p>
        <Link
          to="/admin"
          data-testid="footer-admin-link"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-['JetBrains_Mono'] text-[var(--text-muted)] hover:text-[var(--brand-ai)] hover:bg-[var(--brand-ai)]/10 border border-transparent hover:border-[var(--brand-ai)]/20 transition-all"
        >
          <ShieldCheck size={14} />
          Admin Console
        </Link>
      </div>
    </div>
  </footer>
);
