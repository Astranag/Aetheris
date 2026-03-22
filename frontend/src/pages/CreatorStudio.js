import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scene3D } from '../components/Scene3D';
import { useAuth } from '../contexts/AuthContext';
import { PaperPlaneTilt, Palette, Ruler, Brain, Sparkle, FloppyDisk, Cube } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MATERIALS = ['Bamboo Composite', 'Recycled Aluminum', 'Bio-Resin', 'Cork', 'Smart Foam', 'Carbon Fiber', 'Organic Cotton'];
const COLORS = [
  { name: 'Neon Cyan', hex: '#00F0FF' },
  { name: 'Signal Red', hex: '#FF0055' },
  { name: 'Void Black', hex: '#1a1a1a' },
  { name: 'Arctic White', hex: '#e8e8e8' },
  { name: 'Ocean Blue', hex: '#0066FF' },
  { name: 'Forest Moss', hex: '#2d5a27' },
  { name: 'Amber Glow', hex: '#ffb347' },
  { name: 'Sunset Orange', hex: '#ff6b35' },
];
const SHAPES = [
  { name: 'Desk', value: 'desk' },
  { name: 'Chair', value: 'chair' },
  { name: 'Panel', value: 'panel' },
  { name: 'Hexagon', value: 'hexagon' },
  { name: 'Pod', value: 'pod' },
  { name: 'Cylinder', value: 'cylinder' },
];

export default function CreatorStudio() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');

  const [product, setProduct] = useState(null);
  const [shape, setShape] = useState('desk');
  const [color, setColor] = useState('#00F0FF');
  const [colorName, setColorName] = useState('Neon Cyan');
  const [material, setMaterial] = useState('Bamboo Composite');
  const [designName, setDesignName] = useState('Untitled Design');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await axios.get(`${API}/products/${productId}`);
      setProduct(res.data);
      setDesignName(`${res.data.name} - Custom`);
      if (res.data.shape) setShape(res.data.shape);
    } catch (err) {
      console.error(err);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/ai/chat`, {
        message: userMsg,
        product_id: productId || null,
        context: { shape, color: colorName, material }
      }, { withCredentials: true });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'AI service unavailable';
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${errMsg}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const saveDesign = async () => {
    try {
      await axios.post(`${API}/designs`, {
        product_id: productId || 'custom',
        name: designName,
        configuration: { shape, color: colorName, colorHex: color, material }
      }, { withCredentials: true });
      toast.success('Design saved to vault!');
    } catch (err) {
      toast.error('Failed to save design');
    }
  };

  return (
    <main className="min-h-screen pt-16" style={{ background: '#030303' }} data-testid="creator-studio" role="main" aria-label="Creator Studio">
      <div className="grid grid-cols-12 h-[calc(100vh-64px)]">
        {/* 3D Canvas */}
        <div className="col-span-12 lg:col-span-9 relative bg-gradient-to-br from-[#0A0A0A] to-black">
          <Scene3D shape={shape} color={color} height="100%" showParticles={true} />

          {/* Floating toolbar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="liquid-glass rounded-xl px-4 py-2 flex items-center gap-3">
              <Cube size={16} className="text-[#00F0FF]" aria-hidden="true" />
              <label htmlFor="design-name" className="sr-only">Design name</label>
              <input
                id="design-name"
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                data-testid="design-name-input"
                aria-label="Design name"
                className="bg-transparent text-sm text-white font-['Outfit'] font-medium border-none outline-none w-48"
              />
            </div>
            <button onClick={saveDesign} data-testid="save-design-btn" aria-label="Save design to vault"
              className="liquid-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-[#00F0FF] font-['Outfit'] font-medium hover:bg-[#00F0FF]/10 transition-colors duration-300">
              <FloppyDisk size={16} aria-hidden="true" /> Save
            </button>
          </div>

          {/* Shape selector */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="liquid-glass rounded-full px-2 py-1.5 flex items-center gap-1" role="radiogroup" aria-label="Select product shape">
              {SHAPES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setShape(s.value)}
                  data-testid={`shape-${s.value}`}
                  role="radio"
                  aria-checked={shape === s.value}
                  aria-label={`Shape: ${s.name}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-['Outfit'] transition-colors duration-300 ${
                    shape === s.value ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="col-span-12 lg:col-span-3 border-l border-white/5 flex flex-col h-full overflow-hidden" style={{ background: '#050505' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Color */}
            <fieldset>
              <legend className="text-[10px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#71717A] mb-3">
                <Palette size={12} className="inline mr-1.5" aria-hidden="true" />Color
              </legend>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Color palette">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setColor(c.hex); setColorName(c.name); }}
                    data-testid={`color-${c.name.toLowerCase().replace(/\s/g,'-')}`}
                    role="radio"
                    aria-checked={color === c.hex}
                    aria-label={`Color: ${c.name}`}
                    className={`w-full aspect-square rounded-lg border-2 transition-colors duration-300 ${
                      color === c.hex ? 'border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#71717A] font-['JetBrains_Mono'] mt-2 block" aria-live="polite">{colorName}</span>
            </fieldset>

            {/* Material */}
            <fieldset>
              <legend className="text-[10px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#71717A] mb-3">
                <Ruler size={12} className="inline mr-1.5" aria-hidden="true" />Material
              </legend>
              <div className="space-y-1.5" role="radiogroup" aria-label="Material selection">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMaterial(m)}
                    data-testid={`material-btn-${m.toLowerCase().replace(/\s/g,'-')}`}
                    role="radio"
                    aria-checked={material === m}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-['Outfit'] transition-colors duration-300 ${
                      material === m ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* AI Co-Designer Chat */}
          <section className="border-t border-white/5 flex flex-col" style={{ height: '45%' }} aria-label="AI Co-Designer">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <Brain size={16} className="text-[#FF0055]" aria-hidden="true" />
              <h2 className="text-xs font-['Unbounded'] font-bold text-white">AI Co-Designer</h2>
              <Sparkle size={12} className="text-[#FF0055] animate-pulse-glow" aria-hidden="true" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="ai-chat-messages" role="log" aria-label="Chat messages" aria-live="polite">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Brain size={24} className="text-[#71717A] mx-auto mb-2" aria-hidden="true" />
                  <p className="text-[10px] text-[#71717A] font-['Outfit']">
                    Try: "Make it more minimal" or "Suggest warm materials"
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs font-['Outfit'] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20'
                      : 'bg-[#FF0055]/5 text-[#e0e0e0] border border-[#FF0055]/10'
                  }`} role={msg.role === 'ai' ? 'status' : undefined}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start" role="status" aria-label="AI is thinking">
                  <div className="px-3 py-2 rounded-xl bg-[#FF0055]/5 border border-[#FF0055]/10">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="p-3 border-t border-white/5" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <div className="flex gap-2">
                <label htmlFor="ai-input" className="sr-only">Message to AI Co-Designer</label>
                <input
                  id="ai-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI Co-Designer..."
                  data-testid="ai-chat-input"
                  aria-label="Type a message to the AI Co-Designer"
                  className="flex-1 px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white font-['Outfit'] placeholder:text-[#71717A] focus:outline-none focus:border-[#FF0055]/40 focus:ring-1 focus:ring-[#FF0055]/20 transition-colors duration-300"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  data-testid="ai-chat-send"
                  aria-label="Send message"
                  className="p-2 rounded-lg bg-[#FF0055]/10 text-[#FF0055] hover:bg-[#FF0055]/20 transition-colors duration-300 disabled:opacity-40"
                >
                  <PaperPlaneTilt size={16} weight="fill" aria-hidden="true" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
