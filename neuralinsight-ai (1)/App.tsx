
import React, { useState } from 'react';
import { Upload, FileCode, Layers, Search, Sparkles, AlertCircle, Loader2, Grid, BookOpen, Activity, LayoutDashboard, Microscope } from 'lucide-react';
import NetworkVisualizer from './components/NetworkVisualizer';
import ModelInfo from './components/ModelInfo';
import Dashboard from './components/Dashboard';
import Documentation from './components/Documentation';
import DiagnosticLab from './components/DiagnosticLab';
import { analyzeModelFile } from './services/geminiService';
import { ModelArchitecture, FileMetadata } from './types';

type Page = 'workspace' | 'library' | 'lab' | 'docs';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('workspace');
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [architecture, setArchitecture] = useState<ModelArchitecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setLoading(true);
    setError(null);
    setArchitecture(null);
    setCurrentPage('workspace');

    const metadata: FileMetadata = {
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: uploadedFile.type,
      lastModified: uploadedFile.lastModified
    };
    setFile(metadata);

    try {
      let snippet = "Binary file content";
      if (uploadedFile.size < 1024 * 50) {
        snippet = await uploadedFile.text();
      } else {
        const buffer = await uploadedFile.slice(0, 1000).arrayBuffer();
        snippet = new TextDecoder().decode(buffer).substring(0, 500);
      }

      const analysis = await analyzeModelFile(metadata, snippet);
      setArchitecture(analysis);
    } catch (err) {
      setError("Failed to analyze model structure. Please ensure the file is a valid model format.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
        return <Dashboard onSelectModel={(mockArch) => { setArchitecture(mockArch); setCurrentPage('workspace'); }} />;
      case 'docs':
        return <Documentation />;
      case 'lab':
        return <DiagnosticLab architecture={architecture} />;
      case 'workspace':
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
              <div className="flex-none bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-20 h-20 text-indigo-400" />
                </div>
                
                <h2 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Source Model</h2>
                <p className="text-[11px] text-slate-500 mb-4">Select local model binaries or config files.</p>

                <label className="group relative block">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".h5,.pt,.pth,.onnx,.json,.tflite,.bin"
                  />
                  <div className="w-full py-6 px-4 border-2 border-dashed border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer bg-slate-900/50">
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-widest">Upload Model File</p>
                  </div>
                </label>

                {file && (
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <FileCode className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{file.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                {architecture ? (
                  <ModelInfo architecture={architecture} />
                ) : !loading && (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl opacity-40 py-12">
                    <Search className="w-10 h-10 mb-3 text-slate-600" />
                    <p className="text-xs font-bold uppercase tracking-tighter">Awaiting analysis...</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-400 text-[11px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Right Content - Full Height Visualization */}
            <div className="lg:col-span-9 flex flex-col h-full">
              <div className="flex-1 flex flex-col bg-slate-900/40 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
                
                {/* Viz Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Connection Map</h2>
                  </div>
                  {architecture && (
                    <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      <span className="text-slate-200">{architecture.layers.length} Layers Detected</span>
                      <div className="h-3 w-px bg-slate-700"></div>
                      <span>{architecture.type}</span>
                    </div>
                  )}
                </div>

                {/* Viz Body */}
                <div className="flex-1 relative bg-slate-950/20">
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md z-40">
                      <div className="relative mb-6">
                         <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                         <div className="absolute inset-0 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                      </div>
                      <p className="text-base font-bold text-white uppercase tracking-widest">Synthesizing Layers</p>
                      <p className="text-[11px] text-slate-500 mt-2 font-mono">Mapping weights, bias, and propagation flow...</p>
                    </div>
                  ) : architecture ? (
                    <NetworkVisualizer architecture={architecture} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                       <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800 shadow-2xl">
                        <Layers className="w-8 h-8 text-slate-700" />
                       </div>
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Import a model to initialize visualization</p>
                    </div>
                  )}
                </div>

                {/* Viz Footer */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className="w-2 h-0.5 bg-indigo-500 rounded-sm"></span> Propagation Pathways
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 border border-slate-700 rounded-full"></span> Neural Unit
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-600 font-medium">Vector Engine Ready • 60FPS Render</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div onClick={() => setCurrentPage('workspace')} className="cursor-pointer">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-none">
                NeuralInsight <span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Model Deconstruction v3.1</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <button 
                onClick={() => setCurrentPage('workspace')} 
                className={`flex items-center gap-2 transition-colors ${currentPage === 'workspace' ? 'text-indigo-400' : 'hover:text-white'}`}
              >
                <Activity className="w-3.5 h-3.5" /> Workspace
              </button>
              <button 
                onClick={() => setCurrentPage('library')} 
                className={`flex items-center gap-2 transition-colors ${currentPage === 'library' ? 'text-indigo-400' : 'hover:text-white'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Library
              </button>
              <button 
                onClick={() => setCurrentPage('lab')} 
                className={`flex items-center gap-2 transition-colors ${currentPage === 'lab' ? 'text-indigo-400' : 'hover:text-white'}`}
              >
                <Microscope className="w-3.5 h-3.5" /> Diagnostic Lab
              </button>
              <button 
                onClick={() => setCurrentPage('docs')} 
                className={`flex items-center gap-2 transition-colors ${currentPage === 'docs' ? 'text-indigo-400' : 'hover:text-white'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Documentation
              </button>
            </nav>
            <div className="h-6 w-px bg-slate-800"></div>
            <button className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-700 font-medium">
              Enterprise
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 overflow-hidden">
        {renderPage()}
      </main>

      <footer className="flex-none border-t border-slate-800 bg-slate-900/30 px-6 py-2 text-center text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">
        NeuralInsight Advanced Diagnostics Platform
      </footer>
    </div>
  );
};

export default App;
