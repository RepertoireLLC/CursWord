
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { ChatMode } from '../types';
import { getActiveProvider, getAvailableProviders, getAvailableModels } from '../services/multiProviderService';
import { SettingsPanel } from './SettingsPanel';

export const ChatInterface: React.FC = () => {
  const { messages, orchestrate, clearChat, inference, statusLog, initializeModel, setSelectedModel } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<ChatMode>('agent');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusLog, inference.progress]);

  // Initialize model on component mount
  useEffect(() => {
    if (!inference.isLoaded && !inference.isLoading) {
      console.log('Initializing model...');
      initializeModel().catch((error) => {
        console.error('Model initialization failed:', error);
      });
    }
  }, []);

  // Update selected model when provider changes
  useEffect(() => {
    const activeProvider = getActiveProvider();
    const availableModels = getAvailableModels();
    if (activeProvider && availableModels.length > 0) {
      // If current selectedModel is not in the available models for this provider, switch to first available
      const isCurrentModelValid = availableModels.some(m => m.id === inference.selectedModel);
      if (!isCurrentModelValid) {
        setSelectedModel(availableModels[0].id);
      }
    }
  }, [getActiveProvider()?.name]); // Re-run when provider changes

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !inference.isLoading) {
      if (inference.isLoaded) {
        orchestrate(input, activeMode);
        setInput('');
      } else {
        // Show error message in chat
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Cannot send message: ${inference.error || 'AI provider not configured'}. Please check your provider settings in the gear icon (⚙️) above.`,
          timestamp: Date.now(),
          mode: activeMode
        };
        const { messages } = useStore.getState();
        useStore.setState({ messages: [...messages, errorMessage] });
        setInput('');
      }
    }
  };


  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* MINI HUD */}
      <div className="px-4 py-2 bg-[#0c0c0c] border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${inference.isLoaded ? 'bg-green-500' : 'bg-orange-500'} shadow-sm`}></div>
             <span
               className="text-[8px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors"
               onClick={() => setShowSettings(true)}
               title="Click to change AI provider"
             >
               {getActiveProvider()?.name || 'No Provider'} ⚙️
             </span>
           </div>

           <select
             value={inference.selectedModel}
             onChange={(e) => handleModelChange(e.target.value)}
             disabled={inference.isLoading}
             className="bg-transparent text-[6px] text-slate-400 font-bold border border-white/10 px-1 py-0.5 rounded focus:outline-none focus:border-green-500/50 ml-2 max-w-[140px] truncate"
           >
             <optgroup label="Free Models">
               {getAvailableModels().filter(m => !m.pricing).map(m => (
                 <option key={m.id} value={m.id} className="text-green-400">
                   {m.name} (Free)
                 </option>
               ))}
             </optgroup>
             <optgroup label="Paid Models">
               {getAvailableModels().filter(m => m.pricing).map(m => (
                 <option key={m.id} value={m.id}>
                   {m.name} (${(m.pricing!.input * 1000).toFixed(3)}/1K)
                 </option>
               ))}
             </optgroup>
           </select>

           {/* Model Status Indicator */}
           <div className="text-[6px] text-slate-500 font-medium ml-1 max-w-[100px] truncate">
             {inference.isLoaded ? (
               <span className="text-green-400">
                 {getAvailableModels().find(m => m.id === inference.selectedModel)?.name?.split(' ')[0] || 'Ready'}
               </span>
             ) : inference.error ? (
               <span className="text-red-400">Error</span>
             ) : (
               <span className="text-yellow-400">...</span>
             )}
           </div>
        </div>

        {inference.isLoading && inference.progress && (
          <div className="mb-3">
            <div className="flex justify-between text-[7px] text-slate-600 uppercase font-black mb-1">
              <span>{inference.progress.text.split(' ')[0]}...</span>
              <span>{Math.round(inference.progress.progress * 100)}%</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/60 transition-all duration-300" style={{ width: `${inference.progress.progress * 100}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex gap-1">
          {(['ask', 'plan', 'agent', 'debug'] as ChatMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex-1 py-1 rounded-sm text-[7px] font-black uppercase tracking-widest border transition-all ${activeMode === mode ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'border-white/5 text-slate-600 hover:text-slate-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* STREAM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[#050505]">
        {messages.length === 0 && !statusLog.length && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-10">
            <div className="w-10 h-10 border border-white rounded-full flex items-center justify-center mb-4 border-dashed animate-pulse">
              <span className="text-[7px] font-black">AI</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">Multi_Provider_AI</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1.5 opacity-30 text-[7px] font-black uppercase">
              <span className={msg.role === 'user' ? 'text-blue-400' : 'text-green-500'}>{msg.role === 'user' ? 'Input' : 'Output'}</span>
              <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className={`p-3 rounded-sm text-[10px] leading-relaxed font-mono whitespace-pre-wrap max-w-[95%] border ${
              msg.role === 'user' 
                ? 'bg-[#111] border-white/5 text-slate-400' 
                : 'bg-[#0a0a0a] border-green-500/5 text-slate-200 shadow-xl'
            }`}>
              {msg.content.includes('[FILE:') ? 'Code materialization successful. Check buffers.' : msg.content}
            </div>
          </div>
        ))}

        {inference.isLoading && !inference.progress && (
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-green-500/50 animate-pulse">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[8px] font-black uppercase tracking-widest italic">Chain_Processing</span>
             </div>
             <div className="space-y-1 ml-3 border-l border-white/5 pl-3">
                {statusLog.map((log, i) => (
                  <div key={i} className="text-[8px] font-mono text-slate-600">
                    <span className="text-green-900/40 opacity-50 mr-2">#</span>{log}
                  </div>
                ))}
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 bg-[#0c0c0c] border-t border-white/5">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              inference.error
                ? `Provider error: ${inference.error.substring(0, 40)}...`
                : "Describe the functional requirement..."
            }
            disabled={inference.isLoading}
            className="w-full bg-black text-slate-300 text-[10px] p-3 pr-10 rounded-sm border border-white/5 focus:outline-none focus:border-green-500/20 transition-all resize-none h-20 font-mono disabled:opacity-20 placeholder:text-slate-700 shadow-inner"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || inference.isLoading}
            className="absolute right-2 bottom-2 p-1.5 rounded-sm bg-green-700/80 text-white hover:bg-green-600 transition-all disabled:opacity-0 shadow-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth={3} /></svg>
          </button>
        </div>
      </div>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};
