
import React from 'react';
import { Book, Code, Terminal, Info, Shield, Zap, Search } from 'lucide-react';

const Documentation: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto pr-4 max-w-4xl mx-auto py-8 animate-in fade-in duration-700">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Book className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Technical Manual</h1>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed">
          Understanding NeuralInsight AI's deconstruction engine and the logic behind architectural synthesis.
        </p>
      </div>

      <div className="space-y-12 pb-20">
        <section>
          <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6 uppercase tracking-wider">
            <Zap className="w-5 h-5 text-amber-400" /> Deconstruction Logic
          </h2>
          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
            <p className="text-slate-400 leading-relaxed mb-6">
              The platform utilizes the <strong>Gemini 3 Flash</strong> model to perform deep behavioral analysis on model binary snippets. 
              By examining file headers, metadata, and byte sequences, the AI identifies signature patterns common to frameworks like 
              TensorFlow, PyTorch, and ONNX.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
                <h4 className="text-indigo-400 text-xs font-black uppercase mb-3">Signature Analysis</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Detection of magic numbers, tensor descriptors, and graph serialization patterns to identify standard models like ResNet, VGG, or Transformers.
                </p>
              </div>
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
                <h4 className="text-emerald-400 text-xs font-black uppercase mb-3">Architectural Mapping</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Extrapolation of layer counts, activation functions, and propagation flows based on industry-standard architectural principles.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6 uppercase tracking-wider">
            <Code className="w-5 h-5 text-indigo-400" /> Layer Classification
          </h2>
          <div className="overflow-hidden border border-slate-800 rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Primary Function</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Visualization Key</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/20 divide-y divide-slate-800">
                <tr>
                  <td className="px-6 py-5 font-bold text-emerald-400">Input</td>
                  <td className="px-6 py-5 text-sm text-slate-400">Entry point for multi-dimensional tensors.</td>
                  <td className="px-6 py-5"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div></td>
                </tr>
                <tr>
                  <td className="px-6 py-5 font-bold text-blue-400">Dense</td>
                  <td className="px-6 py-5 text-sm text-slate-400">Fully connected linear transformations.</td>
                  <td className="px-6 py-5"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div></td>
                </tr>
                <tr>
                  <td className="px-6 py-5 font-bold text-violet-400">Convolution</td>
                  <td className="px-6 py-5 text-sm text-slate-400">Spatial feature extraction using filters.</td>
                  <td className="px-6 py-5"><div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div></td>
                </tr>
                <tr>
                  <td className="px-6 py-5 font-bold text-amber-400">Output</td>
                  <td className="px-6 py-5 text-sm text-slate-400">Final classification or regression heads.</td>
                  <td className="px-6 py-5"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Terminal className="w-40 h-40 text-indigo-400" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Security & Privacy</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
              Model binaries are analyzed in-memory. Only small metadata snippets and headers are sent to the deconstruction 
              engine. Your proprietary weights and training data are never stored or used for model training. 
              NeuralInsight AI acts as a passive diagnostic lens.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Documentation;
