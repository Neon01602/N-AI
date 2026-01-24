
import React from 'react';
import { ModelArchitecture } from '../types';
import { Brain, Cpu, Database, ChevronRight, Star, History, TrendingUp } from 'lucide-react';

interface Props {
  onSelectModel: (arch: ModelArchitecture) => void;
}

const MOCK_MODELS: ModelArchitecture[] = [
  {
    name: "ResNet-50",
    type: "Convolutional Neural Network",
    description: "A deep residual network for high-performance image classification and feature extraction.",
    layers: Array(50).fill(null).map((_, i) => ({ id: `r${i}`, name: `Layer ${i}`, type: 'convolution', neurons: 256, contribution: 'Feature maps', relativeImportance: 0.8 })),
    totalParameters: "25.6M",
    useCase: "Computer Vision / Image Classification"
  },
  {
    name: "BERT-Base",
    type: "Transformer Architecture",
    description: "Bidirectional Encoder Representations from Transformers for natural language understanding.",
    layers: Array(12).fill(null).map((_, i) => ({ id: `b${i}`, name: `Attention ${i}`, type: 'dense', neurons: 768, contribution: 'Contextual embedding', relativeImportance: 0.9 })),
    totalParameters: "110M",
    useCase: "Natural Language Processing"
  },
  {
    name: "YOLO v8-Nano",
    type: "Object Detection Engine",
    description: "Ultra-fast real-time object detection model optimized for edge devices.",
    layers: Array(22).fill(null).map((_, i) => ({ id: `y${i}`, name: `CSP ${i}`, type: 'convolution', neurons: 128, contribution: 'Bounding box regression', relativeImportance: 0.7 })),
    totalParameters: "3.2M",
    useCase: "Real-time Surveillance / Robotics"
  },
  {
    name: "Stable Diffusion V1.5",
    type: "Latent Diffusion Model",
    description: "Text-to-image generator using latent space denoising and U-Net architecture.",
    layers: Array(32).fill(null).map((_, i) => ({ id: `s${i}`, name: `UNet ${i}`, type: 'convolution', neurons: 512, contribution: 'Denoising step', relativeImportance: 0.95 })),
    totalParameters: "860M",
    useCase: "Generative AI / Digital Art"
  }
];

const Dashboard: React.FC<Props> = ({ onSelectModel }) => {
  return (
    <div className="h-full overflow-y-auto pr-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Model Library</h2>
          <p className="text-slate-500 text-sm mt-1">Explore and manage your deconstructed architectural assets.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
            <History className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
          </div>
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Performance Stats</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {MOCK_MODELS.map((model, idx) => (
          <div 
            key={idx}
            onClick={() => onSelectModel(model)}
            className="group relative bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
              <Brain className="w-24 h-24 text-indigo-400" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                </div>
                <button className="text-slate-600 hover:text-amber-400 transition-colors">
                  <Star className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{model.name}</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-4">{model.type}</p>
              
              <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2">
                {model.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Params</span>
                  <span className="text-xs font-mono text-slate-300">{model.totalParameters}</span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Layers</span>
                  <span className="text-xs font-mono text-slate-300">{model.layers.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">A</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">B</div>
                  <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">+4</div>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest group-hover:gap-3 transition-all">
                  Open Workspace <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500/30 transition-all cursor-pointer group">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800 group-hover:scale-110 transition-transform">
            <Database className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Import Archive</h3>
          <p className="text-xs text-slate-600 mt-2">Bulk import deconstructed JSON architecture files.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
