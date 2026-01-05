
import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  isLiveWriting?: boolean;
  language?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, isLiveWriting = false, language = 'javascript' }) => {
  return (
    <div className="flex flex-col h-full bg-[#080808]">
      {/* EDITOR HEADER */}
      <div className="px-4 h-9 flex items-center justify-between border-b border-white/5 bg-[#0c0c0c]">
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3 text-green-500/50 italic" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 19.77 3.23 21 12 17.27 20.77 21 22 19.77 12 2z"/></svg>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Source Buffer</span>
          {isLiveWriting && (
            <div className="flex items-center gap-1 ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[7px] font-bold text-green-400 uppercase tracking-wider">AI Writing</span>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 opacity-20">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
        </div>
      </div>
      
      {/* EDITOR AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Visual Line Numbers Gutter */}
        <div className="w-10 bg-black/40 border-r border-white/5 flex flex-col items-center pt-5 pointer-events-none select-none">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="text-[8px] text-slate-800 h-[1.6em] font-mono">{i + 1}</div>
          ))}
        </div>
        
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 p-5 bg-transparent text-slate-300 font-mono text-[11px] leading-[1.6] resize-none focus:outline-none selection:bg-green-500/10 custom-scrollbar"
          placeholder="// Code Architect awaiting instructions..."
        />
      </div>
    </div>
  );
};
