/**
 * File System Service for Cursor-like Workspace Management
 * Provides file browsing, reading, writing, and terminal capabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn, ChildProcess } from 'child_process';

export interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  extension?: string;
  children?: FileSystemEntry[];
}

export interface TerminalSession {
  id: string;
  cwd: string;
  process?: ChildProcess;
  output: string[];
  isRunning: boolean;
}

class FileSystemService {
  private terminalSessions: Map<string, TerminalSession> = new Map();
  private currentWorkspace: string | null = null;

  // Workspace Management
  async setWorkspace(workspacePath: string): Promise<boolean> {
    try {
      // Validate the path exists and is a directory
      const stats = await fs.promises.stat(workspacePath);
      if (!stats.isDirectory()) {
        throw new Error('Selected path is not a directory');
      }

      this.currentWorkspace = workspacePath;
      console.log('Workspace set to:', workspacePath);
      return true;
    } catch (error) {
      console.error('Failed to set workspace:', error);
      return false;
    }
  }

  getCurrentWorkspace(): string | null {
    return this.currentWorkspace;
  }

  // File System Operations
  async readDirectory(dirPath: string): Promise<FileSystemEntry[]> {
    try {
      const fullPath = this.resolveWorkspacePath(dirPath);
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

      const fileEntries: FileSystemEntry[] = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path.join(fullPath, entry.name);
          const stats = await fs.promises.stat(entryPath);

          const fileEntry: FileSystemEntry = {
            name: entry.name,
            path: path.relative(this.currentWorkspace || '', entryPath),
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime,
          };

          if (!entry.isDirectory()) {
            fileEntry.extension = path.extname(entry.name);
          }

          return fileEntry;
        })
      );

      return fileEntries.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Failed to read directory:', error);
      throw error;
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const fullPath = this.resolveWorkspacePath(filePath);
      return await fs.promises.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = this.resolveWorkspacePath(filePath);
      await fs.promises.writeFile(fullPath, content, 'utf-8');
      console.log('File written:', fullPath);
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error;
    }
  }

  async createFile(filePath: string, content: string = ''): Promise<void> {
    try {
      const fullPath = this.resolveWorkspacePath(filePath);
      await fs.promises.writeFile(fullPath, content, 'utf-8');
      console.log('File created:', fullPath);
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      const fullPath = this.resolveWorkspacePath(dirPath);
      await fs.promises.mkdir(fullPath, { recursive: true });
      console.log('Directory created:', fullPath);
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = this.resolveWorkspacePath(filePath);
      const stats = await fs.promises.stat(fullPath);

      if (stats.isDirectory()) {
        await fs.promises.rmdir(fullPath, { recursive: true });
        console.log('Directory deleted:', fullPath);
      } else {
        await fs.promises.unlink(fullPath);
        console.log('File deleted:', fullPath);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      throw error;
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      const fullOldPath = this.resolveWorkspacePath(oldPath);
      const fullNewPath = this.resolveWorkspacePath(newPath);
      await fs.promises.rename(fullOldPath, fullNewPath);
      console.log('Renamed:', fullOldPath, '->', fullNewPath);
    } catch (error) {
      console.error('Failed to rename:', error);
      throw error;
    }
  }

  // Terminal Operations
  async createTerminalSession(cwd?: string): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionCwd = cwd || this.currentWorkspace || process.cwd();

    const session: TerminalSession = {
      id: sessionId,
      cwd: sessionCwd,
      output: [],
      isRunning: false,
    };

    this.terminalSessions.set(sessionId, session);
    console.log('Terminal session created:', sessionId);
    return sessionId;
  }

  async executeCommand(sessionId: string, command: string): Promise<void> {
    const session = this.terminalSessions.get(sessionId);
    if (!session) {
      throw new Error('Terminal session not found');
    }

    return new Promise((resolve, reject) => {
      session.isRunning = true;
      session.output.push(`$ ${command}`);

      const child = spawn(command, [], {
        shell: true,
        cwd: session.cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      session.process = child;

      child.stdout.on('data', (data) => {
        const output = data.toString();
        session.output.push(output);
        console.log('Terminal output:', output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        session.output.push(`Error: ${output}`);
        console.error('Terminal error:', output);
      });

      child.on('close', (code) => {
        session.isRunning = false;
        session.output.push(`Exit code: ${code}`);
        console.log('Command completed with code:', code);
        resolve();
      });

      child.on('error', (error) => {
        session.isRunning = false;
        session.output.push(`Command error: ${error.message}`);
        console.error('Command execution error:', error);
        reject(error);
      });
    });
  }

  getTerminalOutput(sessionId: string): string[] {
    const session = this.terminalSessions.get(sessionId);
    return session ? session.output : [];
  }

  async closeTerminalSession(sessionId: string): Promise<void> {
    const session = this.terminalSessions.get(sessionId);
    if (session && session.process) {
      session.process.kill();
    }
    this.terminalSessions.delete(sessionId);
    console.log('Terminal session closed:', sessionId);
  }

  // Utility Methods
  private resolveWorkspacePath(filePath: string): string {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected');
    }

    // Ensure the path is within the workspace for security
    const fullPath = path.resolve(this.currentWorkspace, filePath);
    const relativePath = path.relative(this.currentWorkspace, fullPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Access denied: Path outside workspace');
    }

    return fullPath;
  }

  // AI Debugging and Action Logging
  async performAIOperation(
    operation: string,
    filePath: string,
    action: () => Promise<any>,
    description: string
  ): Promise<any> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AI ${operation}: ${description}`);
    console.log(`[${timestamp}] Target: ${filePath}`);

    try {
      const result = await action();
      console.log(`[${timestamp}] ✅ Success: ${operation} completed`);
      return result;
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error in ${operation}:`, error);
      throw error;
    }
  }

  // Get workspace statistics
  async getWorkspaceStats(): Promise<{
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected');
    }

    const stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      fileTypes: {} as Record<string, number>,
    };

    async function walkDirectory(dirPath: string) {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          stats.totalDirectories++;
          await walkDirectory(fullPath);
        } else {
          stats.totalFiles++;
          const fileStats = await fs.promises.stat(fullPath);
          stats.totalSize += fileStats.size;

          const ext = path.extname(entry.name).toLowerCase() || 'no-extension';
          stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
        }
      }
    }

    await walkDirectory(this.currentWorkspace);
    return stats;
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();

