import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scales } from '@phosphor-icons/react';

export default function TermsOfService() {
  return (
    <main className="min-h-screen pt-20 pb-16 px-6 md:px-12" style={{ background: '#030303' }} role="main" aria-label="Terms of Service">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#00F0FF] transition-colors duration-300 font-['Outfit'] mb-8" aria-label="Back to home">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Scales size={28} className="text-[#00F0FF]" aria-hidden="true" />
          <h1 className="font-['Unbounded'] text-2xl md:text-3xl font-bold tracking-tighter text-white" data-testid="terms-heading">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-8" data-testid="terms-content">
          <p className="text-xs text-[#71717A] font-['JetBrains_Mono']">Effective: March 22, 2026</p>

          <section aria-labelledby="tos-acceptance">
            <h2 id="tos-acceptance" className="font-['Unbounded'] text-base font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              By accessing or using Aetheris Spatial, you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you do not agree, you must not use the platform. These terms constitute a legally binding agreement between you 
              and Aetheris Spatial.
            </p>
          </section>

          <section aria-labelledby="tos-account">
            <h2 id="tos-account" className="font-['Unbounded'] text-base font-bold text-white mb-3">2. User Accounts</h2>
            <ul className="space-y-2 text-sm text-[#A1A1AA] font-['Outfit'] list-disc list-inside">
              <li>You must authenticate via Google OAuth to access platform features</li>
              <li>You are responsible for maintaining the security of your account session</li>
              <li>You must be at least 16 years old to create an account (GDPR Article 8)</li>
              <li>One account per person; shared or automated accounts are prohibited</li>
            </ul>
          </section>

          <section aria-labelledby="tos-ip">
            <h2 id="tos-ip" className="font-['Unbounded'] text-base font-bold text-white mb-3">3. Intellectual Property</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              Product designs created using our Creator Studio tools belong to the user who created them. 
              The platform's UI, 3D models, branding, and AI systems remain the property of Aetheris Spatial. 
              AI-generated design suggestions are provided as creative assistance and do not constitute independent works.
            </p>
          </section>

          <section aria-labelledby="tos-acceptable">
            <h2 id="tos-acceptable" className="font-['Unbounded'] text-base font-bold text-white mb-3">4. Acceptable Use</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed mb-3">You agree not to:</p>
            <ul className="space-y-2 text-sm text-[#A1A1AA] font-['Outfit'] list-disc list-inside">
              <li>Attempt to reverse-engineer, decompile, or exploit the platform's 3D rendering engine</li>
              <li>Use the AI Co-Designer to generate harmful, illegal, or misleading content</li>
              <li>Scrape, crawl, or harvest data from the platform without authorization</li>
              <li>Upload malicious files or attempt to compromise platform security</li>
              <li>Exceed reasonable API rate limits or abuse service resources</li>
            </ul>
          </section>

          <section aria-labelledby="tos-ai">
            <h2 id="tos-ai" className="font-['Unbounded'] text-base font-bold text-white mb-3">5. AI-Generated Content</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              The AI Co-Designer provides creative suggestions only. Aetheris Spatial does not guarantee the accuracy, 
              suitability, or safety of AI-generated design recommendations. Users are responsible for evaluating AI 
              suggestions before implementing them. AI outputs may occasionally produce unexpected results.
            </p>
          </section>

          <section aria-labelledby="tos-liability">
            <h2 id="tos-liability" className="font-['Unbounded'] text-base font-bold text-white mb-3">6. Limitation of Liability</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              Aetheris Spatial is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, 
              special, or consequential damages arising from platform use. Our total liability shall not exceed the amount 
              paid by you in the 12 months preceding the claim. This limitation does not affect your statutory rights under 
              applicable consumer protection law.
            </p>
          </section>

          <section aria-labelledby="tos-termination">
            <h2 id="tos-termination" className="font-['Unbounded'] text-base font-bold text-white mb-3">7. Termination</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              We may suspend or terminate your access for violation of these terms. You may delete your account at any time. 
              Upon termination, your design data will be retained for 30 days before permanent deletion, during which you 
              may request data export (GDPR Article 20).
            </p>
          </section>

          <section aria-labelledby="tos-governing">
            <h2 id="tos-governing" className="font-['Unbounded'] text-base font-bold text-white mb-3">8. Governing Law</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              These terms are governed by the laws of the jurisdiction in which you reside, subject to mandatory consumer 
              protection provisions. Disputes shall be resolved through binding arbitration, except where prohibited by 
              local law, in which case local courts shall have jurisdiction.
            </p>
          </section>

          <section aria-labelledby="tos-changes">
            <h2 id="tos-changes" className="font-['Unbounded'] text-base font-bold text-white mb-3">9. Changes to Terms</h2>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] leading-relaxed">
              We may update these terms with 30 days' notice via email or platform notification. Continued use after 
              the effective date constitutes acceptance. Material changes require explicit consent.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
