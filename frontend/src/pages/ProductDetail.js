import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Scene3D } from '../components/Scene3D';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Leaf, Palette, Ruler, Heart, Flask } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHAPE_MAP = { 'Furniture': 'desk', 'Lighting': 'panel', 'Storage': 'hexagon', 'Workspace': 'pod', 'Living': 'cylinder' };
const COLOR_HEX = {
  'Void Black': '#1a1a1a', 'Arctic White': '#e8e8e8', 'Neon Cyan': '#00F0FF', 'Warm Graphite': '#4a4a4a',
  'Stealth Black': '#111111', 'Signal Red': '#FF0055', 'Ocean Blue': '#0066FF', 'Forest Moss': '#2d5a27',
  'Cloud White': '#f0f0f0', 'Deep Charcoal': '#2a2a2a', 'Terracotta': '#c4603c', 'Midnight Blue': '#0a1628',
  'Natural Oak': '#b8860b', 'Matte Black': '#111', 'Sage Green': '#87ae73', 'Dusty Rose': '#dcae96',
  'Warm White': '#fff5e1', 'Cool Daylight': '#c9ddf0', 'Neon Pink': '#FF0055', 'Amber Glow': '#ffb347',
  'Earth Tone': '#8B7355', 'Glacier White': '#f0f8ff', 'Moss Green': '#4a7c59', 'Sunset Orange': '#ff6b35',
};

export default function ProductDetail() {
  const { productId } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/products/${productId}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const saveToVault = async () => {
    if (!user) { toast.error('Please login to save designs'); return; }
    try {
      await axios.post(`${API}/designs`, {
        product_id: product.product_id,
        name: `${product.name} - Custom`,
        configuration: {
          color: product.colors[selectedColor],
          colorHex: COLOR_HEX[product.colors[selectedColor]] || '#00F0FF',
          size: product.sizes[selectedSize],
          material: product.materials[selectedMaterial],
          shape: product.shape || SHAPE_MAP[product.category] || 'desk'
        }
      }, { withCredentials: true });
      toast.success('Design saved to vault!');
    } catch (err) {
      toast.error('Failed to save design');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: '#030303' }} role="status" aria-label="Loading product">
        <div className="w-10 h-10 border-2 border-t-[#00F0FF] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: '#030303' }} role="alert">
        <p className="text-[#A1A1AA]">Product not found</p>
      </div>
    );
  }

  const shape = product.shape || SHAPE_MAP[product.category] || 'desk';
  const currentColor = COLOR_HEX[product.colors[selectedColor]] || '#00F0FF';

  return (
    <main className="min-h-screen pt-16" style={{ background: '#030303' }} data-testid="product-detail" role="main" aria-label={`Product: ${product.name}`}>
      <div className="max-w-[1440px] mx-auto">
        <div className="px-6 md:px-12 pt-6">
          <Link to="/dashboard" data-testid="back-to-discovery" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#00F0FF] transition-colors duration-300 font-['Outfit']" aria-label="Back to product discovery">
            <ArrowLeft size={16} aria-hidden="true" /> Back to Discovery
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 px-6 md:px-12 pt-6 pb-16">
          {/* 3D Viewer — single Canvas here is fine */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-7 relative">
            <div className="sticky top-24 rounded-2xl overflow-hidden liquid-glass" data-testid="product-3d-viewer">
              <div className="h-[400px] md:h-[500px] bg-gradient-to-br from-[#0A0A0A] to-black">
                <Scene3D shape={shape} color={currentColor} height="100%" showParticles={true} />
              </div>
              <div className="absolute bottom-4 left-4 flex gap-2" role="group" aria-label="Color selection">
                {product.colors.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(i)}
                    data-testid={`color-swatch-${i}`}
                    aria-label={`Select color: ${c}`}
                    aria-pressed={i === selectedColor}
                    className={`w-8 h-8 rounded-full border-2 transition-colors duration-300 ${
                      i === selectedColor ? 'border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]' : 'border-white/20 hover:border-white/40'
                    }`}
                    style={{ background: COLOR_HEX[c] || '#444' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-5 py-6 lg:py-0">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#A1A1AA]">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0FF00]/10 border border-[#E0FF00]/20" aria-label={`Sustainability score: ${product.sustainability_score} out of 100`}>
                <Leaf size={12} weight="fill" className="text-[#E0FF00]" aria-hidden="true" />
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#E0FF00]">{product.sustainability_score}/100</span>
              </div>
            </div>

            <h1 className="font-['Unbounded'] text-2xl md:text-3xl font-bold tracking-tighter text-white mb-3" data-testid="product-name">
              {product.name}
            </h1>
            <p className="text-sm text-[#A1A1AA] font-['Outfit'] font-light leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="font-['JetBrains_Mono'] text-2xl text-white font-medium mb-8" data-testid="product-price" aria-label={`Price: $${product.price?.toLocaleString()}`}>
              ${product.price?.toLocaleString()}
            </div>

            {/* Material Selector */}
            <fieldset className="mb-6">
              <legend className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">
                <Palette size={14} className="inline mr-2" aria-hidden="true" />Material
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Material options">
                {product.materials.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMaterial(i)}
                    data-testid={`material-${i}`}
                    role="radio"
                    aria-checked={i === selectedMaterial}
                    className={`px-4 py-2 rounded-lg text-xs font-['Outfit'] transition-colors duration-300 ${
                      i === selectedMaterial ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/40' : 'bg-white/5 text-[#A1A1AA] border border-white/5 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Size Selector */}
            <fieldset className="mb-8">
              <legend className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">
                <Ruler size={14} className="inline mr-2" aria-hidden="true" />Size
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size options">
                {product.sizes.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(i)}
                    data-testid={`size-${i}`}
                    role="radio"
                    aria-checked={i === selectedSize}
                    className={`px-4 py-2 rounded-lg text-xs font-['Outfit'] transition-colors duration-300 ${
                      i === selectedSize ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/40' : 'bg-white/5 text-[#A1A1AA] border border-white/5 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button onClick={saveToVault} data-testid="save-to-vault-btn" aria-label="Save current configuration to Design Vault"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#00F0FF] text-black font-['Outfit'] font-semibold text-sm hover:bg-[#66F6FF] transition-colors duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                <Heart size={16} weight="bold" aria-hidden="true" /> Save to Vault
              </button>
              <Link to={`/studio?product=${product.product_id}`} data-testid="open-in-studio-btn" aria-label="Open in Creator Studio for advanced customization"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-[#FF0055]/30 text-[#FF0055] font-['Outfit'] font-medium text-sm hover:bg-[#FF0055]/10 transition-colors duration-300">
                <Flask size={16} aria-hidden="true" /> Open in Studio
              </Link>
            </div>

            {/* Specs */}
            <div className="liquid-glass rounded-xl p-6" data-testid="product-specs" role="region" aria-label="Product specifications">
              <h3 className="text-xs font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-4">
                Specifications
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <dt className="text-xs text-[#A1A1AA] font-['Outfit']">Category</dt>
                  <dd className="text-xs text-white font-['Outfit'] font-medium">{product.category}</dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <dt className="text-xs text-[#A1A1AA] font-['Outfit']">Materials</dt>
                  <dd className="text-xs text-white font-['Outfit'] font-medium">{product.materials.length} options</dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <dt className="text-xs text-[#A1A1AA] font-['Outfit']">Sizes</dt>
                  <dd className="text-xs text-white font-['Outfit'] font-medium">{product.sizes.length} variants</dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <dt className="text-xs text-[#A1A1AA] font-['Outfit']">Sustainability</dt>
                  <dd className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={product.sustainability_score} aria-valuemin="0" aria-valuemax="100">
                      <div className="h-full rounded-full bg-[#E0FF00]" style={{ width: `${product.sustainability_score}%` }} />
                    </div>
                    <span className="text-xs text-[#E0FF00] font-['JetBrains_Mono']">{product.sustainability_score}%</span>
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <dt className="text-xs text-[#A1A1AA] font-['Outfit']">Tags</dt>
                  <dd className="flex gap-1 flex-wrap justify-end">
                    {product.tags?.slice(0, 3).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-[#71717A] font-['Outfit']">{t}</span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
