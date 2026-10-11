import React from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Check, 
  ShieldCheck, 
  HardDrive, 
  Cpu, 
  User, 
  Sparkles, 
  Sliders,
  Cloud,
  LogOut,
  Key
} from 'lucide-react';
import { AWS_S3_CONFIG } from '../services/storageService';

export default function AccountSettingsModal({
  isOpen,
  onClose,
  darkMode,
  setDarkMode,
  filesCount,
  totalTokens,
  user,
  onLogout,
  onOpenAddModel
}) {
  if (!isOpen) return null;

  const userName = user?.name || 'Damien K.';
  const userEmail = user?.email || 'damien@cognidrive.local';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DK';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-title-wrap">
            <User size={20} className="text-indigo" />
            <div>
              <h2 className="settings-modal-title">Account Settings</h2>
              <div className="settings-modal-subtitle">Manage preferences, appearance, and AWS cloud storage</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="settings-modal-body">
          {/* User Profile Card */}
          <div className="settings-profile-card">
            <div className="profile-card-avatar">{initials}</div>
            <div className="profile-card-info">
              <div className="profile-card-name">{userName}</div>
              <div className="profile-card-email">{userEmail}</div>
              <span className="profile-card-badge">Workspace Owner • AWS S3 Backed</span>
            </div>
            {onLogout && (
              <button 
                type="button" 
                className="btn-settings-logout" 
                onClick={() => { onClose(); onLogout(); }}
                title="Switch user session or return to landing page"
              >
                <LogOut size={14} />
                <span>Switch Session</span>
              </button>
            )}
          </div>

          {/* Theme / Appearance Section */}
          <div className="settings-section">
            <div className="section-title-row">
              <h3 className="settings-section-title">Appearance & Theme</h3>
              <span className="section-current-pill">
                {darkMode ? <Moon size={13} /> : <Sun size={13} />}
                <span>{darkMode ? 'Dark theme active' : 'Light theme active'}</span>
              </span>
            </div>
            <p className="settings-section-desc">
              Google Drive Material 3 design tokens customized for your workspace.
            </p>

            <div className="theme-toggle-options">
              {/* Light Mode Card */}
              <div 
                className={`theme-option-card ${!darkMode ? 'selected' : ''}`}
                onClick={() => setDarkMode(false)}
              >
                <div className="theme-preview-box light-preview">
                  <div className="preview-nav-mock light-mock"></div>
                  <div className="preview-body-mock light-mock">
                    <div className="preview-item-mock"></div>
                    <div className="preview-item-mock"></div>
                  </div>
                </div>
                <div className="theme-option-footer">
                  <div className="theme-label-group">
                    <Sun size={16} className="text-amber" />
                    <span>Light Mode</span>
                  </div>
                  {!darkMode && <Check size={16} className="text-indigo" />}
                </div>
              </div>

              {/* Dark Mode Card */}
              <div 
                className={`theme-option-card ${darkMode ? 'selected' : ''}`}
                onClick={() => setDarkMode(true)}
              >
                <div className="theme-preview-box dark-preview">
                  <div className="preview-nav-mock dark-mock"></div>
                  <div className="preview-body-mock dark-mock">
                    <div className="preview-item-mock"></div>
                    <div className="preview-item-mock"></div>
                  </div>
                </div>
                <div className="theme-option-footer">
                  <div className="theme-label-group">
                    <Moon size={16} className="text-indigo" />
                    <span>Dark Mode</span>
                  </div>
                  {darkMode && <Check size={16} className="text-indigo" />}
                </div>
              </div>
            </div>

            {/* Quick Switch Row */}
            <div className="quick-switch-row">
              <div className="switch-text-group">
                <strong>Dark theme</strong>
                <span>Apply dark background colors to files, spaces, and dialogs</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={(e) => setDarkMode(e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* AWS Cloud & Storage Status */}
          <div className="settings-section">
            <div className="section-title-row">
              <h3 className="settings-section-title">AWS S3 Storage & Backend</h3>
              <span className="section-current-pill text-green">
                <Cloud size={13} />
                <span>Active</span>
              </span>
            </div>
            <div className="aws-bucket-info-banner">
              <div className="bucket-meta-row">
                <span className="bucket-label">Storage Bucket:</span>
                <code className="bucket-val">{AWS_S3_CONFIG.bucket}</code>
              </div>
              <div className="bucket-meta-row">
                <span className="bucket-label">AWS Region:</span>
                <span className="bucket-val">{AWS_S3_CONFIG.region}</span>
              </div>
              <div className="bucket-meta-row">
                <span className="bucket-label">Security & Privacy:</span>
                <span className="bucket-val text-green font-semibold">Zero-retention ephemeral inference</span>
              </div>
            </div>

            <div className="settings-info-grid">
              <div className="settings-stat-card">
                <div className="stat-label">
                  <HardDrive size={14} className="text-muted" />
                  <span>Indexed Documents</span>
                </div>
                <div className="stat-value">{filesCount} files</div>
              </div>

              <div className="settings-stat-card">
                <div className="stat-label">
                  <Sparkles size={14} className="text-muted" />
                  <span>Context Scope</span>
                </div>
                <div className="stat-value">{(totalTokens / 1000).toFixed(1)}k tokens</div>
              </div>

              <div className="settings-stat-card">
                <div className="stat-label">
                  <Cpu size={14} className="text-muted" />
                  <span>Model Orchestration</span>
                </div>
                <div className="stat-value">Multi-Provider</div>
              </div>

              <div className="settings-stat-card">
                <div className="stat-label">
                  <ShieldCheck size={14} className="text-muted" />
                  <span>Data Protection</span>
                </div>
                <div className="stat-value text-green">AWS Encrypted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-modal-footer">
          {onOpenAddModel && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => { onClose(); onOpenAddModel(); }}
            >
              <Key size={14} />
              <span>Connect AI Model Key</span>
            </button>
          )}
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
