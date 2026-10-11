import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Sparkles, 
  FileText, 
  ExternalLink, 
  Check, 
  Share2, 
  Users, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Download, 
  Plus, 
  Link2, 
  X, 
  Eye, 
  FileSpreadsheet, 
  FileCode,
  HardDriveDownload,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Key,
  Cpu,
  Cloud
} from 'lucide-react';
import { sendChatMessage } from '../services/chatService';

export default function SpaceView({
  space,
  allFiles,
  allBots,
  teamMembers,
  onSendMessage,
  onMountFiles,
  onUnmountFile,
  onToggleFileContext,
  onOpenFile,
  onSaveArtifactToDrive,
  onOpenConnectModal,
  onOpenAddModel
}) {
  const [inputText, setInputText] = useState('');
  const [selectedBotId, setSelectedBotId] = useState(space.activeBots[0] || allBots[0]?.id || 'bot-gemini');
  const [showFilesDrawer, setShowFilesDrawer] = useState(true);
  const [expandedReasoning, setExpandedReasoning] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Keep selected bot valid if bots list changes
  useEffect(() => {
    if (!allBots.some(b => b.id === selectedBotId)) {
      setSelectedBotId(allBots[0]?.id || 'bot-gemini');
    }
  }, [allBots, selectedBotId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [space.messages, isGenerating]);

  // Connected files for this space
  const connectedFiles = allFiles.filter(f => space.connectedFileIds?.includes(f.id));
  
  // Total tokens in mounted files
  const totalMountedTokens = connectedFiles.reduce((sum, f) => sum + (f.tokens || 0), 0);
  const maxContextWindow = 1000000; // 1M tokens standard
  const contextPercentage = Math.min(100, ((totalMountedTokens / maxContextWindow) * 100).toFixed(1));

  const activeBot = allBots.find(b => b.id === selectedBotId) || allBots[0];
  const hasLiveApiKey = Boolean(activeBot?.apiKey && activeBot.apiKey.trim());

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return;

    const promptSnapshot = inputText;
    setInputText('');
    setIsGenerating(true);

    const userMessage = {
      id: `m-${Date.now()}`,
      senderType: 'human',
      author: 'Damien K.',
      avatar: 'DK',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: promptSnapshot
    };

    onSendMessage(space.id, userMessage);

    // Call unified chat service (real API if key configured, otherwise grounded RAG)
    try {
      const result = await sendChatMessage({
        messageText: promptSnapshot,
        model: activeBot,
        connectedFiles,
        spaceName: space.name,
        conversationHistory: space.messages || []
      });

      const aiResponse = {
        id: `m-${Date.now() + 1}`,
        senderType: 'ai',
        botId: activeBot.id,
        author: activeBot.name,
        avatar: activeBot.avatar,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoningTime: result.reasoningTime || '1.1s',
        isLiveApi: result.isLiveApi,
        content: result.content,
        citations: result.citations || [],
        hasArtifact: connectedFiles.length > 0 && !result.error,
        artifactData: {
          title: `Grounded_Synthesis_${Date.now().toString().slice(-4)}.md`,
          preview: result.content.slice(0, 160)
        }
      };

      onSendMessage(space.id, aiResponse);
    } catch (err) {
      const errResponse = {
        id: `m-${Date.now() + 1}`,
        senderType: 'ai',
        botId: activeBot.id,
        author: activeBot.name,
        avatar: activeBot.avatar,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoningTime: 'Failed',
        content: `Error generating response: ${err.message}`,
        citations: []
      };
      onSendMessage(space.id, errResponse);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleReasoning = (msgId) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const applySuggestedPrompt = (prompt) => {
    setInputText(prompt);
  };

  return (
    <div className="space-view-container">
      {/* Space Header */}
      <div className="space-header">
        <div className="space-title-block">
          <div className="space-heading-row">
            <h1 className="space-name">{space.name}</h1>
            <span className="badge-live-collab">Chat Space</span>
            {hasLiveApiKey && (
              <span className="badge-live-api-pill" title="Connected to live provider API via user key">
                🟢 Live API Connected
              </span>
            )}
          </div>
          <p className="space-desc">{space.description}</p>
        </div>

        <div className="space-header-right">
          <span className="space-owner-badge" title="Chat Space">Workspace</span>

          {/* Connected Files Button */}
          <button 
            className={`btn-connected-drawer ${showFilesDrawer ? 'active' : ''}`}
            onClick={() => setShowFilesDrawer(!showFilesDrawer)}
          >
            <Paperclip size={15} />
            <span>Files ({connectedFiles.length})</span>
          </button>

          <button 
            className="btn-connect-more"
            onClick={() => onOpenConnectModal && onOpenConnectModal(space.id)}
            title="Attach more files from Drive"
          >
            <Plus size={15} />
            <span>Mount File</span>
          </button>
        </div>
      </div>

      {/* Main Area: Split between Chat Stream and Connected Files Drawer */}
      <div className="space-main-body">
        
        {/* Chat Stream Area */}
        <div className="chat-stream-column">
          
          {/* Connected Files Summary Ribbon */}
          {connectedFiles.length > 0 && (
            <div className="grounding-context-ribbon">
              <div className="ribbon-left">
                <Sparkles size={14} className="text-amber" />
                <span className="ribbon-title">Grounded Context (AWS S3):</span>
                <div className="ribbon-files-list">
                  {connectedFiles.map(f => (
                    <span 
                      key={f.id} 
                      className="ribbon-file-tag"
                      onClick={() => onOpenFile(f)}
                      title={`Click to preview ${f.name}`}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ribbon-right">
                <span className="token-budget-pill">
                  {(totalMountedTokens / 1000).toFixed(1)}k Tokens
                </span>
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="messages-scroll-area">
            {space.messages.map((msg) => {
              const isAi = msg.senderType === 'ai';
              const bot = isAi ? allBots.find(b => b.id === msg.botId) : null;

              return (
                <div key={msg.id} className={`message-row ${isAi ? 'ai-row' : 'human-row'}`}>
                  <div className="message-avatar-wrap">
                    {isAi ? (
                      <div className="bot-avatar-badge" style={{ backgroundColor: bot?.color || '#0b57d0' }}>
                        {msg.avatar || '🤖'}
                      </div>
                    ) : (
                      <div className="human-avatar-badge">
                        {msg.avatar || 'DK'}
                      </div>
                    )}
                  </div>

                  <div className="message-content-wrapper">
                    <div className="message-header">
                      <span className="message-author">{msg.author}</span>
                      {isAi && (
                        <span className="ai-provider-badge">
                          {bot?.provider || 'AI Model'}
                        </span>
                      )}
                      {msg.isLiveApi && (
                        <span className="badge-live-tag">Live Key</span>
                      )}
                      {msg.reasoningTime && (
                        <span className="reasoning-time-badge">
                          ⚡ {msg.reasoningTime}
                        </span>
                      )}
                      <span className="message-timestamp">{msg.timestamp}</span>

                      <div className="message-actions-inline">
                        <button 
                          className="msg-action-btn"
                          title="Copy text"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                        >
                          {copiedId === msg.id ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Reasoning Collapsible for AI */}
                    {isAi && (
                      <div className="reasoning-collapsible">
                        <button 
                          className="reasoning-toggle-btn"
                          onClick={() => toggleReasoning(msg.id)}
                        >
                          {expandedReasoning[msg.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span>Chain-of-thought grounding inspection</span>
                        </button>
                        {expandedReasoning[msg.id] && (
                          <div className="reasoning-content-box">
                            <p><strong>Vector Grounding pass:</strong> Scanned {connectedFiles.length} mounted documents from AWS S3 storage.</p>
                            <p><strong>Active Model:</strong> {bot?.name} ({bot?.provider}) • Context: {totalMountedTokens.toLocaleString()} tokens.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main text content */}
                    <div className="message-body-text">
                      {msg.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} style={{ marginBottom: '8px' }}>{paragraph}</p>
                      ))}
                    </div>

                    {/* Citations Box */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="citations-container">
                        <div className="citations-header">
                          <Link2 size={13} className="text-indigo" />
                          <span>Grounded Source Citations from Drive:</span>
                        </div>
                        <div className="citations-grid">
                          {msg.citations.map((cite, cIdx) => {
                            const sourceFile = allFiles.find(f => f.id === cite.fileId);
                            return (
                              <div 
                                key={cIdx} 
                                className="citation-card"
                                onClick={() => sourceFile && onOpenFile(sourceFile)}
                                title="Click to inspect source file in Drive"
                              >
                                <div className="citation-title">
                                  <FileText size={12} className="text-cyan" />
                                  <span>{cite.fileName}</span>
                                  <ExternalLink size={10} style={{ marginLeft: 'auto' }} />
                                </div>
                                <div className="citation-excerpt">
                                  "{cite.excerpt}"
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Save to Drive Artifact CTA */}
                    {isAi && msg.hasArtifact && (
                      <div className="save-artifact-banner">
                        <div className="artifact-banner-left">
                          <Sparkles size={15} className="text-amber" />
                          <div>
                            <strong>Generated Artifact:</strong> {msg.artifactData?.title}
                            <span className="artifact-preview-sub">Save this grounded analysis directly to your Drive</span>
                          </div>
                        </div>
                        <button 
                          className="btn-save-drive"
                          onClick={() => onSaveArtifactToDrive(space.id, msg.artifactData, msg.content)}
                        >
                          <HardDriveDownload size={14} />
                          <span>Save to Drive</span>
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {isGenerating && (
              <div className="message-row ai-row generating-row">
                <div className="message-avatar-wrap">
                  <div className="bot-avatar-badge" style={{ backgroundColor: activeBot?.color || '#0b57d0' }}>
                    {activeBot?.avatar || '⚡'}
                  </div>
                </div>
                <div className="generating-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="generating-text">
                    {hasLiveApiKey ? `${activeBot?.name} generating live response...` : `${activeBot?.name} grounding across ${connectedFiles.length} files...`}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Example Suggestions */}
          <div className="space-prompts-bar">
            <span className="prompts-label">Try example:</span>
            <button 
              className="prompt-chip" 
              onClick={() => applySuggestedPrompt("Summarize key points from my mounted files")}
            >
              "Summarize key points from mounted files"
            </button>
            <button 
              className="prompt-chip" 
              onClick={() => applySuggestedPrompt("What are the main risks and operational action items in these documents?")}
            >
              "Extract risks & action items"
            </button>
            {connectedFiles.length === 0 && (
              <button 
                className="prompt-chip highlight" 
                onClick={onOpenConnectModal}
              >
                + Mount a file to ground answers
              </button>
            )}
          </div>

          {/* Bottom Chat Prompt Box */}
          <div className="space-input-box">
            <div className="input-toolbar-top">
              {/* Bot Selector */}
              <div className="bot-selector-wrap">
                <span className="model-label">Model:</span>
                <select 
                  value={selectedBotId} 
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="model-select"
                >
                  {allBots.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.avatar} {b.name} ({b.provider}) {b.apiKey ? '• 🟢 Live' : ''}
                    </option>
                  ))}
                </select>

                {onOpenAddModel && (
                  <button 
                    type="button" 
                    className="btn-add-model-quick" 
                    onClick={onOpenAddModel}
                    title="Add custom model or API key"
                  >
                    <Plus size={13} />
                    <span>API Key</span>
                  </button>
                )}
              </div>

              <div className="input-hint-right">
                {hasLiveApiKey ? (
                  <span className="text-green font-semibold">🟢 Using Your Live API Key</span>
                ) : (
                  <span>Grounded in {connectedFiles.length} file(s) via AWS S3</span>
                )}
              </div>
            </div>

            <div className="input-textarea-wrapper">
              <textarea 
                placeholder={`Ask ${activeBot?.name || 'AI'} anything about the ${connectedFiles.length} connected files... (Press Enter to send)`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <div className="input-buttons-row">
                <button 
                  className="input-action-icon" 
                  title="Mount files from Drive"
                  onClick={onOpenConnectModal}
                >
                  <Paperclip size={16} />
                </button>
                <button 
                  className={`btn-send-message ${inputText.trim() && !isGenerating ? 'active' : ''}`}
                  onClick={handleSend}
                  disabled={!inputText.trim() || isGenerating}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Connected Files Drawer */}
        {showFilesDrawer && (
          <div className="connected-files-drawer">
            <div className="drawer-header">
              <div className="drawer-title">
                <Layers size={16} className="text-indigo" />
                <span>Mounted Drive Context</span>
              </div>
              <button 
                className="drawer-close-btn"
                onClick={() => setShowFilesDrawer(false)}
              >
                <X size={15} />
              </button>
            </div>

            {/* Context Budget Meter */}
            <div className="context-meter-box">
              <div className="meter-label-row">
                <span>RAG Context Utilization</span>
                <span className="meter-percent">{contextPercentage}%</span>
              </div>
              <div className="meter-bar-track">
                <div 
                  className="meter-bar-fill" 
                  style={{ width: `${contextPercentage}%` }}
                ></div>
              </div>
              <div className="meter-caption">
                {(totalMountedTokens / 1000).toFixed(1)}k / {(maxContextWindow / 1000).toFixed(0)}k Max Window
              </div>
            </div>

            {/* Files List in Space */}
            <div className="drawer-files-list">
              <div className="drawer-section-title">
                MOUNTED REPOSITORY FILES ({connectedFiles.length})
              </div>

              {connectedFiles.length === 0 ? (
                <div className="empty-drawer-state">
                  <AlertCircle size={28} className="text-muted" />
                  <p>No files mounted to this space yet.</p>
                  <button className="btn-mount-first" onClick={onOpenConnectModal}>
                    + Mount Files from Drive
                  </button>
                </div>
              ) : (
                connectedFiles.map(file => (
                  <div key={file.id} className="drawer-file-item">
                    <div className="drawer-file-left" onClick={() => onOpenFile(file)}>
                      <FileText size={16} className="file-icon text-cyan" />
                      <div className="drawer-file-info">
                        <span className="drawer-file-name" title={file.name}>{file.name}</span>
                        <span className="drawer-file-tokens">{(file.tokens / 1000).toFixed(1)}k tokens • {file.type}</span>
                      </div>
                    </div>
                    <div className="drawer-file-actions">
                      <button 
                        className="btn-drawer-inspect"
                        title="Preview file"
                        onClick={() => onOpenFile(file)}
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        className="btn-drawer-unlink"
                        title="Unmount from this space"
                        onClick={() => onUnmountFile(space.id, file.id)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="drawer-footer-actions">
              <button className="btn-add-more-drive" onClick={onOpenConnectModal}>
                <Plus size={14} />
                <span>Mount More Files</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
