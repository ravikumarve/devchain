import { useState, useEffect, useRef } from 'react';
import { uploadAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileManager({ productId, isSeller }: { productId: string; isSeller: boolean }) {
  const { token } = useAuthStore();
  const [info, setInfo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadInfo(); }, [productId]);

  const loadInfo = async () => {
    try {
      const res = await uploadAPI.getFileInfo(productId);
      setInfo(res.data);
    } catch { setInfo({ hasFile: false, hasAccess: false }); }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      // Simulate progress
      const interval = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
      await uploadAPI.uploadFile(productId, file);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => { setUploading(false); setUploadProgress(0); loadInfo(); }, 800);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  const handleDownload = () => {
    const url = uploadAPI.getDownloadUrl(productId);
    // Use fetch with auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = info?.fileName || 'download';
        a.click();
      })
      .catch(() => alert('Download failed'));
  };

  if (!info) return null;

  return (
    <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24, marginTop: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#fff' }}>📁 Product Files</h3>
      <p style={{ color: '#55556a', fontSize: 13, marginBottom: 20 }}>
        {isSeller ? 'Upload your product file for buyers to download after purchase.' : 'Download your purchased file.'}
      </p>

      {/* Seller: Upload UI */}
      {isSeller && (
        <div>
          {info.hasFile ? (
            <div style={{ background: '#07070d', border: '1px solid #05966933', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📦</span>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{info.fileName}</div>
                  <div style={{ color: '#55556a', fontSize: 12 }}>{info.fileSize ? formatSize(info.fileSize) : 'Unknown size'} · Uploaded</div>
                </div>
              </div>
              <span style={{ background: '#05966922', color: '#059669', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>✓ Active</span>
            </div>
          ) : null}

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            style={{ border: `2px dashed ${dragOver ? '#7C3AED' : '#2a2a3e'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: dragOver ? '#1a0a2e' : 'transparent' }}
          >
            {uploading ? (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⬆️</div>
                <div style={{ color: '#7C3AED', fontWeight: 700, marginBottom: 10 }}>Uploading... {uploadProgress}%</div>
                <div style={{ height: 6, background: '#1e1e2e', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #7C3AED, #9F67FF)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{info.hasFile ? 'Replace file' : 'Upload product file'}</div>
                <div style={{ color: '#55556a', fontSize: 12 }}>ZIP, PDF, JS, TS, JSON — max 50MB · drag & drop or click</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".zip,.tar,.gz,.pdf,.js,.ts,.json,.md,.txt,.png,.svg" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </div>
      )}

      {/* Buyer: Download UI */}
      {!isSeller && (
        <div>
          {!info.hasAccess ? (
            <div style={{ background: '#1a0a0a', border: '1px solid #DC262633', borderRadius: 12, padding: 16, color: '#DC2626', fontSize: 14, fontWeight: 600 }}>
              🔒 Purchase this product to access the files.
            </div>
          ) : !info.hasFile ? (
            <div style={{ background: '#07070d', border: '1px solid #1e1e2e', borderRadius: 12, padding: 16, color: '#55556a', fontSize: 14 }}>
              📭 The seller hasn't uploaded files yet. Check back soon.
            </div>
          ) : (
            <div style={{ background: '#07070d', border: '1px solid #7C3AED33', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>📦</span>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{info.fileName}</div>
                  <div style={{ color: '#55556a', fontSize: 12 }}>{info.fileSize ? formatSize(info.fileSize) : ''} · Ready to download</div>
                </div>
              </div>
              <button onClick={handleDownload} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                ⬇️ Download File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
