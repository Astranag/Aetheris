import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, Cube, Leaf } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHAPE_ICONS = {
  desk: 'M2 18h20M4 18V8h16v10M8 8V5h8v3',
  chair: 'M6 20v-4M18 20v-4M6 16H4V8h16v8h-2M8 8V4h8v4',
  panel: 'M3 3h18v18H3V3z',
  hexagon: 'M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z',
  pod: 'M12 2a8 8 0 018 8v4a8 8 0 01-16 0v-4a8 8 0 018-8z',
  cylinder: 'M12 2a6 3 0 016 3v14a6 3 0 01-12 0V5a6 3 0 016-3z',
};

const COLOR_MAP = {
  'Void Black': '#1a1a1a', 'Arctic White': '#e8e8e8', 'Neon Cyan': '#00F0FF',
  'Warm Graphite': '#4a4a4a', 'Stealth Black': '#111111', 'Signal Red': '#FF0055',
  'Ocean Blue': '#0066FF', 'Forest Moss': '#2d5a27', 'Warm White': '#fff5e1',
  'Cool Daylight': '#c9ddf0', 'Neon Pink': '#FF0055', 'Amber Glow': '#ffb347',
  'Natural Oak': '#b8860b', 'Matte Black': '#111', 'Sage Green': '#87ae73',
  'Earth Tone': '#8B7355', 'Glacier White': '#f0f8ff', 'Moss Green': '#4a7c59',
  'Cloud White': '#f0f0f0', 'Deep Charcoal': '#2a2a2a', 'Terracotta': '#c4603c',
  'Sunset Orange': '#ff6b35', 'Dusty Rose': '#dcae96', 'Midnight Blue': '#0a1628',
};

/* Lightweight CSS 3D card — NO WebGL canvas */
const ProductCard = ({ product, index, isHero = false }) => {
  const color = COLOR_MAP[product.colors?.[0]] || '#00F0FF';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      data-testid={`product-card-${product.product_id}`}
      className="group relative liquid-glass rounded-2xl overflow-hidden hover:border-[#00F0FF]/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.08)] transition-colors duration-500"
      role="article"
      aria-label={`${product.name} - $${product.price}`}
    >
      <Link to={`/product/${product.product_id}`} className="block" aria-label={`View ${product.name} details`}>
        {/* Visual preview with CSS glow */}
        <div className={`relative ${isHero ? 'h-64 md:h-72' : 'h-44'} bg-gradient-to-br from-[#0A0A0A] to-[#050505] overflow-hidden`}>
          {/* Animated glow orb */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[50px] group-hover:scale-150 transition-transform duration-700"
            style={{ background: `${color}25` }}
          />
          {/* Shape icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth={0.8}
              className={`${isHero ? 'w-24 h-24' : 'w-16 h-16'} opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500`}
            >
              <path d={SHAPE_ICONS[product.shape] || SHAPE_ICONS.desk} />
            </svg>
          </div>
          {/* Color accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }} />
          {/* Sustainability badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-[#E0FF00]/20">
            <Leaf size={12} weight="fill" className="text-[#E0FF00]" aria-hidden="true" />
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#E0FF00]" aria-label={`Sustainability score ${product.sustainability_score}`}>{product.sustainability_score}</span>
          </div>
          {/* Category */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#A1A1AA]">
              {product.category}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="font-['Unbounded'] text-sm font-bold tracking-tight text-white mb-1 group-hover:text-[#00F0FF] transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-xs text-[#71717A] font-['Outfit'] line-clamp-2 mb-3">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-sm text-white font-medium">
              ${product.price?.toLocaleString()}
            </span>
            <div className="flex gap-1">
              {product.colors?.slice(0, 4).map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ background: COLOR_MAP[c] || '#444' }} />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default function DiscoveryHub() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchData = useCallback(async () => {
    try {
      const params = { sort: sortBy };
      if (activeCategory !== 'all') params.category = activeCategory;
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API}/products`, { params }),
        axios.get(`${API}/categories`)
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async () => {
    if (!search.trim()) { fetchData(); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products`, { params: { search } });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low' },
    { value: 'price_high', label: 'Price: High' },
    { value: 'sustainability', label: 'Eco Score' },
  ];

  return (
    <main className="min-h-screen pt-20 pb-12 px-6 md:px-12" style={{ background: '#030303' }} role="main" aria-label="Product Discovery">
      <div className="max-w-[1440px] mx-auto" data-testid="discovery-hub">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="text-xs font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#00F0FF] block mb-3">
            Discovery Hub
          </span>
          <h1 className="font-['Unbounded'] text-3xl md:text-4xl font-bold tracking-tighter text-white mb-2">
            Explore the Spatial
          </h1>
          <p className="text-sm text-[#A1A1AA] font-['Outfit'] font-light">
            Discover modular products designed for the future
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10" data-testid="discovery-filters" role="search" aria-label="Product search and filters">
          <div className="flex-1 relative">
            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search modular desks for small rooms..."
              data-testid="search-input"
              aria-label="Search products"
              className="w-full pl-11 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm text-white font-['Outfit'] placeholder:text-[#71717A] focus:outline-none focus:border-[#00F0FF]/50 focus:ring-2 focus:ring-[#00F0FF]/20 transition-colors duration-300"
            />
          </div>
          <div className="flex gap-2" role="group" aria-label="Sort options">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                data-testid={`sort-${opt.value}`}
                aria-pressed={sortBy === opt.value}
                aria-label={`Sort by ${opt.label}`}
                className={`px-4 py-3 rounded-xl text-xs font-['Outfit'] font-medium whitespace-nowrap transition-colors duration-300 ${
                  sortBy === opt.value
                    ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30'
                    : 'bg-white/5 text-[#A1A1AA] border border-white/5 hover:bg-white/8 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <nav className="flex gap-2 mb-10 overflow-x-auto pb-2" data-testid="category-filter" aria-label="Product categories">
          <button
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className={`px-4 py-2 rounded-full text-xs font-['Outfit'] font-medium whitespace-nowrap transition-colors duration-300 ${
              activeCategory === 'all' ? 'bg-white text-black' : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              data-testid={`category-${cat.toLowerCase()}`}
              aria-pressed={activeCategory === cat}
              className={`px-4 py-2 rounded-full text-xs font-['Outfit'] font-medium whitespace-nowrap transition-colors duration-300 ${
                activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6" aria-busy="true" aria-label="Loading products">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${i === 0 ? 'md:col-span-8 md:row-span-2' : 'md:col-span-4'} h-64 rounded-2xl bg-white/5 animate-pulse`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6" role="list" aria-label="Products grid">
            {products.map((product, i) => (
              <div key={product.product_id} className={i === 0 ? 'md:col-span-8 md:row-span-2' : 'md:col-span-4'} role="listitem">
                <ProductCard product={product} index={i} isHero={i === 0} />
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-20" role="status">
            <Cube size={48} className="text-[#71717A] mx-auto mb-4" aria-hidden="true" />
            <p className="text-[#A1A1AA] font-['Outfit']">No products found. Try adjusting your search.</p>
          </div>
        )}
      </div>
    </main>
  );
}
