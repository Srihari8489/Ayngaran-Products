import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Check,
  Search,
  X,
  FolderOpen,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import adminApi from '../api/client';

export interface UploadedMediaItem {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrls: string[]) => void;
  multiple?: boolean;
  initialSelected?: string[];
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  initialSelected = [],
  title = 'Media Library (Server Uploads)',
}) => {
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedUrls(initialSelected);
      setUploadError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.get('/uploads');
      const items = Array.isArray(res) ? res : res.data || [];
      setMediaList(items);
    } catch (err: any) {
      console.error('Failed to load media files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append('file', files[0]);
        const res: any = await adminApi.post('/uploads/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploaded = res?.data || res;
        if (uploaded?.url) {
          if (multiple) {
            setSelectedUrls((prev) => [...prev, uploaded.url]);
          } else {
            setSelectedUrls([uploaded.url]);
          }
        }
      } else {
        Array.from(files).forEach((f) => formData.append('files', f));
        const res: any = await adminApi.post('/uploads/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploadedArr = Array.isArray(res) ? res : res?.data || [];
        const newUrls = uploadedArr.map((item: any) => item.url);
        if (multiple) {
          setSelectedUrls((prev) => [...prev, ...newUrls]);
        } else if (newUrls.length > 0) {
          setSelectedUrls([newUrls[0]]);
        }
      }
      await fetchMedia();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSelect = (url: string) => {
    if (multiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls(selectedUrls.filter((u) => u !== url));
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedUrls);
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredItems = mediaList.filter((item) =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-panel animate-fadeIn"
        style={{
          width: '100%',
          maxWidth: '56rem',
          maxHeight: 'calc(100vh - 2.5rem)',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Directly synchronized with server <code style={{ color: '#2563eb', backgroundColor: '#eff6ff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>backend/uploads/</code> folder
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar (Upload + Search) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            flexWrap: 'wrap',
          }}
        >
          {/* Direct Upload Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple={multiple}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem',
                padding: '0.55rem 1rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              <UploadCloud size={16} />
              {uploading ? 'Uploading to Server...' : multiple ? 'Upload New Image(s)' : 'Upload New Image'}
            </button>

            <button
              type="button"
              onClick={fetchMedia}
              disabled={loading}
              title="Refresh uploads directory"
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '0.55rem',
                borderRadius: '0.5rem',
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search uploaded files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
                paddingRight: '0.75rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                fontSize: '0.82rem',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {uploadError && (
          <div
            style={{
              padding: '0.65rem 1.75rem',
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.8rem',
            }}
          >
            {uploadError}
          </div>
        )}

        {/* Gallery Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 1.75rem',
            backgroundColor: '#f8fafc',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Reading server uploads folder...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px dashed #cbd5e1',
              }}
            >
              <ImageIcon size={36} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                No uploaded images found
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                {searchQuery ? 'No images match your search.' : 'Upload images above to store them in backend/uploads/.'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
              >
                <UploadCloud size={14} style={{ marginRight: '0.4rem' }} /> Upload Now
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredItems.map((item) => {
                const isSelected = selectedUrls.includes(item.url);

                return (
                  <div
                    key={item.filename}
                    onClick={() => toggleSelect(item.url)}
                    style={{
                      position: 'relative',
                      borderRadius: '0.75rem',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 4px 12px rgba(37, 99, 235, 0.2)'
                        : '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Thumbnail Image */}
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.filename}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Selection Indicator Checkmark */}
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.4rem',
                          right: '0.4rem',
                          width: '1.35rem',
                          height: '1.35rem',
                          borderRadius: '50%',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff' }}>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={item.filename}
                      >
                        {item.filename}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>
                        {formatSize(item.size)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {selectedUrls.length > 0 ? (
              <span style={{ color: '#2563eb', fontWeight: 600 }}>
                {selectedUrls.length} image{selectedUrls.length > 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>Select image{multiple ? 's' : ''} to use</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="btn-primary"
              style={{
                fontSize: '0.82rem',
                padding: '0.5rem 1.25rem',
                opacity: selectedUrls.length === 0 ? 0.5 : 1,
                cursor: selectedUrls.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <FileCheck size={15} />
              Use Selected {selectedUrls.length > 0 ? `(${selectedUrls.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;
