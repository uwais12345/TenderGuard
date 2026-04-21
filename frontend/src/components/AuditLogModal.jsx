import React, { useState, useEffect } from 'react';
import { X, ClipboardList, RefreshCw, User, Clock, FileText, Building2, IndianRupee, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const ACTION_LABELS = {
  EVALUATION: { label: 'Evaluation', color: '#10b981' },
  PDF_CHAT: { label: 'PDF Chat', color: '#6366f1' },
  EXPORT: { label: 'Export', color: '#f59e0b' },
  BID_AUTOMATION: { label: 'Bid Automated', color: '#3b82f6' },
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatCurrencyShort = (value) => {
  if (value === null || value === undefined) return '—';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

const AuditLogModal = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audit');
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, historyRes] = await Promise.all([
        axios.get('http://localhost:5000/api/audit-log'),
        axios.get('http://localhost:5000/api/evaluation-history')
      ]);
      setLogs(logsRes.data.logs || []);
      setHistory(historyRes.data.history || []);
    } catch (err) {
      setError('Could not load audit data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content audit-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="bot-icon-container">
              <ClipboardList size={22} />
            </div>
            <div>
              <h3>Audit Trail & History</h3>
              <p>Government-compliant evaluation record log</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="close-btn" onClick={fetchData} title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="audit-tabs">
          <button
            className={`audit-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <ClipboardList size={15} /> Audit Log ({logs.length})
          </button>
          <button
            className={`audit-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FileText size={15} /> Evaluation History ({history.length})
          </button>
        </div>

        {/* Body */}
        <div className="audit-body">
          {loading && (
            <div className="audit-loading">
              <RefreshCw size={20} className="spin" /> Loading records...
            </div>
          )}

          {error && (
            <div className="audit-error">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {!loading && !error && activeTab === 'audit' && (
            logs.length === 0 ? (
              <div className="audit-empty">No audit entries yet. Run an evaluation to start logging.</div>
            ) : (
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Officer</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => {
                      const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: '#94a3b8' };
                      return (
                        <tr key={i}>
                          <td className="audit-cell-time">
                            <Clock size={12} />
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="audit-cell-officer">
                            <User size={12} />
                            {log.officer_name}
                          </td>
                          <td>
                            <span className="action-pill" style={{ color: actionInfo.color, borderColor: actionInfo.color }}>
                              {actionInfo.label}
                            </span>
                          </td>
                          <td className="audit-cell-meta">
                            {log.metadata?.top_vendor && <span><Building2 size={11} /> {log.metadata.top_vendor}</span>}
                            {log.metadata?.question && <span><FileText size={11} /> "{log.metadata.question}"</span>}
                            {log.metadata?.vendor_count !== undefined && (
                              <span>{log.metadata.vendor_count} vendor(s) evaluated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!loading && !error && activeTab === 'history' && (
            history.length === 0 ? (
              <div className="audit-empty">No evaluation history yet. Run an evaluation to populate this log.</div>
            ) : (
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Officer</th>
                      <th>Top Vendor</th>
                      <th>L1 Bid</th>
                      <th>Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => {
                      const topVendor = h.top_vendors?.[0];
                      const l1Vendor = h.top_vendors?.find(v => v.l_rank === 1) || topVendor;
                      return (
                        <tr key={i}>
                          <td className="audit-cell-time">
                            <Clock size={12} /> {formatDate(h.timestamp)}
                          </td>
                          <td className="audit-cell-officer">
                            <User size={12} /> {h.officer_name}
                          </td>
                          <td>
                            {topVendor ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{topVendor.company_name}</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            {l1Vendor?.total_bid_value ? (
                              <div className="action-pill" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>
                                <IndianRupee size={11} />
                                {formatCurrencyShort(l1Vendor.total_bid_value)}
                              </div>
                            ) : '—'}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {Array.isArray(h.files_processed) ? h.files_processed.length : '—'} PDF(s)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogModal;
