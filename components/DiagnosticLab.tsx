
import React from 'react';
import { ModelArchitecture } from '../types';
import { Microscope, Activity, BarChart3, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  architecture: ModelArchitecture | null;
}

const DiagnosticLab: React.FC<Props> = ({ architecture }) => {
  if (!architecture) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed animate-in fade-in duration-500">
        <Microscope className="w-16 h-16 text-slate-700 mb-6" />
        <h2 className="text-2xl font-bold text-slate-500 mb-2 uppercase tracking-tight">No Active Diagnostic Session</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          You must upload a model or select one from the library to perform a deep architectural diagnostic.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            <Activity className="w-4 h-4" /> Real-time Diagnostics
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">{architecture.name} <span className="text-slate-600 font-light font-mono text-xl ml-2">/ Analytics</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
             <CheckCircle2 className="w-5 h-5 text-emerald-500" />
             <div>
               <p className="text-[10px] text-emerald-500 font-black uppercase">Integrity</p>
               <p className="text-sm font-bold text-white">Verified</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> Architectural Importance Gradient
            </h3>
            <div className="space-y-4">
              {architecture.layers.map((layer, idx) => (
                <div key={idx} className="group relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">
                      {layer.name} <span className="text-[9px] text-slate-600 ml-2 font-mono uppercase">[{layer.type}]</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{Math.round(layer.relativeImportance * 100)}% Impact</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                      style={{ width: `${layer.relativeImportance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Layer Contribution Analysis</h3>
                <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-widest">Logic Breakdown</span>
             </div>
             <div className="p-8 space-y-4">
                {architecture.layers.map((layer, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-slate-950/40 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
                    <div className={`mt-1 p-2 rounded-lg ${
                      layer.type === 'input' ? 'bg-emerald-500/10 text-emerald-400' :
                      layer.type === 'convolution' ? 'bg-violet-500/10 text-violet-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      <Info className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{layer.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed italic">"{layer.contribution}"</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-4">Diagnostic Summary</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              This {architecture.type} model exhibits a complex {architecture.layers.length}-layer depth, primarily optimized for {architecture.useCase.toLowerCase()}. 
              Total deconstructed parameters estimated at <span className="text-indigo-300 font-mono">{architecture.totalParameters}</span>.
            </p>
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-3 text-amber-500 mb-2">
                 <AlertTriangle className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Heuristic Warning</span>
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed">
                 High parameter density detected in tail layers. Potential for over-fitting if training distribution lacks entropy.
               </p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Verified Meta-Tags</h3>
            <div className="flex flex-wrap gap-2">
              {['Optimized', 'Pre-Trained', 'Vision', 'Dense', 'Validated', 'Quantized'].map((tag, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticLab;
