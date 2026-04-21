import React from 'react';
import { X, Building2, TrendingUp, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';

const METRICS = [
  { key: 'match_score', label: 'Match Score', suffix: '%' },
  { key: 'success_rate', label: 'Success Rate', suffix: '%' },
  { key: 'cost_score', label: 'Cost', suffix: '/100' },
  { key: 'delivery_score', label: 'Delivery', suffix: '/100' },
  { key: 'compliance_score', label: 'Compliance', suffix: '/100' },
  { key: 'security_score', label: 'Security', suffix: '/100' },
  { key: 'experience_score', label: 'Experience', suffix: '/100' },
];

const getBest = (vendors, key) => {
  return Math.max(...vendors.map(v => v[key] ?? 0));
};

const ComparisonModal = ({ vendors, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content comparison-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="bot-icon-container">
              <Building2 size={22} />
            </div>
            <div>
              <h3>Side-by-Side Vendor Comparison</h3>
              <p>Comparing {vendors.length} top-ranked vendors across all evaluation metrics</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="comparison-body">
          <div className="comparison-table">
            {/* Column Headers */}
            <div className="comparison-row header-row">
              <div className="comparison-cell label-cell">Metric</div>
              {vendors.map((v, i) => (
                <div key={i} className={`comparison-cell vendor-header-cell rank-${i + 1}`}>
                  <span className="rank-emoji">{['🥇', '🥈', '🥉'][i]}</span>
                  <span>{v.company_name}</span>
                </div>
              ))}
            </div>

            {/* Metric Rows */}
            {METRICS.map(({ key, label, suffix }) => {
              const best = getBest(vendors, key);
              return (
                <div key={key} className="comparison-row">
                  <div className="comparison-cell label-cell">{label}</div>
                  {vendors.map((v, i) => {
                    const val = v[key] ?? '—';
                    const isBest = val === best && val !== '—';
                    return (
                      <div key={i} className={`comparison-cell value-cell ${isBest ? 'best-value' : ''}`}>
                        <span className="cell-value">{val}{typeof val === 'number' ? suffix : ''}</span>
                        {isBest && <span className="best-badge">Best</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Strengths Row */}
            <div className="comparison-row">
              <div className="comparison-cell label-cell pros-label">
                <ThumbsUp size={14} /> Strengths
              </div>
              {vendors.map((v, i) => (
                <div key={i} className="comparison-cell list-cell">
                  <ul>
                    {v.pros?.map((p, idx) => (
                      <li key={idx}><ChevronRight size={11} />{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Weaknesses Row */}
            <div className="comparison-row">
              <div className="comparison-cell label-cell cons-label">
                <ThumbsDown size={14} /> Weaknesses
              </div>
              {vendors.map((v, i) => (
                <div key={i} className="comparison-cell list-cell">
                  <ul>
                    {v.cons?.map((c, idx) => (
                      <li key={idx}><ChevronRight size={11} />{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
