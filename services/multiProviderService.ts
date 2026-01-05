/**
 * MULTI-PROVIDER_INFERENCE_SERVICE
 * Enhanced version with multiple AI provider support
 */

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
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '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',
    models: [
      // Free Models (no cost)
      { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B (Free)', contextLength: 32768 },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Instruct (Free)', contextLength: 131072 },
      { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B Instruct (Free)', contextLength: 131072 },
      { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Llama 3.1 405B Instruct (Free)', contextLength: 131072 },
      { id: 'microsoft/wizardlm-2-8x22b:free', name: 'WizardLM 2 8x22B (Free)', contextLength: 65536 },
      { id: 'microsoft/wizardlm-2-7b', name: 'WizardLM 2 7B (Free)', contextLength: 32768 },
      { id: 'huggingface/zephyr-7b-beta:free', name: 'Zephyr 7B Beta (Free)', contextLength: 32768 },
      { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B (Free)', contextLength: 8192 },
      { id: 'anthropic/claude-3-haiku:beta', name: 'Claude 3 Haiku (Beta)', contextLength: 200000 },

      // Premium OpenAI Models
      { id: 'openai/gpt-4o', name: 'GPT-4o', contextLength: 128000, pricing: { input: 0.005, output: 0.015 } },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000, pricing: { input: 0.00015, output: 0.0006 } },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', contextLength: 128000, pricing: { input: 0.01, output: 0.03 } },
      { id: 'openai/gpt-4', name: 'GPT-4', contextLength: 8192, pricing: { input: 0.03, output: 0.06 } },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextLength: 16385, pricing: { input: 0.0005, output: 0.0015 } },
      { id: 'openai/gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', contextLength: 16385, pricing: { input: 0.003, output: 0.004 } },

      // Premium Anthropic Models
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', contextLength: 200000, pricing: { input: 0.003, output: 0.015 } },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', contextLength: 200000, pricing: { input: 0.015, output: 0.075 } },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', contextLength: 200000, pricing: { input: 0.00025, output: 0.00125 } },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', contextLength: 200000, pricing: { input: 0.003, output: 0.015 } },

      // Google Models
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', contextLength: 2097152, pricing: { input: 0.00125, output: 0.005 } },
      { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', contextLength: 1048576, pricing: { input: 0.000075, output: 0.0003 } },
      { id: 'google/gemini-pro', name: 'Gemini Pro', contextLength: 32768, pricing: { input: 0.00025, output: 0.0005 } },

      // Meta Llama Models
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct', contextLength: 131072, pricing: { input: 0.002, output: 0.002 } },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct', contextLength: 131072, pricing: { input: 0.0009, output: 0.0009 } },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct', contextLength: 131072, pricing: { input: 0.0003, output: 0.0003 } },
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B Instruct', contextLength: 8192, pricing: { input: 0.001, output: 0.001 } },
      { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B Instruct', contextLength: 8192, pricing: { input: 0.0004, output: 0.0004 } },

      // Mistral Models
      { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct', contextLength: 32768, pricing: { input: 0.0002, output: 0.0002 } },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', contextLength: 32768 },
      { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B Instruct', contextLength: 32768, pricing: { input: 0.0007, output: 0.0007 } },

      // Cohere Models
      { id: 'cohere/command-r-plus', name: 'Command R Plus', contextLength: 128000, pricing: { input: 0.003, output: 0.015 } },
      { id: 'cohere/command-r', name: 'Command R', contextLength: 128000, pricing: { input: 0.0005, output: 0.0015 } },

      // Groq Models (Fast Inference)
      { id: 'groq/llama-3.1-70b', name: 'Llama 3.1 70B (Groq)', contextLength: 131072, pricing: { input: 0.00059, output: 0.00079 } },
      { id: 'groq/llama-3.1-8b', name: 'Llama 3.1 8B (Groq)', contextLength: 131072, pricing: { input: 0.00005, output: 0.00008 } },
      { id: 'groq/mixtral-8x7b', name: 'Mixtral 8x7B (Groq)', contextLength: 32768, pricing: { input: 0.00027, output: 0.00027 } },

      // xAI Grok Models
      { id: 'xai/grok-beta', name: 'Grok Beta', contextLength: 131072, pricing: { input: 0.005, output: 0.005 } },

      // Other Models
      { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Llama 3.1 Sonar Large 128K', contextLength: 127072, pricing: { input: 0.001, output: 0.001 } },
      { id: 'perplexity/llama-3.1-sonar-small-128k-online', name: 'Llama 3.1 Sonar Small 128K', contextLength: 127072, pricing: { input: 0.0002, output: 0.0002 } },
      { id: 'fireworks/firellava-13b', name: 'FireLLaVA 13B', contextLength: 4096, pricing: { input: 0.0002, output: 0.0002 } },
      { id: 'anthropic/claude-2', name: 'Claude 2', contextLength: 100000, pricing: { input: 0.008, output: 0.024 } },
      { id: 'anthropic/claude-instant-1', name: 'Claude Instant', contextLength: 100000, pricing: { input: 0.0008, output: 0.0024 } },
    ],
    enabled: false,
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

// Dynamic model list based on active provider
export const getAvailableModels = (): ModelInfo[] => {
  const provider = getActiveProvider();
  if (!provider) return [];

  return provider.models;
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
      if (!provider.apiKey) {
        throw new Error('OpenAI API key required. Please configure in settings.');
      }

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
      if (!provider.apiKey) {
        throw new Error('Anthropic API key required. Please configure in settings.');
      }

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

    } else if (provider.name === 'OpenRouter') {
      if (!provider.apiKey) {
        throw new Error('OpenRouter API key required. Please configure in settings.');
      }

      const testResponse = await fetch(`${provider.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Code Architect'
        },
      });

      if (!testResponse.ok) {
        throw new Error(`OpenRouter API key invalid or service unavailable (${testResponse.status})`);
      }

      console.log('OpenRouter API connection successful');
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
  onStream?: (text: string) => void,
  modelId?: string
): Promise<string> {
  try {
    const provider = getActiveProvider();
    if (!provider) {
      return 'No AI provider configured. Please check your settings.';
    }

    console.log('Using provider:', provider.name, 'with model:', modelId);

    // Use provided modelId or default to first model
    const selectedModelId = modelId || provider.models[0]?.id || 'qwen2.5:0.5b';

    if (provider.name === 'Ollama') {
      return await generateOllamaResponse(provider, prompt, systemInstruction, onStream, selectedModelId);
    } else if (provider.name === 'OpenAI') {
      return await generateOpenAIResponse(provider, prompt, systemInstruction, onStream, selectedModelId);
    } else if (provider.name === 'Anthropic') {
      return await generateAnthropicResponse(provider, prompt, systemInstruction, onStream, selectedModelId);
    } else if (provider.name === 'OpenRouter') {
      return await generateOpenRouterResponse(provider, prompt, systemInstruction, onStream, selectedModelId);
    } else {
      return `Provider ${provider.name} not yet supported.`;
    }

  } catch (error) {
    console.error('AI API error:', error);
    return `Error: ${error.message}. Please check your provider configuration.`;
  }
}

async function generateOpenRouterResponse(
  provider: ProviderConfig,
  prompt: string,
  systemInstruction: string,
  onStream?: (text: string) => void,
  modelId?: string
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Code Architect'
    },
    body: JSON.stringify({
      model: modelId || 'openai/gpt-oss-120b:free',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      stream: true,
      temperature: 0.1,
      max_tokens: 1024,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
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
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content || '';
            fullText += content;

            if (onStream) {
              onStream(fullText);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  return fullText || 'No response generated.';
}

async function generateOllamaResponse(
  provider: ProviderConfig,
  prompt: string,
  systemInstruction: string,
  onStream?: (text: string) => void,
  modelId?: string
): Promise<string> {
  const fullPrompt = `${systemInstruction}\n\nUser: ${prompt}\nAssistant:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(`${provider.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId || 'qwen2.5:0.5b',
      prompt: fullPrompt,
      stream: true,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        top_k: 40,
        num_predict: 1024,
        num_ctx: 2048,
      }
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
    buffer = lines.pop() || '';

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
          console.warn('Skipping malformed JSON line:', line);
        }
      }
    }
  }

  return fullText || 'No response generated. The model may still be loading.';
}

async function generateOpenAIResponse(
  provider: ProviderConfig,
  prompt: string,
  systemInstruction: string,
  onStream?: (text: string) => void,
  modelId?: string
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      stream: true,
      temperature: 0.1,
      max_tokens: 1024,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
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
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content || '';
            fullText += content;

            if (onStream) {
              onStream(fullText);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  return fullText || 'No response generated.';
}

async function generateAnthropicResponse(
  provider: ProviderConfig,
  prompt: string,
  systemInstruction: string,
  onStream?: (text: string) => void,
  modelId?: string
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(`${provider.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelId || 'claude-3-5-haiku-20241022',
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 1024,
      temperature: 0.1,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
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
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'content_block_delta') {
              const content = data.delta?.text || '';
              fullText += content;

              if (onStream) {
                onStream(fullText);
              }
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  return fullText || 'No response generated.';
}

// Export functions for compatibility
export { extractFiles, distillProject } from './localInferenceService';
