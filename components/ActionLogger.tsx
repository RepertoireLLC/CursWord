import React, { useState, useEffect, useRef } from 'react';

interface ActionLog {
  id: string;
  timestamp: Date;
  operation: string;
  filePath: string;
  description: string;
  status: 'pending' | 'success' | 'error';
  details?: string;
}

interface ActionLoggerProps {
  logs: ActionLog[];
  onClear: () => void;
}

export const ActionLogger: React.FC<ActionLoggerProps> = ({ logs, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const getStatusIcon = (status: ActionLog['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return 'ℹ️';
    }
  };

  const getStatusColor = (status: ActionLog['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  if (!isExpanded) {
    return (
      <div className="h-12 bg-[#0a0a0a] border-t border-white/5 flex items-center px-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium">AI Actions</span>
          {logs.length > 0 && (
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">
              {logs.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="h-80 bg-[#0a0a0a] border-t border-white/5 flex flex-col">
      {/* Logger Header */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-[#0c0c0c]">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium text-white">AI Action Logger</span>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="bg-[#1a1a1a] text-xs text-slate-300 px-2 py-1 rounded border border-white/10"
            >
              <option value="all">All ({logs.length})</option>
              <option value="success">Success ({logs.filter(l => l.status === 'success').length})</option>
              <option value="error">Errors ({logs.filter(l => l.status === 'error').length})</option>
              <option value="pending">Pending ({logs.filter(l => l.status === 'pending').length})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-colors"
          >
            Clear
          </button>

          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-slate-500 mt-8">
            <div className="text-lg mb-2">📋</div>
            <div>No action logs</div>
            <div className="text-xs mt-1">
              {logs.length === 0
                ? "AI actions will appear here"
                : `No ${filter} actions found`
              }
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`border-l-4 p-3 rounded-r-lg bg-[#1a1a1a] ${
                  log.status === 'success' ? 'border-green-500' :
                  log.status === 'error' ? 'border-red-500' :
                  log.status === 'pending' ? 'border-yellow-500' : 'border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(log.status)}</span>
                    <span className="font-medium text-white">{log.operation}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-sm text-slate-300 mb-1">
                  {log.description}
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  📁 {log.filePath}
                </div>

                {log.details && (
                  <div className="mt-2 p-2 bg-black/30 rounded text-xs text-slate-400 font-mono whitespace-pre-wrap">
                    {log.details}
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
