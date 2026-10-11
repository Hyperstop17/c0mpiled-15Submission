import React, { useState, useEffect } from 'react';
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
  Grid, 
  List, 
  ChevronRight,
  Plus,
  MessageSquare,
  Image as ImageIcon,
  Cloud,
  Copy,
  Download,
  FolderPlus,
  FilePlus,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function DriveView({
  files = [],
  folders = [],
  spaces = [],
  onOpenFile,
  onConnectFileToSpace,
  onDeleteFile,
  onOpenUpload,
  onCreateFolder,
  onDeleteFolder,
  onCreateNewDocument,
  searchQuery = ''
}) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'canvas', // 'file', 'folder', 'canvas'
    item: null
  });

  // New Folder Dialog State
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(prev => ({ ...prev, isOpen: false }));
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
        setIsNewFolderOpen(false);
      }
    };

    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter files based on folder, type filter, and search query
  const filteredFiles = (files || []).filter(file => {
    if (selectedFolder && file.folder !== selectedFolder) return false;
    
    if (typeFilter !== 'all') {
      if (typeFilter === 'documents') {
        if (file.type !== 'markdown' && file.type !== 'doc' && file.type !== 'docx' && file.type !== 'text') return false;
      } else if (file.type !== typeFilter) {
        return false;
      }
    }

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
      case 'text':
        return <FileText className="file-icon text-blue" size={20} />;
      case 'pdf':
        return <FileText className="file-icon text-rose" size={20} />;
      case 'code':
        return <FileCode className="file-icon text-purple" size={20} />;
      case 'image':
        return <ImageIcon className="file-icon text-indigo" size={20} />;
      default:
        return <FileQuestion className="file-icon text-muted" size={20} />;
    }
  };

  const getSpaceName = (spaceId) => {
    const sp = spaces.find(s => s.id === spaceId);
    return sp ? sp.name : spaceId;
  };

  // Right-click handlers
  const handleFileContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 260),
      type: 'file',
      item: file
    });
  };

  const handleFolderContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 200),
      type: 'folder',
      item: folder
    });
  };

  const handleCanvasContextMenu = (e) => {
    // Only trigger if right-clicking background
    if (e.target.closest('.file-row') || e.target.closest('.folder-card') || e.target.closest('.file-grid-card')) {
      return;
    }
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 220),
      type: 'canvas',
      item: null
    });
  };

  const handleDownload = (file) => {
    const blob = new Blob([file.content || file.summary || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateFolderSubmit = (e) => {
    e.preventDefault();
    if (folderNameInput.trim() && onCreateFolder) {
      onCreateFolder(folderNameInput.trim());
      setFolderNameInput('');
      setIsNewFolderOpen(false);
    }
  };

  return (
    <div 
      className="drive-view-container"
      onContextMenu={handleCanvasContextMenu}
    >
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
          <button 
            className="btn-new-folder-action" 
            onClick={() => setIsNewFolderOpen(true)}
            title="Create a new folder"
          >
            <FolderPlus size={15} />
            <span>New Folder</span>
          </button>

          <button 
            className="btn-new-doc-action"
            onClick={() => onCreateNewDocument && onCreateNewDocument(selectedFolder)}
            title="Create a blank collaborative document"
          >
            <FilePlus size={15} />
            <span>New Doc</span>
          </button>

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
            <span>Upload Document</span>
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
                  onContextMenu={(e) => handleFolderContextMenu(e, f)}
                >
                  <Folder size={20} className="text-muted" fill="currentColor" fillOpacity={0.15} />
                  <span className="folder-name">{f.name}</span>
                  <span className="folder-count-pill">{filesInFolder}</span>
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
            All Files
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'documents' ? 'active' : ''}`}
            onClick={() => setTypeFilter('documents')}
          >
            Documents (.md, .docx, .txt)
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'csv' ? 'active' : ''}`}
            onClick={() => setTypeFilter('csv')}
          >
            Spreadsheets (.csv)
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'code' ? 'active' : ''}`}
            onClick={() => setTypeFilter('code')}
          >
            Code (.py, .js, .sql)
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'pdf' ? 'active' : ''}`}
            onClick={() => setTypeFilter('pdf')}
          >
            PDFs
          </button>
          <button 
            className={`filter-pill ${typeFilter === 'image' ? 'active' : ''}`}
            onClick={() => setTypeFilter('image')}
          >
            Images
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
                <th>Storage</th>
                <th>Context Tokens</th>
                <th>Folder</th>
                <th>Mounted in Spaces</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-files-row">
                    No files found matching the criteria. Right-click or click "Upload Document" to add files.
                  </td>
                </tr>
              ) : (
                filteredFiles.map(file => (
                  <tr 
                    key={file.id} 
                    className="file-row"
                    onContextMenu={(e) => handleFileContextMenu(e, file)}
                  >
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
                      <span className="badge-grounded" title="Encrypted cloud storage">
                        <Cloud size={13} className="text-indigo" />
                        <span>Cloud Synced</span>
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
                          className="action-btn-sm btn-open-file" 
                          title="Open & Read Document"
                          onClick={() => onOpenFile(file)}
                        >
                          <Eye size={14} />
                          <span>Read</span>
                        </button>
                        <button 
                          className="action-btn-sm btn-chat-doc" 
                          title="Ask AI about this file"
                          onClick={() => onOpenFile(file)}
                        >
                          <Sparkles size={13} className="text-amber" />
                          <span>Chat</span>
                        </button>
                        <button 
                          className="action-btn-sm" 
                          title="Mount to Collaborative Space"
                          onClick={() => onConnectFileToSpace(file)}
                        >
                          <Link2 size={13} />
                        </button>
                        <button 
                          className="action-btn-sm danger" 
                          title="Delete File"
                          onClick={() => onDeleteFile(file.id)}
                        >
                          <Trash2 size={13} />
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
            <div 
              key={file.id} 
              className="file-grid-card"
              onContextMenu={(e) => handleFileContextMenu(e, file)}
            >
              <div className="grid-card-top">
                <div className="grid-icon-row">
                  {getFileIcon(file.type)}
                  <span className="grid-s3-pill">
                    <Cloud size={11} className="text-indigo" />
                    <span>Cloud</span>
                  </span>
                </div>
                <div className="grid-token-badge">
                  {(file.tokens / 1000).toFixed(1)}k tokens
                </div>
              </div>
              <div className="grid-card-title" onClick={() => onOpenFile(file)}>
                {file.name}
              </div>
              <div className="grid-card-summary" onClick={() => onOpenFile(file)}>
                {file.summary || 'Click to view file content...'}
              </div>
              <div className="grid-card-footer">
                <span className="folder-tag">{file.folder}</span>
                <div className="grid-actions">
                  <button 
                    className="action-btn-sm" 
                    title="Read File"
                    onClick={() => onOpenFile(file)}
                  >
                    <Eye size={13} />
                    <span>Read</span>
                  </button>
                  <button 
                    className="action-btn-sm" 
                    title="Chat with File"
                    onClick={() => onOpenFile(file)}
                  >
                    <Sparkles size={13} className="text-amber" />
                  </button>
                  <button 
                    className="action-btn-sm" 
                    title="Mount to Space"
                    onClick={() => onConnectFileToSpace(file)}
                  >
                    <Link2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu.isOpen && (
        <div 
          className="context-menu-dropdown"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* File Context Menu */}
          {contextMenu.type === 'file' && contextMenu.item && (
            <>
              <div className="context-menu-header">
                {contextMenu.item.name}
              </div>
              <button 
                className="context-menu-item"
                onClick={() => { onOpenFile(contextMenu.item); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Eye size={15} />
                <span>Open & Read Document</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => { onOpenFile(contextMenu.item); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Sparkles size={15} className="text-amber" />
                <span>Ask AI Co-Pilot</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => { onConnectFileToSpace(contextMenu.item); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Link2 size={15} />
                <span>Mount to Space</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.item.content || contextMenu.item.summary || '');
                  setContextMenu(p => ({ ...p, isOpen: false }));
                }}
              >
                <Copy size={15} />
                <span>Copy File Text</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => { handleDownload(contextMenu.item); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Download size={15} />
                <span>Download</span>
              </button>
              <div className="context-menu-divider" />
              <button 
                className="context-menu-item danger"
                onClick={() => { onDeleteFile(contextMenu.item.id); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Trash2 size={15} />
                <span>Delete File</span>
              </button>
            </>
          )}

          {/* Folder Context Menu */}
          {contextMenu.type === 'folder' && contextMenu.item && (
            <>
              <div className="context-menu-header">
                📁 {contextMenu.item.name}
              </div>
              <button 
                className="context-menu-item"
                onClick={() => { setSelectedFolder(contextMenu.item.name); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <FolderOpen size={15} />
                <span>Open Folder</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => {
                  if (onCreateNewDocument) onCreateNewDocument(contextMenu.item.name);
                  setContextMenu(p => ({ ...p, isOpen: false }));
                }}
              >
                <FilePlus size={15} />
                <span>New Document Here</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => { onOpenUpload(); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Upload size={15} />
                <span>Upload to this Folder</span>
              </button>
              <div className="context-menu-divider" />
              <button 
                className="context-menu-item danger"
                onClick={() => {
                  if (onDeleteFolder) onDeleteFolder(contextMenu.item.name);
                  setContextMenu(p => ({ ...p, isOpen: false }));
                }}
              >
                <Trash2 size={15} />
                <span>Delete Folder</span>
              </button>
            </>
          )}

          {/* Background Canvas Context Menu */}
          {contextMenu.type === 'canvas' && (
            <>
              <button 
                className="context-menu-item"
                onClick={() => { setIsNewFolderOpen(true); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <FolderPlus size={15} className="text-indigo" />
                <span>New Folder</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => {
                  if (onCreateNewDocument) onCreateNewDocument(selectedFolder);
                  setContextMenu(p => ({ ...p, isOpen: false }));
                }}
              >
                <FilePlus size={15} className="text-blue" />
                <span>New Document</span>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => { onOpenUpload(); setContextMenu(p => ({ ...p, isOpen: false })); }}
              >
                <Upload size={15} className="text-cyan" />
                <span>Upload File</span>
              </button>
              <div className="context-menu-divider" />
              <button 
                className="context-menu-item"
                onClick={() => { window.location.reload(); }}
              >
                <RefreshCw size={14} />
                <span>Refresh Drive</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewFolderOpen(false)}>
          <div className="quick-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="quick-dialog-header">
              <FolderPlus size={18} className="text-indigo" />
              <h3>Create New Folder</h3>
            </div>
            <form onSubmit={handleCreateFolderSubmit}>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Folder name (e.g. Research, Projects, Legal)"
                  value={folderNameInput}
                  onChange={e => setFolderNameInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewFolderOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={!folderNameInput.trim()}>
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
