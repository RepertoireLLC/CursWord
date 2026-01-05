
import React, { useState, useEffect } from 'react';

interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  extension?: string;
  children?: FileSystemEntry[];
}

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string;
  workspaceFiles?: FileSystemEntry[];
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onUpload: () => void;
  onCreateFile?: (path: string) => void;
  onCreateDirectory?: (path: string) => void;
  onRefresh?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFile,
  workspaceFiles = [],
  onSelectFile,
  onDeleteFile,
  onUpload,
  onCreateFile,
  onCreateDirectory,
  onRefresh
}) => {
  const getFileCategory = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['html', 'htm'].includes(ext)) return 'Web';
    if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'Styles';
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'Scripts';
    if (['py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs'].includes(ext)) return 'Code';
    if (['json', 'xml', 'yaml', 'yml', 'sql'].includes(ext)) return 'Data';
    if (['md', 'txt'].includes(ext)) return 'Docs';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'Assets';
    return 'Other';
  };

  const getFileIcon = (filename: string) => {
    const category = getFileCategory(filename);
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    switch (category) {
      case 'Web':
        return 'text-orange-500/60';
      case 'Styles':
        return 'text-pink-500/60';
      case 'Scripts':
        return ext.startsWith('ts') ? 'text-blue-500/60' : 'text-yellow-500/60';
      case 'Code':
        return 'text-green-500/60';
      case 'Data':
        return 'text-purple-500/60';
      case 'Assets':
        return 'text-cyan-500/60';
      default:
        return 'text-slate-500/60';
    }
  };

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; type: 'file' | 'directory' } | null>(null);

  // Use workspace files if available, otherwise fall back to the old files structure
  const fileTree = workspaceFiles.length > 0 ? workspaceFiles : Object.keys(files).map(path => ({
    name: path,
    path,
    type: 'file' as const,
    extension: path.split('.').pop()
  }));

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, type: 'file' | 'directory') => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      type
    });
  };

  const handleCreateFile = () => {
    if (contextMenu && onCreateFile) {
      const fileName = prompt('Enter file name:');
      if (fileName) {
        const fullPath = contextMenu.type === 'directory'
          ? `${contextMenu.path}/${fileName}`
          : `${contextMenu.path.split('/').slice(0, -1).join('/')}/${fileName}`;
        onCreateFile(fullPath);
      }
    }
    setContextMenu(null);
  };

  const handleCreateDirectory = () => {
    if (contextMenu && onCreateDirectory) {
      const dirName = prompt('Enter directory name:');
      if (dirName) {
        const fullPath = contextMenu.type === 'directory'
          ? `${contextMenu.path}/${dirName}`
          : `${contextMenu.path.split('/').slice(0, -1).join('/')}/${dirName}`;
        onCreateDirectory(fullPath);
      }
    }
    setContextMenu(null);
  };

  const renderFileTree = (entries: typeof fileTree, level = 0): JSX.Element[] => {
    return entries.map(entry => (
      <div key={entry.path}>
        <div
          className={`group flex items-center justify-between px-2 py-1 cursor-pointer transition-colors relative ${
            selectedPath === entry.path ? 'bg-blue-500/20' :
            activeFile === entry.path ? 'bg-green-500/10' : 'hover:bg-white/[0.02]'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            setSelectedPath(entry.path);
            if (entry.type === 'directory') {
              toggleDirectory(entry.path);
            } else {
              onSelectFile(entry.path);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, entry.path, entry.type)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {entry.type === 'directory' ? (
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${expandedDirs.has(entry.path) ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            )}
            <span className={`text-sm truncate ${
              selectedPath === entry.path ? 'text-blue-400' :
              activeFile === entry.path ? 'text-green-400' : 'text-slate-400 group-hover:text-white'
            }`}>
              {entry.name}
            </span>
            {entry.extension && (
              <span className="text-xs text-slate-600 font-mono">
                .{entry.extension}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(entry.path);
              }}
              className="p-1 hover:text-red-500/80 transition-colors text-slate-600"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} />
              </svg>
            </button>
          </div>
        </div>

        {entry.type === 'directory' && expandedDirs.has(entry.path) && entry.children && (
          <div>
            {renderFileTree(entry.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <div className="w-60 h-full bg-[#080808] border-r border-white/5 flex flex-col shrink-0 select-none">
        <div className="px-4 h-9 flex items-center justify-between border-b border-white/5 bg-[#0c0c0c]">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Explorer</span>
          <div className="flex gap-1">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 hover:bg-white/5 rounded transition-colors text-slate-600 hover:text-slate-300"
                title="Refresh"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={onUpload}
              className="p-1 hover:bg-white/5 rounded transition-colors text-slate-600 hover:text-slate-300"
              title="Import Project"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {fileTree.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[8px] text-slate-700 font-black uppercase">No Files</p>
              <p className="text-[7px] text-slate-600 mt-1">Select a workspace to get started</p>
            </div>
          ) : (
            renderFileTree(fileTree)
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-[#0a0a0a] border border-white/20 rounded-lg shadow-xl py-2 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleCreateFile}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              📄 New File
            </button>
            <button
              onClick={handleCreateDirectory}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              📁 New Folder
            </button>
            <hr className="border-white/10 my-1" />
            <button
              onClick={() => setContextMenu(null)}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
};
