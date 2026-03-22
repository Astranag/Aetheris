import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DimensionalHero } from '../components/DimensionalHero';
import { Footer } from '../components/Footer';
import { Cube, ArrowRight, Lightning, Leaf, Brain, ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const DIMENSION_LABELS = ['1D — Line', '2D — Plane', '3D — Volume', '4D — Tesseract'];

export default function Landing() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const [dimIdx, setDimIdx] = useState(0);

  // Cycle dimension label in sync with the 3D animation (4s hold + 2s transition = 6s per stage)
  useEffect(() => {
    const interval = setInterval(() => {
      setDimIdx(prev => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-default)]" role="main" aria-label="Aetheris Spatial Landing">
      {/* ═══ Hero ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" aria-label="Hero section">
        {/* Dimensional 3D Background */}
        <div className="absolute inset-0 opacity-50">
          <DimensionalHero height="100vh" />
        </div>

        {/* Overlay gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, var(--hero-overlay), transparent 40%, transparent 60%, var(--bg-default))` }} />

        {/* Content */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 pt-24 pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            {/* Dimension indicator */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 mb-8">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse-glow" />
              <span className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[var(--brand-primary)]" data-testid="dimension-label">
                {DIMENSION_LABELS[dimIdx]}
              </span>
            </div>

            <h1 className="font-['Unbounded'] text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.95] mb-6">
              <span className="text-[var(--text-primary)]">Design Across</span>
              <br />
              <span className="text-[var(--brand-primary)]" style={{ textShadow: isDark ? '0 0 30px var(--brand-primary)' : 'none' }}>
                Every Dimension
              </span>
            </h1>

            <p className="text-base md:text-lg text-[var(--text-secondary)] font-['Outfit'] font-light leading-relaxed max-w-xl mb-10">
              The AI-native spatial marketplace. Explore products beyond flat browsing —
              customize in real-time 3D, morph through n-dimensional parameter spaces,
              and let spatial intelligence shape your world.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={login}
                data-testid="hero-cta-enter"
                aria-label="Sign in to enter the Aetheris Spatial platform"
                className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-[var(--brand-primary)] text-black font-['Outfit'] font-semibold text-sm hover:opacity-90 transition-all duration-300"
              >
                Enter the Spatial
                <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={login}
                data-testid="hero-cta-explore"
                aria-label="Explore products in the marketplace"
                className="flex items-center gap-3 px-8 py-3.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-primary)] font-['Outfit'] font-medium text-sm hover:bg-[var(--card-hover-bg)] hover:border-[var(--text-muted)] transition-all duration-300"
              >
                Explore Products
              </button>
            </div>

            {/* Dimension Progress Dots */}
            <div className="flex items-center gap-2 mt-10" aria-label="Current visualization dimension">
              {DIMENSION_LABELS.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    i === dimIdx ? 'bg-[var(--brand-primary)] scale-125' : 'bg-[var(--text-muted)]/30'
                  }`} />
                  <span className={`text-[9px] font-['JetBrains_Mono'] transition-colors duration-500 ${
                    i === dimIdx ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]/40'
                  }`}>{label.split(' — ')[0]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-primary)]/30 to-transparent" />
      </section>

      {/* ═══ Features Bento ═══ */}
      <section className="relative py-24 px-6 md:px-12 max-w-[1440px] mx-auto" aria-label="Platform features">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-xs font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[var(--brand-ai)] block mb-4">
            Why Aetheris
          </span>
          <h2 className="font-['Unbounded'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            A Leap Beyond Flat Marketplaces
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Hero Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-8 md:row-span-2 liquid-glass rounded-2xl p-8 md:p-12 relative overflow-hidden group"
            data-testid="feature-3d-customization"
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-700" style={{ background: 'var(--brand-primary)' }} />
            <div className="absolute bottom-0 left-1/2 w-60 h-60 rounded-full blur-[80px] opacity-5" style={{ background: 'var(--brand-ai)' }} />
            <div className="relative z-10">
              <Cube size={32} weight="duotone" className="text-[var(--brand-primary)] mb-6" />
              <h3 className="font-['Unbounded'] text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
                Multi-Dimensional Customization
              </h3>
              <p className="text-[var(--text-secondary)] font-['Outfit'] font-light text-sm md:text-base leading-relaxed max-w-md mb-8">
                Navigate product parameter spaces across dimensions. Morph geometry, explore material composites,
                and discover design variants the AI generates from n-dimensional reasoning.
              </p>
              <div className="flex gap-3">
                {['var(--brand-primary)', 'var(--brand-ai)', 'var(--brand-success)', '#0066FF'].map((c, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border border-[var(--border-subtle)]" style={{ background: `color-mix(in srgb, ${c} 15%, transparent)` }} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-4 liquid-glass rounded-2xl p-8 relative overflow-hidden"
            data-testid="feature-ai-designer"
          >
            <Brain size={28} weight="duotone" className="text-[var(--brand-ai)] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-[var(--text-primary)] mb-2">
              AI Co-Designer
            </h3>
            <p className="text-[var(--text-secondary)] font-['Outfit'] font-light text-sm leading-relaxed">
              Five specialized agents — Design, Material, Style, Spatial, Generative — powered by GPT-5.2.
              Describe your vision and watch it materialize across dimensions.
            </p>
          </motion.div>

          {/* Sustainability */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-4 liquid-glass rounded-2xl p-8"
            data-testid="feature-sustainability"
          >
            <Leaf size={28} weight="duotone" className="text-[var(--brand-success)] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-[var(--text-primary)] mb-2">
              Sustainability Scored
            </h3>
            <p className="text-[var(--text-secondary)] font-['Outfit'] font-light text-sm leading-relaxed">
              Every product rated for environmental impact. Transparent eco-scores, material origins, and carbon metrics.
            </p>
          </motion.div>

          {/* Performance */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:col-span-6 liquid-glass rounded-2xl p-8"
            data-testid="feature-performance"
          >
            <Lightning size={28} weight="duotone" className="text-[var(--brand-primary)] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-[var(--text-primary)] mb-2">
              Spatial-First Rendering
            </h3>
            <p className="text-[var(--text-secondary)] font-['Outfit'] font-light text-sm leading-relaxed">
              Fluid 60fps 3D interactions. Dimensional morphing with real-time constraint satisfaction. Beyond flat browsing.
            </p>
          </motion.div>

          {/* Design Vault */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="md:col-span-6 liquid-glass rounded-2xl p-8"
            data-testid="feature-vault"
          >
            <ShieldCheck size={28} weight="duotone" className="text-[var(--brand-primary)] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-[var(--text-primary)] mb-2">
              Design Vault
            </h3>
            <p className="text-[var(--text-secondary)] font-['Outfit'] font-light text-sm leading-relaxed">
              Save, version, and share configurations. Build collections across dimensional variants. Full version history.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <Footer />
    </main>
  );
}
