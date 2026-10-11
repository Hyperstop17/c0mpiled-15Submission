import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  Zap, 
  Brain, 
  Code, 
  Scale, 
  Plus, 
  Key, 
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function AgentsView({ bots = [], spaces = [], onOpenAddModel, onDeleteCustomBot }) {
  const getBotIcon = (bot) => {
    if (bot.avatar && typeof bot.avatar === 'string' && bot.avatar.length <= 4) {
      return <span style={{ fontSize: '20px' }}>{bot.avatar}</span>;
    }
    switch (bot.id) {
      case 'bot-gemini': return <Zap className="text-amber" size={24} />;
      case 'bot-claude': return <Brain className="text-indigo" size={24} />;
      case 'bot-coder': return <Code className="text-purple" size={24} />;
      case 'bot-legal': return <Scale className="text-rose" size={24} />;
      default: return <Bot className="text-cyan" size={24} />;
    }
  };

  return (
    <div className="agents-view-container">
      <div className="agents-header">
        <div>
          <h1 className="view-heading">AI Models & Foundation Registry</h1>
          <p className="view-subheading">
            Connect your own API keys (OpenAI, Claude, Gemini, or local models) or use pre-configured team agents to ground responses in Drive files.
          </p>
        </div>
        <button className="btn-primary" onClick={onOpenAddModel}>
          <Plus size={16} />
          <span>Connect Custom Model / API Key</span>
        </button>
      </div>

      <div className="agents-grid">
        {(bots || []).map(bot => {
          const spacesActiveIn = (spaces || []).filter(s => s.activeBots?.includes(bot.id));
          const hasApiKey = Boolean(bot.apiKey && bot.apiKey.trim());

          return (
            <div key={bot.id} className={`agent-card ${bot.isCustom ? 'custom-model-card' : ''}`}>
              <div className="agent-card-header">
                <div className="agent-avatar-wrap">
                  {getBotIcon(bot)}
                </div>
                <div className="agent-title-block">
                  <div className="agent-title-row">
                    <h3 className="agent-name">{bot.name}</h3>
                    {bot.isCustom && <span className="custom-badge-tag">Custom</span>}
                  </div>
                  <span className="agent-provider">{bot.provider} {bot.modelId ? `• ${bot.modelId}` : ''}</span>
                </div>
                
                {hasApiKey ? (
                  <span className="badge-agent-status live-api" title="Live API Key Connected">
                    <Key size={12} className="text-green" /> Live API
                  </span>
                ) : (
                  <span className="badge-agent-status">
                    <CheckCircle2 size={12} className="text-green" /> Ready
                  </span>
                )}
              </div>

              <div className="agent-role-desc">
                {bot.role}
              </div>

              <div className="agent-specs-box">
                <div className="spec-row">
                  <span className="spec-label">Specialization:</span>
                  <span className="spec-val font-semibold">{bot.badge}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Active Spaces:</span>
                  <span className="spec-val">
                    {spacesActiveIn.length} ({spacesActiveIn.map(s => `#${s.name.split(' ')[0]}`).join(', ') || 'Available in all'})
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">RAG Grounding:</span>
                  <span className="spec-val text-green font-semibold">Enabled (AWS S3)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Execution Mode:</span>
                  <span className={`spec-val font-semibold ${hasApiKey ? 'text-green' : 'text-indigo'}`}>
                    {hasApiKey ? 'Direct Live API' : 'Simulated / Sandbox'}
                  </span>
                </div>
              </div>

              {bot.isCustom && onDeleteCustomBot && (
                <div className="agent-card-footer">
                  <button 
                    className="btn-delete-agent" 
                    onClick={() => onDeleteCustomBot(bot.id)}
                    title="Remove custom model"
                  >
                    <Trash2 size={13} />
                    <span>Remove Model</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
