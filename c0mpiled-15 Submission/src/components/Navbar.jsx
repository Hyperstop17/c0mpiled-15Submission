import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  HardDrive,
  SlidersHorizontal,
  Settings,
  Cloud,
  LogOut,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { AWS_S3_CONFIG } from '../services/storageService';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  onOpenSettings,
  currentView,
  setCurrentView,
  user,
  onLogout
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const userName = user?.name || 'Workspace User';
  const userEmail = user?.email || 'user@cognidrive.local';
  const userRole = user?.role || 'Owner';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="brand-logo" onClick={() => setCurrentView('drive')} title="Go to Drive">
          <div className="logo-icon-wrap">
            <HardDrive className="logo-icon-drive" size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-name">CogniDrive</span>
          </div>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="nav-s3-pill" title="Secure Cloud Storage Active">
          <Cloud size={13} className="text-indigo" />
          <span>Cloud Synced</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className="global-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search in Drive and Collaborative Spaces" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
          <div className="search-filter-icon" title="Search options">
            <SlidersHorizontal size={15} />
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Settings button */}
        <button 
          className="navbar-icon-btn" 
          onClick={onOpenSettings} 
          title="Settings & Appearance"
        >
          <Settings size={19} />
        </button>

        {/* Account profile widget */}
        <div className="profile-widget-wrapper" ref={profileMenuRef}>
          <div 
            className="user-profile-widget" 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
            title={`Account: ${userName}`}
          >
            <div className="user-avatar-badge">{initials}</div>
            <div className="user-info-text">
              <span className="user-name">{userName}</span>
              <span className="user-org">{userRole}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </div>

          {/* Account Popover */}
          {isProfileMenuOpen && (
            <div className="profile-switcher-dropdown">
              <div className="profile-dropdown-header">
                <div className="dropdown-user-avatar">{initials}</div>
                <div className="dropdown-user-meta">
                  <strong>{userName}</strong>
                  <span className="dropdown-email">{userEmail}</span>
                  <div className="verified-badge-row">
                    <ShieldCheck size={12} className="text-green" />
                    <span>AWS Verified Account</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="dropdown-footer-actions">
                <button 
                  type="button" 
                  className="dropdown-action-btn"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSettings();
                  }}
                >
                  <Settings size={14} />
                  <span>Account & Storage Settings</span>
                </button>
                {onLogout && (
                  <button 
                    type="button" 
                    className="dropdown-action-btn logout-text"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button 
            className="navbar-icon-btn logout-btn" 
            onClick={onLogout} 
            title="Sign Out / Switch Account"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
