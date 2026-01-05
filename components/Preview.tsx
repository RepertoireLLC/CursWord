
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PreviewProps {
  files: Record<string, string>;
  activeFile: string;
}

export const Preview: React.FC<PreviewProps> = ({ files, activeFile }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewType, setPreviewType] = useState<'web' | 'code' | 'image' | 'data'>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const extensions: Record<string, string> = {
      'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'css', 'sass': 'css', 'less': 'css',
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
      'php': 'php', 'rb': 'ruby', 'go': 'go', 'rs': 'rust',
      'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
      'md': 'markdown', 'txt': 'text',
      'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'svg': 'image', 'webp': 'image',
      'sql': 'sql', 'sh': 'shell', 'bash': 'shell'
    };
    return extensions[ext] || 'text';
  };

  const getPreviewType = (filename: string, content: string): 'web' | 'code' | 'image' | 'data' => {
    const fileType = getFileType(filename);

    if (['html', 'htm'].includes(filename.split('.').pop()?.toLowerCase() || '')) {
      return 'web';
    }

    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(filename.split('.').pop()?.toLowerCase() || '')) {
      return 'image';
    }

    if (['json', 'xml', 'yaml', 'yml', 'sql'].includes(filename.split('.').pop()?.toLowerCase() || '')) {
      return 'data';
    }

    return 'code';
  };

  const resolveProjectContext = (html: string) => {
    let resolved = html;
    resolved = resolved.replace(/<link[^>]+href=["'](.*?)["'][^>]*>/gi, (match, href) => {
      const cleanHref = href.replace('./', '');
      if (files[cleanHref]) return `<style data-source="${cleanHref}">${files[cleanHref]}</style>`;
      return match;
    });
    resolved = resolved.replace(/<script[^>]+src=["'](.*?)["'][^>]*><\/script>/gi, (match, src) => {
      const cleanSrc = src.replace('./', '');
      if (files[cleanSrc]) return `<script data-source="${cleanSrc}">${files[cleanSrc]}</script>`;
      return match;
    });
    return resolved;
  };

  // Debounced preview update
  const debouncedUpdate = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const content = files[activeFile] || '';
      const newPreviewType = getPreviewType(activeFile, content);
      setPreviewType(newPreviewType);

      if (newPreviewType === 'web') {
        updateWebPreview();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [files, activeFile]);

  useEffect(() => {
    debouncedUpdate();
  }, [debouncedUpdate]);

  const updateWebPreview = () => {
    if (!iframeRef.current) return;
    const document = iframeRef.current.contentDocument;
    if (!document) return;

    const entryFile = ['html', 'htm'].includes(activeFile.split('.').pop()?.toLowerCase() || '')
      ? activeFile
      : (files['index.html'] ? 'index.html' : null);

    if (!entryFile) {
      setPreviewType('code');
      return;
    }

    const code = files[entryFile] || '';
    const headInjection = `
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      </style>
    `;

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      document.open();
      let finalDoc = resolveProjectContext(code);
      if (!finalDoc.toLowerCase().includes('<html')) {
        finalDoc = `<!DOCTYPE html><html><head>${headInjection}</head><body>${finalDoc}</body></html>`;
      } else if (!finalDoc.includes('tailwindcss')) {
        finalDoc = finalDoc.replace('<head>', `<head>${headInjection}`);
      }
      document.write(finalDoc);
      document.close();
    });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err.message));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0b0e14]">
      {/* PREVIEW HEADER */}
      <div className="px-4 h-9 flex items-center justify-between border-b border-white/5 bg-[#0c0c0c]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Live Preview</span>
        </div>
        
        <div className="flex items-center gap-3">
           <span className="text-[7px] bg-white/[0.03] text-slate-400 px-2 py-0.5 rounded-sm border border-white/5 font-black uppercase tracking-widest truncate max-w-[120px]">
             {activeFile}
           </span>
           <button 
             onClick={toggleFullscreen}
             className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all border border-white/5"
           >
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isFullscreen ? "M9 9L4 4m0 0l5-5M4 4h5M15 9l5-5m0 0l-5-5m5 5h-5M9 15l-5 5m0 0l5 5m-5-5h5M15 15l5 5m0 0l-5 5m5-5h-5" : "M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"} />
             </svg>
           </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white relative overflow-hidden">
        {previewType === 'web' && (
          <iframe
            ref={iframeRef}
            title="Project Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          />
        )}

        {previewType === 'code' && (
          <div className="h-full bg-[#0d1117] overflow-auto custom-scrollbar">
            <div className="p-4 border-b border-white/10 bg-[#0a0a0a]">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <div className={`w-2 h-2 rounded-full ${
                  getFileType(activeFile) === 'javascript' ? 'bg-yellow-500' :
                  getFileType(activeFile) === 'typescript' ? 'bg-blue-500' :
                  getFileType(activeFile) === 'python' ? 'bg-green-500' :
                  getFileType(activeFile) === 'css' ? 'bg-pink-500' :
                  'bg-slate-500'
                }`}></div>
                <span>{getFileType(activeFile).toUpperCase()}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500">{activeFile}</span>
              </div>
            </div>
            <div className="p-6">
              <pre className={`font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${
                getFileType(activeFile) === 'javascript' || getFileType(activeFile) === 'typescript' ? 'text-yellow-100' :
                getFileType(activeFile) === 'python' ? 'text-green-100' :
                getFileType(activeFile) === 'css' ? 'text-pink-100' :
                getFileType(activeFile) === 'html' ? 'text-blue-100' :
                'text-slate-300'
              }`}>
                {files[activeFile]}
              </pre>
            </div>
          </div>
        )}

        {previewType === 'data' && (
          <div className="h-full bg-[#0a0a0a] overflow-auto custom-scrollbar">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>{getFileType(activeFile).toUpperCase()}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500">Structured Data</span>
              </div>
            </div>
            <div className="p-6">
              <pre className="font-mono text-[11px] leading-relaxed text-purple-100 whitespace-pre-wrap bg-[#0d1117] p-4 rounded border border-purple-500/20">
                {files[activeFile]}
              </pre>
            </div>
          </div>
        )}

        {previewType === 'image' && (
          <div className="h-full bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-mono">Image Preview</p>
              <p className="text-slate-600 text-xs mt-1">{activeFile}</p>
              <p className="text-slate-500 text-xs mt-2">Image files are not rendered in preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
