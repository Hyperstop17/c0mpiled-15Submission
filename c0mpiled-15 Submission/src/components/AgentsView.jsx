import React from 'react';
import { Bot, Sparkles, Cpu, CheckCircle2, Zap, Brain, Code, Scale } from 'lucide-react';

export default function AgentsView({ bots, spaces }) {
  const getBotIcon = (botId) => {
    switch (botId) {
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
          <h1 className="view-heading">AI Models & Domain Agents Registry</h1>
          <p className="view-subheading">
            Configure multi-model orchestration across your collaborative spaces and mounted Drive documents.
          </p>
        </div>
      </div>

      <div className="agents-grid">
        {bots.map(bot => {
          const spacesActiveIn = spaces.filter(s => s.activeBots?.includes(bot.id));
          return (
            <div key={bot.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-avatar-wrap">
                  {getBotIcon(bot.id)}
                </div>
                <div className="agent-title-block">
                  <h3 className="agent-name">{bot.name}</h3>
                  <span className="agent-provider">{bot.provider}</span>
                </div>
                <span className="badge-agent-status">
                  <CheckCircle2 size={12} className="text-green" /> Active
                </span>
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
                    {spacesActiveIn.length} ({spacesActiveIn.map(s => `#${s.name.split(' ')[0]}`).join(', ') || 'None'})
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">RAG Grounding:</span>
                  <span className="spec-val text-green font-semibold">Enabled (Vector Chunks)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
