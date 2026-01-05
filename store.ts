
import { create } from 'zustand';
import { ChatMessage, LayoutMode, ChatMode, InferenceState } from './types';
import { initEngine, generateLocalResponse, extractFiles, distillProject, AVAILABLE_MODELS, getActiveProvider } from './services/multiProviderService';

// AI Code Action Processing
async function processAICodeActions(aiResponse: string, modelId: string) {
  const createRegex = /\[CREATE:\s*([^\]]+)\]\s*\n([\s\S]*?)\n\[\/CREATE\]/g;
  const modifyRegex = /\[MODIFY:\s*([^\]]+)\]\s*\n([\s\S]*?)\n\[\/MODIFY\]/g;

  let match;

  // Process file creation
  while ((match = createRegex.exec(aiResponse)) !== null) {
    const [, filePath, content] = match;
    try {
      console.log(`AI creating file: ${filePath}`);
      await apiClient.executeAIOperation('create', filePath.trim(), content.trim(), `AI created file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to create file ${filePath}:`, error);
    }
  }

  // Process file modification
  while ((match = modifyRegex.exec(aiResponse)) !== null) {
    const [, filePath, content] = match;
    try {
      console.log(`AI modifying file: ${filePath}`);
      await apiClient.executeAIOperation('write', filePath.trim(), content.trim(), `AI modified file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to modify file ${filePath}:`, error);
    }
  }
}

// Helper functions for context analysis
function detectFramework(files: Record<string, string>) {
  const packageJson = files['package.json'];
  if (!packageJson) return { type: 'vanilla', version: null, features: ['HTML', 'CSS', 'JavaScript'] };

  try {
    const pkg = JSON.parse(packageJson);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['react']) {
      if (deps['next']) return { type: 'nextjs', version: deps['next'], features: ['React', 'SSR', 'API Routes', 'App Router'] };
      return { type: 'react', version: deps['react'], features: ['React', 'JSX', 'Hooks', 'Components'] };
    }

    if (deps['vue']) {
      if (deps['nuxt']) return { type: 'nuxt', version: deps['nuxt'], features: ['Vue', 'SSR', 'Auto-imports'] };
      return { type: 'vue', version: deps['vue'], features: ['Vue', 'Components', 'Reactivity'] };
    }

    if (deps['svelte']) return { type: 'svelte', version: deps['svelte'], features: ['Svelte', 'Components', 'Reactivity'] };
    if (deps['@angular/core']) return { type: 'angular', version: deps['@angular/core'], features: ['Angular', 'Components', 'Services'] };
    if (deps['express']) return { type: 'express', version: deps['express'], features: ['Express', 'Middleware', 'REST API'] };

  } catch (error) {
    console.warn('Framework detection failed:', error);
  }

  return { type: 'vanilla', version: null, features: ['HTML', 'CSS', 'JavaScript'] };
}

function extractSymbolsFromFiles(files: Record<string, string>): string[] {
  const symbols: string[] = [];

  Object.entries(files).forEach(([filename, content]) => {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      // Extract function names
      const funcMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g) || [];
      symbols.push(...funcMatches.map(match => match.replace(/export\s+|async\s+|function\s+/g, '')));

      // Extract class names
      const classMatches = content.match(/(?:export\s+)?class\s+(\w+)/g) || [];
      symbols.push(...classMatches.map(match => match.replace(/export\s+|class\s+/g, '')));
    }

    if (ext === 'py') {
      // Extract Python functions and classes
      const pyFuncs = content.match(/def\s+(\w+)/g) || [];
      symbols.push(...pyFuncs.map(match => match.replace('def ', '')));

      const pyClasses = content.match(/class\s+(\w+)/g) || [];
      symbols.push(...pyClasses.map(match => match.replace('class ', '')));
    }
  });

  return [...new Set(symbols)]; // Remove duplicates
}

function extractImportsFromFiles(files: Record<string, string>): string[] {
  const imports: string[] = [];

  Object.entries(files).forEach(([filename, content]) => {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      // ES6 imports
      const es6Matches = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      imports.push(...es6Matches.map(match => match.replace(/from\s+['"]|['"]/g, '')));
    }

    if (ext === 'py') {
      // Python imports
      const pyMatches = content.match(/^(?:import\s+(\w+)|from\s+(\w+))/gm) || [];
      imports.push(...pyMatches.map(match => match.replace(/import\s+|from\s+/g, '').split(' ')[0]));
    }
  });

  return [...new Set(imports)]; // Remove duplicates
}

function ensureProperFilename(filename: string, content: string): string {
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

interface AppState {
  files: Record<string, string>;
  activeFile: string;
  messages: ChatMessage[];
  statusLog: string[];
  layout: LayoutMode;
  inference: InferenceState & { selectedModel: string };
  
  initializeModel: (modelId?: string) => Promise<void>;
  setActiveFile: (path: string) => void;
  setFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setLayout: (layout: LayoutMode) => void;
  clearChat: () => void;
  deleteFile: (path: string) => void;
  orchestrate: (content: string, mode: ChatMode) => Promise<void>;
}

const INITIAL_PROJECT = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-950 text-slate-400 font-sans">
    <div class="container mx-auto p-8">
        <header class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-4">Welcome to My Project</h1>
            <p class="text-xl text-slate-300">Built with AI assistance</p>
        </header>

        <main id="app" class="text-center">
            <div class="bg-slate-800 rounded-lg p-8 shadow-xl">
                <h2 class="text-2xl font-semibold text-white mb-4">Hello World!</h2>
                <p class="text-slate-300 mb-6">This is your new project. Start building something amazing!</p>
                <button id="action-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                    Get Started
                </button>
            </div>
        </main>
    </div>

    <script src="script.js"></script>
</body>
</html>`,

  'styles.css': `/* Custom styles for the project */

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.container {
    max-width: 1200px;
}

#app {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }

    h1 {
        font-size: 2rem;
    }
}`,

  'script.js': `// Main JavaScript file for the project

document.addEventListener('DOMContentLoaded', function() {
    console.log('Project initialized!');

    const actionBtn = document.getElementById('action-btn');

    if (actionBtn) {
        actionBtn.addEventListener('click', function() {
            alert('Welcome to your new project! 🚀\\n\\nStart building something amazing.');
        });
    }

    // Add some interactive features
    const header = document.querySelector('h1');
    if (header) {
        header.addEventListener('click', function() {
            this.style.color = this.style.color === 'rgb(34, 197, 94)' ? 'white' : '#22c55e';
        });
    }
});`,

  'README.md': `# My Project

A modern web application built with AI assistance.

## Features

- Responsive design with Tailwind CSS
- Interactive JavaScript functionality
- Clean and maintainable code structure

## Getting Started

1. Open index.html in your web browser
2. Click the "Get Started" button
3. Start customizing your project!

## File Structure

- index.html - Main HTML page
- styles.css - Custom styles
- script.js - JavaScript functionality
- README.md - This documentation

## Technologies Used

- HTML5
- CSS3 with Tailwind CSS
- Vanilla JavaScript

Built with ❤️ using AI assistance.
`,
};

const handleAskMode = async (content: string, projectState: any, log: (msg: string) => void, set: any, get: any) => {
  log("Processing Question with Rich Context");

  // Extract framework and context info
  const framework = detectFramework(projectState.files);
  const symbols = extractSymbolsFromFiles(projectState.files);
  const imports = extractImportsFromFiles(projectState.files);

  const askPrompt = `You are an expert ${framework.type} developer working in a ${framework.type} project.

QUESTION: ${content}

PROJECT CONTEXT:
- Framework: ${framework.type} ${framework.version || ''}
- Features: ${framework.features.join(', ')}
- Active File: ${projectState.activeFile}
- Available Symbols: ${symbols.slice(0, 20).join(', ')}
- Key Imports: ${imports.slice(0, 15).join(', ')}

CODEBASE OVERVIEW:
${projectState.context}

Please provide a clear, actionable answer that takes into account the framework, existing code patterns, and project structure. Include relevant code examples when helpful.`;

  const selectedModel = get().inference.selectedModel;
  const response = await generateLocalResponse(askPrompt, `You are a senior ${framework.type} developer with deep knowledge of this codebase. Answer questions with specific, actionable advice based on the provided context.`, undefined, selectedModel);

  set((state: any) => ({
    messages: [...state.messages, {
      id: (Date.now()+1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      mode: 'ask'
    }]
  }));
};

const handlePlanMode = async (content: string, projectState: any, log: (msg: string) => void, set: any, get: any) => {
  const { setLiveWritingFile } = get();
  log("Creating Implementation Plan - Writing to PLAN.md");

  const framework = detectFramework(projectState.files);
  const symbols = extractSymbolsFromFiles(projectState.files);
  const imports = extractImportsFromFiles(projectState.files);

  // Create plan filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_');
  const planFileName = `PLAN_${timestamp}.md`;

  const planPrompt = `You are creating a detailed implementation plan for a ${framework.type} project.

TASK TO IMPLEMENT: "${content}"

PROJECT ANALYSIS:
- Framework: ${framework.type} ${framework.version || ''}
- Current Architecture: ${framework.features.join(', ')}
- Existing Symbols: ${symbols.slice(0, 25).join(', ')}
- Key Dependencies: ${Object.keys(detectFramework(projectState.files)).slice(0, 10).join(', ')}
- Active File: ${projectState.activeFile}
- Total Files: ${projectState.fileCount}

CODEBASE CONTEXT:
${projectState.context}

Create a comprehensive implementation plan that includes:
1. Project overview and requirements analysis
2. Architecture decisions and design patterns
3. File-by-file implementation breakdown
4. Dependencies and imports needed
5. Testing strategy and validation steps
6. Deployment considerations
7. Follow-up tasks and next steps

Format as a well-structured Markdown document with clear headings, code examples, and actionable steps.`;

  const selectedModel = get().inference.selectedModel;

  // Create the plan file first
  const initialPlanContent = `# Implementation Plan: ${content}

*Plan generated on ${new Date().toLocaleString()}*

## Analyzing Requirements...

*AI is analyzing the task and generating a comprehensive implementation plan...*

---
*This plan is being written live by the AI. Watch as the content appears below.*
---

`;

  try {
    // Create the plan file
    await apiClient.createFile(planFileName, initialPlanContent);

    // Update the files state to include the new plan file
    const { files } = get();
    set({
      files: { ...files, [planFileName]: initialPlanContent },
      activeFile: planFileName
    });

    log(`Plan file created: ${planFileName} - Opening for live editing`);

    // Indicate live writing has started
    setLiveWritingFile(planFileName);

    // Generate the plan and stream it to the file
    const planStream = await generateLocalResponse(planPrompt, `You are a senior ${framework.type} architect creating a detailed implementation plan. Write a comprehensive, well-structured plan that covers all aspects of implementation.`, undefined, selectedModel);

    // Process the plan content and update the file progressively
    const lines = planStream.split('\n');
    let currentContent = initialPlanContent;

    for (let i = 0; i < lines.length; i++) {
      // Add each line with a small delay to simulate live writing
      currentContent += lines[i] + '\n';

      // Update the file content
      set({
        files: { ...files, [planFileName]: currentContent }
      });

      // Small delay to make it visible as "live writing"
      if (i % 3 === 0) { // Update every 3 lines for more responsive live writing
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    log(`Plan completed and saved to ${planFileName}`);

    // Clear live writing indicator
    setLiveWritingFile(null);

    // Add success message to chat
    const successMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `✅ **Implementation plan created!**\n\n📄 **File:** \`${planFileName}\`\n📝 **Status:** Plan generated and saved to disk\n👀 **View:** The plan file is now open in the editor\n\nThe AI has analyzed your request and created a comprehensive implementation plan. You can see it being written live in the \`${planFileName}\` file.`,
      timestamp: Date.now(),
      mode: 'plan'
    };

    set((state) => ({
      messages: [...state.messages, successMessage]
    }));

  } catch (error) {
    console.error('Failed to create plan file:', error);
    // Fallback to chat response if file creation fails
    const plan = await generateLocalResponse(planPrompt, `You are a senior ${framework.type} architect. Create detailed, actionable implementation plans that leverage existing codebase patterns and follow framework conventions.`, undefined, selectedModel);

    log("Plan generated (file creation failed, showing in chat)");

    // Clear live writing indicator
    setLiveWritingFile(null);

    // Add the plan as a chat message
    const planMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `📋 **Implementation Plan**\n\n${plan}`,
      timestamp: Date.now(),
      mode: 'plan'
    };

    set((state) => ({
      messages: [...state.messages, planMessage]
    }));
  }

  set((state: any) => ({
    messages: [...state.messages, {
      id: (Date.now()+1).toString(),
      role: 'assistant',
      content: plan,
      timestamp: Date.now(),
      mode: 'plan'
    }]
  }));
};

const handleAgentMode = async (content: string, projectState: any, log: (msg: string) => void, set: any, get: any) => {
  const { files, activeFile } = projectState;

  log("Analyzing Request with AI Context");
  const framework = detectFramework(files);
  const symbols = extractSymbolsFromFiles(files);
  const imports = extractImportsFromFiles(files);

  // Enhanced analysis prompt
  const analysisPrompt = `You are analyzing a request for a ${framework.type} project.

REQUEST: "${content}"

PROJECT INTELLIGENCE:
- Framework: ${framework.type} ${framework.version || ''}
- Architecture: ${framework.features.join(', ')}
- Existing Code Patterns: ${symbols.slice(0, 25).join(', ')}
- Import Patterns: ${imports.slice(0, 20).join(', ')}
- Active Context: ${activeFile}
- Project Size: ${Object.keys(files).length} files

CODEBASE ANALYSIS:
${projectState.context}

Analyze what the user wants to implement and provide technical requirements that fit seamlessly into this existing ${framework.type} codebase. Consider the established patterns, naming conventions, and architectural decisions.`;

  const selectedModel = get().inference.selectedModel;
  const requirements = await generateLocalResponse(analysisPrompt, `You are a senior ${framework.type} developer analyzing implementation requirements. Provide detailed technical specifications that align with existing codebase patterns.`, undefined, selectedModel);

  log("Generating Framework-Aware Code");

  // Enhanced code generation prompt
  const codePrompt = `You are implementing: "${content}"

TECHNICAL REQUIREMENTS: ${requirements}

FRAMEWORK CONTEXT: ${framework.type} ${framework.version || ''}
- Use ${framework.features.join(', ')} patterns
- Follow existing code style in: ${activeFile}
- Leverage imports: ${imports.slice(0, 15).join(', ')}
- Reference symbols: ${symbols.slice(0, 20).join(', ')}

PROJECT STRUCTURE:
${Object.keys(files).join(', ')}

CODEBASE CONTEXT:
${projectState.context}

Generate production-ready code that integrates seamlessly with this ${framework.type} project. Use proper file naming conventions and create additional files as needed.

IMPORTANT: You can create and modify files directly. Use this format to create files:

[CREATE: filename.ext]
file content here
[/CREATE]

Or to modify existing files:

[MODIFY: filename.ext]
replacement content here
[/MODIFY]

Ensure all code follows ${framework.type} best practices and matches the existing codebase style.`;

  const codeOutput = await generateLocalResponse(codePrompt, `You are an expert ${framework.type} developer. Generate high-quality, production-ready code that perfectly integrates with the existing codebase. You have full file creation and modification capabilities.`, undefined, selectedModel);

  // Process any file creation/modification commands in the response
  await processAICodeActions(codeOutput, selectedModel);

  const patches = extractFiles(codeOutput);
  if (Object.keys(patches).length > 0) {
    set((state: any) => ({
      files: { ...state.files, ...patches },
      activeFile: Object.keys(patches)[0] || state.activeFile // Switch to first new file
    }));
    log(`Created/Updated: ${Object.keys(patches).join(', ')}`);
  }

  set((state: any) => ({
    messages: [...state.messages, {
      id: (Date.now()+1).toString(),
      role: 'assistant',
      content: codeOutput,
      timestamp: Date.now(),
      mode: 'agent'
    }]
  }));
};

const handleDebugMode = async (content: string, projectState: any, log: (msg: string) => void, set: any, get: any) => {
  log("Performing Intelligent Code Analysis");

  const framework = detectFramework(projectState.files);
  const symbols = extractSymbolsFromFiles(projectState.files);
  const imports = extractImportsFromFiles(projectState.files);

  const debugPrompt = `You are debugging a ${framework.type} application.

DEBUG REQUEST: "${content}"

CODE ANALYSIS CONTEXT:
- Framework: ${framework.type} ${framework.version || ''}
- Tech Stack: ${framework.features.join(', ')}
- Code Symbols: ${symbols.slice(0, 30).join(', ')}
- Dependencies: ${Object.keys(detectFramework(projectState.files)).slice(0, 15).join(', ')}
- Active File: ${projectState.activeFile}

FULL CODEBASE CONTEXT:
${projectState.context}

Perform a comprehensive analysis to identify:
1. Syntax errors and logical bugs
2. Performance bottlenecks
3. Framework-specific issues
4. Best practice violations
5. Security concerns
6. Integration problems

Provide specific, actionable fixes with code examples that follow ${framework.type} conventions. Explain the root cause and prevention strategies.`;

  const selectedModel = get().inference.selectedModel;
  const analysis = await generateLocalResponse(debugPrompt, `You are an expert ${framework.type} debugger with deep knowledge of the framework, common pitfalls, and best practices. Provide detailed, actionable debugging advice with specific code fixes.`, undefined, selectedModel);

  set((state: any) => ({
    messages: [...state.messages, {
      id: (Date.now()+1).toString(),
      role: 'assistant',
      content: analysis,
      timestamp: Date.now(),
      mode: 'debug'
    }]
  }));
};

export const useStore = create<AppState>((set, get) => ({
  files: INITIAL_PROJECT,
  activeFile: 'index.html',
  messages: [],
  liveWritingFile: null,
  statusLog: [],
  layout: 'split',
  inference: {
    isLoaded: false,
    isLoading: false,
    progress: null,
    error: null,
    selectedModel: getActiveProvider()?.models[0]?.id || 'qwen2.5:0.5b'
  },

  initializeModel: async (modelId) => {
    const targetModel = modelId || get().inference.selectedModel;
    set({ inference: { ...get().inference, isLoading: true, error: null, selectedModel: targetModel } });
    try {
      console.log('Starting model initialization for:', targetModel);
      await initEngine(targetModel, (p) => {
        console.log('Progress:', p.text, p.progress);
        set({ inference: { ...get().inference, progress: { text: p.text, progress: p.progress } } });
      });
      console.log('Model initialization successful');
      set({ inference: { ...get().inference, isLoaded: true, isLoading: false, progress: null } });
    } catch (e: any) {
      console.error('Model initialization failed:', e);
      // Allow UI interaction even if model fails to load - set isLoaded to true with error state
      set({ inference: { ...get().inference, isLoaded: true, isLoading: false, error: e.message } });
    }
  },

  setActiveFile: (path) => set({ activeFile: path }),
  setSelectedModel: (modelId: string) => set({ inference: { ...get().inference, selectedModel: modelId } }),
  setLiveWritingFile: (file: string | null) => set({ liveWritingFile: file }),

  setFiles: (updater) => {
    const newFiles = typeof updater === 'function' ? updater(get().files) : updater;

    // Ensure all new files have proper extensions
    const validatedFiles: Record<string, string> = {};
    Object.entries(newFiles).forEach(([filename, content]) => {
      const properFilename = ensureProperFilename(filename, content);
      validatedFiles[properFilename] = content;
    });

    set({ files: validatedFiles });
  },
  setLayout: (layout) => set({ layout }),
  clearChat: () => set({ messages: [] }),

  deleteFile: (path) => set((state) => {
    if (Object.keys(state.files).length <= 1) return state;
    const nextFiles = { ...state.files };
    delete nextFiles[path];
    return { files: nextFiles, activeFile: state.activeFile === path ? Object.keys(nextFiles)[0] : state.activeFile };
  }),

  orchestrate: async (content, mode) => {
    const { inference, initializeModel, files, activeFile, messages, setSelectedModel } = get();

    // 1. Immediately add the user message to UI
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now(), mode };
    set({ messages: [...messages, userMsg] });

    // 2. Get complete project context including all workspace files
    let projectContext: string;
    try {
      projectContext = await distillProject(files, activeFile, true); // Use backend for complete context
    } catch (error) {
      console.warn('Failed to get backend context, using local context:', error);
      projectContext = await distillProject(files, activeFile, false); // Fallback to local
    }

    if (!inference.isLoaded) {
      await initializeModel();
    }

    set({ statusLog: [`Initializing ${mode.toUpperCase()} mode...`], inference: { ...get().inference, isLoading: true } });
    const log = (msg: string) => set((state) => ({ statusLog: [...state.statusLog, msg] }));

    try {
      const projectState = {
        files,
        activeFile,
        fileCount: Object.keys(files).length,
        context: projectContext
      };

      switch (mode) {
        case 'ask':
          await handleAskMode(content, projectState, log, set, get);
          break;
        case 'plan':
          await handlePlanMode(content, projectState, log, set, get);
          break;
        case 'agent':
          await handleAgentMode(content, projectState, log, set, get);
          break;
        case 'debug':
          await handleDebugMode(content, projectState, log, set, get);
          break;
      }

    } catch (e: any) {
      log(`ERR: ${e.message}`);
    } finally {
      set({ inference: { ...get().inference, isLoading: false } });
    }
  }
}));
