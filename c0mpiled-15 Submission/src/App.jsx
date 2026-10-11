import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DriveView from './components/DriveView';
import SpaceView from './components/SpaceView';
import AgentsView from './components/AgentsView';
import FilePreviewModal from './components/FilePreviewModal';
import ConnectFilesModal from './components/ConnectFilesModal';
import NewSpaceModal from './components/NewSpaceModal';
import UploadFileModal from './components/UploadFileModal';
import EvaluationModal from './components/EvaluationModal';

import { 
  INITIAL_FILES, 
  INITIAL_FOLDERS, 
  AI_BOTS, 
  TEAM_MEMBERS, 
  INITIAL_SPACES 
} from './data/initialData';

import './App.css';

export default function App() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [spaces, setSpaces] = useState(INITIAL_SPACES);
  const [bots, setBots] = useState(AI_BOTS);
  const [teamMembers, setTeamMembers] = useState(TEAM_MEMBERS);

  const [currentView, setCurrentView] = useState('drive'); // 'drive', 'space', 'agents', 'evaluation'
  const [selectedSpaceId, setSelectedSpaceId] = useState('space-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewFile, setPreviewFile] = useState(null);
  const [connectModalSpaceId, setConnectModalSpaceId] = useState(null);
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics
  const totalTokens = files.reduce((acc, f) => acc + (f.tokens || 0), 0);

  // Active space object
  const currentSpace = spaces.find(s => s.id === selectedSpaceId) || spaces[0];

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
    // Update Space
    setSpaces(prev => prev.map(sp => {
      if (sp.id === spaceId) {
        return { ...sp, connectedFileIds: fileIds };
      }
      return sp;
    }));

    // Update Files
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

    showToast(`Mounted ${fileIds.length} Drive files to space!`);
  };

  // Unmount single file
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

  // Save AI Artifact output directly into Drive as a file!
  const handleSaveArtifactToDrive = (spaceId, artifactData, rawContent, authorName) => {
    const sp = spaces.find(s => s.id === spaceId);
    const newFile = {
      id: `f-${Date.now()}`,
      name: artifactData.title || `AI_Output_${Date.now().toString().slice(-4)}.md`,
      type: 'markdown',
      size: `${Math.round(rawContent.length / 100) + 1} KB`,
      tokens: Math.round(rawContent.split(/\s+/).length * 1.3),
      status: 'indexed',
      folder: 'Product Research',
      updatedAt: 'Just now',
      author: authorName ? `${authorName} (AI Generated)` : 'Gemini 3.8 Flash (AI Generated)',
      summary: artifactData.preview || 'Grounded synthesis saved directly from collaborative chat space.',
      content: rawContent,
      tags: ['AI Generated', 'Artifact', sp?.name.split(' ')[0] || 'Space'],
      connectedSpaces: [spaceId]
    };

    setFiles(prev => [newFile, ...prev]);

    // Also link to space
    setSpaces(prev => prev.map(s => {
      if (s.id === spaceId) {
        return {
          ...s,
          connectedFileIds: [...new Set([...(s.connectedFileIds || []), newFile.id])]
        };
      }
      return s;
    }));

    showToast(`"${newFile.name}" committed to Drive!`);
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

    showToast(`"${newFile.name}" indexed and uploaded to Drive!`);
  };

  // Delete file
  const handleDeleteFile = (fileId) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!window.confirm(`Delete "${fileToDelete?.name}" from AI Drive?`)) return;

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

    // Update files connectedSpaces
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

  return (
    <div className="cogni-app-root">
      {/* Top Navigation */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalTokens={totalTokens}
        filesCount={files.length}
        spacesCount={spaces.length}
        onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
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
          bots={bots}
          teamMembers={teamMembers}
          onOpenNewSpace={() => setIsNewSpaceModalOpen(true)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenEvaluation={() => setIsEvaluationModalOpen(true)}
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
              allBots={bots}
              teamMembers={teamMembers}
              onSendMessage={handleSendMessage}
              onMountFiles={handleSaveConnections}
              onUnmountFile={handleUnmountFile}
              onToggleFileContext={() => {}}
              onOpenFile={(file) => setPreviewFile(file)}
              onSaveArtifactToDrive={handleSaveArtifactToDrive}
              onOpenConnectModal={() => setConnectModalSpaceId(currentSpace.id)}
            />
          )}

          {currentView === 'agents' && (
            <AgentsView 
              bots={bots}
              spaces={spaces}
            />
          )}

          {currentView === 'evaluation' && (
            <div className="eval-standalone-wrapper">
              <EvaluationModal onClose={() => setCurrentView('drive')} />
            </div>
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
          allBots={bots}
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

      {isEvaluationModalOpen && currentView !== 'evaluation' && (
        <EvaluationModal 
          onClose={() => setIsEvaluationModalOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
