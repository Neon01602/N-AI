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
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blurOut');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blurOut');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;
    const padding = 140;

    const layers = architecture.layers;
    const layerCount = layers.length;

    const xScale = d3.scaleLinear()
      .domain([0, layerCount - 1])
      .range([padding, width - padding]);

    const maxVisibleNeurons = 10;
    const g = svg.append('g').attr('class', 'main-content');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom as any);

    const nodes: VisualNode[] = [];
    const links: any[] = [];

    layers.forEach((layer, layerIdx) => {
      const displayNeurons = Math.min(layer.neurons, maxVisibleNeurons);
      const startY = height / 2 - ((displayNeurons - 1) * 40) / 2;

      const layerNodes: VisualNode[] = Array.from({ length: displayNeurons }).map((_, i) => ({
        id: `l${layerIdx}-n${i}`,
        layerIdx,
        neuronIdx: i,
        x: xScale(layerIdx),
        y: startY + (i * 40),
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
      const q = searchQuery.toLowerCase();
      return layer.name.toLowerCase().includes(q) || layer.type.toLowerCase().includes(q);
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

    // Links
    g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', d => isLinkHighlighted(d) ? '#0ff' : (isMatch(d.source.layerData) || isMatch(d.target.layerData) ? '#5b21b6' : '#1e293b'))
      .attr('stroke-width', d => isLinkHighlighted(d) ? 3 : 1.2)
      .attr('opacity', d => isLinkHighlighted(d) ? 0.9 : 0.2)
      .attr('filter', d => isLinkHighlighted(d) ? 'url(#glow)' : 'none');

    // Nodes
    const getNodeColor = (type: string) => {
      switch(type) {
        case 'input': return '#06b6d4';
        case 'output': return '#facc15';
        case 'dense': return '#8b5cf6';
        case 'convolution': return '#3b82f6';
        case 'dropout': return '#f43f5e';
        default: return '#94a3b8';
      }
    };

    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('opacity', d => selectedNodeId ? (isNodeHighlighted(d) ? 1 : 0.1) : (isMatch(d.layerData) ? 1 : 0.2))
      .on('mouseenter', (event, d) => setHoveredLayer(d.layerData))
      .on('mouseleave', () => setHoveredLayer(null))
      .on('click', (event, d) => {
        event.stopPropagation();
        if (selectedNodeId === d.id) { setSelectedNodeId(null); setPinnedLayer(null); }
        else { setSelectedNodeId(d.id); setPinnedLayer(d.layerData); }
      });

    nodeGroups.append('circle')
      .attr('r', d => d.id === selectedNodeId ? 10 : 5 + d.importance * 3)
      .attr('fill', d => getNodeColor(d.layerData.type))
      .attr('stroke', '#0ff')
      .attr('stroke-width', d => d.id === selectedNodeId ? 3 : 1.5)
      .attr('filter', d => d.id === selectedNodeId ? 'url(#glow)' : 'none');

    // Labels
    layers.forEach((layer, i) => {
      const matching = isMatch(layer);
      const isSelectedLayer = pinnedLayer?.id === layer.id || (selectedNodeId && nodes.find(n => n.id === selectedNodeId)?.layerIdx === i);
      const labelY = padding - 80;

      const header = g.append('g').attr('transform', `translate(${xScale(i)},${labelY})`).attr('opacity', matching || isSelectedLayer ? 1 : 0.2);

      header.append('rect')
        .attr('x', -45)
        .attr('y', -30)
        .attr('width', 90)
        .attr('height', 40)
        .attr('rx', 12)
        .attr('fill', isSelectedLayer ? '#0f172a' : 'rgba(20,20,20,0.4)')
        .attr('stroke', isSelectedLayer ? '#06b6d4' : 'none');

      header.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#f0f0f0')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text(layer.name.length > 12 ? layer.name.substring(0,10)+'...' : layer.name);
    });

    svg.on('click', () => { setSelectedNodeId(null); setPinnedLayer(null); });
  }, [architecture, searchQuery, pinnedLayer, selectedNodeId]);

  const activeLayer = pinnedLayer || hoveredLayer;

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col overflow-hidden bg-[#010a13]">
      {/* Top Controls */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-30 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="bg-[#081a2a]/90 backdrop-blur-xl px-4 py-2 rounded-full flex gap-4 text-[10px] font-bold uppercase tracking-wide shadow-xl">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> IN</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> DENSE</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> CONV</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> OUT</span>
          </div>
        </div>
        <div className="relative w-64 pointer-events-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="w-4 h-4 text-slate-400" /></div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 rounded-3xl text-[11px] font-bold text-white bg-[#081a2a]/80 border border-[#0c1a2a] focus:ring-2 focus:ring-cyan-500 outline-none"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-2 flex items-center"><X className="w-4 h-4 text-slate-400" /></button>}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>

      {/* Floating Export Buttons */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-30">
        <button className="bg-[#081a2a]/90 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] text-white hover:bg-[#0f2436] shadow-lg"><ImageIcon className="w-4 h-4"/> PNG</button>
        <button className="bg-[#081a2a]/90 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] text-white hover:bg-[#0f2436] shadow-lg"><FileCode className="w-4 h-4"/> SVG</button>
      </div>

      {/* Inspector Panel */}
      {activeLayer && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-[#0b1b2c]/90 backdrop-blur-xl p-6 rounded-3xl border border-[#0f2a44] shadow-xl overflow-y-auto pointer-events-auto">
          <h3 className="text-lg font-bold text-cyan-400">{activeLayer.name}</h3>
          <p className="text-sm text-slate-300 mt-1 italic">{activeLayer.contribution}</p>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualizer;
