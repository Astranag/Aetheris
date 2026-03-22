import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Vault, Trash, Clock, FolderOpen, Plus, ShareNetwork, Eye } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLOR_MAP = {
  'Neon Cyan': '#00F0FF', 'Signal Red': '#FF0055', 'Void Black': '#1a1a1a',
  'Arctic White': '#e8e8e8', 'Ocean Blue': '#0066FF', 'Forest Moss': '#2d5a27',
  'Amber Glow': '#ffb347', 'Sunset Orange': '#ff6b35',
};

const DesignCard = ({ design, onDelete, index }) => {
  const color = design.configuration?.colorHex || COLOR_MAP[design.configuration?.color] || '#00F0FF';
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);

  const loadVersions = async () => {
    if (showVersions) { setShowVersions(false); return; }
    try {
      const res = await axios.get(`${API}/designs/${design.design_id}/versions`, { withCredentials: true });
      setVersions(res.data);
      setShowVersions(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="liquid-glass rounded-2xl overflow-hidden group hover:border-[#00F0FF]/20 transition-colors duration-500"
      data-testid={`design-card-${design.design_id}`}
      role="article"
      aria-label={`Design: ${design.name}`}
    >
      {/* Visual preview */}
      <div className="h-36 bg-gradient-to-br from-[#0A0A0A] to-[#050505] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-[40px]" style={{ background: `${color}30` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl border border-white/10" style={{ background: `${color}15`, boxShadow: `0 0 30px ${color}20` }}>
            <div className="w-full h-full rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 rounded" style={{ background: color, opacity: 0.6 }} />
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
          <span className="text-[9px] font-['JetBrains_Mono'] text-[#A1A1AA]">v{design.version}</span>
        </div>
        {design.collection && design.collection !== 'Default' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20">
            <FolderOpen size={10} className="text-[#00F0FF]" aria-hidden="true" />
            <span className="text-[9px] font-['JetBrains_Mono'] text-[#00F0FF]">{design.collection}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-['Unbounded'] text-xs font-bold tracking-tight text-white mb-1 group-hover:text-[#00F0FF] transition-colors duration-300">
          {design.name}
        </h3>
        <p className="text-[10px] text-[#71717A] font-['Outfit'] mb-3">
          {design.configuration?.material || 'Custom'} / {design.configuration?.color || 'Default'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Link
              to={`/studio?product=${design.product_id}`}
              data-testid={`edit-design-${design.design_id}`}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors duration-300"
              title="Edit in Studio"
              aria-label={`Edit ${design.name} in Creator Studio`}
            >
              <Eye size={14} />
            </Link>
            <button
              onClick={loadVersions}
              data-testid={`versions-${design.design_id}`}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors duration-300"
              title="Version history"
              aria-label={`View version history for ${design.name}`}
              aria-expanded={showVersions}
            >
              <Clock size={14} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/product/${design.product_id}`);
                toast.success('Link copied!');
              }}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors duration-300"
              title="Share"
              aria-label={`Share ${design.name}`}
            >
              <ShareNetwork size={14} />
            </button>
          </div>
          <button
            onClick={() => onDelete(design.design_id)}
            data-testid={`delete-design-${design.design_id}`}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FF0055] hover:bg-[#FF0055]/10 transition-colors duration-300"
            title="Delete"
            aria-label={`Delete ${design.name}`}
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {showVersions && (
        <div className="border-t border-white/5 p-3 bg-black/40" role="region" aria-label="Version history">
          <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Version History</p>
          {versions.length === 0 ? (
            <p className="text-[10px] text-[#71717A] font-['Outfit']">No previous versions</p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {versions.map((v) => (
                <div key={v.version_id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.03]">
                  <span className="text-[10px] text-[#A1A1AA] font-['Outfit']">v{v.version}</span>
                  <span className="text-[9px] text-[#71717A] font-['JetBrains_Mono']">
                    {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.article>
  );
};

export default function DesignVault() {
  const [designs, setDesigns] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDesigns = useCallback(async () => {
    try {
      const params = activeCollection ? { collection: activeCollection } : {};
      const res = await axios.get(`${API}/designs`, { params, withCredentials: true });
      setDesigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCollection]);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/collections`, { withCredentials: true });
      setCollections(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchDesigns();
    fetchCollections();
  }, [fetchDesigns, fetchCollections]);

  const deleteDesign = async (designId) => {
    try {
      await axios.delete(`${API}/designs/${designId}`, { withCredentials: true });
      setDesigns(prev => prev.filter(d => d.design_id !== designId));
      toast.success('Design deleted');
    } catch (err) {
      toast.error('Failed to delete design');
    }
  };

  return (
    <main className="min-h-screen pt-20 pb-12 px-6 md:px-12" style={{ background: '#030303' }} data-testid="design-vault" role="main" aria-label="Design Vault">
      <div className="max-w-[1440px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <span className="text-xs font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#00F0FF] block mb-3">Design Vault</span>
          <h1 className="font-['Unbounded'] text-3xl md:text-4xl font-bold tracking-tighter text-white mb-2">Your Creations</h1>
          <p className="text-sm text-[#A1A1AA] font-['Outfit'] font-light">{designs.length} design{designs.length !== 1 ? 's' : ''} saved</p>
        </motion.div>

        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2" data-testid="collection-filter" aria-label="Design collections">
          <button
            onClick={() => setActiveCollection(null)}
            aria-pressed={!activeCollection}
            className={`px-4 py-2 rounded-full text-xs font-['Outfit'] font-medium whitespace-nowrap transition-colors duration-300 ${
              !activeCollection ? 'bg-white text-black' : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white'
            }`}
          >
            All Designs
          </button>
          {collections.map((col) => (
            <button
              key={col}
              onClick={() => setActiveCollection(col)}
              data-testid={`collection-${col.toLowerCase()}`}
              aria-pressed={activeCollection === col}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-['Outfit'] font-medium whitespace-nowrap transition-colors duration-300 ${
                activeCollection === col ? 'bg-white text-black' : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white'
              }`}
            >
              <FolderOpen size={12} aria-hidden="true" /> {col}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true">
            {[...Array(4)].map((_, i) => (<div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />))}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-24" role="status">
            <Vault size={48} className="text-[#71717A] mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-['Unbounded'] text-base font-bold text-white mb-2">Your vault is empty</h3>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] mb-6">Start customizing products and save your designs here</p>
            <Link to="/dashboard" data-testid="explore-products-btn" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00F0FF] text-black font-['Outfit'] font-semibold text-sm hover:bg-[#66F6FF] transition-colors duration-300">
              <Plus size={16} aria-hidden="true" /> Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="Saved designs">
            {designs.map((design, i) => (
              <div key={design.design_id} role="listitem">
                <DesignCard design={design} onDelete={deleteDesign} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
