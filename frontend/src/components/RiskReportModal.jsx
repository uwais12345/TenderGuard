import React, { useState } from 'react';
import { X, ShieldAlert, TrendingDown, Truck, BadgeCheck, Users, Loader, AlertTriangle, CheckCircle } from 'lucide-react';

const RISK_ICONS = {
  financial: { icon: TrendingDown, color: '#dc2626', label: 'Financial Risk' },
  delivery: { icon: Truck, color: '#dc2626', label: 'Delivery / Operational Risk' },
  compliance: { icon: BadgeCheck, color: '#ffffff', label: 'Compliance Risk' },
  reputational: { icon: Users, color: '#dc2626', label: 'Reputational Risk' },
};

const LEVEL_COLORS = {
  LOW: { bg: 'rgba(255,255,255,0.08)', text: '#ffffff', border: 'rgba(255,255,255,0.3)' },
  MEDIUM: { bg: 'rgba(220,38,38,0.1)', text: '#fca5a5', border: 'rgba(220,38,38,0.3)' },
  HIGH: { bg: 'rgba(220,38,38,0.2)', text: '#dc2626', border: 'rgba(220,38,38,0.5)' },
};

const RiskBar = ({ score }) => (
  <div style={{ height: '6px', background: '#333', borderRadius: '4px', overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%',
      width: `${score}%`,
      background: score >= 70 ? '#dc2626' : score >= 40 ? '#fca5a5' : '#ffffff',
      borderRadius: '4px',
      transition: 'width 1s ease-out'
    }} />
  </div>
);

const RiskReportModal = ({ vendor, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debarmentResult, setDebarmentResult] = useState(null);
  const [checkingDebarment, setCheckingDebarment] = useState(false);

  const fetchRiskReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/risk-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor })
      });
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkDebarment = async () => {
    setCheckingDebarment(true);
    try {
      const res = await fetch('http://localhost:5000/api/check-debarment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_name: vendor.company_name })
      });
      const data = await res.json();
      setDebarmentResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDebarment(false);
    }
  };

  // Trigger both on mount
  React.useEffect(() => {
    fetchRiskReport();
    checkDebarment();
  }, []);

  const overallLevel = report?.overall_risk_level || null;
  const levelStyle = overallLevel ? LEVEL_COLORS[overallLevel] : null;

  return (
    <div className="modal-overlay">
      <div className="eportal-modal" style={{ maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="bot-icon-container" style={{ background: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Vendor Risk Assessment</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#888' }}>{vendor.company_name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Debarment Check */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            border: `1px solid ${debarmentResult?.is_blacklisted ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.15)'}`,
            background: debarmentResult?.is_blacklisted ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {checkingDebarment ? (
              <><Loader className="spin" size={18} style={{ color: '#888' }} /><span style={{ color: '#888', fontSize: '0.9rem' }}>Checking TN Debarment Registry...</span></>
            ) : debarmentResult ? (
              debarmentResult.is_blacklisted ? (
                <><AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.9rem' }}>
                  ⚠️ BLACKLIST MATCH FOUND on TN Tenders Debarment List!
                </span></>
              ) : (
                <><CheckCircle size={18} style={{ color: '#fff', flexShrink: 0 }} />
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  ✅ <strong style={{ color: '#fff' }}>CLEAR</strong> — Not found in TN Tenders Debarment Registry ({debarmentResult.total_debarred_in_db} records checked)
                </span></>
              )
            ) : null}
          </div>

          {/* Overall Risk Score */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <Loader className="spin" size={36} style={{ color: '#dc2626', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>Generating AI Risk Analysis...</p>
            </div>
          ) : report && !report.error ? (
            <>
              {/* Overall */}
              <div style={{
                padding: '18px 20px',
                background: levelStyle?.bg,
                border: `1px solid ${levelStyle?.border}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: levelStyle?.bg,
                  border: `2px solid ${levelStyle?.border}`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: levelStyle?.text }}>{report.overall_risk_score}</span>
                  <span style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>/ 100</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      background: levelStyle?.bg, color: levelStyle?.text,
                      border: `1px solid ${levelStyle?.border}`,
                      padding: '2px 10px', borderRadius: '20px',
                      fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {report.overall_risk_level} RISK
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#ccc', lineHeight: 1.5 }}>
                    <strong style={{ color: '#fff' }}>Recommendation:</strong> {report.top_recommendation}
                  </p>
                </div>
              </div>

              {/* 4 Dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(report.dimensions || {}).map(([key, dim]) => {
                  const meta = RISK_ICONS[key];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const dimStyle = LEVEL_COLORS[dim.risk_level] || LEVEL_COLORS.LOW;
                  return (
                    <div key={key} style={{ background: '#0a0a0a', border: `1px solid ${dimStyle.border}`, borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Icon size={16} style={{ color: meta.color }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ccc' }}>{meta.label}</span>
                        <span style={{
                          marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 800,
                          padding: '1px 7px', borderRadius: '10px',
                          background: dimStyle.bg, color: dimStyle.text, border: `1px solid ${dimStyle.border}`
                        }}>{dim.risk_level}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <RiskBar score={dim.risk_score} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: dimStyle.text, minWidth: '28px' }}>{dim.risk_score}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#999', lineHeight: 1.4 }}>{dim.summary}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : report?.error ? (
            <div className="error-msg"><AlertTriangle size={16} />{report.error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RiskReportModal;
