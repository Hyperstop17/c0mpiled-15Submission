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
  MessageSquare
} from 'lucide-react';

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
  onOpenConnectModal
}) {
  const [inputText, setInputText] = useState('');
  const [selectedBotId, setSelectedBotId] = useState(space.activeBots[0] || 'bot-gemini');
  const [showFilesDrawer, setShowFilesDrawer] = useState(true);
  const [expandedReasoning, setExpandedReasoning] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [space.messages, isGenerating]);

  // Connected files for this space
  const connectedFiles = allFiles.filter(f => space.connectedFileIds?.includes(f.id));
  
  // Total tokens in mounted files
  const totalMountedTokens = connectedFiles.reduce((sum, f) => sum + (f.tokens || 0), 0);
  const maxContextWindow = 1000000; // 1M tokens (Gemini 3.8 standard)
  const contextPercentage = Math.min(100, ((totalMountedTokens / maxContextWindow) * 100).toFixed(1));

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;

    // Detect @bot mention if present
    const lower = inputText.toLowerCase();
    let respondentBotId = selectedBotId;
    if (lower.includes('@claude')) respondentBotId = 'bot-claude';
    else if (lower.includes('@gemini')) respondentBotId = 'bot-gemini';
    else if (lower.includes('@code') || lower.includes('@synthesizer')) respondentBotId = 'bot-coder';
    else if (lower.includes('@compliance') || lower.includes('@legal') || lower.includes('@audit')) respondentBotId = 'bot-legal';

    const activeBot = allBots.find(b => b.id === respondentBotId) || allBots[0];

    const userMessage = {
      id: `m-${Date.now()}`,
      senderType: 'human',
      author: 'Damien K.',
      avatar: 'DK',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: inputText
    };

    onSendMessage(space.id, userMessage);
    const promptSnapshot = inputText;
    setInputText('');
    setIsGenerating(true);

    // Simulate AI response grounded in the connected files
    setTimeout(() => {
      let content = '';
      let citations = [];
      let artifactTitle = `Synthesis_${Date.now().toString().slice(-4)}.md`;
      let artifactPreview = '';

      if (connectedFiles.length === 0) {
        content = `I received your prompt: "${promptSnapshot}".\n\nNotice: **No files are currently mounted to #${space.name}**. To ground my answers in verified company documentation with exact line citations, click **+ Mount File** in the top right to attach files from your AI Drive.`;
      } else {
        // Find matching files based on prompt keywords
        const financialFile = connectedFiles.find(f => f.name.includes('Financial') || f.tags?.includes('Finance'));
        const archFile = connectedFiles.find(f => f.name.includes('Architecture') || f.tags?.includes('Architecture'));
        const interviewFile = connectedFiles.find(f => f.name.includes('Interview') || f.tags?.includes('Interviews'));
        const legalFile = connectedFiles.find(f => f.name.includes('Agreement') || f.tags?.includes('Legal'));
        const competitorFile = connectedFiles.find(f => f.name.includes('Competitor') || f.tags?.includes('Strategy'));

        if ((lower.includes('margin') || lower.includes('mrr') || lower.includes('financial') || lower.includes('revenue')) && financialFile) {
          content = `According to **${financialFile.name}**, your Q3 performance demonstrated remarkable operating leverage:
- **MRR Expansion**: September MRR closed at **$550,000** (up from $420,000 in July), totaling **$1.455M** for the quarter.
- **Gross Margins**: Reached **80.5%** in September, driven by a **14% unit cost decrease in GPU inference** through dynamic quantization.
- **Customer Acquisition**: CAC dropped from $185 to $164, while LTV climbed to $16,200.

**Strategic takeaway for #${space.name}**: Reinvesting these inference savings directly into real-time collaborative vector indexing will solidify our margin moat against single-model competitors.`;
          citations = [{ fileId: financialFile.id, fileName: financialFile.name, excerpt: 'September MRR $550k, Gross Margin 80.5%, CAC $164, GPU inference cost -14%' }];
          artifactTitle = 'Q3_Financial_Defensibility_Analysis.md';
          artifactPreview = 'Detailed breakdown of MRR expansion, unit inference savings, and CAC/LTV trajectory...';
        } else if ((lower.includes('interview') || lower.includes('customer') || lower.includes('feedback')) && interviewFile) {
          content = `Cross-referencing customer discovery notes in **${interviewFile.name}**:
1. **The Isolated AI Tab Problem**: **94% of teams** reported that employees copy-paste confidential enterprise files into disconnected personal browser tabs.
2. **Drive Disconnect**: Static cloud drives (SharePoint / Google Drive) are treated as file cemeteries—teams cannot collaborate in live chat channels grounded in those documents.
3. **Core Demand**: A unified platform where team members and AI bots share the same mounted Drive documents in transparent, auditable rooms.`;
          citations = [{ fileId: interviewFile.id, fileName: interviewFile.name, excerpt: '94% of enterprise teams report employees dumping files into disconnected personal tabs...' }];
          artifactTitle = 'Enterprise_Customer_Pain_Points_Brief.md';
          artifactPreview = 'Consolidated synthesis of enterprise customer interviews highlighting isolated AI tab friction...';
        } else if ((lower.includes('privacy') || lower.includes('training') || lower.includes('legal') || lower.includes('msa') || lower.includes('compliance')) && legalFile) {
          content = `I reviewed the contractual covenants in **${legalFile.name}**:
- **Section 4.1 (Customer Data Ownership)**: The customer retains full, perpetual ownership of all files and prompts.
- **Section 4.2 (Zero AI Training Prohibition)**: Explicitly guarantees that Customer Data will *never* be utilized to train, retrain, or fine-tune public foundation models.
- **Section 4.3 (Ephemeral Cache Retention)**: Guarantees zero retention on inference buffers.`;
          citations = [{ fileId: legalFile.id, fileName: legalFile.name, excerpt: 'Section 4.2: Customer Data shall NEVER be utilized to train foundation models.' }];
          artifactTitle = 'Compliance_Privacy_Audit_Summary.md';
          artifactPreview = 'Legal verification of Section 4 zero-training guarantees and data ownership clauses...';
        } else if ((lower.includes('competitor') || lower.includes('notebooklm') || lower.includes('market')) && competitorFile) {
          content = `Evaluating against **${competitorFile.name}**:
- **NotebookLM**: Excellent grounding, but restricted to single-player audio/notes and limited to Gemini with no multi-user channels or file write-back.
- **ChatGPT Team**: Lacks a real hierarchical Drive, file tagging, and multi-model flexibility.
- **CogniDrive Advantage**: True collaborative Drive + multi-model spaces where ${connectedFiles.length} files are mounted in real-time and team members co-prompt transparently.`;
          citations = [{ fileId: competitorFile.id, fileName: competitorFile.name, excerpt: 'NotebookLM lacks collaborative team channels; CogniDrive unifies Drive + multi-model spaces.' }];
          artifactTitle = 'Competitive_Differentiation_Report.md';
          artifactPreview = 'Market matrix comparing NotebookLM, ChatGPT Team, and CogniDrive capabilities...';
        } else {
          // General grounded synthesis across mounted files
          content = `Grounded synthesis for query: "${promptSnapshot}" across **${connectedFiles.length} mounted Drive files**:

1. **Contextual Correlation**: Scanned mounted sources including ${connectedFiles.map(f => `\`${f.name}\``).slice(0, 3).join(', ')}.
2. **Key Findings**: The mounted data directly supports a collaborative approach where teammates and domain bots operate with synchronized context.
3. **Execution Ready**: Generated action points have been prepared and can be committed directly to Drive as a reusable team document.`;
          citations = connectedFiles.slice(0, 2).map(f => ({
            fileId: f.id,
            fileName: f.name,
            excerpt: f.summary || `Grounded from ${f.name} in #${space.name}`
          }));
          artifactTitle = `Grounded_Action_Plan_${Date.now().toString().slice(-4)}.md`;
          artifactPreview = `Synthesis of ${connectedFiles.map(f => f.name).slice(0, 2).join(' and ')} for #${space.name}...`;
        }
      }

      const aiResponse = {
        id: `m-${Date.now() + 1}`,
        senderType: 'ai',
        botId: activeBot.id,
        author: activeBot.name,
        avatar: activeBot.avatar,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoningTime: activeBot.id === 'bot-gemini' ? '0.9s' : activeBot.id === 'bot-claude' ? '2.1s' : '1.4s',
        content: content,
        citations: citations,
        hasArtifact: connectedFiles.length > 0,
        artifactData: {
          title: artifactTitle,
          preview: artifactPreview
        }
      };

      onSendMessage(space.id, aiResponse);
      setIsGenerating(false);
    }, 1100);
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
          </div>
          <p className="space-desc">{space.description}</p>
        </div>

        <div className="space-header-right">
          <span className="space-owner-badge" title="Workspace Owner">Damien K.</span>

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
            onClick={onOpenConnectModal}
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
                <span className="ribbon-title">Grounded Context:</span>
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
              <div className="ribbon-token-stat">
                {(totalMountedTokens / 1000).toFixed(1)}k tokens in scope
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
                      <div className="bot-avatar-badge" style={{ backgroundColor: bot?.color || '#6366f1' }}>
                        {msg.avatar || '🤖'}
                      </div>
                    ) : (
                      <div className="human-avatar-badge">
                        {msg.avatar || 'U'}
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
                            <p><strong>Vector Grounding pass:</strong> Scanned {connectedFiles.length} mounted documents.</p>
                            <p><strong>Semantic Relevance:</strong> Matched key clauses in <code>{connectedFiles[0]?.name || 'Drive source'}</code> with 98.4% retrieval confidence.</p>
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
                            <div className="artifact-banner-desc">
                              Ready to be committed directly into your shared Drive repository.
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn-save-drive"
                          onClick={() => onSaveArtifactToDrive(space.id, msg.artifactData, msg.content, msg.author)}
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
                  <div className="bot-avatar-badge generating-pulse">⚡</div>
                </div>
                <div className="message-content-wrapper">
                  <div className="generating-indicator">
                    <Sparkles size={14} className="text-indigo spin" />
                    <span>Synthesizing answer from mounted Drive files...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Grounded Prompts */}
          <div className="suggested-prompts-bar">
            <span className="suggested-label">Suggestions:</span>
            <button 
              className="prompt-chip"
              onClick={() => applySuggestedPrompt("What are the key conflicts or agreements between our mounted files?")}
            >
              Analyze cross-file agreements
            </button>
            <button 
              className="prompt-chip"
              onClick={() => applySuggestedPrompt("Generate an executive 1-page summary grounded in these documents.")}
            >
              Draft 1-page executive summary
            </button>
            <button 
              className="prompt-chip"
              onClick={() => applySuggestedPrompt("What critical risks or gaps are missing from our current data?")}
            >
              Audit critical gaps & risks
            </button>
          </div>

          {/* Chat Input Box */}
          <div className="chat-input-container">
            <div className="input-toolbar-top">
              <div className="model-selector-wrapper">
                <span className="selector-label">Respondent:</span>
                <select 
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="model-select"
                >
                  {allBots.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.avatar} {b.name} ({b.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-hint-right">
                Use <strong>@bot</strong> or <strong>@filename</strong> to reference files
              </div>
            </div>

            <div className="input-textarea-wrapper">
              <textarea 
                placeholder={`Ask ${allBots.find(b => b.id === selectedBotId)?.name || 'AI'} anything about the ${connectedFiles.length} connected files... (Press Enter to send)`}
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
                        title="Preview File"
                        onClick={() => onOpenFile(file)}
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        className="btn-drawer-unlink"
                        title="Unmount from this Space"
                        onClick={() => onUnmountFile(space.id, file.id)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add More Files CTA */}
            <div className="drawer-footer-actions">
              <button className="btn-add-more-drive" onClick={onOpenConnectModal}>
                <Plus size={15} />
                <span>Attach Files from Drive</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
