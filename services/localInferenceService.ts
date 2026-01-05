
/**
 * MULTI-PROVIDER_INFERENCE_KERNEL v2.0
 * Support for multiple AI providers: Ollama, OpenAI, Anthropic, etc.
 */

// Legacy constants for backwards compatibility
const OLLAMA_BASE_URL = 'http://localhost:11434';
const MODEL_NAME = 'qwen2.5:0.5b';

// Import API client for backend integration
import { apiClient } from './apiClient';

// Provider configurations
export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: ModelInfo[];
  enabled: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  size?: string;
  contextLength?: number;
  pricing?: {
    input: number;
    output: number;
  };
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    models: [
      { id: 'qwen2.5:0.5b', name: 'Qwen 2.5 (Fast)', size: '0.5B', contextLength: 32768 },
      { id: 'codegemma:latest', name: 'CodeGemma', size: '7.3B', contextLength: 8192 },
      { id: 'llama3.2:3b', name: 'Llama 3.2 3B', size: '3B', contextLength: 32768 },
    ],
    enabled: true,
  },
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000, pricing: { input: 0.005, output: 0.015 } },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000, pricing: { input: 0.00015, output: 0.0006 } },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextLength: 16385, pricing: { input: 0.0005, output: 0.0015 } },
    ],
    enabled: false,
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextLength: 200000, pricing: { input: 0.003, output: 0.015 } },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextLength: 200000, pricing: { input: 0.0008, output: 0.004 } },
    ],
    enabled: false,
  },
];

// Load provider configs from localStorage
const loadProviderConfigs = (): ProviderConfig[] => {
  try {
    const saved = localStorage.getItem('ai-providers');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new providers are included
      return DEFAULT_PROVIDERS.map(defaultProvider => {
        const savedProvider = parsed.find((p: any) => p.name === defaultProvider.name);
        return savedProvider ? { ...defaultProvider, ...savedProvider } : defaultProvider;
      });
    }
  } catch (error) {
    console.error('Failed to load provider configs:', error);
  }
  return DEFAULT_PROVIDERS;
};

// Save provider configs to localStorage
export const saveProviderConfigs = (configs: ProviderConfig[]) => {
  try {
    localStorage.setItem('ai-providers', JSON.stringify(configs));
  } catch (error) {
    console.error('Failed to save provider configs:', error);
  }
};

// Get available providers
export const getAvailableProviders = (): ProviderConfig[] => {
  return loadProviderConfigs();
};

// Get current active provider
export const getActiveProvider = (): ProviderConfig | null => {
  const providers = loadProviderConfigs();
  return providers.find(p => p.enabled) || null;
};

// Set active provider
export const setActiveProvider = (providerName: string) => {
  const providers = loadProviderConfigs();
  providers.forEach(p => p.enabled = p.name === providerName);
  saveProviderConfigs(providers);
};

// Fallback response when AI is unavailable
const FALLBACK_RESPONSE = "I'm sorry, but the AI model is currently unavailable. Please check your provider settings and try refreshing the page.";

// Get current model info
const getCurrentModel = (): ModelInfo | null => {
  const provider = getActiveProvider();
  return provider?.models[0] || null;
};

// Legacy compatibility - keep AVAILABLE_MODELS for now
export const AVAILABLE_MODELS = [
  { id: 'qwen2.5:0.5b', name: "Qwen 2.5 (Fast Code Assistant)", size: "0.5B" },
];

export async function initEngine(modelId: string, onProgress: (progress: any) => void) {
  try {
    console.log('Initializing AI provider connection...');
    onProgress({ text: "Connecting to AI provider...", progress: 0.3 });

    const provider = getActiveProvider();
    if (!provider) {
      throw new Error('No AI provider selected. Please configure a provider in settings.');
    }

    console.log('Using provider:', provider.name);

    // Test connectivity based on provider type
    if (provider.name === 'Ollama') {
      const response = await fetch(`${provider.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Ollama service not available (${response.status}). Make sure Ollama is running.`);
      }

      const data = await response.json();
      const hasModels = data.models && data.models.length > 0;

      if (!hasModels) {
        throw new Error('No models available in Ollama. Run: ollama pull qwen2.5:0.5b');
      }

      console.log('Ollama connection successful, models available:', data.models.length);

    } else if (provider.name === 'OpenAI') {
      // Test API key validity
      if (!provider.apiKey) {
        throw new Error('OpenAI API key required. Please configure in settings.');
      }

      // Simple connectivity test
      const testResponse = await fetch(`${provider.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
      });

      if (!testResponse.ok) {
        throw new Error(`OpenAI API key invalid or service unavailable (${testResponse.status})`);
      }

      console.log('OpenAI API connection successful');

    } else if (provider.name === 'Anthropic') {
      // Test API key validity
      if (!provider.apiKey) {
        throw new Error('Anthropic API key required. Please configure in settings.');
      }

      // Simple connectivity test
      const testResponse = await fetch(`${provider.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': provider.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (!testResponse.ok) {
        throw new Error(`Anthropic API key invalid or service unavailable (${testResponse.status})`);
      }

      console.log('Anthropic API connection successful');
    }

    onProgress({ text: "Ready for inference", progress: 1.0 });
    console.log('AI provider initialization successful');

    return true;

  } catch (error) {
    console.error('Provider initialization failed:', error);
    throw new Error(`AI provider setup issue: ${error.message}`);
  }
}

export async function generateLocalResponse(
  prompt: string,
  systemInstruction: string,
  onStream?: (text: string) => void
): Promise<string> {
  try {
    // Use /api/generate endpoint which is more reliable
    const fullPrompt = `${systemInstruction}\n\nUser: ${prompt}\nAssistant:`;

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: fullPrompt,
        stream: true,
        options: {
          temperature: 0.1, // Low temperature for code generation precision
          top_p: 0.9,
          top_k: 40,
          num_predict: 1024, // Reduced for faster response
          num_ctx: 2048, // Reduced context window
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Unable to read response stream');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.done) break;

            const content = data.response || '';
            fullText += content;

            if (onStream) {
              onStream(fullText);
            }
          } catch (e) {
            // Skip malformed JSON lines
            console.warn('Skipping malformed JSON line:', line);
          }
        }
      }
    }

    return fullText || 'No response generated. The model may still be loading.';

  } catch (error) {
    console.error('Ollama API error:', error);

    if (error.name === 'AbortError') {
      return 'Response timeout. CodeGemma may still be loading. Please try again in a moment.';
    }

    return `Error: ${error.message}. Make sure Ollama is running and CodeGemma model is available.`;
  }
}

export function extractFiles(text: string): Record<string, string> {
  const files: Record<string, string> = {};

  // Enhanced file extraction with proper naming
  const fileRegex = /\[FILE:\s*([a-zA-Z0-9\/\._-]+)\]\s*(?:```[a-z]*\n)?([\s\S]*?)(?:\n?```|\n?\[\/FILE\]|$)/gi;

  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();

    // Ensure proper file extension if missing
    const properFilename = ensureProperExtension(filename, content);
    files[properFilename] = content;
  }

  // Fallback: extract code blocks and create appropriate files
  if (Object.keys(files).length === 0) {
    const codeBlocks = extractCodeBlocks(text);
    Object.assign(files, codeBlocks);
  }

  return files;
}

function extractCodeBlocks(text: string): Record<string, string> {
  const files: Record<string, string> = {};
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/gi;

  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1]?.toLowerCase() || 'text';
    const content = match[2].trim();

    if (content && content.length > 10) { // Skip empty or very short blocks
      const filename = generateFilename(language, blockIndex++, content);
      files[filename] = content;
    }
  }

  return files;
}

function generateFilename(language: string, index: number, content: string): string {
  // Try to extract filename from content comments
  const filenameRegex = /(?:\/\/|#|<!--|--)\s*(?:file|filename|name):\s*([^\n\r]+)/i;
  const filenameMatch = content.match(filenameRegex);

  if (filenameMatch) {
    return filenameMatch[1].trim();
  }

  // Generate filename based on language and content hints
  const extensions: Record<string, string> = {
    'javascript': 'js',
    'js': 'js',
    'jsx': 'jsx',
    'typescript': 'ts',
    'ts': 'ts',
    'tsx': 'tsx',
    'python': 'py',
    'py': 'py',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yml',
    'markdown': 'md',
    'md': 'md',
    'sql': 'sql',
    'bash': 'sh',
    'shell': 'sh',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'cs',
    'cs': 'cs',
    'php': 'php',
    'ruby': 'rb',
    'rb': 'rb',
    'go': 'go',
    'rust': 'rs',
    'rs': 'rs'
  };

  const ext = extensions[language] || 'txt';

  // Generate meaningful names based on content
  if (language === 'html' && index === 0) return 'index.html';
  if (language === 'css' && index === 0) return 'styles.css';
  if (language === 'javascript' || language === 'js') {
    if (content.includes('React') || content.includes('import React')) return `component${index + 1}.jsx`;
    if (content.includes('function') || content.includes('const') || content.includes('let')) return `script${index + 1}.js`;
  }

  return `${language}${index + 1}.${ext}`;
}

function ensureProperExtension(filename: string, content: string): string {
  // If filename already has extension, validate it
  if (filename.includes('.')) {
    const ext = filename.split('.').pop()?.toLowerCase();

    // Check if extension matches content type
    if (isValidExtensionForContent(ext, content)) {
      return filename;
    }

    // Remove invalid extension and add proper one
    const baseName = filename.replace(/\.[^.]+$/, '');
    const properExt = detectContentType(content);
    return `${baseName}.${properExt}`;
  }

  // Add extension if missing
  const properExt = detectContentType(content);
  return `${filename}.${properExt}`;
}

function isValidExtensionForContent(extension: string | undefined, content: string): boolean {
  if (!extension) return false;

  const contentType = detectContentType(content);

  // Allow some flexibility
  const compatibleExtensions: Record<string, string[]> = {
    'js': ['js', 'jsx', 'ts', 'tsx'],
    'jsx': ['js', 'jsx', 'ts', 'tsx'],
    'ts': ['js', 'jsx', 'ts', 'tsx'],
    'tsx': ['js', 'jsx', 'ts', 'tsx'],
    'py': ['py'],
    'html': ['html', 'htm'],
    'css': ['css', 'scss', 'sass', 'less'],
    'json': ['json'],
    'md': ['md', 'markdown']
  };

  return compatibleExtensions[contentType]?.includes(extension) || false;
}

function detectContentType(content: string): string {
  // HTML detection
  if (content.includes('<html') || content.includes('<body') || content.includes('<div')) {
    return 'html';
  }

  // CSS detection
  if (content.includes('{') && content.includes('}') && (content.includes('#') || content.includes('.') || content.includes('@'))) {
    return 'css';
  }

  // JavaScript/React detection
  if (content.includes('function') || content.includes('const') || content.includes('let') ||
      content.includes('import') || content.includes('export') || content.includes('React')) {
    if (content.includes('React') || content.includes('<') && content.includes('/>')) {
      return 'jsx';
    }
    return 'js';
  }

  // Python detection
  if (content.includes('def ') || content.includes('import ') || content.includes('from ') ||
      content.includes('class ') || content.includes('print(')) {
    return 'py';
  }

  // JSON detection
  try {
    JSON.parse(content);
    return 'json';
  } catch {}

  // Markdown detection
  if (content.includes('# ') || content.includes('## ') || content.includes('```') ||
      content.includes('[') && content.includes('](')) {
    return 'md';
  }

  // SQL detection
  if (content.toUpperCase().includes('SELECT') || content.toUpperCase().includes('INSERT') ||
      content.toUpperCase().includes('UPDATE') || content.toUpperCase().includes('CREATE')) {
    return 'sql';
  }

  return 'txt'; // Default to text
}

// Enhanced context interfaces
interface SymbolInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'constant' | 'variable';
  file: string;
  line?: number;
  signature?: string;
  exports?: boolean;
}

interface FrameworkInfo {
  type: 'vanilla' | 'react' | 'vue' | 'nextjs' | 'nuxt' | 'svelte' | 'angular' | 'express' | 'fastify';
  version?: string;
  features: string[];
}

interface RichCodeContext {
  symbols: SymbolInfo[];
  imports: string[];
  exports: string[];
  dependencies: Record<string, string>;
  framework: FrameworkInfo;
  configFiles: Record<string, any>;
}

/**
 * ENHANCED CURSOR-STYLE PROJECT DISTILLER
 * Provides comprehensive context awareness like Cursor IDE
 */
export async function distillProject(files: Record<string, string>, activeFile: string, useBackend: boolean = false): Promise<string> {
  let fileList: string[];
  let activeContent: string;
  let richContext: any;

  if (useBackend) {
    try {
      // Get real workspace context from backend
      const context = await apiClient.getWorkspaceContext();
      fileList = Object.keys(context.files);

      // Find active file content
      const activeFileData = context.files[activeFile];
      activeContent = activeFileData ? activeFileData.content : '';

      // Convert backend context to rich context format
      richContext = {
        symbols: [], // TODO: Extract from backend files
        imports: [],
        exports: [],
        dependencies: {},
        framework: detectFramework(context.files),
        configFiles: {}
      };

      // Extract symbols from backend files
      Object.entries(context.files).forEach(([filePath, fileData]: [string, any]) => {
        if (fileData.extension === '.js' || fileData.extension === '.ts' ||
            fileData.extension === '.jsx' || fileData.extension === '.tsx') {
          richContext.symbols.push(...extractJSSymbols(fileData.content, filePath));
          richContext.imports.push(...extractJSImports(fileData.content));
          richContext.exports.push(...extractJSExports(fileData.content));
        }
      });

      // Remove duplicates
      richContext.imports = [...new Set(richContext.imports)];
      richContext.exports = [...new Set(richContext.exports)];

    } catch (error) {
      console.warn('Backend context unavailable, falling back to local files:', error);
      // Fallback to local file processing
      fileList = Object.keys(files);
      activeContent = files[activeFile] || '';
      richContext = extractRichContext(files, activeFile);
    }
  } else {
    // Use local files (original behavior)
    fileList = Object.keys(files);
    activeContent = files[activeFile] || '';
    richContext = extractRichContext(files, activeFile);
  }

  // Build comprehensive context string
  let context = `=== CURSOR-STYLE CODE CONTEXT ===

FRAMEWORK: ${richContext.framework.type.toUpperCase()}${richContext.framework.version ? ` (${richContext.framework.version})` : ''}
PROJECT SIZE: ${fileList.length} files
ACTIVE FILE: ${activeFile}

=== SYMBOLS IN CODEBASE ===
${richContext.symbols.map(s => `${s.type.toUpperCase()}: ${s.name} (${s.file}${s.line ? `:${s.line}` : ''})`).join('\n')}

=== IMPORTS/EXPORTS ===
IMPORTS: ${richContext.imports.slice(0, 10).join(', ')}${richContext.imports.length > 10 ? '...' : ''}
EXPORTS: ${richContext.exports.slice(0, 10).join(', ')}${richContext.exports.length > 10 ? '...' : ''}

=== DEPENDENCIES ===
${Object.entries(richContext.dependencies).slice(0, 15).map(([pkg, ver]) => `${pkg}@${ver}`).join(', ')}${Object.keys(richContext.dependencies).length > 15 ? '...' : ''}

=== ACTIVE FILE CONTENT ===
${activeContent}

=== FRAMEWORK FEATURES ===
${richContext.framework.features.join(', ')}

=== CONFIGURATION ===
${Object.entries(richContext.configFiles).map(([file, config]) =>
  `${file}: ${typeof config === 'object' ? JSON.stringify(config).substring(0, 200) + '...' : config}`
).join('\n')}

=== ADDITIONAL CONTEXT FILES ===
${getRelevantFileContents(files, activeFile, richContext)}`;

  return context;
}

function extractRichContext(files: Record<string, string>, activeFile: string): RichCodeContext {
  const symbols: SymbolInfo[] = [];
  const imports: string[] = [];
  const exports: string[] = [];
  const configFiles: Record<string, any> = {};

  // Extract symbols from all files
  Object.entries(files).forEach(([filename, content]) => {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      symbols.push(...extractJSSymbols(content, filename));
      imports.push(...extractJSImports(content));
      exports.push(...extractJSExports(content));
    }

    if (ext === 'py') {
      symbols.push(...extractPySymbols(content, filename));
      imports.push(...extractPyImports(content));
    }

    // Extract config files
    if (['package.json', 'tsconfig.json', 'next.config.js', 'nuxt.config.js'].includes(filename)) {
      try {
        configFiles[filename] = JSON.parse(content);
      } catch {
        configFiles[filename] = content;
      }
    }
  });

  return {
    symbols,
    imports: [...new Set(imports)], // Remove duplicates
    exports: [...new Set(exports)], // Remove duplicates
    dependencies: extractDependencies(files),
    framework: detectFramework(files),
    configFiles
  };
}

function extractJSSymbols(content: string, filename: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const lines = content.split('\n');

  // Extract functions
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'function',
      file: filename,
      line: lineNum,
      signature: match[0],
      exports: match[0].includes('export')
    });
  }

  // Extract classes
  const classRegex = /(?:export\s+)?class\s+(\w+)/g;
  while ((match = classRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'class',
      file: filename,
      line: lineNum,
      exports: match[0].includes('export')
    });
  }

  // Extract TypeScript interfaces
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
  while ((match = interfaceRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'interface',
      file: filename,
      line: lineNum,
      exports: match[0].includes('export')
    });
  }

  // Extract TypeScript types
  const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=/g;
  while ((match = typeRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'type',
      file: filename,
      line: lineNum,
      exports: match[0].includes('export')
    });
  }

  return symbols;
}

function extractPySymbols(content: string, filename: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];

  // Extract functions
  const funcRegex = /def\s+(\w+)\s*\([^)]*\):/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'function',
      file: filename,
      line: lineNum,
      signature: match[0]
    });
  }

  // Extract classes
  const classRegex = /class\s+(\w+)/g;
  while ((match = classRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'class',
      file: filename,
      line: lineNum
    });
  }

  return symbols;
}

function extractJSImports(content: string): string[] {
  const imports: string[] = [];

  // ES6 imports
  const es6Regex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Dynamic imports
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // CommonJS requires
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function extractJSExports(content: string): string[] {
  const exports: string[] = [];

  // Named exports
  const namedRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Default exports
  const defaultRegex = /export\s+default\s+(?:\w+|\{[^}]+\}|\([^)]+\)\s*=>)/g;
  if (defaultRegex.test(content)) {
    exports.push('default');
  }

  return exports;
}

function extractPyImports(content: string): string[] {
  const imports: string[] = [];

  const importRegex = /^(?:import\s+(\w+)|from\s+(\w+)\s+import)/gm;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1] || match[2]);
  }

  return imports;
}

function extractDependencies(files: Record<string, string>): Record<string, string> {
  const deps: Record<string, string> = {};

  if (files['package.json']) {
    try {
      const pkg = JSON.parse(files['package.json']);
      Object.assign(deps, pkg.dependencies || {});
      Object.assign(deps, pkg.devDependencies || {});
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
    }
  }

  return deps;
}

function detectFramework(files: Record<string, string>): FrameworkInfo {
  const packageJson = files['package.json'];
  let deps: Record<string, string> = {};

  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      deps = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch {
      // Ignore parse errors
    }
  }

  const features: string[] = [];

  // React detection
  if (deps['react']) {
    features.push('JSX', 'Hooks', 'Components');
    if (deps['next']) {
      return { type: 'nextjs', version: deps['next'], features: [...features, 'SSR', 'API Routes', 'App Router'] };
    }
    return { type: 'react', version: deps['react'], features };
  }

  // Vue detection
  if (deps['vue']) {
    features.push('Vue Components', 'Reactivity', 'Templates');
    if (deps['nuxt']) {
      return { type: 'nuxt', version: deps['nuxt'], features: [...features, 'SSR', 'Auto-imports', 'Modules'] };
    }
    return { type: 'vue', version: deps['vue'], features };
  }

  // Svelte detection
  if (deps['svelte']) {
    return { type: 'svelte', version: deps['svelte'], features: ['Components', 'Reactivity', 'Stores'] };
  }

  // Angular detection
  if (deps['@angular/core']) {
    return { type: 'angular', version: deps['@angular/core'], features: ['Components', 'Services', 'Modules', 'Dependency Injection'] };
  }

  // Backend frameworks
  if (deps['express']) {
    return { type: 'express', version: deps['express'], features: ['Middleware', 'Routing', 'REST API'] };
  }

  if (deps['fastify']) {
    return { type: 'fastify', version: deps['fastify'], features: ['Plugins', 'Hooks', 'Validation'] };
  }

  return { type: 'vanilla', features: ['HTML', 'CSS', 'JavaScript'] };
}

function getRelevantFileContents(files: Record<string, string>, activeFile: string, context: RichCodeContext): string {
  const relevantFiles: string[] = [];

  // Include package.json and config files
  if (files['package.json']) {
    relevantFiles.push(`package.json: ${files['package.json']}`);
  }

  // Include small related files
  const relatedExtensions = getRelatedExtensions(activeFile);
  Object.keys(files).forEach(filename => {
    if (filename === activeFile) return;

    const ext = filename.split('.').pop()?.toLowerCase();
    if (relatedExtensions.includes(ext || '') && files[filename].length < 1000) {
      relevantFiles.push(`${filename}:\n${files[filename]}`);
    }
  });

  return relevantFiles.join('\n\n');
}

function getRelatedExtensions(activeFile: string): string[] {
  const ext = activeFile.split('.').pop()?.toLowerCase();

  const extensionMap: Record<string, string[]> = {
    'html': ['css', 'js'],
    'css': ['html', 'js', 'scss'],
    'js': ['html', 'css', 'json', 'ts'],
    'jsx': ['css', 'js', 'json', 'ts', 'tsx'],
    'ts': ['js', 'json', 'tsx'],
    'tsx': ['css', 'ts', 'js', 'json'],
    'py': ['txt', 'md', 'json', 'yml'],
    'json': ['js', 'ts', 'py', 'md']
  };

  return extensionMap[ext || ''] || [];
}

function getFileTypeInfo(extension: string): string {
  const types: Record<string, string> = {
    'html': 'HTML Document',
    'htm': 'HTML Document',
    'css': 'Cascading Style Sheet',
    'scss': 'Sass Stylesheet',
    'sass': 'Sass Stylesheet',
    'less': 'Less Stylesheet',
    'js': 'JavaScript',
    'jsx': 'React JavaScript',
    'ts': 'TypeScript',
    'tsx': 'React TypeScript',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'json': 'JSON Data',
    'xml': 'XML Data',
    'yaml': 'YAML Data',
    'yml': 'YAML Data',
    'md': 'Markdown',
    'txt': 'Text File',
    'sql': 'SQL Database',
    'sh': 'Shell Script',
    'bash': 'Bash Script'
  };
  return types[extension] || `${extension.toUpperCase()} File`;
}

function isRelatedFile(activeExt: string, fileExt?: string): boolean {
  if (!fileExt) return false;

  // HTML related files
  if (activeExt === 'html' || activeExt === 'htm') {
    return ['css', 'js', 'scss', 'sass', 'less'].includes(fileExt);
  }

  // CSS related files
  if (['css', 'scss', 'sass', 'less'].includes(activeExt)) {
    return ['html', 'htm', 'js', 'jsx', 'ts', 'tsx'].includes(fileExt);
  }

  // JS/TS related files
  if (['js', 'jsx', 'ts', 'tsx'].includes(activeExt)) {
    return ['html', 'htm', 'css', 'scss', 'sass', 'less', 'json'].includes(fileExt);
  }

  // Python related files
  if (activeExt === 'py') {
    return ['txt', 'md', 'json', 'yml', 'yaml'].includes(fileExt);
  }

  return false;
}
