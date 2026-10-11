import React, { useState } from 'react';
import { 
  Folder, 
  MessageSquare, 
  Plus, 
  HardDrive, 
  Star, 
  Clock, 
  Bot, 
  Lightbulb, 
  ChevronRight, 
  ChevronDown,
  Upload,
  FolderPlus,
  Cloud,
  Trash2
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  selectedSpaceId,
  setSelectedSpaceId,
  spaces = [],
  files = [],
  filesCount = 0,
  totalTokens = 0,
  bots = [],
  user,
  onOpenNewSpace,
  onOpenUpload,
  onOpenNewSpaceModal,
  onOpenUploadModal,
  onOpenAddModelModal,
  onDeleteSpace
}) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(true);

  const handleUpload = onOpenUpload || onOpenUploadModal;
  const handleNewSpace = onOpenNewSpace || onOpenNewSpaceModal;

  return (
    <aside className="sidebar-container">
      {/* Google Drive Style Primary "+ New" Button */}
      <div className="sidebar-action-wrap">
        <button 
          className="btn-new-google"
          onClick={() => setShowNewMenu(!showNewMenu)}
        >
          <Plus size={20} className="plus-icon" />
          <span>New</span>
        </button>

        {showNewMenu && (
          <div className="new-dropdown-menu" onClick={() => setShowNewMenu(false)}>
            <button className="dropdown-item" onClick={handleUpload}>
              <Upload size={18} className="text-muted" />
              <div>
                <strong>File upload</strong>
              </div>
            </button>
            <button className="dropdown-item" onClick={handleNewSpace}>
              <MessageSquare size={18} className="text-muted" />
              <div>
                <strong>New chat space</strong>
              </div>
            </button>
            <button className="dropdown-item" onClick={() => alert("New folder created in Drive!")}>
              <FolderPlus size={18} className="text-muted" />
              <div>
                <strong>New folder</strong>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="sidebar-nav-scroll">
        <nav className="nav-list">
          <button 
            className={`nav-item ${currentView === 'drive' ? 'active' : ''}`}
            onClick={() => setCurrentView('drive')}
          >
            <HardDrive size={18} />
            <span>My Drive</span>
          </button>
          
          <button 
            className={`nav-item ${currentView === 'recent' ? 'active' : ''}`}
            onClick={() => setCurrentView('drive')}
          >
            <Clock size={18} />
            <span>Recent</span>
          </button>

          <button 
            className={`nav-item ${currentView === 'starred' ? 'active' : ''}`}
            onClick={() => setCurrentView('drive')}
          >
            <Star size={18} />
            <span>Starred</span>
          </button>
        </nav>

        {/* Collaborative Spaces Section */}
        <div className="spaces-section-header">
          <button 
            className="toggle-section-btn"
            onClick={() => setSpacesOpen(!spacesOpen)}
          >
            {spacesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Chat Spaces</span>
          </button>
          <button 
            className="icon-mini-btn" 
            title="Create Space"
            onClick={handleNewSpace}
          >
            <Plus size={15} />
          </button>
        </div>

        {spacesOpen && (
          <div className="spaces-list">
            {spaces.map((sp) => {
              const isSelected = currentView === 'space' && selectedSpaceId === sp.id;
              const connectedCount = sp.connectedFileIds?.length || 0;
              return (
                <div
                  key={sp.id}
                  className={`space-nav-item-wrapper ${isSelected ? 'active' : ''}`}
                >
                  <button
                    className={`space-nav-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSpaceId(sp.id);
                      setCurrentView('space');
                    }}
                  >
                    <MessageSquare size={16} className="space-icon" />
                    <span className="space-title-text">{sp.name}</span>
                    {connectedCount > 0 && (
                      <span className="space-file-tag">{connectedCount}</span>
                    )}
                  </button>
                  {onDeleteSpace && (
                    <button
                      className="btn-delete-space-sidebar"
                      title={`Delete #${sp.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSpace(sp.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI Section */}
        <div className="spaces-section-header" style={{ marginTop: '20px' }}>
          <span className="section-label-simple">Intelligence</span>
        </div>
        <nav className="nav-list">
          <button 
            className={`nav-item ${currentView === 'agents' ? 'active' : ''}`}
            onClick={() => setCurrentView('agents')}
          >
            <Bot size={18} />
            <span>AI Models</span>
          </button>
        </nav>
      </div>

      {/* Google Drive Storage Footer */}
      <div className="sidebar-storage-footer">
        <div className="storage-header">
          <Cloud size={16} className="storage-icon" />
          <span>Storage</span>
        </div>
        <div className="storage-progress-track">
          <div className="storage-progress-bar" style={{ width: '8%' }}></div>
        </div>
        <div className="storage-caption">
          {(files?.length ?? filesCount ?? 0)} files • {totalTokens > 0 ? `${(totalTokens / 1000).toFixed(1)}k tokens` : `${(files?.length || 0) * 1.5}k tokens`}
        </div>
      </div>
    </aside>
  );
}
