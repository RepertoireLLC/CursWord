import React, { useState, useEffect, useRef } from 'react';

interface TerminalProps {
  isVisible: boolean;
  onToggle: () => void;
  workspacePath: string | null;
}

interface TerminalSession {
  id: string;
  output: string[];
  isRunning: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ isVisible, onToggle, workspacePath }) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [sessions]);

  // Focus input when terminal becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const createSession = async () => {
    if (!workspacePath) {
      alert('Please select a workspace first');
      return;
    }

    setIsCreatingSession(true);
    try {
      // In a real implementation, this would call the backend API
      const sessionId = `session_${Date.now()}`;
      const newSession: TerminalSession = {
        id: sessionId,
        output: [`Terminal session started in: ${workspacePath}`, '$ '],
        isRunning: false,
      };

      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(sessionId);
    } catch (error) {
      console.error('Failed to create terminal session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!activeSessionId || !cmd.trim()) return;

    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;

    // Update session with command
    const updatedSession = {
      ...session,
      output: [...session.output, `$ ${cmd}`, 'Executing...'],
      isRunning: true,
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));

    try {
      // Simulate command execution (in real implementation, call backend API)
      let output = '';

      // Basic command simulation
      if (cmd.startsWith('ls')) {
        output = 'file1.js\nfile2.py\ndirectory1/\npackage.json\n';
      } else if (cmd.startsWith('pwd')) {
        output = workspacePath || '/unknown';
      } else if (cmd.startsWith('echo ')) {
        output = cmd.substring(5) + '\n';
      } else if (cmd === 'clear') {
        updatedSession.output = ['$ '];
        setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
        setCommand('');
        return;
      } else if (cmd.startsWith('cd ')) {
        output = `Changed directory to: ${cmd.substring(3)}\n`;
      } else if (cmd.startsWith('mkdir ')) {
        output = `Created directory: ${cmd.substring(6)}\n`;
      } else if (cmd.startsWith('touch ')) {
        output = `Created file: ${cmd.substring(6)}\n`;
      } else {
        output = `Command executed: ${cmd}\n`;
      }

      // Simulate async execution
      setTimeout(() => {
        const finalSession = {
          ...updatedSession,
          output: [...updatedSession.output.slice(0, -1), output, '$ '],
          isRunning: false,
        };

        setSessions(prev => prev.map(s => s.id === activeSessionId ? finalSession : s));
      }, Math.random() * 1000 + 500); // Random delay 500-1500ms

    } catch (error) {
      const errorSession = {
        ...updatedSession,
        output: [...updatedSession.output.slice(0, -1), `Error: ${error}`, '$ '],
        isRunning: false,
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? errorSession : s));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand(command);
      setCommand('');
    }
  };

  const closeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  if (!isVisible) {
    return (
      <div className="h-12 bg-[#0a0a0a] border-t border-white/5 flex items-center px-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Terminal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-80 bg-[#0a0a0a] border-t border-white/5 flex flex-col">
      {/* Terminal Header */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-[#0c0c0c]">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-white">Terminal</span>

          {activeSession && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Session: {activeSession.id.slice(-8)}</span>
              {activeSession.isRunning && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-yellow-400">Running</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <select
              value={activeSessionId || ''}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="bg-[#1a1a1a] text-xs text-slate-300 px-2 py-1 rounded border border-white/10"
            >
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  Session {session.id.slice(-8)}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={createSession}
            disabled={isCreatingSession}
            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs rounded transition-colors disabled:opacity-50"
          >
            {isCreatingSession ? 'Creating...' : 'New Session'}
          </button>

          {activeSessionId && (
            <button
              onClick={() => closeSession(activeSessionId)}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-colors"
            >
              Close
            </button>
          )}

          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black custom-scrollbar"
      >
        {activeSession ? (
          <div className="space-y-1">
            {activeSession.output.map((line, index) => (
              <div key={index} className="text-green-400">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 mt-8">
            <div className="text-lg mb-2">🖥️</div>
            <div>No active terminal session</div>
            <div className="text-xs mt-1">Click "New Session" to start</div>
          </div>
        )}
      </div>

      {/* Terminal Input */}
      {activeSession && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={activeSession.isRunning}
              placeholder="Enter command..."
              className="flex-1 bg-transparent text-green-400 font-mono text-sm focus:outline-none placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={!command.trim() || activeSession.isRunning}
              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs rounded transition-colors disabled:opacity-50"
            >
              Run
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
