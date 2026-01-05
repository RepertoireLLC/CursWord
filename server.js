import express from 'express';
import cors from 'cors';
import { fileSystemService } from './services/fileSystemService.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// Workspace Management
app.post('/api/workspace/set', async (req, res) => {
  try {
    const { path } = req.body;
    const success = await fileSystemService.setWorkspace(path);
    res.json({ success, workspace: fileSystemService.getCurrentWorkspace() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/workspace/current', (req, res) => {
  res.json({ workspace: fileSystemService.getCurrentWorkspace() });
});

app.get('/api/workspace/stats', async (req, res) => {
  try {
    const stats = await fileSystemService.getWorkspaceStats();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Workspace Management
app.post('/api/workspace/set', async (req, res) => {
  try {
    const { path } = req.body;
    const success = await fileSystemService.setWorkspace(path);
    res.json({ success, workspace: fileSystemService.getCurrentWorkspace() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/workspace/current', (req, res) => {
  res.json({ workspace: fileSystemService.getCurrentWorkspace() });
});

// File System Operations
app.get('/api/files', async (req, res) => {
  try {
    const { path = '.' } = req.query;
    const files = await fileSystemService.readDirectory(path);
    res.json(files);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/files/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const content = await fileSystemService.readFile(filePath);
    res.json({ content, path: filePath });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/files/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const { content } = req.body;

    // Ensure AI can access this file for future operations
    await fileSystemService.writeFile(filePath, content);

    // Return file info for context
    const stats = await fs.promises.stat(fileSystemService.resolveWorkspacePath(filePath));
    res.json({
      success: true,
      path: filePath,
      size: stats.size,
      modified: stats.mtime
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/files/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const { content = '' } = req.body;

    await fileSystemService.createFile(filePath, content);

    // Return file info for context
    const stats = await fs.promises.stat(fileSystemService.resolveWorkspacePath(filePath));
    res.json({
      success: true,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/files/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    await fileSystemService.deleteFile(filePath);
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/directories/*', async (req, res) => {
  try {
    const dirPath = req.params[0];
    await fileSystemService.createDirectory(dirPath);
    res.json({ success: true, path: dirPath });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI Context Operations
app.get('/api/context/files', async (req, res) => {
  try {
    const workspace = fileSystemService.getCurrentWorkspace();
    if (!workspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const allFiles = await getAllFilesRecursively(workspace);
    const fileContents = {};

    // Read content of all relevant files
    for (const filePath of allFiles) {
      try {
        const relativePath = path.relative(workspace, filePath);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        fileContents[relativePath] = {
          content,
          size: content.length,
          extension: path.extname(filePath)
        };
      } catch (error) {
        console.warn(`Could not read file ${filePath}:`, error.message);
      }
    }

    res.json({
      workspace,
      files: fileContents,
      totalFiles: Object.keys(fileContents).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/execute', async (req, res) => {
  try {
    const { operation, filePath, content, description } = req.body;

    // Log the AI operation
    console.log(`[${new Date().toISOString()}] AI ${operation}: ${description}`);
    console.log(`[${new Date().toISOString()}] Target: ${filePath}`);

    let result = {};

    switch (operation) {
      case 'create':
        result = await fileSystemService.createFile(filePath, content || '');
        break;
      case 'write':
        result = await fileSystemService.writeFile(filePath, content || '');
        break;
      case 'read':
        const readContent = await fileSystemService.readFile(filePath);
        result = { content: readContent };
        break;
      case 'delete':
        result = await fileSystemService.deleteFile(filePath);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    res.json({
      success: true,
      operation,
      filePath,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`AI operation failed:`, error);
    res.status(400).json({ error: error.message });
  }
});

// Helper function to get all files recursively
async function getAllFilesRecursively(dirPath) {
  const files = [];

  async function walk(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common directories that shouldn't be analyzed
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
          await walk(fullPath);
        }
      } else {
        // Only include relevant file types
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.scss', '.json', '.md'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(dirPath);
  return files;
}

// Terminal Operations
app.post('/api/terminal', async (req, res) => {
  try {
    const { cwd } = req.body;
    const sessionId = await fileSystemService.createTerminalSession(cwd);
    res.json({ sessionId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/terminal/:sessionId/execute', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;
    await fileSystemService.executeCommand(sessionId, command);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/terminal/:sessionId/output', (req, res) => {
  try {
    const { sessionId } = req.params;
    const output = fileSystemService.getTerminalOutput(sessionId);
    res.json({ output });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/terminal/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await fileSystemService.closeTerminalSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI Action Logging
app.post('/api/ai/log', (req, res) => {
  const { operation, filePath, description, result } = req.body;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] AI ${operation}: ${description}`);
  console.log(`[${timestamp}] Target: ${filePath}`);
  if (result) {
    console.log(`[${timestamp}] Result:`, result);
  }

  res.json({ logged: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    workspace: fileSystemService.getCurrentWorkspace(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 File System Server running on port ${PORT}`);
  console.log(`📁 Workspace: ${fileSystemService.getCurrentWorkspace() || 'Not set'}`);
});
