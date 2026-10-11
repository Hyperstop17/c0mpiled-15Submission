import React, { useState, useEffect, useRef } from 'react';
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
import { 
  AWS_S3_CONFIG, 
  saveUserStateToCloud, 
  loadUserStateFromCloud, 
  getCleanUserId 
} from './services/storageService';
import { 
  getActiveSession, 
  logoutSession 
} from './services/authService';

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
  author: 'CogniDrive Team',
  summary: 'Getting started guide for CogniDrive: AWS cloud storage, connecting custom AI models with API keys, and collaborative RAG spaces.',
  content: `# Welcome to CogniDrive 🚀\n\nCogniDrive is your Google Drive for AI Chatbots, backed by **Secure Cloud Storage**.\n\n## Quick Start Guide\n1. **Upload Your Files**: Click **"+ New"** in the sidebar to upload PDF, Word (.docx), CSV, Code, or Text files. They are parsed and indexed for real-time RAG.\n2. **Collaborative Chat Spaces**: Navigate to **#general-workspace** to chat with AI models grounded in your mounted documents.\n3. **Connect Your Own API Key**: Head to **AI Models** or click **"+ API Key"** in any chat space to plug in your OpenAI, Claude, or Gemini key for live responses.\n4. **1-Click Artifacts**: AI models can generate downloadable summaries, roadmaps, and plans that commit back to your Drive with 1 click.`,
  tags: ['Welcome', 'Guide', 'Cloud Vault'],
  connectedSpaces: ['space-general'],
  storageProvider: 'Cloud Storage',
  s3Bucket: AWS_S3_CONFIG.bucket
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
  description: 'Your primary collaborative space grounded in your secure cloud documents.',
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
      content: `Welcome to your fresh CogniDrive workspace! 📂\n\nI am grounded in your initial file **Welcome_to_CogniDrive.md** stored in your cloud vault. You can:\n- Upload your own files via **"+ New"**\n- Connect your custom model (OpenAI, Claude, Gemini) with your API key\n- Try asking me: *"Summarize the quick start guide in my mounted file"*\n\nLet's get started!`,
      citations: [
        { fileId: 'f-welcome', fileName: 'Welcome_to_CogniDrive.md', excerpt: 'CogniDrive is your Google Drive for AI Chatbots, backed by Secure Cloud Storage.' }
      ]
    }
  ]
};

export default function App() {
  // Session State (Cookies & LocalStorage auto sign-in)
  const [session, setSession] = useState(() => getActiveSession());

  // Determine if this is the explicit dev testing profile
  const isDevSession = Boolean(session && (
    session.id === 'damien-k' ||
    session.email === 'damien.dev@cognidrive.local' ||
    session.mode === 'demo'
  ));

  // Workspace State per user (safe defaults while cloud state loads)
  const [files, setFiles] = useState(() => isDevSession ? INITIAL_FILES : []);
  const [folders, setFolders] = useState(() => isDevSession ? INITIAL_FOLDERS : FRESH_FOLDERS);
  const [spaces, setSpaces] = useState(() => isDevSession ? INITIAL_SPACES : [FRESH_SPACE]);
  const [customModels, setCustomModels] = useState([]);

  // Ref flag to ensure we only persist after active user state has loaded
  const isLoadedRef = useRef(false);

  const [teamMembers] = useState(TEAM_MEMBERS);
  const [currentView, setCurrentView] = useState('drive'); // 'drive', 'space', 'agents'
  const [selectedSpaceId, setSelectedSpaceId] = useState(() => isDevSession ? 'space-1' : 'space-general');
  const [searchQuery, setSearchQuery] = useState('');

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('cognidrive_theme') === 'dark';
  });

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

  // 1. Load active user workspace from S3 / LocalStorage on session switch or mount
  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    isLoadedRef.current = false;

    loadUserStateFromCloud(session).then((cloudState) => {
      if (!isMounted) return;

      const isDevProfile = session.id === 'damien-k' || 
                           session.email === 'damien.dev@cognidrive.local' || 
                           session.mode === 'demo';

      if (cloudState && (cloudState.files || cloudState.spaces || cloudState.folders)) {
        let loadedFiles = cloudState.files || [];
        let loadedSpaces = cloudState.spaces || [];

        if (!isDevProfile) {
          // Strict multi-user isolation: purge any dev test files or spaces that might have leaked
          const devFileIds = new Set(['f-1', 'f-2', 'f-3', 'f-4', 'f-5']);
          loadedFiles = loadedFiles.filter(f => !devFileIds.has(f.id) && f.userId !== 'damien-k');
          loadedSpaces = loadedSpaces.filter(s => s.id !== 'space-1' && s.id !== 'space-2' && s.id !== 'space-3');
          if (loadedSpaces.length === 0) {
            loadedSpaces = [FRESH_SPACE];
          }
        }

        setFiles(loadedFiles);
        setFolders(cloudState.folders || (isDevProfile ? INITIAL_FOLDERS : FRESH_FOLDERS));
        setSpaces(loadedSpaces);
        setCustomModels(cloudState.customModels || []);

        if (loadedSpaces.length > 0) {
          setSelectedSpaceId(prev => loadedSpaces.some(s => s.id === prev) ? prev : loadedSpaces[0].id);
        }
      } else {
        // Initial setup for this user profile
        if (isDevProfile) {
          setFiles(INITIAL_FILES);
          setFolders(INITIAL_FOLDERS);
          setSpaces(INITIAL_SPACES);
          setSelectedSpaceId('space-1');
        } else {
          const cleanName = session.name || 'User';
          const userWelcomeDoc = {
            ...FRESH_WELCOME_FILE,
            id: `f-welcome-${session.id || Date.now()}`,
            name: `Welcome_${cleanName.replace(/\s+/g, '_')}.md`,
            author: cleanName,
            userId: getCleanUserId(session),
            content: `# Welcome to CogniDrive, ${cleanName}! 📂\n\nYour private workspace is provisioned with AWS cloud storage under \`users/${getCleanUserId(session)}/documents/\`.\n\n### Quick Start:\n1. Upload your own documents (PDF, Word .docx, CSV, Code, Images) via **+ New**\n2. Right-click anywhere on the canvas to create folders or documents\n3. Connect custom AI model API keys under **AI Models**\n4. Ask the AI Co-Pilot questions grounded directly in your uploaded files!`
          };
          setFiles([userWelcomeDoc]);
          setFolders(FRESH_FOLDERS);
          setSpaces([FRESH_SPACE]);
          setSelectedSpaceId('space-general');
        }
        setCustomModels([]);
      }

      isLoadedRef.current = true;
    });

    return () => { isMounted = false; };
  }, [session?.email, session?.id]);

  // 2. Persist state to AWS S3 & LocalStorage whenever user workspace changes
  useEffect(() => {
    if (!session || !isLoadedRef.current) return;

    saveUserStateToCloud(session, {
      files,
      folders,
      spaces,
      customModels
    });
  }, [files, folders, spaces, customModels, session]);

  // Combined bots list (custom user models prepended to built-in models)
  const allBots = [...customModels, ...AI_BOTS];

  // Dark Mode Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('cognidrive_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('cognidrive_theme', 'light');
    }
  }, [darkMode]);

  // Metrics
  const totalTokens = files.reduce((acc, f) => acc + (f.tokens || 0), 0);
  const currentSpace = spaces.find(s => s.id === selectedSpaceId) || spaces[0];

  // Start session from Landing Page
  const handleStartSession = (userSession) => {
    setSession(userSession);
    setCurrentView('drive');
    showToast(`Welcome ${userSession.name}! Workspace active.`);
  };

  // Sign out
  const handleLogout = () => {
    logoutSession();
    setSession(null);
    showToast('Signed out of workspace.');
  };

  // Create Folder
  const handleCreateFolder = (folderName) => {
    if (!folderName.trim()) return;
    const newFol = {
      id: `fol-${Date.now()}`,
      name: folderName.trim(),
      color: '#1a73e8',
      fileCount: 0
    };
    setFolders(prev => [...prev, newFol]);
    showToast(`Folder "${folderName.trim()}" created!`);
  };

  // Delete Folder
  const handleDeleteFolder = (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all files in it?`)) return;
    setFolders(prev => prev.filter(f => f.name !== folderName));
    setFiles(prev => prev.filter(f => f.folder !== folderName));
    showToast(`Folder "${folderName}" deleted.`);
  };

  // Create Blank Document
  const handleCreateNewDocument = (folderName) => {
    const timestamp = Date.now();
    const docName = `Untitled_Notes_${Date.now().toString().slice(-4)}.md`;
    const newDoc = {
      id: `f-${timestamp}`,
      userId: getCleanUserId(session),
      name: docName,
      type: 'markdown',
      size: '1 KB',
      tokens: 300,
      status: 'indexed',
      folder: folderName || folders[0]?.name || 'My Uploads',
      updatedAt: 'Just now',
      author: session?.name || 'You',
      summary: 'New collaborative Markdown document ready for AI co-authoring.',
      content: `# ${docName.replace('.md', '')}\n\nStart typing or collaborate with your AI model...`,
      tags: ['Document', 'Notes'],
      connectedSpaces: selectedSpaceId ? [selectedSpaceId] : []
    };
    setFiles(prev => [newDoc, ...prev]);
    setPreviewFile(newDoc);
    showToast(`Document "${docName}" created!`);
  };

  // Save new custom model
  const handleSaveModel = (newModel) => {
    setCustomModels(prev => [newModel, ...prev]);
    showToast(`Model "${newModel.name}" connected with live API key!`);
  };

  // Delete custom model
  const handleDeleteCustomBot = (modelId) => {
    setCustomModels(prev => prev.filter(m => m.id !== modelId));
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
      userId: getCleanUserId(session),
      name: artifactData.title || `Synthesis_${Date.now().toString().slice(-4)}.md`,
      type: 'markdown',
      size: `${Math.round(Math.max(12, rawContent.length / 100))} KB`,
      tokens: Math.round(rawContent.split(/\s+/).length * 1.3),
      status: 'indexed',
      folder: 'Project Docs',
      updatedAt: 'Just now',
      author: `${session?.name || 'You'} (via AI)`,
      summary: artifactData.preview || 'Grounded synthesis saved directly from collaborative chat space.',
      content: rawContent,
      tags: ['AI Generated', 'Artifact', sp?.name.split(' ')[0] || 'Space', 'Cloud Vault'],
      connectedSpaces: [spaceId],
      storageProvider: 'Cloud Storage',
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

    showToast(`"${newFile.name}" saved to your cloud drive!`);
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

    showToast(`"${newFile.name}" saved and synced to your cloud vault!`);
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
  const handleCreateSpace = (newSpaceData) => {
    const newSpace = {
      id: `space-${Date.now()}`,
      name: newSpaceData.name,
      description: newSpaceData.description || 'Collaborative room grounded in workspace files.',
      activeBots: newSpaceData.activeBots || ['bot-gemini'],
      members: ['u-1', ...(newSpaceData.members || [])],
      connectedFileIds: newSpaceData.connectedFileIds || [],
      messages: [
        {
          id: `m-init-${Date.now()}`,
          senderType: 'system',
          author: 'System',
          timestamp: 'Just now',
          content: `Space created with ${newSpaceData.connectedFileIds?.length || 0} mounted files and ${newSpaceData.activeBots?.length || 1} AI agents ready to collaborate.`
        }
      ]
    };

    setSpaces(prev => [...prev, newSpace]);

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

    setSelectedSpaceId(newSpace.id);
    setCurrentView('space');
    showToast(`Space "#${newSpace.name}" launched!`);
  };

  // If user is not signed in, show modern Landing View
  if (!session) {
    return (
      <LandingView onStartSession={handleStartSession} />
    );
  }

  return (
    <div className="cogni-app-root cognidrive-app-root">
      {/* Universal Top Navigation */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={session}
        onLogout={handleLogout}
      />

      <div className="cogni-body-layout app-main-layout">
        {/* Google Drive / Slack Unified Sidebar */}
        <Sidebar 
          currentView={currentView}
          setCurrentView={setCurrentView}
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          setSelectedSpaceId={setSelectedSpaceId}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenNewSpace={() => setIsNewSpaceModalOpen(true)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenNewSpaceModal={() => setIsNewSpaceModalOpen(true)}
          onOpenAddModelModal={() => setIsAddModelModalOpen(true)}
          files={files || []}
          filesCount={(files || []).length}
          totalTokens={totalTokens}
          user={session}
        />

        {/* Dynamic Center Workspaces */}
        <main className="cogni-main-content workspace-content-pane">
          {currentView === 'drive' && (
            <DriveView 
              files={files}
              folders={folders}
              spaces={spaces}
              searchQuery={searchQuery}
              onOpenFile={(file) => setPreviewFile(file)}
              onDeleteFile={handleDeleteFile}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onMountToSpace={(file) => {
                if (currentSpace) {
                  handleSaveConnections(currentSpace.id, [...new Set([...(currentSpace.connectedFileIds || []), file.id])]);
                }
              }}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onCreateNewDocument={handleCreateNewDocument}
            />
          )}

          {currentView === 'space' && currentSpace && (
            <SpaceView 
              key={currentSpace.id}
              space={currentSpace}
              allFiles={files}
              allBots={allBots}
              teamMembers={teamMembers}
              onSendMessage={(msg) => handleSendMessage(currentSpace.id, msg)}
              onOpenConnectModal={(spaceId) => setConnectModalSpaceId(spaceId || currentSpace.id)}
              onOpenFile={(file) => setPreviewFile(file)}
              onUnmountFile={(fileId) => handleUnmountFile(currentSpace.id, fileId)}
              onSaveArtifact={(artifact, content) => handleSaveArtifactToDrive(currentSpace.id, artifact, content)}
              onOpenAddModel={() => setIsAddModelModalOpen(true)}
            />
          )}

          {currentView === 'agents' && (
            <AgentsView 
              bots={allBots}
              spaces={spaces || []}
              filesCount={files.length}
              spacesCount={spaces.length}
              onOpenAddModel={() => setIsAddModelModalOpen(true)}
              onDeleteCustomBot={handleDeleteCustomBot}
            />
          )}
        </main>
      </div>

      {/* Global High-Fidelity File Preview / Document Viewer */}
      {previewFile && (
        <FilePreviewModal 
          file={previewFile}
          spaces={spaces}
          onClose={() => setPreviewFile(null)}
          onMountToSpace={(file) => {
            if (currentSpace) {
              handleSaveConnections(currentSpace.id, [...new Set([...(currentSpace.connectedFileIds || []), file.id])]);
            }
          }}
          allBots={allBots}
        />
      )}

      {/* Mount / Connect Files to Space Modal */}
      {connectModalSpaceId && (
        <ConnectFilesModal 
          space={spaces.find(s => s.id === connectModalSpaceId) || currentSpace}
          allFiles={files}
          onClose={() => setConnectModalSpaceId(null)}
          onSaveConnections={(spaceId, fileIds) => {
            handleSaveConnections(spaceId || connectModalSpaceId, fileIds);
            setConnectModalSpaceId(null);
          }}
          onSave={(fileIds) => {
            handleSaveConnections(connectModalSpaceId, fileIds);
            setConnectModalSpaceId(null);
          }}
        />
      )}

      {/* Create New Space Modal */}
      {isNewSpaceModalOpen && (
        <NewSpaceModal 
          allFiles={files}
          allBots={allBots}
          teamMembers={teamMembers}
          onClose={() => setIsNewSpaceModalOpen(false)}
          onCreateSpace={handleCreateSpace}
        />
      )}

      {/* Upload File to Drive Modal */}
      {isUploadModalOpen && (
        <UploadFileModal 
          folders={folders}
          spaces={spaces}
          currentSpaceId={currentView === 'space' ? selectedSpaceId : null}
          user={session}
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
