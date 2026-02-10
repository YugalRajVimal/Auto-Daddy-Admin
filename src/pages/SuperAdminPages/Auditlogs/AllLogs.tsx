import React, { useEffect, useState } from 'react';
import axios from 'axios';

// --- Styles (could be moved to CSS for real prod) ---
const containerStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  padding: '30px 24px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  margin: '36px auto',
  maxWidth: 1200,
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  marginTop: 24,
  borderRadius: 8,
  boxShadow: '0 0 0 1px #e7e7e7',
  background: '#fcfcfc',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: '15px',
  minWidth: 850,
};

const thStyle: React.CSSProperties = {
  background: '#f3f6fa',
  padding: '12px 10px',
  borderBottom: '2px solid #e5e5e5',
  fontWeight: 600,
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  borderBottom: '1px solid #ececec',
  textAlign: 'center',
  maxWidth: 250,
  verticalAlign: 'top',
};

const badgeStyle = (role: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 500,
  background: {
    superadmin: '#ffd60022',
    admin: '#29b6f633',
    therapist: '#81c78433',
    patient: '#ff638433',
  }[role] || '#eee',
  color: {
    superadmin: '#927900',
    admin: '#0678a2',
    therapist: '#236d30',
    patient: '#a0202a',
  }[role] || '#555',
});

const actionStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  color: '#4183c4',
};

const detailSummaryButtonStyle: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '13px',
  color: '#388e3c',
  padding: 0,
  background: 'none',
  border: 'none',
  outline: 'none',
  textAlign: 'left',
  textDecoration: 'underline',
};

const detailBoxStyle: React.CSSProperties = {
  background: '#f9fbe7',
  padding: 12,
  borderRadius: 4,
  fontSize: 13,
  marginTop: 10,
  maxHeight: 500,
  overflowY: 'auto',
};

const timestampStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#2f2f2f',
  letterSpacing: '.01em',
  background: '#f1f5fb',
  padding: '4px 8px',
  borderRadius: 5,
  display: 'inline-block',
};

const resourceIdStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#3949ab',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
};

const errorStyle: React.CSSProperties = {
  color: '#d32f2f',
  background: '#fff5f5',
  border: '1px solid #ffe2e2',
  padding: '8px 18px',
  borderRadius: 8,
  marginTop: 20,
  marginBottom: 16,
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(31, 44, 55, 0.30)',
  zIndex: 1011,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalContainerStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 6px 32px 0 rgba(84, 90, 111, 0.12)',
  padding: '27px 28px 25px 28px',
  minWidth: 388,
  maxWidth: '93vw',
  maxHeight: '75vh',
  overflowY: 'auto',
  zIndex: 1013,
  position: 'relative',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 16,
  background: 'none',
  border: 'none',
  fontSize: 22,
  color: '#2f4867',
  cursor: 'pointer',
  padding: 0,
  zIndex: 1020,
  fontWeight: 600,
  lineHeight: 1,
};

interface AuditLog {
  _id: string;
  action: string;
  user: string | { _id: string, name?: string, email?: string };
  role: string;
  resource?: string;
  resourceId?: string;
  details?: any; // mixed type!
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const renderObject = (obj: any, level = 0) =>
  Object.entries(obj).map(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={key} style={{ marginLeft: 14 * (level + 1) }}>
          <span style={{ fontWeight: 500 }}>{key}:</span>
          <div>{renderObject(value, level + 1)}</div>
        </div>
      );
    } else if (Array.isArray(value)) {
      return (
        <div key={key} style={{ marginLeft: 14 * (level + 1) }}>
          <span style={{ fontWeight: 500 }}>{key}:</span> [
          {value.map((v, i) => (
            <span key={i}>
              {typeof v === 'object' ? JSON.stringify(v, null, 1) : String(v)}
              {i < value.length - 1 ? ', ' : ''}
            </span>
          ))}]
        </div>
      );
    } else {
      return (
        <div key={key} style={{ marginLeft: 14 * (level + 1) }}>
          <span style={{ fontWeight: 500 }}>{key}:</span> {String(value)}
        </div>
      );
    }
  });

const renderDetailsModalBody = (details: any) => {
  if (!details || typeof details !== 'object') {
    return <span>{String(details)}</span>;
  }
  return <div style={detailBoxStyle}>{renderObject(details)}</div>;
};

const formatUser = (user: string | { _id: string, name?: string, email?: string }) => {
  if (!user) return '-';
  if (typeof user === 'string') {
    return <span title={user}>{user.slice(0, 8) + (user.length > 8 ? '...' : '')}</span>;
  }
  return (
    <span title={user._id}>
      {(user.name || user.email) && (
        <span style={{ fontWeight: 500 }}>
          {(user.name ? user.name : (user.email ? user.email : user._id))}
        </span>
      )}
      {(user.name || user.email) ? (
        <span style={{ color: '#999', fontSize: 13, marginLeft: 5 }}>
          ({user._id.slice(0, 6)}...)
        </span>
      ) : user._id}
    </span>
  );
};

const formatUserAgent = (ua: string | null | undefined) =>
  ua
    ? <span title={ua}>{ua.length > 32 ? ua.slice(0, 28) + '…' : ua}</span>
    : '-';

const formatResourceId = (id: string | undefined) =>
  id ? <span style={resourceIdStyle} title={id}>{id.slice(0, 9) + (id.length > 9 ? '...' : '')}</span> : '-';

const formatIP = (ip: string | null | undefined) =>
  ip ? <span style={{ color: '#005c3c', fontFamily: 'monospace', background: '#e7fff6', borderRadius: 4, padding: '2px 7px', fontSize: 13 }}>{ip}</span> : '-';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DetailsModal: React.FC<{
  show: boolean;
  onClose: () => void;
  log?: AuditLog | null;
}> = ({ show, onClose, log }) => {
  if (!show || !log) return null;

  return (
    <div style={modalBackdropStyle}>
      <div style={modalContainerStyle} tabIndex={-1}>
        <button aria-label="Close" style={closeButtonStyle} onClick={onClose} title="Close">&times;</button>
        <h3 style={{ fontWeight: 700, fontSize: 19, color: '#20497b', marginBottom: 7 }}>
          Details for Action: <span style={{ color: '#2b6c2e' }}>{capitalize(log.action.replace(/_/g, ' '))}</span>
        </h3>
        <div style={{ marginBottom: 11, color: '#888', fontSize: 14 }}>
          Logged at: <span style={timestampStyle}>{new Date(log.createdAt).toLocaleString()}</span>
        </div>
        {renderDetailsModalBody(log.details)}
      </div>
    </div>
  );
};

const AllLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<{show: boolean, log: AuditLog | null}>({
    show: false,
    log: null,
  });

  // Close modal on ESC key
  React.useEffect(() => {
    if (!modal.show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal({ show: false, log: null });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal.show]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/super-admin/logs`);
        if (response.data && response.data.success) {
          setLogs(response.data.logs);
        } else {
          setError('Failed to fetch logs.');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Error fetching logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div style={containerStyle}>
      <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 10, color: '#284293', letterSpacing: '-0.03em' }}>
        <span role="img" aria-label="logs" style={{ fontSize: 23, marginRight: 11 }}>🗒️</span>
        Audit Logs
      </h2>
      <div style={{ color: '#707070', fontSize: 17, marginBottom: loading || error ? 13 : 23, marginLeft: 2, letterSpacing: '0.01em' }}>
        Review all account, admin, and system activities. Click <b>Show Details</b> to see more info about any log.
      </div>
      <DetailsModal
        show={modal.show}
        onClose={() => setModal({ show: false, log: null })}
        log={modal.log}
      />

      {loading ? (
        <div style={{
          padding: 18,
          fontSize: 17,
          fontWeight: 500,
          color: '#276bbc',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span className="spinner" style={{
            border: '3px solid #b5d3f3',
            borderTop: '3px solid #1597e4',
            borderRadius: '50%',
            width: 22, height: 22,
            display: 'inline-block',
            animation: 'spin 1.1s linear infinite',
            marginRight: 8,
          }} />
          Loading audit logs...
          <style>
            {`
            @keyframes spin { to { transform: rotate(360deg); } }
            `}
          </style>
        </div>
      ) : error ? (
        <div style={errorStyle}>Error: {error}</div>
      ) : logs.length === 0 ? (
        <div style={{
          color: '#666', background: '#f4f8fc', borderRadius: 7,
          padding: '18px 12px', marginTop: 15, border: '1px solid #eef4fc',
          fontWeight: 500
        }}>
          No audit logs found yet.
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Resource</th>
                <th style={thStyle}>Resource ID</th>
                <th style={thStyle}>IP Address</th>
                <th style={thStyle}>User Agent</th>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log._id} style={{ background: idx % 2 === 1 ? '#f8fafb' : undefined }}>
                  <td style={{ ...tdStyle, ...actionStyle }}>{capitalize(log.action.replace(/_/g, ' '))}</td>
                  <td style={tdStyle}>{formatUser(log.user)}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(log.role)}>
                      {capitalize(log.role)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {log.resource ? (
                      <span style={{ fontWeight: 500 }}>{capitalize(log.resource.replace(/_/g, ' '))}</span>
                    ) : <span style={{ color: '#bbb' }}>-</span>}
                  </td>
                  <td style={tdStyle}>{formatResourceId(log.resourceId)}</td>
                  <td style={tdStyle}>{formatIP(log.ipAddress)}</td>
                  <td style={tdStyle}>{formatUserAgent(log.userAgent)}</td>
                  <td style={tdStyle}>
                    <span style={timestampStyle}>{new Date(log.createdAt).toLocaleString()}</span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 240, wordBreak: 'break-word', textAlign: 'left' }}>
                    <button
                      style={detailSummaryButtonStyle}
                      onClick={() => setModal({ show: true, log })}
                      type="button"
                    >
                      Show Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllLogs;