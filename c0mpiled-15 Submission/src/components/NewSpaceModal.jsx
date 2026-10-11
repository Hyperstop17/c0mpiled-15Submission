import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Bot, 
  Paperclip, 
  Users, 
  Check, 
  Sparkles 
} from 'lucide-react';

export default function NewSpaceModal({
  allFiles,
  allBots,
  teamMembers,
  onClose,
  onCreateSpace
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBotIds, setSelectedBotIds] = useState(['bot-gemini']);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState(['u-1']);

  const toggleBot = (botId) => {
    setSelectedBotIds(prev => 
      prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
    );
  };

  const toggleFile = (fileId) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleMember = (memberId) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSpace = {
      id: `space-${Date.now()}`,
      name: name.trim().replace(/^#/, ''),
      description: description.trim() || 'Collaborative AI chat space grounded in mounted Drive files.',
      activeBots: selectedBotIds.length > 0 ? selectedBotIds : ['bot-gemini'],
      members: selectedMemberIds,
      connectedFileIds: selectedFileIds,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          senderType: 'ai',
          botId: selectedBotIds[0] || 'bot-gemini',
          author: allBots.find(b => b.id === selectedBotIds[0])?.name || 'Gemini 3.8 Flash',
          avatar: '⚡',
          timestamp: 'Just now',
          content: `Welcome to **#${name.trim()}**! I have initialized this space with ${selectedFileIds.length} mounted Drive files and invited your selected collaborators. Ask me anything to get started!`,
        }
      ]
    };

    onCreateSpace(newSpace);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="new-space-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <MessageSquare size={20} className="text-indigo" />
            <div>
              <h2 className="modal-title">Create Collaborative Chat Space</h2>
              <div className="modal-subtitle">
                Set up a shared room where team members and AI bots collaborate with mounted files.
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          <div className="form-group">
            <label>Space Name</label>
            <div className="input-prefix-wrap">
              <span className="prefix">#</span>
              <input 
                type="text" 
                placeholder="e.g. q4-fundraising-strategy" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <input 
              type="text" 
              placeholder="What will your team and AI bots work on here?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Select AI Bots */}
          <div className="form-group">
            <label>Invited AI Models & Agents</label>
            <div className="selectable-chips-grid">
              {allBots.map(bot => {
                const isSelected = selectedBotIds.includes(bot.id);
                return (
                  <div 
                    key={bot.id} 
                    className={`bot-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleBot(bot.id)}
                  >
                    <span className="bot-select-avatar">{bot.avatar}</span>
                    <div className="bot-select-info">
                      <strong>{bot.name}</strong>
                      <span>{bot.badge}</span>
                    </div>
                    {isSelected && <Check size={14} className="check-mark" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mount Initial Drive Files */}
          <div className="form-group">
            <label>Mount Initial Drive Documents ({selectedFileIds.length} selected)</label>
            <div className="files-compact-selector">
              {allFiles.map(file => {
                const isSelected = selectedFileIds.includes(file.id);
                return (
                  <div 
                    key={file.id} 
                    className={`file-select-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleFile(file.id)}
                  >
                    <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <span className="file-name-text">{file.name}</span>
                    <span className="file-meta-tag">{(file.tokens / 1000).toFixed(1)}k tokens</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Create Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
