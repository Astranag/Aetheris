import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scene3D } from '../components/Scene3D';
import { useAuth } from '../contexts/AuthContext';
import {
  PaperPlaneTilt, Palette, Ruler, Brain, Sparkle, FloppyDisk, Cube,
  Lightning, Crosshair, TreeStructure, ArrowsClockwise, Play
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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

const MODE_ICONS = {
  'Design': Cube,
  'Material': Ruler,
  'Style': Palette,
  'Spatial': TreeStructure,
  'Generative': Lightning,
  'Meta': Crosshair,
  'Marketplace': Crosshair,
};

/* ─── Parse structured AI response into sections ─── */
function parseAIResponse(text) {
  const sections = {};
  const markers = ['INTERPRETATION', 'MODE', 'REASONING', 'TRANSFORMS', 'VARIANTS', 'ACTION'];
  let current = null;
  let buffer = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const matchedMarker = markers.find(m =>
      trimmed === `[${m}]` || trimmed.startsWith(`**[${m}]**`) || trimmed.startsWith(`[${m}]`)
    );
    if (matchedMarker) {
      if (current) sections[current] = buffer.join('\n').trim();
      current = matchedMarker;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  if (current) sections[current] = buffer.join('\n').trim();

  // If no markers found, return raw text
  if (Object.keys(sections).length === 0) {
    return { raw: text };
  }
  return sections;
}

/* ─── Extract JSON from ACTION section ─── */
function extractActionJSON(actionText) {
  if (!actionText) return null;
  try {
    const jsonMatch = actionText.match(/```json\s*([\s\S]*?)```/) || actionText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
  } catch { /* ignore */ }
  return null;
}

/* ─── Structured AI Message Renderer ─── */
const AIMessage = ({ text, actionPayload, onApplyAction }) => {
  const sections = parseAIResponse(text);

  if (sections.raw) {
    return (
      <div className="max-w-[90%] px-3 py-2.5 rounded-xl text-xs font-['Outfit'] leading-relaxed bg-[#FF0055]/5 text-[#e0e0e0] border border-[#FF0055]/10">
        {sections.raw}
      </div>
    );
  }

  const modes = sections.MODE?.split('+').map(m => m.trim().replace(' Agent', '')) || [];
  const actionData = actionPayload || extractActionJSON(sections.ACTION);

  return (
    <div className="max-w-[95%] space-y-2" data-testid="ai-structured-response">
      {/* Mode badges */}
      {modes.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {modes.map((mode, i) => {
            const Icon = MODE_ICONS[mode] || Brain;
            return (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-['JetBrains_Mono'] tracking-wider uppercase bg-[#FF0055]/10 text-[#FF0055] border border-[#FF0055]/20">
                <Icon size={10} weight="bold" aria-hidden="true" /> {mode}
              </span>
            );
          })}
        </div>
      )}

      {/* Interpretation */}
      {sections.INTERPRETATION && (
        <div className="px-3 py-2 rounded-lg bg-[#FF0055]/5 border border-[#FF0055]/10">
          <span className="text-[8px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#FF0055]/60 block mb-1">Interpretation</span>
          <p className="text-[11px] text-[#e0e0e0] font-['Outfit'] leading-relaxed">{sections.INTERPRETATION}</p>
        </div>
      )}

      {/* Reasoning */}
      {sections.REASONING && (
        <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[8px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#71717A] block mb-1">Dimensional Reasoning</span>
          <p className="text-[11px] text-[#A1A1AA] font-['Outfit'] leading-relaxed">{sections.REASONING}</p>
        </div>
      )}

      {/* Transforms */}
      {sections.TRANSFORMS && (
        <div className="px-3 py-2 rounded-lg bg-[#00F0FF]/[0.03] border border-[#00F0FF]/10">
          <span className="text-[8px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#00F0FF]/60 block mb-1">Proposed Transforms</span>
          <div className="text-[11px] text-[#e0e0e0] font-['Outfit'] leading-relaxed whitespace-pre-line">{sections.TRANSFORMS}</div>
        </div>
      )}

      {/* Variants */}
      {sections.VARIANTS && (
        <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
          <span className="text-[8px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#E0FF00]/60 block mb-1">Variants</span>
          <div className="text-[11px] text-[#A1A1AA] font-['Outfit'] leading-relaxed whitespace-pre-line">{sections.VARIANTS}</div>
        </div>
      )}

      {/* Action Payload — with APPLY button */}
      {actionData && (
        <div className="px-3 py-2 rounded-lg bg-[#E0FF00]/[0.03] border border-[#E0FF00]/15">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#E0FF00]/60">Action Payload</span>
            <button
              onClick={() => onApplyAction(actionData)}
              data-testid="apply-action-btn"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-['Outfit'] font-bold bg-[#E0FF00]/15 text-[#E0FF00] border border-[#E0FF00]/30 hover:bg-[#E0FF00]/25 transition-colors duration-300"
              aria-label="Apply AI suggestion to 3D scene"
            >
              <Play size={10} weight="fill" aria-hidden="true" /> Apply
            </button>
          </div>
          <div className="flex gap-2 flex-wrap text-[9px] font-['JetBrains_Mono']">
            {actionData.action && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#A1A1AA]">{actionData.action}</span>}
            {actionData.target && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#A1A1AA]">{actionData.target}</span>}
            {actionData.parameters?.shape && <span className="px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF]">{actionData.parameters.shape}</span>}
            {actionData.parameters?.colorName && <span className="px-1.5 py-0.5 rounded bg-[#FF0055]/10 text-[#FF0055]">{actionData.parameters.colorName}</span>}
            {actionData.parameters?.material && <span className="px-1.5 py-0.5 rounded bg-[#E0FF00]/10 text-[#E0FF00]">{actionData.parameters.material}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

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

  useEffect(() => { fetchProduct(); }, [fetchProduct]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* Apply action payload from AI to the 3D scene */
  const applyAction = useCallback((actionData) => {
    if (!actionData?.parameters) return;
    const p = actionData.parameters;
    let applied = [];
    if (p.shape && SHAPES.some(s => s.value === p.shape)) {
      setShape(p.shape);
      applied.push(`Shape → ${p.shape}`);
    }
    if (p.color) {
      const match = COLORS.find(c => c.hex === p.color);
      if (match) {
        setColor(match.hex);
        setColorName(match.name);
        applied.push(`Color → ${match.name}`);
      }
    }
    if (p.colorName) {
      const match = COLORS.find(c => c.name === p.colorName);
      if (match) {
        setColor(match.hex);
        setColorName(match.name);
        if (!applied.some(a => a.startsWith('Color'))) applied.push(`Color → ${match.name}`);
      }
    }
    if (p.material && MATERIALS.includes(p.material)) {
      setMaterial(p.material);
      applied.push(`Material → ${p.material}`);
    }
    if (applied.length > 0) {
      toast.success(`Applied: ${applied.join(', ')}`);
    } else {
      toast.info('No applicable changes in this payload');
    }
  }, []);

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
      setMessages(prev => [...prev, {
        role: 'ai',
        text: res.data.response,
        actionPayload: res.data.action_payload
      }]);
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

  const quickPrompts = [
    "Make it more minimal",
    "Suggest sustainable materials",
    "Optimize for small spaces",
    "Go bold and experimental",
  ];

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
              <input id="design-name" type="text" value={designName} onChange={(e) => setDesignName(e.target.value)}
                data-testid="design-name-input" aria-label="Design name"
                className="bg-transparent text-sm text-white font-['Outfit'] font-medium border-none outline-none w-48" />
            </div>
            <div className="flex gap-2">
              {/* Active config display */}
              <div className="liquid-glass rounded-xl px-3 py-2 hidden md:flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: color }} />
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#A1A1AA]">{colorName}</span>
                <span className="text-[#71717A]">|</span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#A1A1AA]">{material}</span>
              </div>
              <button onClick={saveDesign} data-testid="save-design-btn" aria-label="Save design to vault"
                className="liquid-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-[#00F0FF] font-['Outfit'] font-medium hover:bg-[#00F0FF]/10 transition-colors duration-300">
                <FloppyDisk size={16} aria-hidden="true" /> Save
              </button>
            </div>
          </div>

          {/* Shape selector */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="liquid-glass rounded-full px-2 py-1.5 flex items-center gap-1" role="radiogroup" aria-label="Select product shape">
              {SHAPES.map((s) => (
                <button key={s.value} onClick={() => setShape(s.value)} data-testid={`shape-${s.value}`}
                  role="radio" aria-checked={shape === s.value} aria-label={`Shape: ${s.name}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-['Outfit'] transition-colors duration-300 ${
                    shape === s.value ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-[#A1A1AA] hover:text-white'
                  }`}>
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
                  <button key={c.name} onClick={() => { setColor(c.hex); setColorName(c.name); }}
                    data-testid={`color-${c.name.toLowerCase().replace(/\s/g,'-')}`}
                    role="radio" aria-checked={color === c.hex} aria-label={`Color: ${c.name}`}
                    className={`w-full aspect-square rounded-lg border-2 transition-colors duration-300 ${
                      color === c.hex ? 'border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: c.hex }} />
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
                  <button key={m} onClick={() => setMaterial(m)}
                    data-testid={`material-btn-${m.toLowerCase().replace(/\s/g,'-')}`}
                    role="radio" aria-checked={material === m}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-['Outfit'] transition-colors duration-300 ${
                      material === m ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white border border-transparent'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* ─── AI Spatial Intelligence Panel ─── */}
          <section className="border-t border-white/5 flex flex-col" style={{ height: '50%' }} aria-label="AI Spatial Intelligence Co-Designer">
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
              <Brain size={16} className="text-[#FF0055]" aria-hidden="true" />
              <h2 className="text-[10px] font-['Unbounded'] font-bold text-white tracking-tight">SPATIAL INTELLIGENCE</h2>
              <Sparkle size={10} className="text-[#FF0055] animate-pulse-glow" aria-hidden="true" />
              <span className="ml-auto text-[8px] font-['JetBrains_Mono'] text-[#71717A]">GPT-5.2</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="ai-chat-messages" role="log" aria-label="Spatial intelligence chat" aria-live="polite">
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <Brain size={20} className="text-[#71717A] mx-auto mb-2" aria-hidden="true" />
                  <p className="text-[10px] text-[#71717A] font-['Outfit'] mb-3">
                    Multidimensional spatial reasoning engine
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickPrompts.map((p, i) => (
                      <button key={i} onClick={() => setInput(p)}
                        data-testid={`quick-prompt-${i}`}
                        className="px-2.5 py-1 rounded-full text-[9px] font-['Outfit'] text-[#A1A1AA] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:text-white transition-colors duration-300">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs font-['Outfit'] leading-relaxed bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
                        {msg.text}
                      </div>
                    ) : (
                      <AIMessage text={msg.text} actionPayload={msg.actionPayload} onApplyAction={applyAction} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {aiLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start" role="status" aria-label="Spatial intelligence processing">
                  <div className="px-3 py-2.5 rounded-xl bg-[#FF0055]/5 border border-[#FF0055]/10">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[8px] font-['JetBrains_Mono'] text-[#FF0055]/50">reasoning spatially...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form className="p-3 border-t border-white/5" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <div className="flex gap-2">
                <label htmlFor="ai-input" className="sr-only">Message to Spatial Intelligence</label>
                <input id="ai-input" type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your spatial vision..."
                  data-testid="ai-chat-input" aria-label="Type a spatial design command"
                  className="flex-1 px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white font-['Outfit'] placeholder:text-[#71717A] focus:outline-none focus:border-[#FF0055]/40 focus:ring-1 focus:ring-[#FF0055]/20 transition-colors duration-300" />
                <button type="submit" disabled={aiLoading} data-testid="ai-chat-send" aria-label="Send spatial command"
                  className="p-2 rounded-lg bg-[#FF0055]/10 text-[#FF0055] hover:bg-[#FF0055]/20 transition-colors duration-300 disabled:opacity-40">
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
