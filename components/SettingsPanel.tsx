import React, { useState, useEffect } from 'react';
import { ProviderConfig, getAvailableProviders, saveProviderConfigs, setActiveProvider } from '../services/multiProviderService';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [activeTab, setActiveTab] = useState<string>('providers');

  useEffect(() => {
    if (isOpen) {
      setProviders(getAvailableProviders());
    }
  }, [isOpen]);

  const updateProvider = (index: number, updates: Partial<ProviderConfig>) => {
    const newProviders = [...providers];
    newProviders[index] = { ...newProviders[index], ...updates };
    setProviders(newProviders);
  };

  const saveSettings = () => {
    saveProviderConfigs(providers);
    onClose();
  };

  const testProvider = async (provider: ProviderConfig) => {
    try {
      // Simple connectivity test
      let testUrl = '';
      let testHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

      if (provider.name === 'Ollama') {
        testUrl = `${provider.baseUrl}/api/tags`;
      } else if (provider.name === 'OpenAI' && provider.apiKey) {
        testUrl = `${provider.baseUrl}/models`;
        testHeaders['Authorization'] = `Bearer ${provider.apiKey}`;
      } else if (provider.name === 'Anthropic' && provider.apiKey) {
        testUrl = `${provider.baseUrl}/messages`;
        testHeaders['x-api-key'] = provider.apiKey;
        testHeaders['anthropic-version'] = '2023-06-01';

        // For Anthropic, we need to send a test message
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: testHeaders,
          body: JSON.stringify({
            model: provider.models[0]?.id || 'claude-3-5-haiku-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });

        if (testResponse.ok) {
          alert(`${provider.name} connection successful!`);
        } else {
          alert(`${provider.name} connection failed: ${testResponse.status}`);
        }
        return;
      }

      if (testUrl) {
        const response = await fetch(testUrl, { headers: testHeaders });
        if (response.ok) {
          alert(`${provider.name} connection successful!`);
        } else {
          alert(`${provider.name} connection failed: ${response.status}`);
        }
      }
    } catch (error) {
      alert(`${provider.name} connection failed: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">AI Provider Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex gap-1">
            {['providers', 'models', 'about'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'providers' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                Configure your AI providers. API keys are stored securely in your browser's local storage.
              </p>

              {providers.map((provider, index) => (
                <div key={provider.name} className="border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="activeProvider"
                        checked={provider.enabled}
                        onChange={() => {
                          setActiveProvider(provider.name);
                          setProviders(getAvailableProviders());
                        }}
                        className="text-green-500"
                      />
                      <h3 className="font-semibold text-white">{provider.name}</h3>
                      {provider.enabled && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => testProvider(provider)}
                      className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded transition-colors"
                    >
                      Test
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Base URL</label>
                      <input
                        type="text"
                        value={provider.baseUrl}
                        onChange={(e) => updateProvider(index, { baseUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:border-green-500/50 focus:outline-none"
                      />
                    </div>

                    {(provider.name === 'OpenAI' || provider.name === 'Anthropic') && (
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          API Key {provider.apiKey ? '(Set)' : '(Not Set)'}
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your API key..."
                          value={provider.apiKey || ''}
                          onChange={(e) => updateProvider(index, { apiKey: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:border-green-500/50 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                View available models for each provider. Models are automatically refreshed when testing connections.
              </p>

              {providers.map(provider => (
                <div key={provider.name} className="border border-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">{provider.name} Models</h3>
                  <div className="space-y-2">
                    {provider.models.map(model => (
                      <div key={model.id} className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded">
                        <div>
                          <div className="text-white text-sm font-medium">{model.name}</div>
                          <div className="text-slate-500 text-xs">{model.id}</div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          {model.size && <div>Size: {model.size}</div>}
                          {model.contextLength && <div>Context: {model.contextLength.toLocaleString()}</div>}
                          {model.pricing && (
                            <div>
                              ${(model.pricing.input * 1000).toFixed(3)}/1K in, ${(model.pricing.output * 1000).toFixed(3)}/1K out
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <h3 className="text-xl font-bold text-white mb-2">Ollama Code Architect</h3>
                <p className="text-slate-400 text-sm mb-4">
                  AI-powered code generation with multi-provider support
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#1a1a1a] p-3 rounded">
                    <div className="text-green-400 font-semibold">Multi-Provider</div>
                    <div className="text-slate-500">Ollama, OpenAI, Anthropic</div>
                  </div>
                  <div className="bg-[#1a1a1a] p-3 rounded">
                    <div className="text-blue-400 font-semibold">Real-time Preview</div>
                    <div className="text-slate-500">HTML, CSS, JS, Python</div>
                  </div>
                  <div className="bg-[#1a1a1a] p-3 rounded">
                    <div className="text-purple-400 font-semibold">Smart Categorization</div>
                    <div className="text-slate-500">File type organization</div>
                  </div>
                  <div className="bg-[#1a1a1a] p-3 rounded">
                    <div className="text-orange-400 font-semibold">AI Chat Modes</div>
                    <div className="text-slate-500">Ask, Plan, Agent, Debug</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

