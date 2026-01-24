
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ModelArchitecture, ModelLayer } from '../types';
import { Search, X, Activity, Zap, Info, Target, Download, ImageIcon, FileCode } from 'lucide-react';

interface Props {
  architecture: ModelArchitecture;
}

// FIX: Added explicit interface for node data to ensure type safety in D3 selections and callbacks
interface VisualNode {
  id: string;
  layerIdx: number;
  neuronIdx: number;
  x: number;
  y: number;
  layerData: ModelLayer;
  importance: number;
}

const NetworkVisualizer: React.FC<Props> = ({ architecture }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLayer, setHoveredLayer] = useState<ModelLayer | null>(null);
  const [pinnedLayer, setPinnedLayer] = useState<ModelLayer | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!svgRef.current || !architecture) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Define Glow Filter for signals and paths
    const defs = svg.append('defs');
    
    // Pulse animation styles - keeping them inside SVG for better export fidelity
    svg.append('style').text(`
      @keyframes linkPulse {
        0% { stroke-opacity: var(--pulse-min); }
        50% { stroke-opacity: var(--pulse-max); }
        100% { stroke-opacity: var(--pulse-min); }
      }
      .link-pulsing {
        animation: linkPulse var(--pulse-duration) ease-in-out infinite;
      }
      text { font-family: 'Inter', sans-serif; }
    `);

    const filter = defs.append('filter')
      .attr('id', 'signal-glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const padding = 120;

    const layers = architecture.layers;
    const layerCount = layers.length;
    
    const xScale = d3.scaleLinear()
      .domain([0, layerCount - 1])
      .range([padding, width - padding]);

    const maxVisibleNeurons = 10;
    const g = svg.append('g').attr('class', 'main-content');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    const nodes: VisualNode[] = [];
    const links: any[] = [];

    layers.forEach((layer, layerIdx) => {
      const displayNeurons = Math.min(layer.neurons, maxVisibleNeurons);
      const startY = height / 2 - ((displayNeurons - 1) * 35) / 2;
      
      const layerNodes: VisualNode[] = Array.from({ length: displayNeurons }).map((_, i) => ({
        id: `l${layerIdx}-n${i}`,
        layerIdx,
        neuronIdx: i,
        x: xScale(layerIdx),
        y: startY + (i * 35),
        layerData: layer,
        importance: layer.relativeImportance || 0.5
      }));

      nodes.push(...layerNodes);

      if (layerIdx > 0) {
        const prevLayerNodes = nodes.filter(n => n.layerIdx === layerIdx - 1);
        layerNodes.forEach(target => {
          prevLayerNodes.forEach(source => {
            links.push({ 
              source, 
              target, 
              importance: (layer.relativeImportance + (source.layerData.relativeImportance || 0.5)) / 2
            });
          });
        });
      }
    });

    const isMatch = (layer: ModelLayer) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return layer.name.toLowerCase().includes(query) || layer.type.toLowerCase().includes(query);
    };

    const isLinkHighlighted = (d: any) => {
      if (!selectedNodeId) return false;
      return d.source.id === selectedNodeId || d.target.id === selectedNodeId;
    };

    const isNodeHighlighted = (d: VisualNode) => {
      if (!selectedNodeId) return true;
      if (d.id === selectedNodeId) return true;
      return links.some(l => 
        (l.source.id === selectedNodeId && l.target.id === d.id) || 
        (l.target.id === selectedNodeId && l.source.id === d.id)
      );
    };

    // Draw links
    g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', d => {
        let classes = 'link transition-all duration-500';
        if (!selectedNodeId) classes += ' link-pulsing';
        return classes;
      })
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', d => {
        if (selectedNodeId) return isLinkHighlighted(d) ? '#818cf8' : '#1e293b';
        const matching = isMatch(d.source.layerData) || isMatch(d.target.layerData);
        if (!searchQuery) return '#334155';
        return matching ? '#6366f1' : '#1e293b';
      })
      .attr('stroke-width', d => {
        if (selectedNodeId) return isLinkHighlighted(d) ? 2.5 : 0.5;
        return 0.5 + d.importance * 2;
      })
      .style('--pulse-min', d => {
        const matching = isMatch(d.source.layerData) || isMatch(d.target.layerData);
        if (searchQuery && !matching) return '0.01';
        return (0.05 + d.importance * 0.05).toString();
      })
      .style('--pulse-max', d => {
        const matching = isMatch(d.source.layerData) || isMatch(d.target.layerData);
        if (searchQuery && !matching) return '0.02';
        return (0.15 + d.importance * 0.25).toString();
      })
      .style('--pulse-duration', d => (4 - d.importance * 3) + 's')
      .attr('stroke-opacity', d => {
        if (selectedNodeId) return isLinkHighlighted(d) ? 0.9 : 0.02;
        const matching = isMatch(d.source.layerData) || isMatch(d.target.layerData);
        if (!searchQuery) return null; // Controlled by animation
        return matching ? 0.4 : 0.01;
      })
      .attr('filter', d => isLinkHighlighted(d) ? 'url(#signal-glow)' : 'none');

    // Advanced Signal Surge Animation
    const animateSignals = () => {
      const signalLayer = g.append('g').attr('class', 'signals');
      
      const targetLinks = links.filter(d => {
        if (selectedNodeId) return isLinkHighlighted(d);
        return Math.random() > 0.94; // Subtle ambient drift
      });

      targetLinks.forEach(link => {
        const isHighlighted = selectedNodeId && isLinkHighlighted(link);
        const particleCount = isHighlighted ? 3 : 1; // Surge effect when selected
        
        for (let i = 0; i < particleCount; i++) {
          const speed = isHighlighted 
            ? 500 + (1 - link.importance) * 800 
            : 1500 + (1 - link.importance) * 2000;
          
          const delay = isHighlighted ? i * 200 : 0; // Staggered particles

          const signal = signalLayer.append('circle')
            .attr('r', isHighlighted ? 3 : 1.2)
            .attr('fill', isHighlighted ? '#c7d2fe' : '#818cf8')
            .attr('filter', 'url(#signal-glow)')
            .attr('cx', link.source.x)
            .attr('cy', link.source.y)
            .attr('opacity', 0);

          signal.transition()
            .delay(delay)
            .duration(speed)
            .ease(d3.easeLinear)
            .attr('opacity', isHighlighted ? 1 : 0.6)
            .attr('cx', link.target.x)
            .attr('cy', link.target.y)
            .on('end', () => signal.remove());
        }
      });

      setTimeout(() => signalLayer.remove(), 5000);
    };

    const signalIntervalTime = selectedNodeId ? 400 : 1000;
    const signalInterval = setInterval(animateSignals, signalIntervalTime);

    const getNodeColor = (type: string) => {
      switch (type) {
        case 'input': return '#10b981';
        case 'output': return '#f59e0b';
        case 'convolution': return '#8b5cf6';
        case 'dense': return '#3b82f6';
        case 'pooling': return '#64748b';
        case 'dropout': return '#ef4444';
        default: return '#94a3b8';
      }
    };

    // Draw nodes
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer transition-all duration-300')
      .attr('transform', (d: VisualNode) => `translate(${d.x},${d.y})`)
      .attr('opacity', (d: VisualNode) => {
        if (selectedNodeId) return isNodeHighlighted(d) ? 1 : 0.1;
        return isMatch(d.layerData) ? 1 : 0.1;
      })
      .on('mouseenter', (event, d: VisualNode) => {
        setHoveredLayer(d.layerData);
        d3.select(event.currentTarget).select('circle')
          .transition().duration(200).attr('r', 12).attr('stroke', '#fff');
      })
      .on('mouseleave', (event, d: VisualNode) => {
        setHoveredLayer(null);
        d3.select(event.currentTarget).select('circle')
          .transition().duration(200)
          .attr('r', () => (d.id === selectedNodeId ? 10 : 4 + d.importance * 4))
          .attr('stroke', () => (d.id === selectedNodeId ? '#fff' : '#1e293b'));
      })
      .on('click', (event, d: VisualNode) => {
        event.stopPropagation();
        if (selectedNodeId === d.id) {
          setSelectedNodeId(null);
          setPinnedLayer(null);
        } else {
          setSelectedNodeId(d.id);
          setPinnedLayer(d.layerData);
        }
      });

    nodeGroups.append('circle')
      .attr('r', (d: VisualNode) => (d.id === selectedNodeId ? 10 : 4 + d.importance * 4))
      .attr('fill', (d: VisualNode) => getNodeColor(d.layerData.type))
      .attr('stroke', (d: VisualNode) => (d.id === selectedNodeId ? '#fff' : '#1e293b'))
      .attr('stroke-width', (d: VisualNode) => (d.id === selectedNodeId ? 3 : 2))
      .attr('filter', (d: VisualNode) => (d.id === selectedNodeId) ? 'drop-shadow(0 0 20px rgba(99,102,241,1))' : 'none');

    // Labels
    layers.forEach((layer, i) => {
      const matching = isMatch(layer);
      const isLayerOfSelectedNode = selectedNodeId && nodes.find(n => n.id === selectedNodeId)?.layerIdx === i;
      const labelOpacity = matching || isLayerOfSelectedNode ? 1 : 0.15;
      const isPinned = pinnedLayer?.id === layer.id;
      
      const vOffset = layerCount > 8 ? (i % 2 === 0 ? -20 : 20) : 0;
      const labelY = padding - 70 + vOffset;

      const layerHeader = g.append('g')
        .attr('transform', `translate(${xScale(i)}, ${labelY})`)
        .attr('opacity', labelOpacity);

      if (matching || isPinned || isLayerOfSelectedNode) {
        layerHeader.append('rect')
          .attr('x', -40)
          .attr('y', -35)
          .attr('width', 80)
          .attr('height', 45)
          .attr('rx', 8)
          .attr('fill', isPinned ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.6)')
          .attr('stroke', isPinned ? 'rgba(99, 102, 241, 0.4)' : 'none');
      }

      layerHeader.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', matching && searchQuery ? '#a5b4fc' : '#64748b')
        .attr('font-size', '8px')
        .attr('font-weight', 'black')
        .attr('letter-spacing', '0.15em')
        .text(layer.type.toUpperCase());
        
      layerHeader.append('text')
        .attr('y', -16)
        .attr('text-anchor', 'middle')
        .attr('fill', isPinned ? '#fff' : (matching ? '#f1f5f9' : '#94a3b8'))
        .attr('font-size', isPinned ? '11px' : '10px')
        .attr('font-weight', isPinned ? 'bold' : 'medium')
        .text(layer.name.length > 12 ? layer.name.substring(0, 10) + '...' : layer.name);
        
      layerHeader.append('line')
        .attr('x1', 0)
        .attr('y1', 10)
        .attr('x2', 0)
        .attr('y2', (height / 2 - ((Math.min(layer.neurons, maxVisibleNeurons) - 1) * 35) / 2) - labelY - 20)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.5);
    });

    svg.on('click', () => {
      setSelectedNodeId(null);
      setPinnedLayer(null);
    });

    return () => clearInterval(signalInterval);
  }, [architecture, searchQuery, pinnedLayer, selectedNodeId]);

  const activeLayer = pinnedLayer || hoveredLayer;

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neural-network-${architecture.name}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = width * 2; // Higher resolution
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#0f172a"; // Background color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width * 2, height * 2);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `neural-network-${architecture.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950/20">
      {/* Search Bar & Legend */}
      <div className="absolute top-4 left-0 right-0 z-30 px-6 flex items-center justify-between pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-4 text-[9px] font-black tracking-widest shadow-2xl">
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> IN</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> DENSE</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span> CONV</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> OUT</span>
          </div>
          {selectedNodeId && (
            <div className="bg-indigo-600/95 backdrop-blur-xl px-4 py-2 rounded-full border border-indigo-500/50 flex items-center gap-2 text-[9px] font-black tracking-widest shadow-2xl text-white animate-pulse">
               <Zap className="w-3 h-3 text-amber-300" /> SIGNAL BURST ACTIVE
            </div>
          )}
        </div>

        <div className="relative pointer-events-auto max-w-xs w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-[11px] text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-2xl font-bold uppercase tracking-widest"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>

      {/* Floating Action Buttons for Export */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-30">
        <button 
          onClick={handleExportPNG}
          className="group flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-2xl"
          title="Export as PNG"
        >
          <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Snapshot PNG</span>
        </button>
        <button 
          onClick={handleExportSVG}
          className="group flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-2xl"
          title="Export as SVG"
        >
          <FileCode className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Vector SVG</span>
        </button>
      </div>

      {/* Fixed Layer Inspector Panel */}
      {activeLayer && (
        <div className="absolute right-4 bottom-4 top-4 z-40 w-[360px] pointer-events-none flex flex-col justify-center animate-in fade-in slide-in-from-right-8 duration-500">
          <div className={`bg-slate-900/98 backdrop-blur-3xl p-7 rounded-[2.5rem] border border-slate-700/50 shadow-[0_0_100px_rgba(0,0,0,0.6)] pointer-events-auto transition-all duration-500 flex flex-col max-h-[90%] ${pinnedLayer ? 'ring-2 ring-indigo-500/20' : ''}`}>
            {pinnedLayer && (
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em]">
                  <Target className="w-3.5 h-3.5" /> Diagnostic Lock
                </div>
                <button 
                  onClick={() => { setPinnedLayer(null); setSelectedNodeId(null); }}
                  className="p-1.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-start justify-between mb-8">
              <div className="min-w-0">
                <h3 className="text-2xl font-black text-white leading-tight truncate tracking-tight">{activeLayer.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${
                    activeLayer.type === 'input' ? 'bg-emerald-500/10 text-emerald-400' :
                    activeLayer.type === 'output' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {activeLayer.type}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">Classified</span>
                </div>
              </div>
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/50 flex-none ml-4 shadow-xl">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
            </div>

            <div className="space-y-7 flex-1 overflow-y-auto pr-3 custom-scrollbar">
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-3 opacity-60">Architectural Context</label>
                <div className="bg-slate-950/60 p-5 rounded-[1.5rem] border border-slate-800/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                  <p className="text-[13px] text-slate-300 leading-relaxed font-medium italic">
                    "{activeLayer.contribution}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/40 group hover:border-indigo-500/30 transition-all duration-300">
                   <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Dimension
                   </div>
                   <p className="text-xl font-mono font-bold text-white tracking-tighter">{activeLayer.neurons.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/40 group hover:border-indigo-500/30 transition-all duration-300">
                   <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] mb-2">
                    <Info className="w-4 h-4 text-blue-400" /> Function
                   </div>
                   <p className="text-sm font-mono font-bold text-slate-200 truncate uppercase">{activeLayer.activation || 'Linear'}</p>
                </div>
              </div>

              <div className="bg-slate-800/20 p-6 rounded-[1.5rem] border border-slate-800/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em]">Network Impact Score</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{Math.round(activeLayer.relativeImportance * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    style={{ width: `${activeLayer.relativeImportance * 100}%` }}
                  />
                </div>
              </div>

              {activeLayer.details && (
                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/30">
                  <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.1em] block mb-2">Technical Metadata</label>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {activeLayer.details}
                  </p>
                </div>
              )}
            </div>

            {pinnedLayer ? (
              <button 
                onClick={() => { setPinnedLayer(null); setSelectedNodeId(null); }}
                className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all border border-indigo-500 shadow-2xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                Release Focus
              </button>
            ) : (
              <div className="mt-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest animate-pulse border-t border-slate-800 pt-4">
                Select neural unit to pin
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualizer;
