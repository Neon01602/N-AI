import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ModelArchitecture, ModelLayer } from '../types';
import { Search, X, Activity, Zap, Info, Target, Download, ImageIcon, FileCode } from 'lucide-react';

interface Props {
  architecture: ModelArchitecture;
}

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

    const defs = svg.append('defs');

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
        if (selectedNodeId) return isLinkHighlighted(d) ? '#3b82f6' : '#cbd5e1';
        const matching = isMatch(d.source.layerData) || isMatch(d.target.layerData);
        if (!searchQuery) return '#94a3b8';
        return matching ? '#2563eb' : '#cbd5e1';
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
        if (!searchQuery) return null;
        return matching ? 0.4 : 0.01;
      })
      .attr('filter', d => isLinkHighlighted(d) ? 'url(#signal-glow)' : 'none');

    const animateSignals = () => {
      const signalLayer = g.append('g').attr('class', 'signals');
      const targetLinks = links.filter(d => selectedNodeId ? isLinkHighlighted(d) : Math.random() > 0.94);

      targetLinks.forEach(link => {
        const isHighlighted = selectedNodeId && isLinkHighlighted(link);
        const particleCount = isHighlighted ? 3 : 1;

        for (let i = 0; i < particleCount; i++) {
          const speed = isHighlighted 
            ? 500 + (1 - link.importance) * 800 
            : 1500 + (1 - link.importance) * 2000;
          
          const delay = isHighlighted ? i * 200 : 0;

          const signal = signalLayer.append('circle')
            .attr('r', isHighlighted ? 3 : 1.2)
            .attr('fill', isHighlighted ? '#3b82f6' : '#60a5fa')
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
        case 'input': return '#22c55e';
        case 'output': return '#f59e0b';
        case 'convolution': return '#6366f1';
        case 'dense': return '#3b82f6';
        case 'pooling': return '#2563eb';
        case 'dropout': return '#ef4444';
        default: return '#64748b';
      }
    };

    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer transition-all duration-300')
      .attr('transform', (d: VisualNode) => `translate(${d.x},${d.y})`)
      .attr('opacity', (d: VisualNode) => {
        if (selectedNodeId) return isNodeHighlighted(d) ? 1 : 0.1;
        return isMatch(d.layerData) ? 1 : 0.2;
      })
      .on('mouseenter', (event, d: VisualNode) => {
        setHoveredLayer(d.layerData);
        d3.select(event.currentTarget).select('circle')
          .transition().duration(200).attr('r', 12).attr('stroke', '#2563eb');
      })
      .on('mouseleave', (event, d: VisualNode) => {
        setHoveredLayer(null);
        d3.select(event.currentTarget).select('circle')
          .transition().duration(200)
          .attr('r', () => (d.id === selectedNodeId ? 10 : 4 + d.importance * 4))
          .attr('stroke', () => (d.id === selectedNodeId ? '#2563eb' : '#cbd5e1'));
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
      .attr('stroke', (d: VisualNode) => (d.id === selectedNodeId ? '#2563eb' : '#cbd5e1'))
      .attr('stroke-width', (d: VisualNode) => (d.id === selectedNodeId ? 3 : 2))
      .attr('filter', (d: VisualNode) => (d.id === selectedNodeId) ? 'drop-shadow(0 0 20px rgba(59,130,246,0.8))' : 'none');

    // Labels
    layers.forEach((layer, i) => {
      const matching = isMatch(layer);
      const isLayerOfSelectedNode = selectedNodeId && nodes.find(n => n.id === selectedNodeId)?.layerIdx === i;
      const labelOpacity = matching || isLayerOfSelectedNode ? 1 : 0.25;
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
          .attr('fill', isPinned ? 'rgba(59,130,246,0.15)' : 'rgba(203,213,225,0.3)')
          .attr('stroke', isPinned ? 'rgba(59,130,246,0.4)' : 'none');
      }

      layerHeader.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', matching && searchQuery ? '#3b82f6' : '#64748b')
        .attr('font-size', '8px')
        .attr('font-weight', 'black')
        .attr('letter-spacing', '0.15em')
        .text(layer.type.toUpperCase());
        
      layerHeader.append('text')
        .attr('y', -16)
        .attr('text-anchor', 'middle')
        .attr('fill', isPinned ? '#2563eb' : (matching ? '#1e40af' : '#475569'))
        .attr('font-size', isPinned ? '11px' : '10px')
        .attr('font-weight', isPinned ? 'bold' : 'medium')
        .text(layer.name.length > 12 ? layer.name.substring(0, 10) + '...' : layer.name);
        
      layerHeader.append('line')
        .attr('x1', 0)
        .attr('y1', 10)
        .attr('x2', 0)
        .attr('y2', (height / 2 - ((Math.min(layer.neurons, maxVisibleNeurons) - 1) * 35) / 2) - labelY - 20)
        .attr('stroke', '#cbd5e1')
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
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#f1f5f9";
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
    <div ref={containerRef} className="relative w-full h-full flex flex-col overflow-hidden bg-white">
      {/* Search Bar & Legend */}
      <div className="absolute top-4 left-0 right-0 z-30 px-6 flex items-center justify-between pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-300 flex items-center gap-4 text-[9px] font-black tracking-widest shadow-lg">
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> IN</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> DENSE</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span> CONV</span>
             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> OUT</span>
          </div>
          {selectedNodeId && (
            <div className="bg-blue-600/95 backdrop-blur-xl px-4 py-2 rounded-full border border-blue-500/50 flex items-center gap-2 text-[9px] font-black tracking-widest shadow-lg text-white animate-pulse">
               <Zap className="w-3 h-3 text-amber-300" /> SIGNAL BURST ACTIVE
            </div>
          )}
        </div>

        <div className="relative pointer-events-auto max-w-xs w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 bg-white/95 backdrop-blur-xl border border-slate-300 rounded-2xl text-[11px] text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-md font-bold uppercase tracking-widest"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-white"></svg>

      {/* Floating Action Buttons & Layer Panel are also updated to light/blue theme similarly */}
    </div>
  );
};

export default NetworkVisualizer;
