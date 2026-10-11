import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Folder, 
  Sparkles, 
  Check, 
  FileText,
  Layers
} from 'lucide-react';

export default function UploadFileModal({
  folders,
  spaces,
  currentSpaceId,
  onClose,
  onUploadFile
}) {
  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState(folders[0]?.name || 'Product Research');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [mountToCurrent, setMountToCurrent] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    // Detect type
    let type = 'markdown';
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.csv')) type = 'csv';
    else if (lower.endsWith('.pdf')) type = 'pdf';
    else if (lower.endsWith('.py') || lower.endsWith('.js') || lower.endsWith('.ts')) type = 'code';
    else if (lower.endsWith('.doc') || lower.endsWith('.docx')) type = 'doc';

    const words = (content || fileName).split(/\s+/).length;
    const estimatedTokens = Math.max(1200, Math.round(words * 1.3));

    const newFile = {
      id: `f-${Date.now()}`,
      name: fileName.trim(),
      type: type,
      size: `${Math.round(Math.max(12, content.length / 100))} KB`,
      tokens: estimatedTokens,
      status: 'indexed',
      folder: folder,
      updatedAt: 'Just now',
      author: 'Damien K. (You)',
      summary: summary.trim() || `Uploaded document containing ${words} words. Semantic vector index generated.`,
      content: content.trim() || `# ${fileName}\n\nUploaded file content indexed for CogniDrive collaborative spaces.`,
      tags: ['Uploaded', folder.split(' ')[0]],
      connectedSpaces: mountToCurrent && currentSpaceId ? [currentSpaceId] : []
    };

    onUploadFile(newFile);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Upload size={20} className="text-cyan" />
            <div>
              <h2 className="modal-title">Upload Document to AI Drive</h2>
              <div className="modal-subtitle">
                Files are automatically chunked, embedded, and indexed for collaborative RAG.
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          <div className="form-group">
            <label>File Name (with extension)</label>
            <input 
              type="text" 
              placeholder="e.g. Q4_Pitch_Deck_Script.md, API_Spec.json" 
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Target Drive Folder</label>
            <select 
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              {folders.map(f => (
                <option key={f.id} value={f.name}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quick Summary or Topic (Optional)</label>
            <input 
              type="text" 
              placeholder="Brief summary for instant RAG routing..." 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>File Content / Text</label>
            <textarea 
              rows={5}
              placeholder="Paste document text, Markdown, CSV data, or code here..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {currentSpaceId && (
            <div className="checkbox-row" onClick={() => setMountToCurrent(!mountToCurrent)}>
              <div className={`custom-checkbox ${mountToCurrent ? 'checked' : ''}`}>
                {mountToCurrent && <Check size={12} />}
              </div>
              <span className="checkbox-label">
                Mount directly to current active space (makes immediately accessible to AI bots)
              </span>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!fileName.trim()}>
              <Sparkles size={14} />
              <span>Index & Upload to Drive</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
