import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassBadge } from '../ui/GlassBadge.jsx';
import { isSupabaseEnabled } from '../../lib/supabase.js';
import {
  uploadDocument,
  fetchDocuments,
  deleteDocument,
  getDocumentUrl,
} from '../../services/documentService.js';

const CATEGORY_LABELS = {
  general: 'Allgemein',
  expose: 'Exposé',
  contract: 'Vertrag',
  gutachten: 'Gutachten',
  proposal: 'Angebot',
};

const FILE_ICONS = {
  pdf: '📄',
  image: '🖼️',
  doc: '📝',
  default: '📎',
};

function getFileType(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext)) return 'doc';
  return 'default';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * DocumentVault — File upload/download component for leads.
 *
 * @param {{ leadId: string|null }} props
 */
export function DocumentVault({ leadId = null }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('general');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return;
    }
    loadDocuments();
  }, [leadId]);

  async function loadDocuments() {
    setLoading(true);
    const { data } = await fetchDocuments(leadId);
    if (data) setDocuments(data);
    setLoading(false);
  }

  async function handleUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const { data, error } = await uploadDocument(leadId, file, category);
      if (data) {
        setDocuments((prev) => [data, ...prev]);
      } else if (error) {
        console.error('Upload failed:', error);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(doc) {
    const confirmed = window.confirm(`"${doc.name}" wirklich löschen?`);
    if (!confirmed) return;
    await deleteDocument(doc.id, doc.file_path);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  async function handleDownload(doc) {
    const { data } = await getDocumentUrl(doc.file_path);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  }

  if (!isSupabaseEnabled) {
    return (
      <GlassCard hoverable={false} className="document-vault">
        <h3 className="document-vault__title">Dokumenten-Tresor</h3>
        <p className="document-vault__empty">
          Supabase-Verbindung erforderlich für Dokumenten-Upload.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard hoverable={false} className="document-vault">
      <div className="document-vault__header">
        <h3 className="document-vault__title">Dokumenten-Tresor</h3>
        <GlassBadge>{documents.length} Dateien</GlassBadge>
      </div>

      {/* Upload area */}
      <div className="document-vault__upload">
        <select
          className="document-vault__category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <GlassButton
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Hochladen...' : 'Dateien hochladen'}
        </GlassButton>
        <input
          ref={fileRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="document-vault__file-input"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
        />
      </div>

      {/* Document list */}
      {loading && <p className="document-vault__loading">Laden...</p>}

      {!loading && documents.length === 0 && (
        <p className="document-vault__empty">Noch keine Dokumente hochgeladen.</p>
      )}

      {!loading && documents.length > 0 && (
        <div className="document-vault__list">
          {documents.map((doc) => {
            const fileType = getFileType(doc.name);
            return (
              <div key={doc.id} className="document-vault__item">
                <span className="document-vault__icon">
                  {FILE_ICONS[fileType] || FILE_ICONS.default}
                </span>
                <div className="document-vault__item-info">
                  <span className="document-vault__item-name">{doc.name}</span>
                  <span className="document-vault__item-meta">
                    {CATEGORY_LABELS[doc.category] || doc.category}
                    {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ''}
                    {` · ${new Date(doc.created_at).toLocaleDateString('de-DE')}`}
                  </span>
                </div>
                <div className="document-vault__item-actions">
                  <GlassButton onClick={() => handleDownload(doc)}>Öffnen</GlassButton>
                  <GlassButton onClick={() => handleDelete(doc)}>Löschen</GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
