import React, { useState } from 'react';
import { 
  HardDrive, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Cloud, 
  Key, 
  FileText, 
  CheckCircle2,
  Users
} from 'lucide-react';

export default function LandingView({ onStartSession }) {
  const [name, setName] = useState('Damien K.');
  const [email, setEmail] = useState('damien@cognidrive.local');
  const [workspaceMode, setWorkspaceMode] = useState('fresh'); // 'fresh' or 'demo'

  const handleLaunch = (e) => {
    e.preventDefault();
    onStartSession({
      name: name.trim() || 'Damien K.',
      email: email.trim() || 'damien@cognidrive.local',
      mode: workspaceMode
    });
  };

  return (
    <div className="landing-page-root">
      {/* Top Bar */}
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="logo-icon-wrap">
            <HardDrive className="logo-icon-drive" size={22} />
          </div>
          <span className="landing-brand-name">CogniDrive</span>
          <span className="landing-badge">AWS S3 Connected</span>
        </div>
        <div className="landing-nav-actions">
          <button 
            type="button" 
            className="btn-text-link"
            onClick={() => onStartSession({ name: 'Damien K.', email: 'demo@cognidrive.local', mode: 'demo' })}
          >
            Quick Demo View
          </button>
        </div>
      </header>

      {/* Hero Container */}
      <main className="landing-hero-container">
        <div className="landing-hero-text">
          <div className="landing-pill-tag">
            <Sparkles size={14} className="text-amber" />
            <span>Google Drive for AI Chatbots</span>
          </div>

          <h1 className="landing-title">
            Collaborative Chat Spaces Grounded in Your Drive
          </h1>

          <p className="landing-lead">
            Store documents in <strong>AWS S3</strong>, mount files dynamically with real-time token budgeting, and collaborate with foundation models using your own API keys.
          </p>

          {/* Feature Grid Pills */}
          <div className="landing-features-grid">
            <div className="landing-feature-item">
              <Cloud size={18} className="text-indigo" />
              <div>
                <strong>AWS S3 Backend</strong>
                <span>Direct document storage and zero training guarantees.</span>
              </div>
            </div>

            <div className="landing-feature-item">
              <Layers size={18} className="text-green" />
              <div>
                <strong>Collaborative Spaces</strong>
                <span>Rooms with multi-model AI and mounted files.</span>
              </div>
            </div>

            <div className="landing-feature-item">
              <Key size={18} className="text-amber" />
              <div>
                <strong>BYO API Keys</strong>
                <span>Plug in OpenAI, Claude, or Gemini for real live inference.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signup / Quick Access Card */}
        <div className="landing-signup-card">
          <div className="signup-card-header">
            <h3>Start Your Session</h3>
            <p>Immediate access to your Drive workspace — no credit card needed.</p>
          </div>

          <form onSubmit={handleLaunch} className="signup-form">
            <div className="form-group">
              <label>Your Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Damien K."
                required
              />
            </div>

            <div className="form-group">
              <label>Work Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="damien@domain.com"
                required
              />
            </div>

            {/* Mode Selector */}
            <div className="form-group">
              <label>Initial Workspace Setup</label>
              <div className="workspace-mode-selector">
                <div 
                  className={`mode-card ${workspaceMode === 'fresh' ? 'selected' : ''}`}
                  onClick={() => setWorkspaceMode('fresh')}
                >
                  <div className="mode-card-header">
                    <strong>Fresh Account (AWS S3)</strong>
                    {workspaceMode === 'fresh' && <CheckCircle2 size={16} className="text-green" />}
                  </div>
                  <p>Clean drive ready for your own files, API keys, and custom models.</p>
                </div>

                <div 
                  className={`mode-card ${workspaceMode === 'demo' ? 'selected' : ''}`}
                  onClick={() => setWorkspaceMode('demo')}
                >
                  <div className="mode-card-header">
                    <strong>Demo Workspace</strong>
                    {workspaceMode === 'demo' && <CheckCircle2 size={16} className="text-green" />}
                  </div>
                  <p>Pre-populated with financial analysis, specs, and multi-agent test rooms.</p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-launch-drive">
              <span>Enter CogniDrive Workspace</span>
              <ArrowRight size={18} />
            </button>

            <div className="signup-guarantee-note">
              <ShieldCheck size={14} className="text-green" />
              <span>AWS Profile DamienK-aws • Encrypted Client-Side Sessions</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
