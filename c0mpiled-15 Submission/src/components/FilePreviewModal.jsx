import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Download, 
  Link2, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  Copy,
  Check,
  Send,
  MessageSquare,
  Info,
  Search,
  Code,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Bot,
  RefreshCw,
  Eye,
  ChevronRight,
  Cloud,
  Share2
} from 'lucide-react';
import { marked } from 'marked';
import { sendChatMessage } from '../services/chatService';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true
});

export default function FilePreviewModal({ 
  file, 
  spaces = [], 
  allBots = [],
  onClose, 
  onMountToSpace,
  onNavigateToSpace,
  onShareFile
}) {
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [pdfMode, setPdfMode] = useState('visual');
  
  // Co-Pilot Chat state
  const [selectedBotId, setSelectedBotId] = useState(allBots[0]?.id || 'bot-gemini');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatScrollRef = useRef(null);

  // Initialize chat greeting for this file
  useEffect(() => {
    if (file) {
      setChatMessages([
        {
          id: 'init-msg',
          senderType: 'ai',
          author: allBots.find(b => b.id === selectedBotId)?.name || 'AI Assistant',
          avatar: allBots.find(b => b.id === selectedBotId)?.avatar || '🤖',
          timestamp: 'Just now',
          content: `I have read and indexed **${file.name}** from AWS S3 (${file.size || 'indexed'}). You can ask me any question or request a summary grounded directly in this file.`
        }
      ]);
    }
  }, [file, selectedBotId]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  if (!file) return null;

  const activeBot = allBots.find(b => b.id === selectedBotId) || allBots[0] || {
    id: 'bot-gemini',
    name: 'Gemini 2.5 Flash',
    avatar: '⚡',
    color: '#0b57d0'
  };

  const hasLiveApiKey = Boolean(activeBot?.apiKey && activeBot.apiKey.trim());

  // Copy full content
  const handleCopyContent = () => {
    navigator.clipboard.writeText(file.content || file.summary || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download file locally
  const handleDownload = () => {
    const blob = new Blob([file.content || file.summary || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Send message in file co-pilot chat
  const handleSendMessage = async (customPrompt) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim() || isGenerating) return;

    if (!customPrompt) setChatInput('');
    setIsGenerating(true);

    const userMsg = {
      id: `u-${Date.now()}`,
      senderType: 'human',
      author: 'Damien K.',
      avatar: 'DK',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: promptToSend
    };

    setChatMessages(prev => [...prev, userMsg]);

    try {
      const result = await sendChatMessage({
        messageText: promptToSend,
        model: activeBot,
        connectedFiles: [file],
        spaceName: `File Review: ${file.name}`,
        conversationHistory: chatMessages
      });

      const aiMsg = {
        id: `ai-${Date.now() + 1}`,
        senderType: 'ai',
        author: activeBot.name,
        avatar: activeBot.avatar,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoningTime: result.reasoningTime || '1.1s',
        isLiveApi: result.isLiveApi,
        content: result.content
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          senderType: 'ai',
          author: activeBot.name,
          avatar: activeBot.avatar,
          timestamp: 'Just now',
          content: `Error: ${err.message}`
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // CSV parsing for spreadsheet view
  const csvData = useMemo(() => {
    if (file.type !== 'csv' || !file.content) return null;
    const lines = file.content.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return null;

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      // Simple CSV cell splitter
      return line.split(',').map(cell => cell.trim());
    });

    const filteredRows = tableSearch
      ? rows.filter(r => r.some(c => c.toLowerCase().includes(tableSearch.toLowerCase())))
      : rows;

    return { headers, rows: filteredRows, totalRows: rows.length };
  }, [file.type, file.content, tableSearch]);

  // Render file icon
  const getFileBadgeIcon = () => {
    switch (file.type) {
      case 'csv': return <FileSpreadsheet size={18} className="text-green" />;
      case 'code': return <FileCode size={18} className="text-purple" />;
      case 'image': return <ImageIcon size={18} className="text-indigo" />;
      case 'pdf': return <FileText size={18} className="text-rose" />;
      default: return <FileText size={18} className="text-blue" />;
    }
  };

  const getSpaceName = (spId) => {
    const sp = spaces.find(s => s.id === spId);
    return sp ? sp.name : spId;
  };

  return (
    <div className="modal-backdrop file-viewer-backdrop" onClick={onClose}>
      <div className="file-reader-workspace" onClick={e => e.stopPropagation()}>
        
        {/* Workspace Top Bar */}
        <header className="file-reader-header">
          <div className="header-left">
            <div className="file-icon-badge">
              {getFileBadgeIcon()}
            </div>
            <div className="file-title-meta">
              <div className="title-row">
                <h2 className="file-display-name">{file.name}</h2>
                <span className="file-type-pill">{file.type}</span>
                <span className="file-s3-pill" title="Synced to secure cloud storage">
                  <Cloud size={12} className="text-indigo" />
                  <span>Cloud Synced</span>
                </span>
              </div>
              <div className="file-sub-breadcrumbs">
                <span>📁 {file.folder || 'My Drive'}</span>
                <span>•</span>
                <span>{file.size}</span>
                <span>•</span>
                <span>{(file.tokens / 1000).toFixed(1)}k tokens</span>
              </div>
            </div>
          </div>

          <div className="header-right-actions">
            {/* Toggle Co-Pilot Chat */}
            <button 
              className={`action-btn-toolbar ${showChat ? 'active-toolbar-btn' : ''}`}
              onClick={() => setShowChat(!showChat)}
              title="Toggle AI Co-Pilot chat beside document"
            >
              <Sparkles size={15} className="text-amber" />
              <span>Ask AI About File</span>
            </button>

            {/* Mount to Space */}
            <button 
              className="action-btn-toolbar"
              onClick={() => onMountToSpace(file)}
              title="Mount this document to a collaborative chat space"
            >
              <Link2 size={15} />
              <span>Mount to Space</span>
            </button>

            {/* Copy Content */}
            <button 
              className="action-btn-toolbar"
              onClick={handleCopyContent}
              title="Copy file text"
            >
              {copied ? <Check size={15} className="text-green" /> : <Copy size={15} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Share Document */}
            {onShareFile && (
              <button 
                className="action-btn-toolbar"
                onClick={() => onShareFile(file)}
                title="Share this document with team collaborators"
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>
            )}

            {/* Download */}
            <button 
              className="action-btn-toolbar"
              onClick={handleDownload}
              title="Download file"
            >
              <Download size={15} />
              <span>Download</span>
            </button>

            {/* Metadata Info (Side drawer toggle) */}
            <button 
              className={`action-btn-toolbar icon-only ${showMetadata ? 'active-toolbar-btn' : ''}`}
              onClick={() => setShowMetadata(!showMetadata)}
              title="View file technical metadata & S3 URI"
            >
              <Info size={16} />
            </button>

            {/* Close */}
            <button className="reader-close-btn" onClick={onClose} title="Close file">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Area: Split View (Document Reader + AI Co-Pilot Chat) */}
        <div className="file-reader-main-split">
          
          {/* LEFT / CENTER: Actual Document Content Reader */}
          <div className={`document-reader-pane ${!showChat ? 'full-width' : ''}`}>
            
            {/* 1. Markdown Document View */}
            {file.type === 'markdown' && (
              <div className="document-paper-container">
                <article 
                  className="markdown-formatted-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(file.content || `# ${file.name}\n\n*No text content.*`) }}
                />
              </div>
            )}

            {/* 2. CSV / Spreadsheet Table View */}
            {file.type === 'csv' && csvData && (
              <div className="spreadsheet-reader-container">
                <div className="spreadsheet-toolbar">
                  <div className="spreadsheet-search-box">
                    <Search size={15} className="text-muted" />
                    <input 
                      type="text" 
                      placeholder="Search in table data..." 
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                    />
                    {tableSearch && (
                      <button className="clear-filter-btn" onClick={() => setTableSearch('')}>✕</button>
                    )}
                  </div>
                  <div className="spreadsheet-metrics-pill">
                    <span>{csvData.rows.length} of {csvData.totalRows} rows</span>
                    <span>•</span>
                    <span>{csvData.headers.length} columns</span>
                  </div>
                </div>

                <div className="spreadsheet-table-wrapper">
                  <table className="interactive-spreadsheet-table">
                    <thead>
                      <tr>
                        <th className="th-row-num">#</th>
                        {csvData.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={csvData.headers.length + 1} className="empty-table-row">
                            No rows matched "{tableSearch}".
                          </td>
                        </tr>
                      ) : (
                        csvData.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="td-row-num">{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className={!isNaN(cell.replace(/[$%,]/g, '')) ? 'cell-numeric' : ''}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Code View */}
            {file.type === 'code' && (
              <div className="code-reader-container">
                <div className="code-toolbar">
                  <div className="code-lang-pill">
                    <Code size={14} className="text-purple" />
                    <span>{file.name.split('.').pop()?.toUpperCase() || 'CODE'}</span>
                  </div>
                  <span className="code-stats">
                    {(file.content || '').split('\n').length} lines • {file.size}
                  </span>
                </div>
                <div className="code-editor-box">
                  <div className="code-line-numbers">
                    {(file.content || '').split('\n').map((_, idx) => (
                      <span key={idx} className="line-num">{idx + 1}</span>
                    ))}
                  </div>
                  <pre className="code-text-canvas">
                    <code>{file.content || '// Empty code file'}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* 4. PDF Document View */}
            {file.type === 'pdf' && (
              <div className="pdf-reader-container">
                <div className="pdf-toolbar-bar">
                  <div className="pdf-toolbar-left">
                    <span className="pdf-badge">PDF DOCUMENT</span>
                    <span className="pdf-page-count">{file.size}</span>
                  </div>
                  <div className="pdf-mode-toggle-group">
                    <button 
                      className={`pdf-mode-pill ${pdfMode === 'visual' ? 'active' : ''}`}
                      onClick={() => setPdfMode('visual')}
                    >
                      <Eye size={13} />
                      <span>Visual PDF</span>
                    </button>
                    <button 
                      className={`pdf-mode-pill ${pdfMode === 'text' ? 'active' : ''}`}
                      onClick={() => setPdfMode('text')}
                    >
                      <FileText size={13} />
                      <span>Extracted Text</span>
                    </button>
                  </div>
                </div>

                {pdfMode === 'visual' && file.dataUrl ? (
                  <iframe 
                    src={file.dataUrl} 
                    title={file.name}
                    className="pdf-iframe-frame"
                  />
                ) : (
                  <div className="document-paper-container">
                    <div className="doc-page-header">
                      <span className="doc-type-label">PDF TEXT STREAM</span>
                      <span className="doc-pages-info">{file.size} • Clean Extracted Text for AI</span>
                    </div>
                    <div className="doc-text-body">
                      <pre className="doc-plain-text">{file.content || file.summary || 'No extracted text found in PDF.'}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Word Document (.docx / .doc) */}
            {(file.type === 'docx' || file.type === 'doc') && (
              <div className="document-paper-container">
                <div className="doc-page-header">
                  <span className="doc-type-label">WORD DOCUMENT</span>
                  <span className="doc-pages-info">{file.size}</span>
                </div>
                {file.htmlContent ? (
                  <div 
                    className="docx-formatted-content" 
                    dangerouslySetInnerHTML={{ __html: file.htmlContent }} 
                  />
                ) : (
                  <div className="doc-text-body">
                    <pre className="doc-plain-text">{file.content || file.summary || 'No document content available.'}</pre>
                  </div>
                )}
              </div>
            )}

            {/* 6. Image View */}
            {file.type === 'image' && (
              <div className="image-reader-container">
                <div className="image-canvas-wrapper">
                  <img 
                    src={file.dataUrl || file.content || ''} 
                    alt={file.name} 
                    className="preview-image-element"
                  />
                </div>
              </div>
            )}

            {/* 7. Plain Text / Fallback */}
            {file.type !== 'markdown' && file.type !== 'csv' && file.type !== 'code' && file.type !== 'image' && file.type !== 'pdf' && file.type !== 'docx' && file.type !== 'doc' && (
              <div className="document-paper-container">
                <div className="doc-page-header">
                  <span className="doc-type-label">{file.type.toUpperCase()} DOCUMENT</span>
                  <span className="doc-pages-info">{file.size}</span>
                </div>
                <div className="doc-text-body">
                  <pre className="doc-plain-text">{file.content || file.summary || 'No text extracted.'}</pre>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Document Co-Pilot Chat Workspace */}
          {showChat && (
            <aside className="document-copilot-pane">
              
              {/* Co-Pilot Top Bar */}
              <div className="copilot-header">
                <div className="copilot-title-group">
                  <div className="copilot-avatar">
                    <Sparkles size={16} className="text-amber" />
                  </div>
                  <div>
                    <h3 className="copilot-title">Doc Co-Pilot</h3>
                    <div className="copilot-sub">Grounded exclusively in this file</div>
                  </div>
                </div>

                <div className="copilot-bot-picker">
                  <select 
                    value={selectedBotId} 
                    onChange={e => setSelectedBotId(e.target.value)}
                    className="copilot-model-select"
                  >
                    {allBots.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.avatar} {b.name} {b.apiKey ? '• 🟢 Live' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div className="copilot-quick-chips">
                <button 
                  className="quick-chip-btn"
                  onClick={() => handleSendMessage("Provide a clear 3-bullet summary of the core points in this document.")}
                  disabled={isGenerating}
                >
                  "Summarize key points"
                </button>
                <button 
                  className="quick-chip-btn"
                  onClick={() => handleSendMessage("Extract the key metrics, numbers, and dates from this file.")}
                  disabled={isGenerating}
                >
                  "Extract metrics & dates"
                </button>
                <button 
                  className="quick-chip-btn"
                  onClick={() => handleSendMessage("What are the potential risks, open questions, or action items outlined in this document?")}
                  disabled={isGenerating}
                >
                  "Risks & action items"
                </button>
              </div>

              {/* Chat Messages Stream */}
              <div className="copilot-messages-scroll">
                {chatMessages.map(msg => {
                  const isAi = msg.senderType === 'ai';
                  return (
                    <div key={msg.id} className={`copilot-msg-bubble ${isAi ? 'ai-bubble' : 'human-bubble'}`}>
                      <div className="msg-header-row">
                        <span className="msg-author">{msg.author}</span>
                        <span className="msg-time">{msg.timestamp}</span>
                        {msg.isLiveApi && <span className="live-pill-sm">🟢 Live</span>}
                      </div>
                      <div 
                        className="msg-body-markdown"
                        dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
                      />
                    </div>
                  );
                })}

                {isGenerating && (
                  <div className="copilot-msg-bubble ai-bubble generating-state">
                    <div className="generating-indicator">
                      <Sparkles size={14} className="text-amber spin" />
                      <span>{activeBot.name} is reading and synthesizing {file.name}...</span>
                    </div>
                  </div>
                )}
                <div ref={chatScrollRef} />
              </div>

              {/* Chat Input Box */}
              <div className="copilot-input-bar">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="copilot-form"
                >
                  <textarea 
                    placeholder={`Ask about ${file.name}... (Press Enter)`}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                  />
                  <button 
                    type="submit" 
                    className={`btn-copilot-send ${chatInput.trim() && !isGenerating ? 'active' : ''}`}
                    disabled={!chatInput.trim() || isGenerating}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>

            </aside>
          )}

          {/* SLIDE-OUT METADATA PANEL (Secondary 'side thing', toggled via info icon) */}
          {showMetadata && (
            <aside className="document-metadata-drawer">
              <div className="drawer-head">
                <div className="head-title">
                  <Info size={16} className="text-indigo" />
                  <h4>File Specifications</h4>
                </div>
                <button className="drawer-close" onClick={() => setShowMetadata(false)}>✕</button>
              </div>

              <div className="metadata-items-list">
                <div className="meta-spec-item">
                  <label>Storage Provider</label>
                  <div className="val text-green font-semibold">AWS S3 (Live Cloud Storage)</div>
                </div>

                <div className="meta-spec-item">
                  <label>S3 Bucket</label>
                  <code className="val-code">{file.s3Bucket || 'cognidrive-storage-450690783766'}</code>
                </div>

                <div className="meta-spec-item">
                  <label>S3 Key Path</label>
                  <code className="val-code">{file.s3Key || `users/damien-k/documents/${file.name}`}</code>
                </div>

                <div className="meta-spec-item">
                  <label>Context Tokens</label>
                  <div className="val text-indigo font-semibold">{(file.tokens / 1000).toFixed(1)}k tokens</div>
                </div>

                <div className="meta-spec-item">
                  <label>File Size</label>
                  <div className="val">{file.size}</div>
                </div>

                <div className="meta-spec-item">
                  <label>Author / Owner</label>
                  <div className="val">{file.author || 'Damien K.'}</div>
                </div>

                <div className="meta-spec-item">
                  <label>Last Updated</label>
                  <div className="val">{file.updatedAt}</div>
                </div>

                <div className="meta-spec-item">
                  <label>Mounted Spaces ({file.connectedSpaces?.length || 0})</label>
                  <div className="spaces-chips-drawer">
                    {file.connectedSpaces?.length > 0 ? (
                      file.connectedSpaces.map(spId => (
                        <button 
                          key={spId} 
                          className="drawer-space-chip"
                          onClick={() => {
                            onNavigateToSpace(spId);
                            onClose();
                          }}
                        >
                          #{getSpaceName(spId)}
                        </button>
                      ))
                    ) : (
                      <span className="text-dim">Not mounted to any chat space</span>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          )}

        </div>

      </div>
    </div>
  );
}
