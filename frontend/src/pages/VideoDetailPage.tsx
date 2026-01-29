import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { disconnectSocket, getSocket } from '../realtime/socket';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';

type Video = {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: string;
  sensitivityStatus: string;
  progress?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  codec?: string;
  containerFormat?: string;
  size: number;
  compressedSize?: number;
  compressionQuality?: string;
  isCompressing?: boolean;
  createdAt: string;
};

const VideoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const fetchVideo = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/videos/${id}`);
      setVideo(res.data.video);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load video';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [id]);

  // Join room for this video and receive progress updates
  useEffect(() => {
    if (!id) return;
    const s = getSocket(token);

    s.emit('join:video', id);

    const onProgress = (payload: any) => {
      if (payload?.videoId === id && typeof payload?.progress === 'number') {
        setProgress(payload.progress);
      }
    };

    const onStatusChanged = (payload: any) => {
      if (payload?.videoId === id) {
        setVideo((prev) =>
          prev
            ? {
                ...prev,
                status: payload?.status || prev.status,
                sensitivityStatus: payload?.sensitivityStatus || prev.sensitivityStatus,
              }
            : prev
        );
        if (payload?.status === 'completed') setProgress(100);
      }
    };

    const onCompressed = (payload: any) => {
      if (payload?.videoId === id) {
        setCompressing(false);
        fetchVideo(); // Refresh video data
      }
    };

    s.on('video:progress', onProgress);
    s.on('video:statusChanged', onStatusChanged);
    s.on('video:compressed', onCompressed);

    return () => {
      s.emit('leave:video', id);
      s.off('video:progress', onProgress);
      s.off('video:statusChanged', onStatusChanged);
      s.off('video:compressed', onCompressed);
      disconnectSocket();
    };
  }, [id, token]);

  const handleCompress = async () => {
    if (!id || !video) return;
    setError(null);
    setCompressing(true);
    try {
      await apiClient.post(`/videos/${id}/compress`, {
        quality: compressionQuality,
      });
      // Socket event will update the UI
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Compression failed';
      setError(msg);
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!id || !token) return;
    const downloadUrl = `${apiBaseUrl}/videos/${id}/download${
      token ? `?token=${token}` : ''
    }`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${video?.title || 'video'}${
      video?.compressedSize ? `-compressed-${video.compressionQuality}` : ''
    }.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };

  if (!id) {
    return (
      <div className="container" style={{ maxWidth: 1400, padding: '2rem 1rem' }}>
        <p style={{ color: '#ef4444' }}>Invalid video ID</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1400, padding: '2rem 1rem' }}>
      {/* Header */}
      <header
        style={{
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #333',
        }}
      >
        <Link
          to="/"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '0.9rem',
            marginBottom: '0.5rem',
            display: 'inline-block',
          }}
        >
          ← Back to dashboard
        </Link>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            Loading video...
          </div>
        )}
        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#7f1d1d',
              borderRadius: '6px',
              color: '#fca5a5',
              marginTop: '1rem',
            }}
          >
            {error}
          </div>
        )}
      </header>

      {video && (
        <>
          {/* Video Info Card */}
          <section style={cardStyle}>
            <h1 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>
              {video.title}
            </h1>
            {video.description && (
              <p style={{ marginTop: 0, marginBottom: '1rem', opacity: 0.8 }}>
                {video.description}
              </p>
            )}

            {/* Status and Sensitivity */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Status:</span>
                <Badge
                  label={video.status}
                  variant={
                    video.status === 'completed'
                      ? 'success'
                      : video.status === 'failed'
                        ? 'danger'
                        : video.status === 'processing'
                          ? 'warning'
                          : 'neutral'
                  }
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Sensitivity:</span>
                <Badge
                  label={video.sensitivityStatus}
                  variant={
                    video.sensitivityStatus === 'safe'
                      ? 'success'
                      : video.sensitivityStatus === 'flagged'
                        ? 'danger'
                        : video.sensitivityStatus === 'pending'
                          ? 'warning'
                          : 'neutral'
                  }
                />
              </div>
            </div>

            {/* Processing Progress */}
            {video.status === 'processing' && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1e3a5f', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 500 }}>Processing...</span>
                  <span>{(progress || video.progress || 0).toFixed(0)}%</span>
                </div>
                <ProgressBar value={progress || video.progress || 0} />
              </div>
            )}

            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #333',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Owner</span>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{video.owner}</p>
              </div>
              {video.durationSeconds != null && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Duration</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                    {video.durationSeconds.toFixed(1)}s
                  </p>
                </div>
              )}
              {video.width && video.height && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Resolution</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                    {video.width}×{video.height}
                  </p>
                </div>
              )}
              {video.codec && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Codec</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{video.codec}</p>
                </div>
              )}
              {video.containerFormat && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Container</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                    {video.containerFormat}
                  </p>
                </div>
              )}
              {user?.role === 'editor' && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>File Size</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                    {formatBytes(video.size)}
                    {video.compressedSize && (
                      <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        {' '}
                        / {formatBytes(video.compressedSize)} ({video.compressionQuality})
                        {video.compressedSize < video.size && (
                          <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>
                            -{(((video.size - video.compressedSize) / video.size) * 100).toFixed(1)}%
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Compression Section - Editor Only */}
          {user?.role === 'editor' && video.status === 'completed' && (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                Compress Video
              </h2>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1rem' }}>
                Reduce file size for faster streaming and storage savings.
              </p>
              {error && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: '#7f1d1d',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                  }}
                >
                  {error}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 200px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Quality</span>
                  <select
                    value={compressionQuality}
                    onChange={(e) =>
                      setCompressionQuality(e.target.value as 'low' | 'medium' | 'high')
                    }
                    disabled={compressing || video.isCompressing}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: '#242424',
                      color: 'white',
                      fontSize: '1rem',
                      cursor: compressing || video.isCompressing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="low">Low (720p, ~800kbps)</option>
                    <option value="medium">Medium (1080p, ~2000kbps)</option>
                    <option value="high">High (1080p, ~4000kbps)</option>
                  </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={handleCompress}
                    disabled={compressing || video.isCompressing}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '6px',
                      background: compressing || video.isCompressing ? '#555' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      cursor: compressing || video.isCompressing ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: 500,
                      height: 'fit-content',
                    }}
                  >
                    {compressing || video.isCompressing ? 'Compressing...' : 'Compress'}
                  </button>
                </div>
              </div>
              {video.isCompressing && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#1e3a5f',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    opacity: 0.9,
                  }}
                >
                  Compression in progress. This may take a few minutes...
                </div>
              )}
            </section>
          )}

          {/* Video Player Section */}
          {video.status === 'completed' ? (
            <section style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Video Player</h2>
                {user?.role === 'editor' && (
                  <button
                    onClick={handleDownload}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: '#16a34a',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  >
                    Download {video.compressedSize ? 'Compressed' : 'Video'}
                  </button>
                )}
              </div>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  background: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <video
                  controls
                  style={{
                    width: '100%',
                    maxWidth: '1200px',
                    height: 'auto',
                    display: 'block',
                  }}
                  src={`${apiBaseUrl}/videos/${video.id}/stream${
                    token ? `?token=${token}` : ''
                  }`}
                />
              </div>
            </section>
          ) : (
            <section style={cardStyle}>
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
                <p style={{ fontSize: '1.1rem', margin: 0 }}>
                  Video is not ready for streaming yet.
                </p>
                {video.status === 'processing' && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    Please wait while the video is being processed...
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default VideoDetailPage;

