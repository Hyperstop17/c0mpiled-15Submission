import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Folder, 
  Sparkles, 
  Check, 
  FileText, 
  Layers,
  Cloud,
  FileUp
} from 'lucide-react';
import { AWS_S3_CONFIG, detectFileType } from '../services/storageService';

export default function UploadFileModal({
  folders,
  spaces,
  currentSpaceId,
  onClose,
  onUploadFile
}) {
  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState(folders[0]?.name || 'My Uploads');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [mountToCurrent, setMountToCurrent] = useState(true);
  const [isReadingLocalFile, setIsReadingLocalFile] = useState(false);

  // Handle uploading real file from local computer
  const handleLocalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsReadingLocalFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setContent(text);
      if (!summary) {
        setSummary(`Uploaded from ${file.name} (${Math.round(file.size / 1024)} KB). Ready for RAG grounding.`);
      }
      setIsReadingLocalFile(false);
    };
    reader.onerror = () => {
      setIsReadingLocalFile(false);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const type = detectFileType(fileName);
    const words = (content || fileName).split(/\s+/).length;
    const estimatedTokens = Math.max(850, Math.round(words * 1.3));
    const timestamp = Date.now();
    const s3Key = `users/damien-k/documents/${timestamp}_${fileName.trim().replace(/\s+/g, '_')}`;

    const newFile = {
      id: `f-${timestamp}`,
      name: fileName.trim(),
      type: type,
      size: `${Math.round(Math.max(12, (content.length || 1024) / 1024))} KB`,
      tokens: estimatedTokens,
      status: 'indexed',
      folder: folder,
      updatedAt: 'Just now',
      author: 'Damien K. (You)',
      summary: summary.trim() || `Uploaded document containing ${words} words. Semantic vector index generated in AWS S3.`,
      content: content.trim() || `# ${fileName}\n\nUploaded file content indexed for CogniDrive collaborative spaces.`,
      tags: ['AWS S3', 'Uploaded', folder.split(' ')[0]],
      connectedSpaces: mountToCurrent && currentSpaceId ? [currentSpaceId] : [],
      storageProvider: 'AWS S3',
      s3Bucket: AWS_S3_CONFIG.bucket,
      s3Key: s3Key,
      s3Uri: `s3://${AWS_S3_CONFIG.bucket}/${s3Key}`
    };

    onUploadFile(newFile);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Upload size={20} className="text-cyan" />
            <div>
              <h2 className="modal-title">Upload Document to AI Drive</h2>
              <div className="modal-subtitle">
                Backed by <strong>AWS S3</strong> ({AWS_S3_CONFIG.bucket}) with automatic vector chunking for RAG.
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          {/* Local File Picker Dropzone */}
          <div className="file-dropzone-box">
            <FileUp size={24} className="text-indigo" />
            <div>
              <label htmlFor="file-input-upload" className="dropzone-label">
                Choose a local file from your computer
              </label>
              <div className="dropzone-sub">Supports Markdown (.md), CSV, Code (.py, .js, .json), PDF, and Text</div>
            </div>
            <input 
              id="file-input-upload" 
              type="file" 
              className="dropzone-file-input"
              onChange={handleLocalFileChange} 
              accept=".txt,.md,.csv,.json,.py,.js,.jsx,.ts,.tsx,.html,.css"
            />
          </div>

          <div className="form-group">
            <label>File Name (with extension)</label>
            <input 
              type="text" 
              placeholder="e.g. Product_Roadmap_2026.md, API_Spec.json, Data.csv" 
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Target Drive Folder</label>
            <select 
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              {folders.map(f => (
                <option key={f.id} value={f.name}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quick Summary or Topic (Optional)</label>
            <input 
              type="text" 
              placeholder="Brief summary for instant RAG routing..." 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>File Content / Text</label>
            <textarea 
              rows={5}
              placeholder="Paste document text, Markdown, CSV data, or code here, or choose a file above..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {currentSpaceId && (
            <div className="checkbox-row" onClick={() => setMountToCurrent(!mountToCurrent)}>
              <div className={`custom-checkbox ${mountToCurrent ? 'checked' : ''}`}>
                {mountToCurrent && <Check size={12} />}
              </div>
              <span className="checkbox-label">
                Mount directly to current active space (makes immediately accessible to AI bots)
              </span>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!fileName.trim() || isReadingLocalFile}>
              <Cloud size={15} />
              <span>Upload to AWS S3 & Index</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
