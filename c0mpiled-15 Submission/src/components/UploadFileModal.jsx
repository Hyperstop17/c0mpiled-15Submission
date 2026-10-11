import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Folder, 
  Check, 
  FileText, 
  FileUp, 
  Loader2, 
  FileSpreadsheet, 
  FileCode, 
  Image as ImageIcon 
} from 'lucide-react';
import { uploadFileToStorage } from '../services/storageService';
import { parseUploadedFile } from '../services/fileParser';

export default function UploadFileModal({
  folders,
  spaces,
  currentSpaceId,
  user,
  onClose,
  onUploadFile
}) {
  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState(folders[0]?.name || 'My Uploads');
  const [content, setContent] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [detectedType, setDetectedType] = useState('text');
  const [fileSize, setFileSize] = useState('');
  const [summary, setSummary] = useState('');
  const [mountToCurrent, setMountToCurrent] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processSelectedFile = async (file) => {
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      const parsed = await parseUploadedFile(file);
      setContent(parsed.content || '');
      setDataUrl(parsed.dataUrl || '');
      setHtmlContent(parsed.htmlContent || '');
      setDetectedType(parsed.type);
      setFileSize(parsed.size);
      if (!summary) {
        setSummary(parsed.summary || `Uploaded ${parsed.name} (${parsed.size}). Ready for AI grounding.`);
      }
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleLocalFileChange = (e) => {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim() || isUploading || isParsing) return;

    setIsUploading(true);

    try {
      const savedFile = await uploadFileToStorage({
        name: fileName.trim(),
        content: content.trim() || `# ${fileName.trim()}\n\nUploaded file content.`,
        dataUrl: dataUrl || undefined,
        htmlContent: htmlContent || undefined,
        type: detectedType,
        size: fileSize || '24 KB',
        folder: folder,
        summary: summary.trim(),
        author: user?.name ? `${user.name} (You)` : 'You',
        connectedSpaces: mountToCurrent && currentSpaceId ? [currentSpaceId] : []
      }, user);

      onUploadFile(savedFile);
      onClose();
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Upload size={20} className="text-cyan" />
            <div>
              <h2 className="modal-title">Upload File to AI Drive</h2>
              <div className="modal-subtitle">
                Secure Cloud Storage • All formats (PDF, Word, Spreadsheets, Code, Images) rendered natively
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          {/* Universal Dropzone Box */}
          <div 
            className={`file-dropzone-box ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isParsing ? (
              <Loader2 size={28} className="text-indigo spinner" />
            ) : (
              <FileUp size={28} className="text-indigo" />
            )}
            <div className="dropzone-text-group">
              <label htmlFor="file-input-upload" className="dropzone-label">
                {isParsing ? 'Parsing and indexing document...' : fileName ? `Selected: ${fileName}` : 'Choose or drop any file from your computer'}
              </label>
              <div className="dropzone-sub">
                Supports PDFs, Word (.docx), Spreadsheets (.csv), Code, Markdown, Text, and Images
              </div>
            </div>
            <input 
              id="file-input-upload" 
              type="file" 
              className="dropzone-file-input"
              onChange={handleLocalFileChange} 
              accept="*/*"
            />
          </div>

          <div className="form-group">
            <label>File Name</label>
            <input 
              type="text" 
              placeholder="e.g. Sales_Report.csv, Contract.pdf, Specs.docx, script.py" 
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Destination Folder</label>
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
            <label>Summary / Topic Note (Optional)</label>
            <input 
              type="text" 
              placeholder="Short note or description for AI retrieval..." 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Show Content Preview textarea only for text/code/markdown */}
          {detectedType !== 'image' && (
            <div className="form-group">
              <label>Document Content Preview</label>
              <textarea 
                rows={4}
                placeholder="File text, extracted content, or paste data directly here..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {currentSpaceId && (
            <div className="checkbox-row" onClick={() => setMountToCurrent(!mountToCurrent)}>
              <div className={`custom-checkbox ${mountToCurrent ? 'checked' : ''}`}>
                {mountToCurrent && <Check size={12} />}
              </div>
              <span className="checkbox-label">
                Mount directly to current active room (makes immediately available for AI questions)
              </span>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isUploading}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!fileName.trim() || isParsing || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 size={15} className="spinner" />
                  <span>Saving to Cloud...</span>
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>Save to Drive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
