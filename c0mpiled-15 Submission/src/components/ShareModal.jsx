import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Link as LinkIcon, 
  Lock, 
  Globe, 
  UserPlus, 
  ChevronDown, 
  FileText, 
  MessageSquare, 
  Shield, 
  Trash2,
  Users,
  CheckCircle2,
  Cloud
} from 'lucide-react';

export default function ShareModal({
  isOpen,
  resource = {},
  resourceType = 'file', // 'file' or 'space'
  currentUser = {},
  onClose,
  onSaveShare
}) {
  const [collaboratorsList, setCollaboratorsList] = useState([]);
  const [sharedUsers, setSharedUsers] = useState(resource.sharedWith || []);
  const [generalAccess, setGeneralAccess] = useState(resource.generalAccess || 'restricted');
  const [linkRole, setLinkRole] = useState(resource.linkRole || 'Viewer');
  const [inputQuery, setInputQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Editor');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch available team directory
  useEffect(() => {
    let isMounted = true;
    fetch('/api/collaborators')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.collaborators) {
          setCollaboratorsList(data.collaborators);
        }
      })
      .catch(() => {
        // Fallback default mock collaborators
        if (isMounted) {
          setCollaboratorsList([
            { id: 'damien-k', name: 'Damien K.', email: 'damien.dev@cognidrive.local', role: 'Owner', avatar: 'DK', color: '#0b57d0' },
            { id: 'selena-chang', name: 'Selena Chang', email: 'selena.chang@amazon.com', role: 'Editor', avatar: 'SC', color: '#1a73e8' },
            { id: 'marcus-vance', name: 'Marcus Vance', email: 'marcus.vance@cognidrive.io', role: 'Editor', avatar: 'MV', color: '#7c3aed' },
            { id: 'elena-rostova', name: 'Elena Rostova', email: 'elena.rostova@cognidrive.io', role: 'Commenter', avatar: 'ER', color: '#ea4335' },
            { id: 'alex-rivera', name: 'Alex Rivera', email: 'alex.rivera@cognidrive.io', role: 'Viewer', avatar: 'AR', color: '#34a853' }
          ]);
        }
      });

    // Try fetching existing share configuration from AWS S3
    if (resource?.id) {
      fetch(`/api/s3/share?resourceType=${resourceType}&resourceId=${encodeURIComponent(resource.id)}`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success && data.shareConfig) {
            if (data.shareConfig.sharedWith) setSharedUsers(data.shareConfig.sharedWith);
            if (data.shareConfig.generalAccess) setGeneralAccess(data.shareConfig.generalAccess);
            if (data.shareConfig.linkRole) setLinkRole(data.shareConfig.linkRole);
          }
        })
        .catch(() => {});
    }

    return () => { isMounted = false; };
  }, [resource?.id, resourceType]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !resource) return null;

  const resourceTitle = resource.name || (resourceType === 'space' ? 'Chat Space' : 'Document');
  const ownerName = currentUser?.name || 'Damien K.';
  const ownerEmail = currentUser?.email || 'damien.dev@cognidrive.local';

  // Filter collaborator suggestions not yet added and matching query
  const existingIds = new Set([
    currentUser?.id || 'damien-k',
    ...sharedUsers.map(u => u.id || u.email)
  ]);

  const matchingSuggestions = collaboratorsList.filter(collab => {
    if (existingIds.has(collab.id)) return false;
    if (!inputQuery) return true;
    const q = inputQuery.toLowerCase();
    return collab.name.toLowerCase().includes(q) || collab.email.toLowerCase().includes(q);
  });

  const handleAddCollaborator = (collab) => {
    const newUser = {
      id: collab.id || collab.email.replace(/[^a-zA-Z0-9_-]/g, '_'),
      name: collab.name || collab.email.split('@')[0],
      email: collab.email,
      role: selectedRole,
      avatar: collab.avatar || (collab.name ? collab.name.slice(0, 2).toUpperCase() : 'CO'),
      color: collab.color || '#1a73e8',
      addedAt: new Date().toISOString()
    };

    setSharedUsers(prev => [...prev, newUser]);
    setInputQuery('');
    setIsSuggestionsOpen(false);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    // Check if matches an existing directory suggestion
    const match = collaboratorsList.find(c => 
      c.email.toLowerCase() === inputQuery.trim().toLowerCase() ||
      c.name.toLowerCase() === inputQuery.trim().toLowerCase()
    );

    if (match) {
      handleAddCollaborator(match);
    } else {
      // Add as custom email collaborator
      const email = inputQuery.trim();
      const name = email.includes('@') ? email.split('@')[0] : email;
      handleAddCollaborator({
        id: email.replace(/[^a-zA-Z0-9_-]/g, '_'),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email.includes('@') ? email : `${email}@cognidrive.io`,
        avatar: name.slice(0, 2).toUpperCase(),
        color: '#7c3aed'
      });
    }
  };

  const handleUpdateRole = (userId, newRole) => {
    if (newRole === 'remove') {
      setSharedUsers(prev => prev.filter(u => u.id !== userId && u.email !== userId));
    } else {
      setSharedUsers(prev => prev.map(u => (u.id === userId || u.email === userId) ? { ...u, role: newRole } : u));
    }
  };

  const handleCopyLink = () => {
    const shareableUrl = `${window.location.origin}/?${resourceType}=${encodeURIComponent(resource.id)}&shared=true`;
    navigator.clipboard.writeText(shareableUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSaveAndDone = async () => {
    setIsSaving(true);
    const payload = {
      resourceType,
      resourceId: resource.id,
      resourceName: resourceTitle,
      ownerId: currentUser?.id || 'damien-k',
      sharedWith: sharedUsers,
      generalAccess,
      linkRole
    };

    try {
      // Save directly to AWS S3 backend
      await fetch('/api/s3/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('S3 share persistence error:', err);
    }

    if (onSaveShare) {
      onSaveShare(payload);
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop share-modal-backdrop" onClick={onClose}>
      <div className="share-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Share Header */}
        <div className="share-modal-header">
          <div className="share-header-title-wrap">
            <div className={`share-icon-badge ${resourceType === 'space' ? 'space-badge' : 'file-badge'}`}>
              {resourceType === 'space' ? (
                <MessageSquare size={18} className="text-cyan" />
              ) : (
                <FileText size={18} className="text-blue" />
              )}
            </div>
            <div>
              <h2 className="share-modal-title">Share "{resourceTitle}"</h2>
              <div className="share-modal-sub">
                <span className="share-type-pill">
                  {resourceType === 'space' ? 'Collaborative Chat Space' : 'Document File'}
                </span>
                <span className="share-cloud-sync" title="Multi-user data stored in AWS S3">
                  <Cloud size={12} className="text-indigo" />
                  <span>AWS Multi-User Active</span>
                </span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close share dialog">
            <X size={18} />
          </button>
        </div>

        {/* Share Body */}
        <div className="share-modal-body">
          
          {/* Add People Input */}
          <div className="share-add-section" ref={dropdownRef}>
            <form onSubmit={handleInputSubmit} className="share-input-form">
              <div className="share-input-wrapper">
                <UserPlus size={16} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Add people, collaborators, or emails..."
                  value={inputQuery}
                  onChange={e => {
                    setInputQuery(e.target.value);
                    setIsSuggestionsOpen(true);
                  }}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  className="share-people-input"
                />
              </div>

              {/* Role Selector for new invite */}
              <select 
                value={selectedRole} 
                onChange={e => setSelectedRole(e.target.value)}
                className="share-role-select"
              >
                <option value="Editor">Editor</option>
                <option value="Commenter">Commenter</option>
                <option value="Viewer">Viewer</option>
              </select>

              <button 
                type="submit" 
                className="btn-share-add"
                disabled={!inputQuery.trim()}
              >
                Add
              </button>
            </form>

            {/* Collaborator Autocomplete Dropdown */}
            {isSuggestionsOpen && matchingSuggestions.length > 0 && (
              <div className="share-suggestions-dropdown">
                <div className="suggestions-header">CogniDrive Team Collaborators</div>
                {matchingSuggestions.map(collab => (
                  <div 
                    key={collab.id} 
                    className="suggestion-row"
                    onClick={() => handleAddCollaborator(collab)}
                  >
                    <div className="collab-avatar-small" style={{ backgroundColor: collab.color || '#1a73e8' }}>
                      {collab.avatar}
                    </div>
                    <div className="collab-meta">
                      <div className="collab-name-row">
                        <span className="collab-name">{collab.name}</span>
                        <span className="collab-title-badge">{collab.title || collab.role}</span>
                      </div>
                      <div className="collab-email">{collab.email}</div>
                    </div>
                    <button type="button" className="btn-add-chip">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* People with Access List */}
          <div className="share-section">
            <h4 className="share-section-heading">People with access</h4>
            <div className="people-access-list">
              
              {/* Owner Row */}
              <div className="access-user-row">
                <div className="collab-avatar" style={{ backgroundColor: '#0b57d0' }}>
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'DK'}
                </div>
                <div className="user-details">
                  <div className="user-name-line">
                    <span className="user-name">{ownerName}</span>
                    <span className="you-pill">(you)</span>
                  </div>
                  <div className="user-email">{ownerEmail}</div>
                </div>
                <div className="owner-badge-pill">Owner</div>
              </div>

              {/* Shared Collaborators Rows */}
              {sharedUsers.map((user) => (
                <div key={user.id || user.email} className="access-user-row">
                  <div className="collab-avatar" style={{ backgroundColor: user.color || '#1a73e8' }}>
                    {user.avatar || user.name?.slice(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <div className="user-details">
                    <div className="user-name-line">
                      <span className="user-name">{user.name}</span>
                    </div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-role-actions">
                    <select 
                      value={user.role || 'Viewer'} 
                      onChange={e => handleUpdateRole(user.id || user.email, e.target.value)}
                      className="access-role-dropdown"
                    >
                      <option value="Editor">Editor</option>
                      <option value="Commenter">Commenter</option>
                      <option value="Viewer">Viewer</option>
                      <option value="remove" style={{ color: '#ea4335' }}>Remove access</option>
                    </select>
                  </div>
                </div>
              ))}

              {sharedUsers.length === 0 && (
                <div className="no-collaborators-hint">
                  <Users size={16} className="text-muted" />
                  <span>Only you have access to this {resourceType}. Add team members above to collaborate.</span>
                </div>
              )}
            </div>
          </div>

          {/* General Access Section */}
          <div className="share-section general-access-section">
            <h4 className="share-section-heading">General access</h4>
            <div className="general-access-box">
              <div className="general-access-icon-wrap">
                {generalAccess === 'anyone_with_link' ? (
                  <Globe size={18} className="text-green" />
                ) : (
                  <Lock size={18} className="text-muted" />
                )}
              </div>
              <div className="general-access-info">
                <div className="general-access-selectors">
                  <select 
                    value={generalAccess} 
                    onChange={e => setGeneralAccess(e.target.value)}
                    className="general-access-select"
                  >
                    <option value="restricted">Restricted</option>
                    <option value="anyone_with_link">Anyone with the link</option>
                  </select>

                  {generalAccess === 'anyone_with_link' && (
                    <select 
                      value={linkRole} 
                      onChange={e => setLinkRole(e.target.value)}
                      className="link-role-select"
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Editor">Editor</option>
                    </select>
                  )}
                </div>
                <div className="general-access-description">
                  {generalAccess === 'anyone_with_link' 
                    ? 'Anyone with this link can view this resource.'
                    : 'Only people added above can access with this link.'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Share Footer */}
        <div className="share-modal-footer">
          <button 
            type="button" 
            className="btn-copy-link" 
            onClick={handleCopyLink}
          >
            {isCopied ? (
              <>
                <Check size={16} className="text-green" />
                <span className="text-green">Link copied</span>
              </>
            ) : (
              <>
                <LinkIcon size={16} />
                <span>Copy link</span>
              </>
            )}
          </button>

          <div className="footer-right-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary btn-save-share" 
              onClick={handleSaveAndDone}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Done'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
