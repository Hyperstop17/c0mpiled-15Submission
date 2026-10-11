import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  FileQuestion, 
  Upload, 
  Link2, 
  Eye, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Filter, 
  Grid, 
  List, 
  ChevronRight,
  MoreVertical,
  Plus,
  Share2,
  HardDrive
} from 'lucide-react';

export default function DriveView({
  files,
  folders,
  spaces,
  onOpenFile,
  onConnectFileToSpace,
  onDeleteFile,
  onOpenUpload,
  searchQuery
}) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Filter files based on folder, type filter, and search query
  const filteredFiles = files.filter(file => {
    if (selectedFolder && file.folder !== selectedFolder) return false;
    if (typeFilter !== 'all' && file.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = file.name.toLowerCase().includes(q);
      const matchesSummary = file.summary?.toLowerCase().includes(q);
      const matchesTag = file.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchesName && !matchesSummary && !matchesTag) return false;
    }
    return true;
  });

  const getFileIcon = (type) => {
    switch (type) {
      case 'csv':
        return <FileSpreadsheet className="file-icon text-green" size={20} />;
      case 'markdown':
      case 'doc':
      case 'docx':
        return <FileText className="file-icon text-blue" size={20} />;
      case 'pdf':
        return <FileText className="file-icon text-rose" size={20} />;
      case 'code':
        return <FileCode className="file-icon text-purple" size={20} />;
      default:
        return <FileQuestion className="file-icon text-muted" size={20} />;
    }
  };

  const getSpaceName = (spaceId) => {
    const sp = spaces.find(s => s.id === spaceId);
    return sp ? sp.name : spaceId;
  };

  return (
    <div className="drive-view-container">
      {/* Top Header / Breadcrumbs */}
      <div className="drive-top-header">
        <div className="breadcrumbs-wrap">
          <button 
            className={`breadcrumb-item ${!selectedFolder ? 'active' : ''}`}
            onClick={() => setSelectedFolder(null)}
          >
            <span>My Drive</span>
          </button>
          {selectedFolder && (
            <>
              <ChevronRight size={16} className="breadcrumb-separator" />
              <span className="breadcrumb-item active">{selectedFolder}</span>
            </>
          )}
        </div>

        <div className="drive-header-actions">
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="List view"
            >
              <List size={16} />
            </button>
            <button 
              className={`mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid size={16} />
            </button>
          </div>

          <button className="btn-upload-file" onClick={onOpenUpload}>
            <Upload size={16} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Folders Section */}
      {!selectedFolder && (
        <div className="drive-folders-section">
          <div className="section-label">Folders</div>
          <div className="folders-grid">
            {folders.map(f => {
              const filesInFolder = files.filter(file => file.folder === f.name).length;
              return (
                <div 
                  key={f.id} 
                  className="folder-card"
                  onClick={() => setSelectedFolder(f.name)}
                >
                  <Folder size={20} className="text-muted" fill="currentColor" fillOpacity={0.15} />
                  <span className="folder-name">{f.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="drive-filters-bar">
        <div className="filter-pills">
          <button 
            className={`filter-pill ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Type
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'markdown' ? 'active' : ''}`}
            onClick={() => setTypeFilter('markdown')}
          >
            Documents
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'csv' ? 'active' : ''}`}
            onClick={() => setTypeFilter('csv')}
          >
            Spreadsheets
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'pdf' ? 'active' : ''}`}
            onClick={() => setTypeFilter('pdf')}
          >
            PDFs
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'code' ? 'active' : ''}`}
            onClick={() => setTypeFilter('code')}
          >
            Code
          </button>
        </div>

        {selectedFolder && (
          <button className="clear-folder-btn" onClick={() => setSelectedFolder(null)}>
            Show all folders ✕
          </button>
        )}
      </div>

      {/* Files Content: Table View */}
      {viewMode === 'table' ? (
        <div className="files-table-wrapper">
          <table className="files-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Grounding</th>
                <th>Context tokens</th>
                <th>Folder</th>
                <th>Mounted in</th>
                <th>Last modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-files-row">
                    No files found matching the criteria. Click "Upload Document" to add files to your AI Drive.
                  </td>
                </tr>
              ) : (
                filteredFiles.map(file => (
                  <tr key={file.id} className="file-row">
                    <td className="col-filename" onClick={() => onOpenFile(file)}>
                      <div className="file-name-cell">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="file-title-text">{file.name}</div>
                          <div className="file-author-sub">{file.author} • {file.size}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-grounded">
                        <CheckCircle2 size={13} className="text-green" />
                        <span>RAG Ready</span>
                      </span>
                    </td>
                    <td>
                      <div className="token-metric-pill" title="Estimated embedding tokens in context">
                        <Sparkles size={11} className="text-amber" />
                        <span>{(file.tokens / 1000).toFixed(1)}k tokens</span>
                      </div>
                    </td>
                    <td>
                      <span className="folder-tag">{file.folder}</span>
                    </td>
                    <td>
                      <div className="spaces-chips-wrap">
                        {file.connectedSpaces?.length > 0 ? (
                          file.connectedSpaces.map(spId => (
                            <span key={spId} className="space-chip" title="Connected to this collaborative chat">
                              #{getSpaceName(spId)}
                            </span>
                          ))
                        ) : (
                          <span className="unconnected-text">Not mounted</span>
                        )}
                      </div>
                    </td>
                    <td className="col-date">
                      {file.updatedAt}
                    </td>
                    <td className="col-actions">
                      <div className="file-row-actions">
                        <button 
                          className="action-btn-sm" 
                          title="Connect to Chat Space"
                          onClick={() => onConnectFileToSpace(file)}
                        >
                          <Link2 size={14} />
                          <span>Mount</span>
                        </button>
                        <button 
                          className="action-btn-sm" 
                          title="Preview Content & Summary"
                          onClick={() => onOpenFile(file)}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn-sm danger" 
                          title="Delete File"
                          onClick={() => onDeleteFile(file.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="files-cards-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-grid-card">
              <div className="grid-card-top">
                {getFileIcon(file.type)}
                <div className="grid-token-badge">
                  {(file.tokens / 1000).toFixed(1)}k tokens
                </div>
              </div>
              <div className="grid-card-title" onClick={() => onOpenFile(file)}>
                {file.name}
              </div>
              <div className="grid-card-summary">
                {file.summary}
              </div>
              <div className="grid-card-footer">
                <span className="folder-tag">{file.folder}</span>
                <div className="grid-actions">
                  <button 
                    className="action-btn-sm" 
                    title="Mount to Space"
                    onClick={() => onConnectFileToSpace(file)}
                  >
                    <Link2 size={13} />
                  </button>
                  <button 
                    className="action-btn-sm" 
                    title="Preview File"
                    onClick={() => onOpenFile(file)}
                  >
                    <Eye size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
