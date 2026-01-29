import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
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
  size: number;
  createdAt: string;
};

const DashboardPage = () => {
  const { user, logout, token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingProgress, setProcessingProgress] = useState<
    Record<string, number>
  >({});
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSensitivity, setFilterSensitivity] = useState<string>('');

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSensitivity) params.sensitivityStatus = filterSensitivity;
      const res = await apiClient.get('/videos', { params });
      setVideos(res.data.videos);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load videos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filterStatus, filterSensitivity]);

  // Real-time processing updates via Socket.io
  useEffect(() => {
    const s = getSocket(token);

    const onProgress = (payload: any) => {
      const videoId = payload?.videoId;
      const progress = payload?.progress;
      if (typeof videoId === 'string' && typeof progress === 'number') {
        setProcessingProgress((prev) => ({ ...prev, [videoId]: progress }));
        // Optimistically mark as processing in list
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId ? { ...v, status: 'processing' } : v
          )
        );
      }
    };

    const onStatusChanged = (payload: any) => {
      const videoId = payload?.videoId;
      if (typeof videoId === 'string') {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  status: payload?.status || v.status,
                  sensitivityStatus: payload?.sensitivityStatus || v.sensitivityStatus,
                }
              : v
          )
        );
        if (payload?.status === 'completed') {
          setProcessingProgress((prev) => ({ ...prev, [videoId]: 100 }));
        }
      }
    };

    s.on('video:progress', onProgress);
    s.on('video:statusChanged', onStatusChanged);

    return () => {
      s.off('video:progress', onProgress);
      s.off('video:statusChanged', onStatusChanged);
      disconnectSocket();
    };
  }, [token]);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      if (title) formData.append('title', title);

      await apiClient.post('/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        },
      });

      setFile(null);
      setTitle('');
      setUploadProgress(0);
      await fetchVideos();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    setError(null);
    try {
      await apiClient.delete(`/videos/${videoId}`);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Delete failed';
      setError(msg);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'completed') return <Badge label="completed" variant="success" />;
    if (status === 'processing') return <Badge label="processing" variant="warning" />;
    if (status === 'failed') return <Badge label="failed" variant="danger" />;
    return <Badge label={status} variant="neutral" />;
  };

  const sensitivityBadge = (s: string) => {
    if (s === 'safe') return <Badge label="safe" variant="success" />;
    if (s === 'flagged') return <Badge label="flagged" variant="danger" />;
    if (s === 'pending') return <Badge label="pending" variant="warning" />;
    return <Badge label={s} variant="neutral" />;
  };

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div className="container" style={{ maxWidth: 1400, padding: '2rem 1rem' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #333',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Video Dashboard</h1>
          {user && (
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              Logged in as <strong>{user.email}</strong> ({user.role}) • Tenant{' '}
              <strong>{user.tenantId}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user?.role === 'admin' && (
            <Link
              to="/admin/users"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              Admin
            </Link>
          )}
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Upload Section - Only for Editors and Admins */}
      {user?.role !== 'viewer' && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>
            Upload Video
          </h2>
          <form
            onSubmit={handleUpload}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontWeight: 500 }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title"
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: '#242424',
                  color: 'white',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontWeight: 500 }}>Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: '#242424',
                  color: 'white',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            {uploading && (
              <div style={{ gridColumn: '1 / -1', padding: '0.75rem', background: '#1e3a5f', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: '#0f172a',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: '#3b82f6',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            )}
            {error && (
              <p style={{ color: '#ef4444', margin: 0, gridColumn: '1 / -1' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={uploading}
              style={{
                gridColumn: '1 / -1',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                background: uploading ? '#555' : '#2563eb',
                color: 'white',
                border: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                marginTop: '0.5rem',
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </form>
        </section>
      )}

      {/* Videos Section */}
      <section style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Videos</h2>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#242424',
                color: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="">All Status</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterSensitivity}
              onChange={(e) => setFilterSensitivity(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#242424',
                color: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="">All Sensitivity</option>
              <option value="pending">Pending</option>
              <option value="safe">Safe</option>
              <option value="flagged">Flagged</option>
            </select>
            <button
              onClick={fetchVideos}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: loading ? '#555' : '#16a34a',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            Loading videos...
          </div>
        )}
        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#7f1d1d',
              borderRadius: '6px',
              color: '#fca5a5',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}
        {!loading && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No videos yet.</p>
            {user?.role !== 'viewer' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Upload your first video using the form above.
              </p>
            )}
          </div>
        )}
        {videos.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Sensitivity
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Owner
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Progress
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video, idx) => (
                  <tr
                    key={video.id}
                    style={{
                      borderBottom: '1px solid #333',
                      background: idx % 2 === 0 ? 'transparent' : '#1f1f1f',
                    }}
                  >
                    <td
                      style={{
                        padding: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {video.title}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{statusBadge(video.status)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {sensitivityBadge(video.sensitivityStatus)}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        opacity: 0.9,
                      }}
                    >
                      {video.owner}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {video.status === 'processing' ||
                      typeof processingProgress[video.id] === 'number' ? (
                        <ProgressBar value={processingProgress[video.id] ?? video.progress ?? 0} />
                      ) : video.status === 'completed' ? (
                        <ProgressBar value={100} />
                      ) : (
                        <ProgressBar value={video.progress ?? 0} />
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Link
                          to={`/videos/${video.id}`}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                          }}
                        >
                          View
                        </Link>
                        {user?.role !== 'viewer' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(video.id)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;

