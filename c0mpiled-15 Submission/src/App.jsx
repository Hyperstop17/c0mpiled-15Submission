import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DriveView from './components/DriveView';
import SpaceView from './components/SpaceView';
import AgentsView from './components/AgentsView';
import FilePreviewModal from './components/FilePreviewModal';
import ConnectFilesModal from './components/ConnectFilesModal';
import NewSpaceModal from './components/NewSpaceModal';
import UploadFileModal from './components/UploadFileModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import AddModelModal from './components/AddModelModal';
import LandingView from './components/LandingView';

import { 
  INITIAL_FILES, 
  INITIAL_FOLDERS, 
  AI_BOTS, 
  TEAM_MEMBERS, 
  INITIAL_SPACES 
} from './data/initialData';
import { AWS_S3_CONFIG } from './services/storageService';

import './App.css';

const FRESH_WELCOME_FILE = {
  id: 'f-welcome',
  name: 'Welcome_to_CogniDrive.md',
  type: 'markdown',
  size: '14 KB',
  tokens: 1100,
  status: 'indexed',
  folder: 'General',
  updatedAt: 'Just now',
  author: 'Damien K.',
  summary: 'Getting started guide for CogniDrive: AWS S3 storage, connecting custom AI models with API keys, and collaborative RAG spaces.',
  content: `# Welcome to CogniDrive 🚀\n\nCogniDrive is your Google Drive for AI Chatbots, backed by **AWS S3** (\`${AWS_S3_CONFIG.bucket}\`).\n\n## Quick Start Guide\n1. **Upload Your Files**: Click **"+ New"** in the sidebar to upload Markdown, CSV, Code, or Text files. They are stored in your AWS S3 bucket and indexed for RAG.\n2. **Collaborative Chat Spaces**: Navigate to **#general-workspace** to chat with AI models grounded in your mounted documents.\n3. **Connect Your Own API Key**: Head to **AI Models** or click **"+ API Key"** in any chat space to plug in your OpenAI, Claude, or Gemini key for live responses.\n4. **1-Click Artifacts**: AI models can generate downloadable summaries, roadmaps, and plans that commit back to your Drive with 1 click.`,
  tags: ['Welcome', 'Guide', 'AWS S3'],
  connectedSpaces: ['space-general'],
  storageProvider: 'AWS S3',
  s3Bucket: AWS_S3_CONFIG.bucket,
  s3Uri: `s3://${AWS_S3_CONFIG.bucket}/users/damien-k/documents/welcome.md`
};

const FRESH_FOLDERS = [
  { id: 'fol-gen', name: 'General', color: '#0b57d0', fileCount: 1 },
  { id: 'fol-proj', name: 'Project Docs', color: '#188038', fileCount: 0 },
  { id: 'fol-res', name: 'Research & Data', color: '#f9ab00', fileCount: 0 },
  { id: 'fol-uploads', name: 'My Uploads', color: '#d93025', fileCount: 0 }
];

const FRESH_SPACE = {
  id: 'space-general',
  name: 'General Workspace',
  description: 'Your primary collaborative space grounded in your AWS S3 documents.',
  activeBots: ['bot-gemini'],
  members: ['u-1'],
  connectedFileIds: ['f-welcome'],
  messages: [
    {
      id: 'm-w1',
      senderType: 'ai',
      botId: 'bot-gemini',
      author: 'Gemini 3.8 Flash',
      avatar: '⚡',
      timestamp: 'Just now',
      reasoningTime: '0.4s',
      content: `Welcome to your fresh CogniDrive workspace! 📂\n\nI am grounded in your initial file **Welcome_to_CogniDrive.md** stored in AWS S3. You can:\n- Upload your own files via **"+ New"**\n- Connect your custom model (OpenAI, Claude, Gemini) with your API key\n- Try asking me: *"Summarize the quick start guide in my mounted file"*\n\nLet's get started!`,
      citations: [
        { fileId: 'f-welcome', fileName: 'Welcome_to_CogniDrive.md', excerpt: 'CogniDrive is your Google Drive for AI Chatbots, backed by AWS S3.' }
      ]
    }
  ]
};

export default function App() {
  // Session State (Null shows Landing Page)
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('cognidrive_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    // Return null so user sees the new Landing Page and easy signup screen first!
    return null;
  });

  const [files, setFiles] = useState(() => {
    const savedMode = localStorage.getItem('cognidrive_mode');
    return savedMode === 'fresh' ? [FRESH_WELCOME_FILE] : INITIAL_FILES;
  });

  const [folders, setFolders] = useState(() => {
    const savedMode = localStorage.getItem('cognidrive_mode');
    return savedMode === 'fresh' ? FRESH_FOLDERS : INITIAL_FOLDERS;
  });

  const [spaces, setSpaces] = useState(() => {
    const savedMode = localStorage.getItem('cognidrive_mode');
    return savedMode === 'fresh' ? [FRESH_SPACE] : INITIAL_SPACES;
  });

  // Custom User Models with API Keys
  const [customModels, setCustomModels] = useState(() => {
    const saved = localStorage.getItem('cognidrive_custom_models');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [teamMembers] = useState(TEAM_MEMBERS);

  const [currentView, setCurrentView] = useState('drive'); // 'drive', 'space', 'agents'
  const [selectedSpaceId, setSelectedSpaceId] = useState(() => {
    const savedMode = localStorage.getItem('cognidrive_mode');
    return savedMode === 'fresh' ? 'space-general' : 'space-1';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Combined bots list (custom user models prepended to built-in models)
  const allBots = [...customModels, ...AI_BOTS];

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('cognidrive_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('cognidrive_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('cognidrive_theme', 'light');
    }
  }, [darkMode]);

  // Modals
  const [previewFile, setPreviewFile] = useState(null);
  const [connectModalSpaceId, setConnectModalSpaceId] = useState(null);
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics
  const totalTokens = files.reduce((acc, f) => acc + (f.tokens || 0), 0);

  // Active space object
  const currentSpace = spaces.find(s => s.id === selectedSpaceId) || spaces[0];

  // Start new user session from Landing Page
  const handleStartSession = ({ name, email, mode }) => {
    const newSession = { name, email, mode, startedAt: Date.now() };
    setSession(newSession);
    localStorage.setItem('cognidrive_session', JSON.stringify(newSession));
    localStorage.setItem('cognidrive_mode', mode);

    if (mode === 'fresh') {
      setFiles([FRESH_WELCOME_FILE]);
      setFolders(FRESH_FOLDERS);
      setSpaces([FRESH_SPACE]);
      setSelectedSpaceId('space-general');
      setCurrentView('drive');
      showToast(`Welcome ${name}! Fresh workspace initialized on AWS S3.`);
    } else {
      setFiles(INITIAL_FILES);
      setFolders(INITIAL_FOLDERS);
      setSpaces(INITIAL_SPACES);
      setSelectedSpaceId('space-1');
      setCurrentView('drive');
      showToast(`Welcome ${name}! Demo workspace loaded.`);
    }
  };

  // Sign out / Return to landing page
  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('cognidrive_session');
    showToast('Signed out of workspace.');
  };

  // Save new custom model
  const handleSaveModel = (newModel) => {
    setCustomModels(prev => {
      const updated = [newModel, ...prev];
      localStorage.setItem('cognidrive_custom_models', JSON.stringify(updated));
      return updated;
    });
    showToast(`Model "${newModel.name}" connected with live API key!`);
  };

  // Delete custom model
  const handleDeleteCustomBot = (modelId) => {
    setCustomModels(prev => {
      const updated = prev.filter(m => m.id !== modelId);
      localStorage.setItem('cognidrive_custom_models', JSON.stringify(updated));
      return updated;
    });
    showToast('Custom model removed.');
  };

  // Send message in space
  const handleSendMessage = (spaceId, message) => {
    setSpaces(prev => prev.map(sp => {
      if (sp.id === spaceId) {
        return {
          ...sp,
          messages: [...sp.messages, message]
        };
      }
      return sp;
    }));
  };

  // Mount/Update connected files for a space
  const handleSaveConnections = (spaceId, fileIds) => {
    setSpaces(prev => prev.map(sp => {
      if (sp.id === spaceId) {
        return { ...sp, connectedFileIds: fileIds };
      }
      return sp;
    }));

    setFiles(prev => prev.map(f => {
      const isConnected = fileIds.includes(f.id);
      const currentSpaces = f.connectedSpaces || [];
      let updatedSpaces = [...currentSpaces];

      if (isConnected && !updatedSpaces.includes(spaceId)) {
        updatedSpaces.push(spaceId);
      } else if (!isConnected && updatedSpaces.includes(spaceId)) {
        updatedSpaces = updatedSpaces.filter(id => id !== spaceId);
      }

      return { ...f, connectedSpaces: updatedSpaces };
    }));

    showToast("Mounted files updated for this space.");
  };

  // Unmount single file from a space
  const handleUnmountFile = (spaceId, fileId) => {
    setSpaces(prev => prev.map(sp => {
      if (sp.id === spaceId) {
        return {
          ...sp,
          connectedFileIds: (sp.connectedFileIds || []).filter(id => id !== fileId)
        };
      }
      return sp;
    }));

    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          connectedSpaces: (f.connectedSpaces || []).filter(id => id !== spaceId)
        };
      }
      return f;
    }));

    showToast("File unmounted from space.");
  };

  // Save generated artifact back to Drive
  const handleSaveArtifactToDrive = (spaceId, artifactData, rawContent) => {
    const sp = spaces.find(s => s.id === spaceId);
    const newFile = {
      id: `f-art-${Date.now()}`,
      name: artifactData.title || `Synthesis_${Date.now().toString().slice(-4)}.md`,
      type: 'markdown',
      size: `${Math.round(Math.max(12, rawContent.length / 100))} KB`,
      tokens: Math.round(rawContent.split(/\s+/).length * 1.3),
      status: 'indexed',
      folder: 'Project Docs',
      updatedAt: 'Just now',
      author: `${session?.name || 'Damien K.'} (via AI)`,
      summary: artifactData.preview || 'Grounded synthesis saved directly from collaborative chat space.',
      content: rawContent,
      tags: ['AI Generated', 'Artifact', sp?.name.split(' ')[0] || 'Space', 'AWS S3'],
      connectedSpaces: [spaceId],
      storageProvider: 'AWS S3',
      s3Bucket: AWS_S3_CONFIG.bucket
    };

    setFiles(prev => [newFile, ...prev]);

    setSpaces(prev => prev.map(s => {
      if (s.id === spaceId) {
        return {
          ...s,
          connectedFileIds: [...new Set([...(s.connectedFileIds || []), newFile.id])]
        };
      }
      return s;
    }));

    showToast(`"${newFile.name}" saved to AWS S3 Drive!`);
  };

  // Upload file to Drive
  const handleUploadFile = (newFile) => {
    setFiles(prev => [newFile, ...prev]);

    if (newFile.connectedSpaces?.length > 0) {
      const targetSpaceId = newFile.connectedSpaces[0];
      setSpaces(prev => prev.map(sp => {
        if (sp.id === targetSpaceId) {
          return {
            ...sp,
            connectedFileIds: [...new Set([...(sp.connectedFileIds || []), newFile.id])]
          };
        }
        return sp;
      }));
    }

    showToast(`"${newFile.name}" uploaded to AWS S3 & indexed!`);
  };

  // Delete file
  const handleDeleteFile = (fileId) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!window.confirm(`Delete "${fileToDelete?.name}" from Drive?`)) return;

    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSpaces(prev => prev.map(sp => ({
      ...sp,
      connectedFileIds: (sp.connectedFileIds || []).filter(id => id !== fileId)
    })));

    showToast("File deleted from Drive.");
  };

  // Create Space
  const handleCreateSpace = (newSpace) => {
    setSpaces(prev => [...prev, newSpace]);
    setSelectedSpaceId(newSpace.id);
    setCurrentView('space');

    if (newSpace.connectedFileIds?.length > 0) {
      setFiles(prev => prev.map(f => {
        if (newSpace.connectedFileIds.includes(f.id)) {
          return {
            ...f,
            connectedSpaces: [...new Set([...(f.connectedSpaces || []), newSpace.id])]
          };
        }
        return f;
      }));
    }

    showToast(`Space #${newSpace.name} created!`);
  };

  // Render Landing Page if no active session
  if (!session) {
    return <LandingView onStartSession={handleStartSession} />;
  }

  return (
    <div className="cogni-app-root">
      {/* Top Navigation */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={session}
        onLogout={handleLogout}
      />

      {/* Main App Layout */}
      <div className="cogni-body-layout">
        <Sidebar 
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedSpaceId={selectedSpaceId}
          setSelectedSpaceId={setSelectedSpaceId}
          spaces={spaces}
          files={files}
          bots={allBots}
          onOpenNewSpace={() => setIsNewSpaceModalOpen(true)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
        />

        <main className="cogni-main-content">
          {currentView === 'drive' && (
            <DriveView 
              files={files}
              folders={folders}
              spaces={spaces}
              onOpenFile={(file) => setPreviewFile(file)}
              onConnectFileToSpace={(file) => {
                setConnectModalSpaceId(selectedSpaceId);
              }}
              onDeleteFile={handleDeleteFile}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'space' && currentSpace && (
            <SpaceView 
              space={currentSpace}
              allFiles={files}
              allBots={allBots}
              teamMembers={teamMembers}
              onSendMessage={handleSendMessage}
              onMountFiles={handleSaveConnections}
              onUnmountFile={handleUnmountFile}
              onToggleFileContext={() => {}}
              onOpenFile={(file) => setPreviewFile(file)}
              onSaveArtifactToDrive={handleSaveArtifactToDrive}
              onOpenConnectModal={() => setConnectModalSpaceId(currentSpace.id)}
              onOpenAddModel={() => setIsAddModelModalOpen(true)}
            />
          )}

          {currentView === 'agents' && (
            <AgentsView 
              bots={allBots}
              spaces={spaces}
              onOpenAddModel={() => setIsAddModelModalOpen(true)}
              onDeleteCustomBot={handleDeleteCustomBot}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal 
          file={previewFile}
          spaces={spaces}
          onClose={() => setPreviewFile(null)}
          onMountToSpace={(file) => {
            setConnectModalSpaceId(selectedSpaceId);
          }}
          onNavigateToSpace={(spaceId) => {
            setSelectedSpaceId(spaceId);
            setCurrentView('space');
          }}
        />
      )}

      {connectModalSpaceId && (
        <ConnectFilesModal 
          space={spaces.find(s => s.id === connectModalSpaceId) || currentSpace}
          allFiles={files}
          onClose={() => setConnectModalSpaceId(null)}
          onSaveConnections={handleSaveConnections}
        />
      )}

      {isNewSpaceModalOpen && (
        <NewSpaceModal 
          allFiles={files}
          allBots={allBots}
          teamMembers={teamMembers}
          onClose={() => setIsNewSpaceModalOpen(false)}
          onCreateSpace={handleCreateSpace}
        />
      )}

      {isUploadModalOpen && (
        <UploadFileModal 
          folders={folders}
          spaces={spaces}
          currentSpaceId={currentView === 'space' ? selectedSpaceId : null}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadFile={handleUploadFile}
        />
      )}

      {/* Connect Custom Model / API Key Modal */}
      <AddModelModal
        isOpen={isAddModelModalOpen}
        onClose={() => setIsAddModelModalOpen(false)}
        onSaveModel={handleSaveModel}
      />

      {/* Account Settings Menu Modal */}
      <AccountSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        filesCount={files.length}
        totalTokens={totalTokens}
        user={session}
        onLogout={handleLogout}
        onOpenAddModel={() => setIsAddModelModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
