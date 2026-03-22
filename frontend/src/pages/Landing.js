import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Scene3D } from '../components/Scene3D';
import { Cube, ArrowRight, Lightning, Leaf, Brain, ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function Landing() {
  const { login } = useAuth();

  return (
    <main className="min-h-screen" style={{ background: '#000' }} role="main" aria-label="Aetheris Spatial Landing">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden" aria-label="Hero section">
        {/* 3D Background - single canvas */}
        <div className="absolute inset-0 opacity-30">
          <Scene3D shape="desk" color="#00F0FF" height="100vh" showParticles={true} />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF]/40 to-transparent" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 pt-24 pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/5 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse-glow" />
              <span className="text-xs font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#00F0FF]">
                Spatial Commerce
              </span>
            </div>

            <h1 className="font-['Unbounded'] text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6">
              <span className="text-white">Design in</span>
              <br />
              <span className="text-[#00F0FF] text-glow-cyan">Three Dimensions</span>
            </h1>

            <p className="text-base md:text-lg text-[#A1A1AA] font-['Outfit'] font-light leading-relaxed max-w-xl mb-10">
              The AI-native 3D marketplace where you explore, customize, and own 
              modular products in real-time spatial interfaces. Beyond flat. Beyond browsing.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={login}
                data-testid="hero-cta-enter"
                aria-label="Sign in to enter the Aetheris Spatial platform"
                className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#00F0FF] text-black font-['Outfit'] font-semibold text-sm hover:bg-[#66F6FF] transition-colors duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
              >
                Enter the Spatial
                <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={login}
                data-testid="hero-cta-explore"
                aria-label="Explore products in the marketplace"
                className="flex items-center gap-3 px-8 py-3.5 rounded-full border border-white/10 text-white font-['Outfit'] font-medium text-sm hover:bg-white/5 hover:border-white/20 transition-colors duration-300"
              >
                Explore Products
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="relative py-24 px-6 md:px-12 max-w-[1440px] mx-auto" aria-label="Platform features">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-xs font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#FF0055] block mb-4">
            Why Aetheris
          </span>
          <h2 className="font-['Unbounded'] text-2xl md:text-3xl font-bold tracking-tight text-white">
            A Leap Beyond Flat Marketplaces
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Hero Card - with CSS glow instead of second Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-8 md:row-span-2 liquid-glass rounded-2xl p-8 md:p-12 relative overflow-hidden group"
            data-testid="feature-3d-customization"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/8 rounded-full blur-[100px] group-hover:bg-[#00F0FF]/12 transition-colors duration-700" />
            <div className="absolute bottom-0 left-1/2 w-60 h-60 bg-[#FF0055]/5 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <Cube size={32} weight="duotone" className="text-[#00F0FF] mb-6" />
              <h3 className="font-['Unbounded'] text-xl md:text-2xl font-bold tracking-tight text-white mb-4">
                Real-Time 3D Customization
              </h3>
              <p className="text-[#A1A1AA] font-['Outfit'] font-light text-sm md:text-base leading-relaxed max-w-md mb-8">
                Rotate, configure, and personalize every product in immersive 3D. 
                Change materials, colors, and modules with instant visual feedback.
              </p>
              <div className="flex gap-3">
                {['#00F0FF', '#FF0055', '#E0FF00', '#0066FF'].map((c, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border border-white/10" style={{ background: `${c}20` }}>
                    <div className="w-full h-full rounded-xl" style={{ background: `linear-gradient(135deg, ${c}40, transparent)` }} />
                  </div>
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
            className="md:col-span-4 liquid-glass rounded-2xl p-8 relative overflow-hidden tracing-beam"
            data-testid="feature-ai-designer"
          >
            <div className="relative z-10">
              <Brain size={28} weight="duotone" className="text-[#FF0055] mb-4" />
              <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-white mb-2">
                AI Co-Designer
              </h3>
              <p className="text-[#A1A1AA] font-['Outfit'] font-light text-sm leading-relaxed">
                Powered by GPT-5.2. Describe your vision in natural language and watch it materialize.
              </p>
            </div>
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
            <Leaf size={28} weight="duotone" className="text-[#E0FF00] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-white mb-2">
              Sustainability Scored
            </h3>
            <p className="text-[#A1A1AA] font-['Outfit'] font-light text-sm leading-relaxed">
              Every product rated for environmental impact. Make conscious choices with transparent metrics.
            </p>
          </motion.div>

          {/* Speed */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:col-span-6 liquid-glass rounded-2xl p-8"
            data-testid="feature-performance"
          >
            <Lightning size={28} weight="duotone" className="text-[#00F0FF] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-white mb-2">
              WebGPU-Accelerated
            </h3>
            <p className="text-[#A1A1AA] font-['Outfit'] font-light text-sm leading-relaxed">
              Blazing fast 3D rendering with real-time ray tracing. Fluid 60fps interactions on any modern device.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="md:col-span-6 liquid-glass rounded-2xl p-8"
            data-testid="feature-vault"
          >
            <ShieldCheck size={28} weight="duotone" className="text-[#00F0FF] mb-4" />
            <h3 className="font-['Unbounded'] text-base font-bold tracking-tight text-white mb-2">
              Design Vault
            </h3>
            <p className="text-[#A1A1AA] font-['Outfit'] font-light text-sm leading-relaxed">
              Save, version, and share your configurations. Build collections. Return to any previous design iteration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6" role="contentinfo">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Cube size={20} weight="bold" className="text-[#00F0FF]" />
            <span className="font-['Unbounded'] text-xs font-bold text-white">AETHERIS SPATIAL</span>
          </div>
          <p className="text-xs text-[#71717A] font-['Outfit']">
            Next-generation spatial commerce platform
          </p>
        </div>
      </footer>
    </main>
  );
}
