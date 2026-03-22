import React from 'react';
import { Link } from 'react-router-dom';
import { Cube } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#030303' }} role="main" aria-label="Page not found">
      <div className="text-center max-w-md" data-testid="not-found-page">
        <Cube size={56} className="text-[#71717A] mx-auto mb-6" aria-hidden="true" />
        <h1 className="font-['Unbounded'] text-4xl font-black text-white mb-2">404</h1>
        <p className="text-sm text-[#A1A1AA] font-['Outfit'] mb-8">
          This spatial coordinate doesn't exist. The page you're looking for has been moved or deleted.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00F0FF] text-black font-['Outfit'] font-semibold text-sm hover:bg-[#66F6FF] transition-colors duration-300"
          data-testid="back-home-btn"
        >
          Return to Origin
        </Link>
      </div>
    </main>
  );
}
