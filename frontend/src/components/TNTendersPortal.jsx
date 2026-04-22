import React, { useState, useEffect } from 'react';
import { Radar, ExternalLink, Bot, PenTool, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

const TNTendersPortal = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [scoringTender, setScoringTender] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/tn-tenders/active');
      if (!res.ok) throw new Error('Failed to fetch from backend');
      const data = await res.json();
      setTenders(data.tenders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreEligibility = async (tender) => {
    setScoringTender(tender.id);
    setScoreResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/tn-tenders/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender })
      });
      const data = await res.json();
      setScoreResult({ id: tender.id, ...data });
    } catch (err) {
      console.error(err);
    } finally {
      setScoringTender(null);
    }
  };

  return (
    <div className="dashboard-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <div className="header" style={{ textAlign: 'left', padding: '10px 0 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="header-icon" style={{ marginBottom: 0, background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)' }}>
            <Radar size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', margin: 0 }}>TN Tenders Live Radar</h1>
            <p style={{ margin: '4px 0 0' }}>Real-time syncing with Tamil Nadu e-Procurement Portal</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <Loader className="spin" size={40} style={{ marginBottom: '16px', color: '#dc2626' }} />
          <p>Connecting to tntenders.gov.in and fetching active contracts...</p>
        </div>
      ) : error ? (
        <div className="error-msg" style={{ margin: '20px 0' }}>
          <AlertTriangle size={20} />
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {tenders.map((tender) => (
            <div key={tender.id} className="vendor-card" style={{ padding: '20px', borderLeft: '3px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {tender.id}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{tender.publish_date}</span>
                  </div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#fff', lineHeight: 1.4 }}>
                    {tender.title}
                  </h3>
                  
                  {scoreResult && scoreResult.id === tender.id && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '16px', 
                      background: '#0a0a0a', 
                      borderRadius: '8px',
                      border: `1px solid ${scoreResult.decision === 'GO' ? '#ffffff' : '#dc2626'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Bot size={18} color={scoreResult.decision === 'GO' ? '#ffffff' : '#dc2626'} />
                        <strong style={{ color: scoreResult.decision === 'GO' ? '#ffffff' : '#dc2626' }}>
                          AI Decision: {scoreResult.decision} ({scoreResult.eligibility_score}%)
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>{scoreResult.rationale}</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px', marginLeft: '24px' }}>
                  <button 
                    onClick={() => handleScoreEligibility(tender)}
                    disabled={scoringTender === tender.id}
                    style={{
                      background: 'rgba(220, 38, 38, 0.1)',
                      color: '#dc2626',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    {scoringTender === tender.id ? <Loader className="spin" size={16} /> : <Bot size={16} />}
                    {scoringTender === tender.id ? 'Scoring...' : 'AI Eligibility Check'}
                  </button>

                  <a 
                    href={tender.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      background: '#111111',
                      color: '#fff',
                      border: '1px solid #333333',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    <ExternalLink size={16} />
                    View on TN Portal
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TNTendersPortal;
