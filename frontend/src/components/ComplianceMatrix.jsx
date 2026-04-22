import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

const ComplianceMatrix = ({ vendor }) => {
  const [expanded, setExpanded] = useState(false);
  const matrix = vendor.compliance_matrix || [];

  if (matrix.length === 0) return null;

  const STATUS_CONFIG = {
    PASS: { icon: CheckCircle, color: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)' },
    FAIL: { icon: XCircle, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
    PARTIAL: { icon: AlertCircle, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' }
  };

  return (
    <div className="compliance-matrix-container">
      <div className="compliance-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} style={{ color: '#dc2626' }} />
          <h4>Clause-by-Clause Compliance</h4>
          <span className="clause-count">{matrix.length} Clauses</span>
        </div>
        <button className="expand-btn">
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="compliance-table-wrapper">
          <table className="compliance-table">
            <thead>
              <tr>
                <th width="35%">Mandatory Clause</th>
                <th width="15%">Status</th>
                <th width="50%">Evaluation & Excerpt</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((item, idx) => {
                const config = STATUS_CONFIG[item.status?.toUpperCase()] || STATUS_CONFIG.PARTIAL;
                const Icon = config.icon;
                
                return (
                  <tr key={idx}>
                    <td className="clause-text">{item.clause}</td>
                    <td>
                      <span className="status-pill" style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color }}>
                        <Icon size={12} />
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="clause-rationale">{item.rationale}</div>
                      {item.excerpt && item.excerpt !== "Not mentioned" && (
                        <div className="clause-excerpt">"{item.excerpt}"</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComplianceMatrix;
