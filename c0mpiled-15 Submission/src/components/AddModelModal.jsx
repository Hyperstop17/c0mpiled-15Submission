import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Key, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Bot
} from 'lucide-react';

const PRESETS = [
  {
    name: 'OpenAI GPT-4o Mini',
    provider: 'OpenAI',
    modelId: 'gpt-4o-mini',
    badge: 'Fast & Versatile',
    avatar: '🟢',
    color: '#10a37f'
  },
  {
    name: 'Anthropic Claude 3.7 Sonnet',
    provider: 'Anthropic',
    modelId: 'claude-3-7-sonnet-20250219',
    badge: 'Hybrid Reasoning',
    avatar: '🧠',
    color: '#d97706'
  },
  {
    name: 'Google Gemini 2.5 Flash',
    provider: 'Google Gemini',
    modelId: 'gemini-2.5-flash',
    badge: 'Large Context Window',
    avatar: '⚡',
    color: '#3b82f6'
  },
  {
    name: 'OpenRouter / DeepSeek V3',
    provider: 'OpenRouter',
    modelId: 'deepseek/deepseek-chat',
    baseUrl: 'https://openrouter.ai/api/v1',
    badge: 'Open Weights Model',
    avatar: '🌐',
    color: '#8b5cf6'
  }
];

export default function AddModelModal({ isOpen, onClose, onSaveModel }) {
  const [provider, setProvider] = useState('OpenAI');
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setName(preset.name);
    setProvider(preset.provider);
    setModelId(preset.modelId);
    if (preset.baseUrl) setBaseUrl(preset.baseUrl);
    else setBaseUrl('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newModel = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      provider: provider,
      modelId: modelId.trim() || name.toLowerCase().replace(/\s+/g, '-'),
      role: `Custom ${provider} endpoint with user-managed API key`,
      avatar: provider.includes('Claude') ? '🧠' : provider.includes('Gemini') ? '⚡' : '🤖',
      color: '#0b57d0',
      badge: 'User API Connected',
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      isCustom: true
    };

    onSaveModel(newModel);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-title-wrap">
            <Cpu size={22} className="text-indigo" />
            <div>
              <h2 className="settings-modal-title">Connect Custom AI Model</h2>
              <div className="settings-modal-subtitle">
                Add foundation models with your own API key to ground responses in Drive files
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="settings-modal-body">
            {/* Quick Presets */}
            <div className="form-group">
              <label>Quick Presets</label>
              <div className="preset-chips-wrap">
                {PRESETS.map(p => (
                  <button
                    type="button"
                    key={p.modelId}
                    className="preset-chip-btn"
                    onClick={() => handleSelectPreset(p)}
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Selection */}
            <div className="form-group">
              <label>Provider Platform</label>
              <select value={provider} onChange={e => setProvider(e.target.value)}>
                <option value="OpenAI">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="Anthropic">Anthropic (Claude 3.7 / 3.5)</option>
                <option value="Google Gemini">Google Gemini (Gemini 2.5 / 1.5)</option>
                <option value="OpenRouter">OpenRouter (Multi-Provider Gateway)</option>
                <option value="Custom">Custom OpenAI-Compatible (Ollama, Groq, LM Studio)</option>
              </select>
            </div>

            {/* Model Name */}
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                placeholder="e.g. My Production GPT-4o"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Model ID */}
            <div className="form-group">
              <label>Model ID / Slug</label>
              <input
                type="text"
                placeholder="e.g. gpt-4o-mini, claude-3-7-sonnet-20250219, gemini-2.5-flash"
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                required
              />
            </div>

            {/* API Key */}
            <div className="form-group">
              <label>API Key</label>
              <div className="api-key-input-wrap">
                <Key size={16} className="key-icon" />
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your provider API key (e.g. sk-..., AIzaSy...)"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="key-security-note">
                <ShieldCheck size={13} className="text-green" />
                <span>API keys are stored exclusively in your local browser session and never sent to our servers.</span>
              </div>
            </div>

            {/* Custom Base URL (Optional) */}
            {(provider === 'Custom' || provider === 'OpenRouter') && (
              <div className="form-group">
                <label>Base URL Endpoint</label>
                <input
                  type="text"
                  placeholder="e.g. http://localhost:11434/v1 or https://openrouter.ai/api/v1"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="settings-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim() || !apiKey.trim()}>
              <Sparkles size={15} />
              <span>Save & Connect Model</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
