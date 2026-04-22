import React, { useState, useEffect } from 'react';
import { History, X, Calendar, User, FileText, ChevronRight, Loader2 } from 'lucide-react';

const SessionHistoryDrawer = ({ isOpen, onClose, onRestore }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('http://localhost:5000/api/evaluations/history')
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease-out'
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: isOpen ? 0 : '-100%', 
        width: '100%', maxWidth: '400px',
        height: '100vh', background: '#0a0a0a', borderLeft: '1px solid #333',
        zIndex: 1000, transition: 'right 0.3s ease-out', display: 'flex', flexDirection: 'column',
        boxShadow: isOpen ? '-10px 0 30px rgba(0,0,0,0.8)' : 'none'
      }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} style={{ color: '#dc2626' }} />
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Saved Sessions</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}><Loader2 className="spin" size={24} /></div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>No saved sessions found.</div>
        ) : (
          history.map((session, i) => (
            <div key={i} onClick={() => onRestore(session._id)} style={{
              background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '16px',
              marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.transform = 'translateX(-4px)'; }}
               onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateX(0)'; }}>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{session.top_vendors?.[0]?.company_name || 'No Vendors'}</span>
                <ChevronRight size={16} style={{ color: '#555' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#888', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(session.timestamp).toLocaleDateString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {session.officer_name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={12} /> {session.files_processed?.length || 0} files</span>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};
export default SessionHistoryDrawer;
