import React, { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  GitBranch,
  FileCheck,
  Bot
} from 'lucide-react';

export default function EvaluationModal({ onClose }) {
  const [activeSection, setActiveSection] = useState('verdict');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="eval-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="eval-modal-header">
          <div className="eval-title-wrap">
            <div className="eval-icon-badge">
              <Lightbulb size={22} className="text-amber" />
            </div>
            <div>
              <h2 className="eval-modal-title">Product Strategy & Concept Evaluation</h2>
              <div className="eval-modal-sub">
                Comprehensive evaluation: Market viability, competitive moat, and feature expansion roadmap.
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="eval-tabs-bar">
          <button 
            className={`eval-tab ${activeSection === 'verdict' ? 'active' : ''}`}
            onClick={() => setActiveSection('verdict')}
          >
            <TrendingUp size={15} />
            <span>Is this a Good Idea? (Verdict)</span>
          </button>
          <button 
            className={`eval-tab ${activeSection === 'features' ? 'active' : ''}`}
            onClick={() => setActiveSection('features')}
          >
            <Layers size={15} />
            <span>Feature Expansion Matrix</span>
          </button>
          <button 
            className={`eval-tab ${activeSection === 'risks' ? 'active' : ''}`}
            onClick={() => setActiveSection('risks')}
          >
            <ShieldCheck size={15} />
            <span>Technical Moat & Challenges</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="eval-body-scroll">
          {activeSection === 'verdict' && (
            <div className="eval-section-content">
              <div className="verdict-banner">
                <div className="verdict-grade">A+</div>
                <div>
                  <h3 className="verdict-headline">Verdict: Extremely Strong & Timely Concept</h3>
                  <p className="verdict-summary">
                    "Google Drive for AI Chatbots" solves the single biggest bottleneck facing modern knowledge teams:
                    <strong> the isolation of personal AI chats and the passivity of traditional cloud storage.</strong>
                  </p>
                </div>
              </div>

              <div className="eval-grid-two">
                <div className="eval-card">
                  <div className="card-header-icon text-rose">
                    <AlertTriangle size={18} />
                    <h4>The Problem Today (The Status Quo)</h4>
                  </div>
                  <ul className="eval-bullet-list">
                    <li>
                      <strong>The "Isolated Chat Tab" Trap:</strong> Employees upload proprietary company PDFs into individual, siloed ChatGPT/Claude browser tabs. Team members duplicate queries with zero institutional visibility.
                    </li>
                    <li>
                      <strong>Drive as a "Digital Cemetery":</strong> Google Drive and SharePoint store static files, but have zero native comprehension of team prompt histories, ongoing syntheses, or multi-agent workflows.
                    </li>
                    <li>
                      <strong>Vendor Lock-in:</strong> ChatGPT Team only gives you OpenAI models; NotebookLM is read-only and single-player without collaborative team rooms.
                    </li>
                  </ul>
                </div>

                <div className="eval-card highlight-border">
                  <div className="card-header-icon text-indigo">
                    <Sparkles size={18} />
                    <h4>Why CogniDrive Wins (The Value Proposition)</h4>
                  </div>
                  <ul className="eval-bullet-list">
                    <li>
                      <strong>Unified Knowledge & Conversation:</strong> Files live in folders, and chat spaces mount them dynamically. The chat isn't ephemeral—it is persistent team intelligence.
                    </li>
                    <li>
                      <strong>Multi-Model Orchestration:</strong> Bring Gemini 3.8 Flash for 1M-token document ingest, Claude 3.7 for nuanced reasoning, and Code Bots into the <em>exact same collaborative thread</em>.
                    </li>
                    <li>
                      <strong>Bi-Directional Output Loop:</strong> AI outputs don't stay trapped in a chat bubble—they export directly into the Drive repository as versioned, reusable files.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="market-comparisons-box">
                <h4>Market Positioning vs Existing Products</h4>
                <div className="comp-table">
                  <div className="comp-row comp-head">
                    <span>Platform</span>
                    <span>Shared File Drive?</span>
                    <span>Live Team Chat Rooms?</span>
                    <span>Multi-Model AI (Gemini + Claude)?</span>
                    <span>Saves AI Output to Drive?</span>
                  </div>
                  <div className="comp-row">
                    <strong>Google Drive</strong>
                    <span className="text-green">✓ Yes (Static)</span>
                    <span className="text-rose">✗ No (Comments only)</span>
                    <span className="text-rose">✗ Gemini only (Side panel)</span>
                    <span className="text-muted">Manual</span>
                  </div>
                  <div className="comp-row">
                    <strong>NotebookLM</strong>
                    <span className="text-muted">Limited</span>
                    <span className="text-rose">✗ Single-player only</span>
                    <span className="text-rose">✗ Gemini only</span>
                    <span className="text-muted">Notes only</span>
                  </div>
                  <div className="comp-row">
                    <strong>ChatGPT Team</strong>
                    <span className="text-rose">✗ No file drive</span>
                    <span className="text-muted">Shared chats (clunky)</span>
                    <span className="text-rose">✗ OpenAI only</span>
                    <span className="text-rose">✗ No</span>
                  </div>
                  <div className="comp-row winner">
                    <strong>CogniDrive (Your Idea)</strong>
                    <span className="text-green">✓ Full Hierarchical Drive</span>
                    <span className="text-green">✓ Real-time Collab Spaces</span>
                    <span className="text-green">✓ Multi-Model + Custom Agents</span>
                    <span className="text-green">✓ 1-Click Commit to Drive</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div className="eval-section-content">
              <h3>Recommended Feature Roadmap</h3>
              <p className="eval-subtext">
                To evolve this from a compelling prototype into a category-defining product, here is the feature priority tier:
              </p>

              <div className="features-tier-list">
                {/* Tier 1 */}
                <div className="tier-card tier-p0">
                  <div className="tier-badge p0">Phase 1: Must-Haves (Current UI Scope)</div>
                  <div className="tier-items-grid">
                    <div className="tier-item">
                      <CheckCircle size={16} className="text-green" />
                      <div>
                        <strong>Selective Document Mounting</strong>
                        <p>Allow users to mount/unmount files dynamically per chat space to preserve context budget.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <CheckCircle size={16} className="text-green" />
                      <div>
                        <strong>Verified Source Citations</strong>
                        <p>Clickable line/chunk references in AI responses that highlight exact passages in the file.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <CheckCircle size={16} className="text-green" />
                      <div>
                        <strong>Export AI Artifact to Drive</strong>
                        <p>1-click button to save generated summaries, tables, or code back into the Drive as new files.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <CheckCircle size={16} className="text-green" />
                      <div>
                        <strong>Context Window & Token Budget Meter</strong>
                        <p>Real-time visual gauge showing % of model context consumed by mounted files.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="tier-card tier-p1">
                  <div className="tier-badge p1">Phase 2: High-Value Differentiators (Next Step)</div>
                  <div className="tier-items-grid">
                    <div className="tier-item">
                      <Sparkles size={16} className="text-indigo" />
                      <div>
                        <strong>Multi-Agent Debate Rooms</strong>
                        <p>Enable @Gemini and @Claude to cross-examine each other's analyses of the same mounted financial doc.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <GitBranch size={16} className="text-indigo" />
                      <div>
                        <strong>Live Collaborative AI Canvas</strong>
                        <p>A shared document pane (like Google Docs + Claude Artifacts) co-edited live by teammates and AI.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <FileCheck size={16} className="text-indigo" />
                      <div>
                        <strong>Two-Way Google Drive & GitHub Sync</strong>
                        <p>Bi-directional webhook sync so external edits in Google Docs or Git repos auto-index in CogniDrive.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <Bot size={16} className="text-indigo" />
                      <div>
                        <strong>Autonomous Folder Watchers (Sentinel Agents)</strong>
                        <p>Agents that monitor a folder and trigger automated audits whenever new files are uploaded.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="tier-card tier-p2">
                  <div className="tier-badge p2">Phase 3: Enterprise & Compliance</div>
                  <div className="tier-items-grid">
                    <div className="tier-item">
                      <ShieldCheck size={16} className="text-amber" />
                      <div>
                        <strong>Granular AI RBAC (Role-Based Access)</strong>
                        <p>Strict access boundaries ensuring AI agents cannot cross-reference confidential folders.</p>
                      </div>
                    </div>
                    <div className="tier-item">
                      <Cpu size={16} className="text-amber" />
                      <div>
                        <strong>Local & Private VPC Model Routing</strong>
                        <p>Support for private on-prem models (e.g. Llama 3 via Ollama/vLLM) for air-gapped security.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'risks' && (
            <div className="eval-section-content">
              <h3>Technical Challenges & How to Solve Them</h3>
              
              <div className="challenge-item">
                <div className="challenge-title">
                  <AlertTriangle size={17} className="text-amber" />
                  <strong>1. Context Window Bloat & Inference Costs</strong>
                </div>
                <p>
                  <strong>The Risk:</strong> If a team mounts twenty 50-page PDFs into a space, naive prompt stuffing will blow past token limits or cost $10 per query.
                </p>
                <p className="solution-text">
                  <strong>The Solution:</strong> Implement a hybrid two-stage RAG: semantic vector search selects top-k relevant chunks first, and only full documents are pulled when explicitly targeted via <code>@filename</code>.
                </p>
              </div>

              <div className="challenge-item">
                <div className="challenge-title">
                  <AlertTriangle size={17} className="text-amber" />
                  <strong>2. Stale Files & Document Version Drift</strong>
                </div>
                <p>
                  <strong>The Risk:</strong> A team member updates a spreadsheet in Drive, but the chat space is referencing an outdated cached vector embedding.
                </p>
                <p className="solution-text">
                  <strong>The Solution:</strong> Version hash tracking. When a file is modified, CogniDrive broadcasts a notification banner in all connected spaces: <em>"File Q3_Financials was updated by Damien K. Re-syncing context..."</em>
                </p>
              </div>

              <div className="challenge-item">
                <div className="challenge-title">
                  <AlertTriangle size={17} className="text-amber" />
                  <strong>3. Enterprise Data Privacy & Leakage</strong>
                </div>
                <p>
                  <strong>The Risk:</strong> Enterprise customers fear their confidential files will be ingested into foundation model training data.
                </p>
                <p className="solution-text">
                  <strong>The Solution:</strong> Zero-retention enterprise API keys (Google Vertex AI / Anthropic Commercial API) with explicit cryptographic attestation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="eval-modal-footer">
          <div className="footer-left-note">
            Prepared for Hackathon Architecture & Product Review
          </div>
          <button className="btn-primary" onClick={onClose}>
            Back to Application
          </button>
        </div>
      </div>
    </div>
  );
}
