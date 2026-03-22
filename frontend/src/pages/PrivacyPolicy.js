import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen pt-20 pb-16 px-6 md:px-12" style={{ background: '#030303' }} role="main" aria-label="Privacy Policy">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#00F0FF] transition-colors duration-300 font-['Outfit'] mb-8" aria-label="Back to home">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck size={28} className="text-[#00F0FF]" aria-hidden="true" />
          <h1 className="font-['Unbounded'] text-2xl md:text-3xl font-bold tracking-tighter text-white" data-testid="privacy-policy-heading">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-8" data-testid="privacy-policy-content">
          <p className="text-xs text-[#71717A] font-['JetBrains_Mono']">Last updated: March 22, 2026</p>

          <section aria-labelledby="pp-intro">
            <h2 id="pp-intro" className="font-['Unbounded'] text-base font-bold text-white mb-3">1. Introduction</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              Aetheris Spatial ("we", "our", "us") respects your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              AI-native 3D marketplace platform, in compliance with GDPR (EU 2016/679), CCPA (California Civil Code 1798.100), 
              and other applicable data protection regulations.
            </p>
          </section>

          <section aria-labelledby="pp-data-collect">
            <h2 id="pp-data-collect" className="font-['Unbounded'] text-base font-bold text-white mb-3">2. Data We Collect</h2>
            <div className="space-y-3">
              <div className="liquid-glass rounded-xl p-4">
                <h3 className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#00F0FF] mb-2">Account Data</h3>
                <p className="text-xs text-[#A1A1AA] font-['Outfit']">Name, email address, and profile picture provided via Google OAuth authentication.</p>
              </div>
              <div className="liquid-glass rounded-xl p-4">
                <h3 className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#00F0FF] mb-2">Usage Data</h3>
                <p className="text-xs text-[#A1A1AA] font-['Outfit']">Product interactions, design configurations, AI Co-Designer conversations, search queries, and preference settings.</p>
              </div>
              <div className="liquid-glass rounded-xl p-4">
                <h3 className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#00F0FF] mb-2">Technical Data</h3>
                <p className="text-xs text-[#A1A1AA] font-['Outfit']">Browser type, device information, IP address, and session cookies necessary for authentication.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="pp-use">
            <h2 id="pp-use" className="font-['Unbounded'] text-base font-bold text-white mb-3">3. How We Use Your Data</h2>
            <ul className="space-y-2 text-sm text-[#A1A1AA] font-['Outfit'] list-disc list-inside">
              <li>To authenticate and maintain your account session</li>
              <li>To provide AI-powered design assistance via our Co-Designer feature</li>
              <li>To save and manage your product designs in the Design Vault</li>
              <li>To personalize product recommendations and UI preferences</li>
              <li>To improve platform performance and user experience</li>
            </ul>
          </section>

          <section aria-labelledby="pp-ai">
            <h2 id="pp-ai" className="font-['Unbounded'] text-base font-bold text-white mb-3">4. AI Data Processing</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              Our AI Co-Designer feature processes your text inputs through OpenAI's GPT-5.2 model via secure API. 
              Conversations are stored in our database to maintain session context. AI-generated responses are not 
              used to train external models. You may request deletion of your AI chat history at any time.
            </p>
          </section>

          <section aria-labelledby="pp-rights">
            <h2 id="pp-rights" className="font-['Unbounded'] text-base font-bold text-white mb-3">5. Your Rights (GDPR Article 12-23)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { right: 'Access', desc: 'Request a copy of your personal data' },
                { right: 'Rectification', desc: 'Correct inaccurate personal data' },
                { right: 'Erasure', desc: 'Request deletion of your data ("right to be forgotten")' },
                { right: 'Portability', desc: 'Receive your data in a machine-readable format' },
                { right: 'Restriction', desc: 'Limit processing of your personal data' },
                { right: 'Objection', desc: 'Object to processing based on legitimate interests' },
              ].map(({ right, desc }) => (
                <div key={right} className="liquid-glass rounded-lg p-3">
                  <span className="text-xs font-['Unbounded'] font-bold text-[#E0FF00]">{right}</span>
                  <p className="text-[10px] text-[#71717A] font-['Outfit'] mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="pp-cookies">
            <h2 id="pp-cookies" className="font-['Unbounded'] text-base font-bold text-white mb-3">6. Cookies</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              We use strictly necessary session cookies for authentication (HttpOnly, Secure, SameSite=None). 
              These cookies are essential for the platform to function and cannot be disabled. We do not use 
              tracking cookies, advertising cookies, or third-party analytics cookies.
            </p>
          </section>

          <section aria-labelledby="pp-retention">
            <h2 id="pp-retention" className="font-['Unbounded'] text-base font-bold text-white mb-3">7. Data Retention</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              Account data is retained for the lifetime of your account. Session data expires after 7 days. 
              Design configurations and AI chat history are retained until you delete them or request account deletion. 
              Upon account deletion, all personal data is permanently removed within 30 days.
            </p>
          </section>

          <section aria-labelledby="pp-security">
            <h2 id="pp-security" className="font-['Unbounded'] text-base font-bold text-white mb-3">8. Security Measures</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              We implement industry-standard security measures including HTTPS encryption, HttpOnly session cookies, 
              input sanitization, rate limiting, and secure headers (HSTS, X-Content-Type-Options, X-Frame-Options). 
              All API communications are encrypted in transit.
            </p>
          </section>

          <section aria-labelledby="pp-contact">
            <h2 id="pp-contact" className="font-['Unbounded'] text-base font-bold text-white mb-3">9. Contact</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              For privacy inquiries, data access requests, or to exercise your rights, contact our Data Protection Officer at 
              <span className="text-[#00F0FF] font-medium"> privacy@aetheris.spatial</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
