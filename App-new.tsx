import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { CodeEditor } from './components/CodeEditor';
import { Preview } from './components/Preview';
import { FileTree } from './components/FileTree';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { Terminal } from './components/Terminal';
import { ActionLogger } from './components/ActionLogger';
import { useStore } from './store';

const App: React.FC = () => {
  const {
    files,
    activeFile,
    layout,
    setActiveFile,
    setFiles,
    setLayout,
    deleteFile,
    inference
  } = useStore();

  // New state for enhanced features
  const [showSettings, setShowSettings] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [actionLogs, setActionLogs] = useState<any[]>([]);

  // Load workspace from localStorage on mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem('currentWorkspace');
    if (savedWorkspace) {
      setCurrentWorkspace(savedWorkspace);
      loadWorkspaceFiles(savedWorkspace);
    }
  }, []);

  const loadWorkspaceFiles = async (workspacePath: string) => {
    try {
      // In a real implementation, this would call the backend API
      // For demo purposes, we'll simulate loading files
      const mockFiles = [
        { name: 'src', type: 'directory', path: 'src', children: [
          { name: 'components', type: 'directory', path: 'src/components' },
          { name: 'App.js', type: 'file', path: 'src/App.js' },
          { name: 'index.js', type: 'file', path: 'src/index.js' }
        ]},
        { name: 'public', type: 'directory', path: 'public' },
        { name: 'package.json', type: 'file', path: 'package.json' },
        { name: 'README.md', type: 'file', path: 'README.md' }
      ];
      setWorkspaceFiles(mockFiles);
    } catch (error) {
      console.error('Failed to load workspace files:', error);
    }
  };

  const handleWorkspaceSelected = (workspacePath: string) => {
    setCurrentWorkspace(workspacePath);
    localStorage.setItem('currentWorkspace', workspacePath);
    loadWorkspaceFiles(workspacePath);

    // Add action log
    addActionLog('workspace', workspacePath, `Selected workspace: ${workspacePath}`, 'success');
  };

  const handleCreateFile = (filePath: string) => {
    // In a real implementation, this would call the backend API
    console.log('Creating file:', filePath);
    addActionLog('create', filePath, `Creating new file: ${filePath}`, 'pending');

    // Simulate file creation
    setTimeout(() => {
      addActionLog('create', filePath, `Successfully created file: ${filePath}`, 'success');
    }, 500);
  };

  const handleCreateDirectory = (dirPath: string) => {
    // In a real implementation, this would call the backend API
    console.log('Creating directory:', dirPath);
    addActionLog('create', dirPath, `Creating new directory: ${dirPath}`, 'pending');

    // Simulate directory creation
    setTimeout(() => {
      addActionLog('create', dirPath, `Successfully created directory: ${dirPath}`, 'success');
    }, 500);
  };

  const addActionLog = (operation: string, filePath: string, description: string, status: 'pending' | 'success' | 'error' = 'success') => {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      operation,
      filePath,
      description,
      status
    };

    setActionLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  const clearActionLogs = () => {
    setActionLogs([]);
  };

  const refreshWorkspace = () => {
    if (currentWorkspace) {
      loadWorkspaceFiles(currentWorkspace);
      addActionLog('refresh', currentWorkspace, 'Refreshed workspace files', 'success');
    }
  };

  return (
    <div className="h-screen bg-[#060606] text-white flex flex-col">
      {/* TOP NAV */}
      <div className="h-12 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">
            Cursor<span className="text-green-500">_AI</span>
          </div>
          <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
            Code Builder
          </div>
          {currentWorkspace && (
            <div className="text-xs text-slate-400 font-mono truncate max-w-xs">
              📁 {currentWorkspace.split('/').pop()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout('horizontal')}
            className={`p-1.5 rounded transition-colors ${layout === 'horizontal' ? 'bg-green-500/20 text-green-400' : 'text-slate-600 hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>

          <button
            onClick={() => setLayout('vertical')}
            className={`p-1.5 rounded transition-colors ${layout === 'vertical' ? 'bg-green-500/20 text-green-400' : 'text-slate-600 hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>

          <button
            onClick={() => setLayout('preview-only')}
            className={`p-1.5 rounded transition-colors ${layout === 'preview-only' ? 'bg-green-500/20 text-green-400' : 'text-slate-600 hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-1.5 rounded transition-colors ${showTerminal ? 'bg-green-500/20 text-green-400' : 'text-slate-600 hover:text-slate-300'}`}
            title="Toggle Terminal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* WORKSPACE SELECTOR */}
      {!currentWorkspace && (
        <div className="flex-1 flex items-center justify-center p-8">
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            onWorkspaceSelected={handleWorkspaceSelected}
            onWorkspaceLoaded={setWorkspaceFiles}
          />
        </div>
      )}

      {/* MAIN CONTENT */}
      {currentWorkspace && (
        <div className="flex-1 flex overflow-hidden">
          {/* FILE TREE */}
          <FileTree
            files={files}
            activeFile={activeFile}
            workspaceFiles={workspaceFiles}
            onSelectFile={setActiveFile}
            onDeleteFile={deleteFile}
            onUpload={() => {/* TODO: implement file upload */}}
            onCreateFile={handleCreateFile}
            onCreateDirectory={handleCreateDirectory}
            onRefresh={refreshWorkspace}
          />

          {/* EDITOR & PREVIEW */}
          <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} overflow-hidden`}>
            {/* CODE EDITOR */}
            {layout !== 'preview-only' && (
              <div className={`bg-[#0a0a0a] border-r border-white/5 ${layout === 'horizontal' ? 'w-1/2' : 'h-1/2'} flex flex-col`}>
                <CodeEditor
                  content={files[activeFile] || ''}
                  onChange={(content) => setFiles({ ...files, [activeFile]: content })}
                  language={getLanguageFromFilename(activeFile)}
                />
              </div>
            )}

            {/* PREVIEW */}
            <div className={`bg-[#0a0a0a] ${layout === 'horizontal' ? 'w-1/2' : layout === 'vertical' ? 'h-1/2' : 'flex-1'} flex flex-col`}>
              <Preview
                files={files}
                activeFile={activeFile}
              />
            </div>
          </div>

          {/* CHAT INTERFACE */}
          <ChatInterface />
        </div>
      )}

      {/* BOTTOM PANEL */}
      {currentWorkspace && (
        <div className="flex">
          <Terminal
            isVisible={showTerminal}
            onToggle={() => setShowTerminal(!showTerminal)}
            workspacePath={currentWorkspace}
          />
          <ActionLogger
            logs={actionLogs}
            onClear={clearActionLogs}
          />
        </div>
      )}

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

// Helper function to get language from filename
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql'
  };
  return languageMap[ext] || 'text';
}

export default App;
