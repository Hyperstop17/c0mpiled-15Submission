import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Check, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Sparkles, 
  Link2,
  HardDrive
} from 'lucide-react';

export default function ConnectFilesModal({
  space = {},
  allFiles = [],
  onClose,
  onSaveConnections,
  onSave
}) {
  const [selectedFileIds, setSelectedFileIds] = useState(
    new Set(space?.connectedFileIds || [])
  );
  const [filterQuery, setFilterQuery] = useState('');

  const toggleFile = (fileId) => {
    const next = new Set(selectedFileIds);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    setSelectedFileIds(next);
  };

  const handleSave = () => {
    const fileIds = Array.from(selectedFileIds);
    if (onSaveConnections && space?.id) {
      onSaveConnections(space.id, fileIds);
    } else if (onSave) {
      onSave(fileIds);
    }
    onClose();
  };

  const filteredFiles = allFiles.filter(f => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q);
  });

  // Calculate projected tokens
  const projectedTokens = allFiles
    .filter(f => selectedFileIds.has(f.id))
    .reduce((sum, f) => sum + (f.tokens || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="connect-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Link2 size={20} className="text-indigo" />
            <div>
              <h2 className="modal-title">Mount Drive Files to #{space?.name || 'Space'}</h2>
              <div className="modal-subtitle">
                Select repository documents to ground AI bots in this collaborative space.
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="connect-search-bar">
          <Search size={15} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search Drive files by name or folder..." 
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        {/* Projected Context Budget Bar */}
        <div className="projected-budget-bar">
          <div className="budget-text">
            <span>Projected Grounding Scope:</span>
            <strong>{(projectedTokens / 1000).toFixed(1)}k Tokens</strong> across {selectedFileIds.size} files
          </div>
          <div className="budget-pill">
            <Sparkles size={12} className="text-amber" />
            <span>RAG Active</span>
          </div>
        </div>

        {/* Files Selection List */}
        <div className="connect-files-list">
          {filteredFiles.map(file => {
            const isChecked = selectedFileIds.has(file.id);
            return (
              <div 
                key={file.id} 
                className={`connect-file-row ${isChecked ? 'selected' : ''}`}
                onClick={() => toggleFile(file.id)}
              >
                <div className={`custom-checkbox ${isChecked ? 'checked' : ''}`}>
                  {isChecked && <Check size={12} />}
                </div>

                <div className="connect-file-info">
                  <div className="file-row-name">
                    <span>{file.name}</span>
                    <span className="file-folder-badge">{file.folder}</span>
                  </div>
                  <div className="file-row-sub">
                    {(file.tokens / 1000).toFixed(1)}k tokens • {file.size} • {file.summary}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Apply Changes ({selectedFileIds.size} mounted)
          </button>
        </div>
      </div>
    </div>
  );
}
