import React, { useState, useEffect } from 'react';

interface WorkspaceSelectorProps {
  currentWorkspace: string | null;
  onWorkspaceSelected: (path: string) => void;
  onWorkspaceLoaded: (files: any[]) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  onWorkspaceSelected,
  onWorkspaceLoaded,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [manualPath, setManualPath] = useState('');
  const [pathSuggestions, setPathSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Generate common Ubuntu/Linux path suggestions
    const user = process.env?.USER || 'user';
    setPathSuggestions([
      `/home/${user}`,
      `/home/${user}/projects`,
      `/home/${user}/Desktop`,
      `/home/${user}/Documents`,
      `/home/${user}/workspace`,
      `/tmp/test-project`,
      `/var/www`,
      `/opt`
    ]);
  }, []);

  const loadWorkspace = async (workspacePath: string) => {
    if (!workspacePath.trim()) {
      alert('Please enter a valid path');
      return;
    }

    try {
      setIsLoading(true);

      // Basic path validation for Linux
      if (!workspacePath.startsWith('/')) {
        throw new Error('Path must be absolute (start with /)');
      }

      // Remove trailing slash
      const cleanPath = workspacePath.replace(/\/$/, '');

      console.log('Loading workspace:', cleanPath);

      // In a real implementation, this would call the backend API
      // For demo, we'll simulate setting a workspace
      onWorkspaceSelected(cleanPath);

      // Load initial files (this would come from the backend)
      const mockFiles = [
        { name: 'src', type: 'directory', path: 'src', children: [
          { name: 'components', type: 'directory', path: 'src/components' },
          { name: 'App.js', type: 'file', path: 'src/App.js' },
          { name: 'index.js', type: 'file', path: 'src/index.js' }
        ]},
        { name: 'public', type: 'directory', path: 'public' },
        { name: 'package.json', type: 'file', path: 'package.json' },
        { name: 'README.md', type: 'file', path: 'README.md' },
        { name: 'node_modules', type: 'directory', path: 'node_modules' },
        { name: '.git', type: 'directory', path: '.git' }
      ];
      onWorkspaceLoaded(mockFiles);

    } catch (error) {
      console.error('Failed to load workspace:', error);
      alert(`Failed to load workspace: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWorkspace(manualPath);
  };

  const selectSuggestion = (path: string) => {
    setManualPath(path);
  };

  const detectUserHome = () => {
    // Try to get the current user from environment or use a fallback
    const user = process.env?.USER || 'user';
    const homePath = `/home/${user}`;
    setManualPath(homePath);
  };

  return (
    <div className="p-6 bg-[#0a0a0a] border border-white/10 rounded-lg max-w-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Select Workspace</h3>
        <p className="text-sm text-slate-400">
          Choose a project directory for AI-assisted development
        </p>
      </div>

      {currentWorkspace ? (
        <div className="space-y-3">
          <div className="text-sm text-slate-400">Current Workspace:</div>
          <div className="text-sm text-white font-mono bg-[#1a1a1a] p-3 rounded border">
            {currentWorkspace}
          </div>
          <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded">
            ✅ Workspace loaded successfully
          </div>
          <button
            onClick={() => {
              onWorkspaceSelected(null as any);
              setManualPath('');
            }}
            className="w-full px-3 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 rounded transition-colors text-sm"
          >
            Change Workspace
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manual Path Input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Enter workspace path:
              </label>
              <input
                type="text"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                placeholder="/home/user/projects/my-app"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 font-mono text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !manualPath.trim()}
                className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Loading...' : 'Load Workspace'}
              </button>
              <button
                type="button"
                onClick={detectUserHome}
                className="px-3 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 rounded transition-colors text-sm"
                title="Use home directory"
              >
                🏠
              </button>
            </div>
          </form>

          {/* Path Suggestions */}
          <div className="space-y-2">
            <div className="text-sm text-slate-400">Quick paths:</div>
            <div className="grid grid-cols-1 gap-1">
              {pathSuggestions.slice(0, 6).map((path, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(path)}
                  className="text-left px-2 py-1 bg-[#1a1a1a] hover:bg-white/5 rounded text-xs text-slate-300 hover:text-white transition-colors font-mono truncate"
                  title={path}
                >
                  {path}
                </button>
              ))}
            </div>
          </div>

          {/* Ubuntu-specific info */}
          <div className="text-xs text-slate-500 bg-slate-500/10 p-3 rounded">
            <div className="font-medium text-slate-400 mb-1">Ubuntu/Linux Tips:</div>
            <div>• Use absolute paths starting with /</div>
            <div>• Common locations: /home/user/projects</div>
            <div>• Check permissions with: ls -la /path/to/dir</div>
          </div>
        </div>
      )}
    </div>
  );
};
