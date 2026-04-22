import React, { useState, useEffect } from 'react';
import { BarChart2, ClipboardList, Bot, PenTool, TrendingUp, Users, Shield, Activity, Building2, Clock, Loader } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = '#dc2626', sub }) => (
  <div style={{
    background: '#111111',
    border: '1px solid #333',
    borderRadius: '14px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'border-color 0.2s, transform 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{
      width: '50px', height: '50px', borderRadius: '12px',
      background: `rgba(220,38,38,0.1)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, border: `1px solid rgba(220,38,38,0.2)`
    }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>{sub}</div>}
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/analytics')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out', maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '10px 0 36px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
          boxShadow: '0 0 30px rgba(220,38,38,0.3)', marginBottom: '16px'
        }}>
          <BarChart2 size={28} color="white" />
        </div>
        <h1 style={{
          fontSize: '2.6rem', fontWeight: 800, margin: '0 0 8px',
          background: 'linear-gradient(135deg, #dc2626, #ffffff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Platform Analytics</h1>
        <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>Real-time insights from your TenderGuard activity</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
          <Loader className="spin" size={40} style={{ color: '#dc2626' }} />
          <p style={{ marginTop: '16px' }}>Loading analytics from database...</p>
        </div>
      ) : data ? (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard icon={ClipboardList} label="Total Evaluations Run" value={data.total_evaluations} />
            <StatCard icon={Users} label="Vendors Evaluated" value={data.total_vendors_evaluated} />
            <StatCard icon={Bot} label="Bids Automated" value={data.total_bids_automated} />
            <StatCard icon={Shield} label="Bias Checks" value={data.total_bias_checks} />
            <StatCard icon={PenTool} label="Tender Drafts Generated" value={data.total_drafts} />
          </div>

          {/* Top Vendors & Recent Activity side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
            {/* Top Vendors */}
            <div style={{ background: '#111111', border: '1px solid #333', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={18} style={{ color: '#dc2626' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Top Vendors by Win Rate</h3>
              </div>
              <div style={{ padding: '12px 0' }}>
                {data.top_vendors?.length > 0 ? data.top_vendors.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '1px solid #1a1a1a' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: i === 0 ? '#dc2626' : '#333',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>#{i + 1}</div>
                    <Building2 size={16} style={{ color: '#555', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.company_name || 'Unknown Vendor'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {v.total_evaluations || 0} evaluation{v.total_evaluations !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#dc2626' }}>
                      {v.win_rate ? `${Math.round(v.win_rate)}%` : 'N/A'}
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555', fontSize: '0.9rem' }}>
                    No vendor data yet. Run your first evaluation!
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background: '#111111', border: '1px solid #333', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} style={{ color: '#dc2626' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Recent Activity Feed</h3>
              </div>
              <div style={{ padding: '8px 0', maxHeight: '320px', overflowY: 'auto' }}>
                {data.recent_activity?.length > 0 ? data.recent_activity.map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 20px', borderBottom: '1px solid #1a1a1a' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#dc2626', flexShrink: 0, marginTop: '5px'
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                        <span style={{
                          fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px',
                          background: 'rgba(220,38,38,0.15)', color: '#dc2626',
                          border: '1px solid rgba(220,38,38,0.3)', marginRight: '6px', fontWeight: 800
                        }}>{log.action}</span>
                        {log.officer_name || 'Anonymous'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                        <Clock size={10} style={{ color: '#555' }} />
                        <span style={{ fontSize: '0.72rem', color: '#555' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Unknown time'}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555', fontSize: '0.9rem' }}>
                    No activity logged yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>Could not load analytics data.</div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
