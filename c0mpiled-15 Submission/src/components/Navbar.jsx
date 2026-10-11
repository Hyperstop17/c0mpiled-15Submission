import React from 'react';
import { 
  Search, 
  HardDrive,
  SlidersHorizontal,
  Settings,
  Cloud,
  LogOut
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
  const userName = user?.name || 'Damien K.';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DK';

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

        {/* AWS S3 Backend Indicator */}
        <div className="nav-s3-pill" title={`Backed by AWS S3 Bucket: ${AWS_S3_CONFIG.bucket} (${AWS_S3_CONFIG.region})`}>
          <Cloud size={13} className="text-indigo" />
          <span>AWS S3</span>
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
          title="Settings, Appearance & AWS Status"
        >
          <Settings size={19} />
        </button>

        {/* Account profile widget */}
        <div 
          className="user-profile-widget" 
          onClick={onOpenSettings} 
          title={`Account settings (${userName})`}
        >
          <div className="user-avatar-badge">{initials}</div>
          <div className="user-info-text">
            <span className="user-name">{userName}</span>
            <span className="user-org">Owner</span>
          </div>
        </div>

        {/* Switch Workspace / Logout Button */}
        {onLogout && (
          <button 
            className="navbar-icon-btn logout-btn" 
            onClick={onLogout} 
            title="Switch Workspace / Landing Page"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
