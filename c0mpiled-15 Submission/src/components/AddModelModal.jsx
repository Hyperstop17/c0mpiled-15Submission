import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Key, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  Brain,
  Globe,
  Terminal
} from 'lucide-react';
import { fetchProviderModels } from '../services/chatService';

export const MODEL_FAMILIES = {
  OpenAI: {
    name: 'OpenAI',
    defaultModel: 'gpt-4o',
    avatar: '🟢',
    color: '#10a37f',
    keyPlaceholder: 'sk-proj-... or sk-...',
    description: 'GPT-4o, GPT-4o Mini, and o3-mini reasoning models',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (Recommended • Flagship Omni)', badge: 'Omni' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-Efficient)', badge: 'Fast' },
      { id: 'o3-mini', label: 'o3-mini (STEM & Deep Reasoning)', badge: 'Reasoning' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo (High Precision)', badge: 'Accurate' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legacy)', badge: 'Legacy' }
    ]
  },
  Anthropic: {
    name: 'Anthropic',
    defaultModel: 'claude-3-7-sonnet-20250219',
    avatar: '🧠',
    color: '#d97706',
    keyPlaceholder: 'sk-ant-api03-...',
    description: 'Claude 3.7 Sonnet hybrid reasoning & 3.5 Sonnet coding models',
    models: [
      { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Recommended • Hybrid Reasoning)', badge: 'Hybrid' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Nuanced Analysis & Code)', badge: 'Flagship' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Ultra-Fast & Lightweight)', badge: 'Fast' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Writing & Complex Nuance)', badge: 'Deep' }
    ]
  },
  'Google Gemini': {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    avatar: '⚡',
    color: '#3b82f6',
    keyPlaceholder: 'AIzaSy...',
    description: 'Gemini 2.0 Flash 1M tokens & Gemini 1.5 Pro multimodal',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended • 1M Context Window)', badge: '1M Context' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast Multimodal)', badge: 'High Speed' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (2M Tokens Deep Context)', badge: '2M Context' }
    ]
  },
  Groq: {
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    avatar: '⚡',
    color: '#f97316',
    keyPlaceholder: 'gsk_...',
    description: 'Llama 3.3 70B & 8B hosted on Groq LPUs with 700 tokens/sec',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Recommended • 700 tokens/sec)', badge: '70B' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra-Low Latency)', badge: 'Instant' }
    ]
  },
  OpenRouter: {
    name: 'OpenRouter',
    defaultModel: 'deepseek/deepseek-chat',
    avatar: '🌐',
    color: '#8b5cf6',
    keyPlaceholder: 'sk-or-v1-...',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'Access DeepSeek V3, Claude, and Llama 3 via unified OpenRouter gateway',
    models: [
      { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Recommended • SOTA Open Weights)', badge: 'DeepSeek' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via OpenRouter)', badge: 'Claude' },
      { id: 'openai/gpt-4o', label: 'GPT-4o (via OpenRouter)', badge: 'OpenAI' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct (via OpenRouter)', badge: 'Llama' }
    ]
  },
  Custom: {
    name: 'Custom / Local',
    defaultModel: 'llama3',
    avatar: '💻',
    color: '#64748b',
    keyPlaceholder: 'Enter bearer token or leave "local" for Ollama',
    baseUrl: 'http://localhost:11434/v1',
    description: 'Connect private OpenAI-compatible endpoints or local Ollama instances',
    models: [
      { id: 'llama3', label: 'Ollama Llama 3 (Local)', badge: 'Local' },
      { id: 'mistral', label: 'Ollama Mistral (Local)', badge: 'Local' },
      { id: 'qwen2.5-coder', label: 'Qwen 2.5 Coder (Local)', badge: 'Local' }
    ]
  }
};

export default function AddModelModal({ isOpen, onClose, onSaveModel }) {
  const [provider, setProvider] = useState('OpenAI');
  const [name, setName] = useState('OpenAI GPT-4o');
  const [modelId, setModelId] = useState('gpt-4o');
  const [customModelIdInput, setCustomModelIdInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  // Dynamic API Model Detection
  const [availableModels, setAvailableModels] = useState(() => MODEL_FAMILIES.OpenAI.models);
  const [isDetectingModels, setIsDetectingModels] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // When provider changes, update default model, models list, display name, and endpoint
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setDetectionStatus(null);
    const family = MODEL_FAMILIES[newProvider] || MODEL_FAMILIES.OpenAI;
    
    setAvailableModels(family.models);
    setModelId(family.defaultModel);
    setName(`${family.name} ${family.models[0]?.label.split(' ')[0] || ''}`.trim());
    
    if (family.baseUrl) {
      setBaseUrl(family.baseUrl);
    } else {
      setBaseUrl('');
    }
  };

  // Auto-detect provider family when user types or pastes an API key
  const handleApiKeyChange = (val) => {
    setApiKey(val);
    setDetectionStatus(null);
    const trimmed = val.trim();

    if (trimmed.startsWith('sk-ant-') && provider !== 'Anthropic') {
      handleProviderChange('Anthropic');
    } else if (trimmed.startsWith('AIza') && provider !== 'Google Gemini') {
      handleProviderChange('Google Gemini');
    } else if (trimmed.startsWith('gsk_') && provider !== 'Groq') {
      handleProviderChange('Groq');
    } else if (trimmed.startsWith('sk-or-') && provider !== 'OpenRouter') {
      handleProviderChange('OpenRouter');
    } else if (trimmed.startsWith('sk-') && !trimmed.startsWith('sk-ant-') && !trimmed.startsWith('sk-or-') && provider !== 'OpenAI') {
      handleProviderChange('OpenAI');
    }
  };

  // Live Auto-Detection: Query provider API for live models
  const handleAutoDetectFromApi = async () => {
    if (!apiKey.trim()) {
      setDetectionStatus({ type: 'error', message: 'Please paste your API key first to auto-detect models.' });
      return;
    }

    setIsDetectingModels(true);
    setDetectionStatus(null);

    try {
      const result = await fetchProviderModels({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || undefined
      });

      if (result.success && result.models?.length > 0) {
        const formatted = result.models.map(id => ({
          id,
          label: id,
          badge: 'Live API'
        }));
        
        setAvailableModels(formatted);
        const bestModel = result.recommendedModel || formatted[0].id;
        setModelId(bestModel);
        setName(`${provider} ${bestModel.split(/[-_/]/)[0].toUpperCase()}`);
        setDetectionStatus({
          type: 'success',
          message: `✓ Connected! Found ${result.models.length} live models on your ${provider} account.`
        });
      } else {
        setDetectionStatus({
          type: 'error',
          message: result.error || `Could not auto-fetch models. Falling back to default ${provider} presets.`
        });
      }
    } catch (err) {
      setDetectionStatus({
        type: 'error',
        message: err.message || 'API verification failed. Check key format.'
      });
    } finally {
      setIsDetectingModels(false);
    }
  };

  const handleSelectModel = (selectedId) => {
    setModelId(selectedId);
    if (selectedId !== 'custom_manual') {
      const found = availableModels.find(m => m.id === selectedId);
      const label = found ? found.label.split(' ')[0] : selectedId;
      setName(`${provider} ${label}`.trim());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalModelId = (modelId === 'custom_manual' ? customModelIdInput.trim() : modelId) || 'gpt-4o';
    const family = MODEL_FAMILIES[provider] || MODEL_FAMILIES.OpenAI;

    const newModel = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      provider: provider,
      modelId: finalModelId,
      role: `${provider} foundation model grounded in Drive documents`,
      avatar: family.avatar,
      color: family.color,
      badge: 'Live API Key',
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      isCustom: true
    };

    onSaveModel(newModel);
    onClose();
  };

  if (!isOpen) return null;
  const currentFamily = MODEL_FAMILIES[provider] || MODEL_FAMILIES.OpenAI;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-title-wrap">
            <Cpu size={22} className="text-indigo" />
            <div>
              <h2 className="settings-modal-title">Connect AI Model & API Key</h2>
              <div className="settings-modal-subtitle">
                Select your model family and plug in your API key to ground responses in your Drive files
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="settings-modal-body" style={{ gap: '16px' }}>
            
            {/* 1. Model Family Selection */}
            <div className="form-group">
              <label>Model Family / Provider</label>
              <select 
                value={provider} 
                onChange={e => handleProviderChange(e.target.value)}
                style={{ fontSize: '14.5px', fontWeight: '500' }}
              >
                <option value="OpenAI">OpenAI (GPT-4o, GPT-4o-mini, o3-mini)</option>
                <option value="Anthropic">Anthropic (Claude 3.7 Sonnet, Claude 3.5 Sonnet/Haiku)</option>
                <option value="Google Gemini">Google Gemini (Gemini 2.0 Flash, 1.5 Pro)</option>
                <option value="Groq">Groq (Llama 3.3 70B Ultra-Fast)</option>
                <option value="OpenRouter">OpenRouter (DeepSeek V3, Multi-Provider Gateway)</option>
                <option value="Custom">Custom / Local (Ollama, LM Studio, Private Server)</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {currentFamily.description}
              </span>
            </div>

            {/* 2. API Key Input with Auto-Detect */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Provider API Key</label>
                <button
                  type="button"
                  onClick={handleAutoDetectFromApi}
                  disabled={isDetectingModels || apiKey.trim().length < 5}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: apiKey.trim().length >= 5 ? 'var(--google-blue)' : 'var(--text-muted)',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: apiKey.trim().length >= 5 ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px'
                  }}
                  title="Query API to verify key and auto-load available models"
                >
                  <RefreshCw size={13} className={isDetectingModels ? 'spinner' : ''} />
                  <span>{isDetectingModels ? 'Verifying...' : 'Auto-Detect via API'}</span>
                </button>
              </div>

              <div className="api-key-input-wrap">
                <Key size={16} className="key-icon" />
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`e.g. ${currentFamily.keyPlaceholder}`}
                  value={apiKey}
                  onChange={e => handleApiKeyChange(e.target.value)}
                  required
                  autoFocus
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

              {/* Verification Feedback Banner */}
              {detectionStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  backgroundColor: detectionStatus.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: detectionStatus.type === 'success' ? '#16a34a' : '#dc2626'
                }}>
                  {detectionStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{detectionStatus.message}</span>
                </div>
              )}
            </div>

            {/* 3. Intuitive Model Selector Dropdown (No typing needed!) */}
            <div className="form-group">
              <label>Model ID (Auto-Selected)</label>
              <select 
                value={modelId} 
                onChange={e => handleSelectModel(e.target.value)}
                style={{ fontSize: '14px' }}
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.label || m.id} {m.badge ? `[${m.badge}]` : ''}
                  </option>
                ))}
                <option value="custom_manual">+ Custom model ID (enter manually)</option>
              </select>
            </div>

            {/* Optional Manual Model ID Override */}
            {modelId === 'custom_manual' && (
              <div className="form-group">
                <label>Manual Model Slug</label>
                <input
                  type="text"
                  placeholder="e.g. ft:gpt-4o-2024-08-06:my-org:custom-v1"
                  value={customModelIdInput}
                  onChange={e => setCustomModelIdInput(e.target.value)}
                  required
                />
              </div>
            )}

            {/* 4. Display Name */}
            <div className="form-group">
              <label>Display Name in Chat</label>
              <input
                type="text"
                placeholder="e.g. GPT-4o (Production)"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Custom Base URL (Optional for Ollama or Custom Gateways) */}
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

            <div className="key-security-note" style={{ marginTop: '4px' }}>
              <ShieldCheck size={14} className="text-green" />
              <span>Keys are saved to your secure browser workspace and authenticated directly through private API endpoints.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="settings-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!name.trim() || !apiKey.trim()}
            >
              <Sparkles size={15} />
              <span>Connect Model</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
