<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CursWord - AI Code Builder

A powerful AI-assisted code development environment optimized for Ubuntu/Linux systems, featuring workspace management, multi-model AI integration, and comprehensive code intelligence. **Now includes real file persistence - all AI-generated code is saved to disk and accessible for future modifications!**

**Key Features:**
- ✅ **Real File Persistence**: AI-generated code saves to disk instantly
- ✅ **Complete AI Context**: AI has access to all workspace files
- ✅ **File Modification**: AI can read and modify existing files
- ✅ **Workspace Integration**: Files persist across sessions
- ✅ **Ubuntu Optimized**: Manual path input works in all browsers

## Features

- **🗂️ Workspace Management**: Select and manage local project directories
- **🤖 AI-Powered Development**: 35+ AI models (Ollama, OpenRouter, OpenAI, Anthropic)
- **📁 Full File Tree**: Navigate and edit files in your workspace
- **🖥️ Integrated Terminal**: Run commands directly in your project
- **📊 AI Action Logger**: See all AI operations in real-time
- **🎯 Framework Intelligence**: Auto-detects React, Vue, Next.js, etc.
- **🔍 Code Intelligence**: Symbol analysis, imports/exports, dependencies

## Ubuntu/Linux Setup

**Prerequisites:** Node.js 18+, npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up AI Models (Choose one)

#### Option A: Ollama (Recommended for Ubuntu)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a fast model optimized for coding
ollama pull qwen2.5:0.5b

# Start Ollama service (keep running in background)
ollama serve
```

#### Option B: OpenRouter (35+ models, requires API key)
Get your API key from [OpenRouter.ai](https://openrouter.ai) and configure it in the app settings.

### 3. Install All Dependencies
```bash
# Install all dependencies (frontend + backend)
npm install

# Or install server dependencies separately
npm run install:server
```

### 4. Run the Full Application (Frontend + Backend)
```bash
npm start
# or
npm run dev:full
```

This will start both:
- **Frontend**: `http://localhost:3001` (React/Vite)
- **Backend**: `http://localhost:3002` (File server)

### Alternative: Run Separately
```bash
# Terminal 1: Backend file server
npm run server

# Terminal 2: Frontend
npm run dev
```

## Workspace Setup

1. **Open the app** in your browser
2. **Select a workspace** by entering a path like:
   - `/home/yourusername/projects/my-app`
   - `/home/yourusername/Desktop/coding`
   - `/tmp/test-project`

3. **Start coding** with AI assistance!

## Features

### File Persistence & AI Access
- **✅ Real File Saving**: All AI-generated code is saved to disk
- **✅ Complete Context**: AI has access to all workspace files
- **✅ File Modification**: AI can read and modify existing files
- **✅ Workspace Integration**: Files persist across sessions

### Usage

- **📁 File Tree**: Click files to edit, right-click for operations
- **💬 AI Chat**: Ask questions, request code generation, debugging
- **🖥️ Terminal**: Run npm install, build commands, tests
- **📊 Action Logger**: Monitor all AI operations in real-time
- **⚙️ Settings**: Switch between AI providers and models

### AI Code Generation

**The AI can now:**
- Create new files with `[CREATE: filename.ext]` syntax
- Modify existing files with `[MODIFY: filename.ext]` syntax
- Access complete workspace context for intelligent code generation
- Follow your project's framework patterns and conventions

### Live Plan Writing (Cursor-Style)

**Plan Mode Features:**
- **Live Writing**: Watch the AI write implementation plans in real-time
- **File Persistence**: Plans are saved as timestamped `.md` files (e.g., `PLAN_2024-01-15_14_30.md`)
- **Visual Indicators**: "AI Writing" indicator shows when content is being generated
- **Complete Context**: AI analyzes your entire codebase before planning
- **Framework Awareness**: Plans consider your tech stack and patterns

**How it works:**
1. Ask the AI to "plan" something (e.g., "Create a user authentication system")
2. AI creates a plan file and opens it in the editor
3. Watch as the AI writes the plan content live in the file
4. File persists and can be edited/reviewed after completion

**Example AI Commands:**
```
[CREATE: src/components/Button.jsx]
import React from 'react';

const Button = ({ children, onClick }) => (
  <button onClick={onClick} className="btn">
    {children}
  </button>
);

export default Button;
[/CREATE]
```

## Ubuntu Tips

- **Path Format**: Always use absolute paths starting with `/`
- **Permissions**: Ensure read/write access to your workspace directory
- **Common Locations**:
  - `/home/$USER/projects` - Your projects folder
  - `/home/$USER/Desktop` - Desktop directory
  - `/tmp/test-project` - Temporary test projects

## Troubleshooting

**Can't select workspace?**
- Use manual path input (File System API not fully supported in Ubuntu browsers)
- Enter paths like `/home/yourusername/projects/my-app`
- Check directory permissions with `ls -la /path/to/dir`

**AI not responding?**
- Ensure Ollama is running: `ollama serve`
- Check model is downloaded: `ollama list`
- Try OpenRouter with API key for more reliable service

**Terminal not working?**
- Commands run in your workspace directory
- Check command syntax for your shell (bash by default)
