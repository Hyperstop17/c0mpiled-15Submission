import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

export default function FilePreviewModal({ 
  file, 
  spaces, 
  onClose, 
  onMountToSpace,
  onNavigateToSpace
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'raw'
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(file.content || file.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSpaceName = (spId) => {
    const sp = spaces.find(s => s.id === spId);
    return sp ? sp.name : spId;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="file-preview-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <FileText size={20} className="text-cyan" />
            <div>
              <h2 className="modal-title">{file.name}</h2>
              <div className="modal-subtitle">
                {file.folder} • {file.author} • {file.size} • {(file.tokens / 1000).toFixed(1)}k Tokens
              </div>
            </div>
          </div>

          <div className="modal-header-actions">
            <button 
              className="action-btn-sm"
              onClick={handleCopyContent}
              title="Copy Content"
            >
              {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs-bar">
          <button 
            className={`modal-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <Sparkles size={14} className="text-amber" />
            <span>AI Synthesis & Vector Metadata</span>
          </button>
          <button 
            className={`modal-tab ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            <FileText size={14} />
            <span>Raw File Content</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-content">
          {activeTab === 'summary' ? (
            <div className="summary-tab-content">
              {/* AI Digest Card */}
              <div className="ai-digest-card">
                <div className="digest-header">
                  <Sparkles size={16} className="text-amber" />
                  <strong>Automated Semantic Overview:</strong>
                </div>
                <p className="digest-body">{file.summary}</p>
              </div>

              {/* Vector RAG Stats */}
              <div className="metadata-grid">
                <div className="meta-card">
                  <span className="meta-label">Grounding Status</span>
                  <div className="meta-val text-green">
                    <CheckCircle2 size={14} /> RAG Ready
                  </div>
                </div>
                <div className="meta-card">
                  <span className="meta-label">Context Window Impact</span>
                  <div className="meta-val text-indigo">
                    {(file.tokens / 1000).toFixed(1)}k Tokens
                  </div>
                </div>
                <div className="meta-card">
                  <span className="meta-label">Storage Folder</span>
                  <div className="meta-val">{file.folder}</div>
                </div>
                <div className="meta-card">
                  <span className="meta-label">File Type</span>
                  <div className="meta-val text-uppercase">{file.type}</div>
                </div>
              </div>

              {/* Connected Spaces List */}
              <div className="connected-spaces-box">
                <div className="box-title">
                  <Layers size={15} className="text-indigo" />
                  <strong>Currently Mounted in Collaborative Spaces:</strong>
                </div>
                {file.connectedSpaces?.length > 0 ? (
                  <div className="spaces-button-grid">
                    {file.connectedSpaces.map(spId => (
                      <button 
                        key={spId} 
                        className="space-nav-pill"
                        onClick={() => {
                          onNavigateToSpace(spId);
                          onClose();
                        }}
                      >
                        <span>#{getSpaceName(spId)}</span>
                        <ExternalLink size={12} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-spaces-text">
                    This file is not currently mounted to any active chat space.
                  </div>
                )}
              </div>

              {/* Tags */}
              {file.tags && (
                <div className="tags-row">
                  <span className="tags-label">Tags:</span>
                  {file.tags.map(t => (
                    <span key={t} className="file-tag-pill">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="raw-tab-content">
              <pre className="code-viewer-block">
                <code>{file.content || "No raw content preview available for this file format."}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            className="btn-mount-action"
            onClick={() => {
              onMountToSpace(file);
              onClose();
            }}
          >
            <Link2 size={15} />
            <span>Mount to Another Space</span>
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
