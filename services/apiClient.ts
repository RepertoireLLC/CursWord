/**
 * API Client for communicating with the backend file system server
 * Provides methods for all file operations and AI context management
 */

const API_BASE_URL = 'http://localhost:3002';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  extension?: string;
}

export interface FileContent {
  content: string;
  path: string;
}

export interface WorkspaceContext {
  workspace: string;
  files: Record<string, {
    content: string;
    size: number;
    extension: string;
  }>;
  totalFiles: number;
}

class APIClient {
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Workspace Management
  async setWorkspace(path: string): Promise<{ success: boolean; workspace: string }> {
    return this.request('/api/workspace/set', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async getCurrentWorkspace(): Promise<{ workspace: string | null }> {
    return this.request('/api/workspace/current');
  }

  // File System Operations
  async getFiles(path: string = '.'): Promise<FileInfo[]> {
    const response = await this.request(`/api/files?path=${encodeURIComponent(path)}`);
    return response;
  }

  async readFile(filePath: string): Promise<FileContent> {
    return this.request(`/api/files/${encodeURIComponent(filePath)}`);
  }

  async writeFile(filePath: string, content: string): Promise<any> {
    return this.request(`/api/files/${encodeURIComponent(filePath)}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async createFile(filePath: string, content: string = ''): Promise<any> {
    return this.request(`/api/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteFile(filePath: string): Promise<any> {
    return this.request(`/api/files/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
  }

  async createDirectory(dirPath: string): Promise<any> {
    return this.request(`/api/directories/${encodeURIComponent(dirPath)}`, {
      method: 'POST',
    });
  }

  // AI Context and Operations
  async getWorkspaceContext(): Promise<WorkspaceContext> {
    return this.request('/api/context/files');
  }

  async executeAIOperation(operation: string, filePath: string, content?: string, description?: string): Promise<any> {
    return this.request('/api/ai/execute', {
      method: 'POST',
      body: JSON.stringify({
        operation,
        filePath,
        content,
        description,
      }),
    });
  }

  // Utility method to check if backend is running
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.request('/api/health');
      return response.status === 'healthy';
    } catch {
      return false;
    }
  }

  // Batch operations for AI code generation
  async createMultipleFiles(files: Array<{ path: string; content: string }>): Promise<any[]> {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.executeAIOperation(
          'create',
          file.path,
          file.content,
          `Creating file: ${file.path}`
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to create ${file.path}:`, error);
        results.push({ error: error.message, path: file.path });
      }
    }

    return results;
  }

  // Get complete context for AI operations
  async getCompleteContext(): Promise<string> {
    try {
      const context = await this.getWorkspaceContext();

      let fullContext = `=== WORKSPACE CONTEXT ===\n`;
      fullContext += `Workspace: ${context.workspace}\n`;
      fullContext += `Total Files: ${context.totalFiles}\n\n`;

      // Add all file contents
      for (const [filePath, fileInfo] of Object.entries(context.files)) {
        fullContext += `=== FILE: ${filePath} ===\n`;
        fullContext += `Size: ${fileInfo.size} chars, Type: ${fileInfo.extension}\n`;
        fullContext += `Content:\n${fileInfo.content}\n\n`;
      }

      return fullContext;
    } catch (error) {
      console.error('Failed to get complete context:', error);
      return 'Error: Could not retrieve workspace context';
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

