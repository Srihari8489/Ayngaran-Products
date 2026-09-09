import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderOpen,
  X,
  Star,
  Plus,
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';
import adminApi from '../api/client';

interface ImageUploadFieldProps {
  label?: string;
  description?: string;
  value?: string | string[]; // Single URL or Array of URLs
  onChange: (value: any) => void;
  multiple?: boolean;
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label = 'Image Asset',
  description,
  value,
  onChange,
  multiple = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize value to array for internal helper functions
  const currentImages: string[] = multiple
    ? Array.isArray(value)
      ? value
      : value
      ? [value as string]
      : []
    : typeof value === 'string' && value.trim()
    ? [value.trim()]
    : [];

  const handleDirectUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      if (multiple) {
        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append('files', f));
        const res: any = await adminApi.post('/uploads/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploadedArr = Array.isArray(res) ? res : res?.data || [];
        const newUrls = uploadedArr.map((item: any) => item.url);
        onChange([...currentImages, ...newUrls]);
      } else {
        const formData = new FormData();
        formData.append('file', files[0]);
        const res: any = await adminApi.post('/uploads/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploaded = res?.data || res;
        if (uploaded?.url) {
          onChange(uploaded.url);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleModalSelect = (selectedUrls: string[]) => {
    if (multiple) {
      // Append without duplicate
      const unique = Array.from(new Set([...currentImages, ...selectedUrls]));
      onChange(unique);
    } else if (selectedUrls.length > 0) {
      onChange(selectedUrls[0]);
    }
  };

  const handleRemoveSingle = () => {
    onChange('');
  };

  const handleRemoveMultiple = (idxToRemove: number) => {
    const updated = currentImages.filter((_, idx) => idx !== idxToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (idx: number) => {
    if (idx === 0) return;
    const target = currentImages[idx];
    const filtered = currentImages.filter((_, i) => i !== idx);
    onChange([target, ...filtered]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleDirectUpload(e.target.files)}
        multiple={multiple}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Label and Description */}
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
            {label}
          </label>
          {multiple && currentImages.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>
              {currentImages.length} image{currentImages.length > 1 ? 's' : ''} uploaded
            </span>
          )}
        </div>
      )}

      {description && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', margin: '0 0 0.4rem 0' }}>
          {description}
        </p>
      )}

      {/* SINGLE IMAGE MODE */}
      {!multiple && (
        <div>
          {currentImages.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div
                style={{
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={currentImages[0]}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={currentImages[0]}
                >
                  {currentImages[0].split('/').pop()}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '0.15rem',
                  }}
                >
                  {currentImages[0]}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                  >
                    <FolderOpen size={12} style={{ marginRight: '0.3rem' }} /> Choose from Uploads
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                  >
                    <UploadCloud size={12} style={{ marginRight: '0.3rem' }} /> Replace
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveSingle}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  color: '#dc2626',
                  borderRadius: '0.5rem',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
                title="Remove image"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div
              style={{
                border: '1.5px dashed #cbd5e1',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={20} />
              </div>

              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                  Select or upload image
                </span>
                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Stored in server uploads folder and persisted in database
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                >
                  <UploadCloud size={13} style={{ marginRight: '0.35rem' }} />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                >
                  <FolderOpen size={13} style={{ marginRight: '0.35rem' }} />
                  Uploads Library
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MULTI IMAGE MODE */}
      {multiple && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Gallery Grid */}
          {currentImages.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {currentImages.map((url, idx) => {
                const isPrimary = idx === 0;

                return (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      borderRadius: '0.65rem',
                      border: isPrimary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Product asset ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    {/* Primary Badge */}
                    {isPrimary && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.3rem',
                          left: '0.3rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '0.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Star size={10} fill="#ffffff" /> Primary
                      </div>
                    )}

                    {/* Actions Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.3rem',
                        right: '0.3rem',
                        display: 'flex',
                        gap: '0.25rem',
                      }}
                    >
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '0.35rem',
                            padding: '0.25rem',
                            cursor: 'pointer',
                          }}
                          title="Set as hero/primary image"
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMultiple(idx)}
                        style={{
                          background: '#dc2626',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '0.35rem',
                          padding: '0.25rem',
                          cursor: 'pointer',
                        }}
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar for Adding More Images */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1.5px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={16} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                  Add Product Gallery Images
                </span>
                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>
                  Upload multiple files or choose from existing server uploads
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
              >
                <UploadCloud size={13} style={{ marginRight: '0.35rem' }} />
                {isUploading ? 'Uploading...' : 'Upload Image(s)'}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
              >
                <FolderOpen size={13} style={{ marginRight: '0.35rem' }} />
                Choose from Uploads Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleModalSelect}
        multiple={multiple}
        initialSelected={currentImages}
      />
    </div>
  );
};

export default ImageUploadField;
