import React from 'react';
import { 
  Search, 
  HardDrive,
  Bot,
  Lightbulb,
  SlidersHorizontal,
  HelpCircle
} from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  totalTokens, 
  filesCount, 
  spacesCount,
  onOpenEvaluation,
  currentView,
  setCurrentView
}) {
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
        <button 
          className="eval-nav-btn"
          onClick={onOpenEvaluation}
          title="Concept Evaluation & Roadmap"
        >
          <Lightbulb size={16} className="eval-icon" />
          <span>Evaluation & Plan</span>
        </button>

        <div className="user-profile-widget" title="Damien K. (Workspace Owner)">
          <div className="user-avatar-badge">DK</div>
          <div className="user-info-text">
            <span className="user-name">Damien K.</span>
            <span className="user-org">Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}
