import React from 'react';
import { IndianRupee, Clock, Calendar, CreditCard, Award, AlertTriangle } from 'lucide-react';

const formatCurrency = (value, currency = 'INR') => {
  if (value === null || value === undefined) return 'Not specified';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const LRankBadge = ({ rank }) => {
  if (!rank) return (
    <div className="l-badge l-unknown">
      <AlertTriangle size={13} /> L-Rank N/A
    </div>
  );
  const labels = { 1: 'L1 — Lowest Bid', 2: 'L2 — Second Lowest', 3: 'L3 — Third Lowest' };
  const classes = { 1: 'l1', 2: 'l2', 3: 'l3' };
  return (
    <div className={`l-badge ${classes[rank] || 'l-unknown'}`}>
      <Award size={13} />
      {labels[rank] || `L${rank}`}
    </div>
  );
};

const FinancialBidPanel = ({ vendor }) => {
  const {
    total_bid_value, unit_price, currency = 'INR',
    gst_percentage, gst_amount, total_with_gst,
    payment_terms, delivery_days, bid_validity_days, l_rank
  } = vendor;

  const hasFinancialData = total_bid_value !== null && total_bid_value !== undefined;

  return (
    <div className="financial-panel">
      <div className="financial-panel-header">
        <IndianRupee size={16} />
        <h4>Financial Bid Summary</h4>
        <LRankBadge rank={l_rank} />
      </div>

      {!hasFinancialData ? (
        <div className="financial-no-data">
          <AlertTriangle size={16} />
          <span>No pricing data found in proposal document. Vendor has not disclosed financials.</span>
        </div>
      ) : (
        <div className="financial-grid">
          {/* Base Price */}
          <div className="fin-card primary-fin">
            <span className="fin-label">Total Bid Value (ex-GST)</span>
            <span className="fin-value">{formatCurrency(total_bid_value, currency)}</span>
          </div>

          {unit_price !== null && unit_price !== undefined && (
            <div className="fin-card">
              <span className="fin-label">Unit Price</span>
              <span className="fin-value">{formatCurrency(unit_price, currency)}</span>
            </div>
          )}

          {gst_percentage !== null && gst_percentage !== undefined && (
            <div className="fin-card">
              <span className="fin-label">GST Rate</span>
              <span className="fin-value">{gst_percentage}%</span>
            </div>
          )}

          {gst_amount !== null && gst_amount !== undefined && (
            <div className="fin-card">
              <span className="fin-label">GST Amount</span>
              <span className="fin-value">{formatCurrency(gst_amount, currency)}</span>
            </div>
          )}

          {/* Final Total */}
          {total_with_gst !== null && total_with_gst !== undefined && (
            <div className="fin-card total-fin">
              <span className="fin-label">Total (incl. GST)</span>
              <span className="fin-value total-amount">{formatCurrency(total_with_gst, currency)}</span>
            </div>
          )}

          {/* Meta info */}
          <div className="fin-meta-row">
            {payment_terms && payment_terms !== 'Not specified' && (
              <div className="fin-meta-chip">
                <CreditCard size={12} />
                <span>{payment_terms}</span>
              </div>
            )}
            {delivery_days !== null && delivery_days !== undefined && (
              <div className="fin-meta-chip">
                <Clock size={12} />
                <span>{delivery_days} day delivery</span>
              </div>
            )}
            {bid_validity_days !== null && bid_validity_days !== undefined && (
              <div className="fin-meta-chip">
                <Calendar size={12} />
                <span>Valid {bid_validity_days} days</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialBidPanel;
