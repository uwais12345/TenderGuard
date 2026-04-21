import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload, Search, Building2, TrendingUp,
  ThumbsUp, ThumbsDown, Loader2, FileText,
  AlertCircle, CheckCircle2, ChevronRight, X, Files,
  Cpu, MessageSquare, BarChart2, Download, IndianRupee
} from 'lucide-react';

import EPortalModal from './EPortalModal';
import ChatModal from './ChatModal';
import ComparisonModal from './ComparisonModal';
import VendorRadarChart from './VendorRadarChart';
import FinancialBidPanel from './FinancialBidPanel';
import { generateProcurementPDF } from '../utils/exportReport';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [requirements, setRequirements] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Modal state
  const [showEPortalModal, setShowEPortalModal] = useState(false);
  const [selectedVendorForBid, setSelectedVendorForBid] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedVendorForChat, setSelectedVendorForChat] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const triggerAutomation = (vendor) => {
    setSelectedVendorForBid(vendor);
    setShowEPortalModal(true);
  };

  const triggerChat = (vendor) => {
    setSelectedVendorForChat(vendor);
    setShowChatModal(true);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!requirements.trim()) {
      setError("Please enter your tender requirements.");
      return;
    }
    if (files.length === 0) {
      setError("Please upload at least one contractor proposal PDF.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('user_requirements', requirements);
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data.evaluation);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to evaluate. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    return '#f59e0b';
  };

  const getRankBadge = (index) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[index] || '';
  };

  return (
    <div className="dashboard-container">
      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-icon">
          <Search size={28} />
        </div>
        <h1>Tender Guard</h1>
        <p>AI-Powered Vendor Evaluation &amp; Matching System</p>
      </header>

      {/* ── INPUT SECTION ── */}
      <section className="input-section">
        <div className="input-card requirements-card">
          <div className="card-header">
            <FileText size={20} />
            <h3>Tender Requirements</h3>
          </div>
          <textarea
            className="requirements-textarea"
            placeholder={`Enter your tender requirements here...\n\nExample: 500 laptops, 16GB RAM, SSD storage, fast delivery within 30 days, budget-friendly, ISO certified vendor preferred.`}
            value={requirements}
            onChange={(e) => { setRequirements(e.target.value); setError(null); }}
            rows={6}
          />
        </div>

        <div className="input-card upload-card">
          <div className="card-header">
            <Files size={20} />
            <h3>Contractor Proposals</h3>
            <span className="file-count-badge">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={`dropzone ${files.length > 0 ? 'has-file' : ''}`}>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              id="fileInput"
              hidden
              multiple
            />
            <label htmlFor="fileInput" className="file-label">
              {files.length > 0 ? (
                <>
                  <Files size={32} className="file-icon-selected" />
                  <span className="file-name">{files.length} PDF{files.length !== 1 ? 's' : ''} selected</span>
                  <span className="file-hint">Click to change selection</span>
                </>
              ) : (
                <>
                  <Upload size={32} />
                  <span>Click to upload PDF proposals</span>
                  <span className="file-hint">Select multiple PDFs</span>
                </>
              )}
            </label>
          </div>

          {files.length > 0 && (
            <div className="selected-files-list">
              {files.map((file, index) => (
                <div key={index} className="selected-file-item">
                  <FileText size={14} />
                  <span className="selected-file-name">{file.name}</span>
                  <span className="selected-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button className="remove-file-btn" onClick={() => removeFile(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <button onClick={handleSubmit} disabled={uploading} className="submit-btn">
        {uploading ? (
          <>
            <Loader2 size={20} className="spin" />
            Evaluating {files.length} Proposal{files.length !== 1 ? 's' : ''}...
          </>
        ) : (
          <>
            <Search size={20} />
            Evaluate &amp; Match Vendors
          </>
        )}
      </button>

      {/* ── ERROR ── */}
      {error && (
        <div className="error-msg">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <section className="results-section">
          <div className="results-header">
            <div className="results-header-left">
              <CheckCircle2 size={22} />
              <div>
                <h2>Top {result.top_vendors.length} Recommended Vendors</h2>
                <p className="results-sub">{result.analysis_summary}</p>
              </div>
            </div>
            <div className="results-actions">
              {result.top_vendors.length >= 2 && (
                <button className="action-btn compare-btn" onClick={() => setShowComparisonModal(true)}>
                  <BarChart2 size={16} />
                  Compare All
                </button>
              )}
              <button
                className="action-btn export-btn"
                onClick={() => generateProcurementPDF(result.top_vendors, requirements, result.analysis_summary)}
              >
                <Download size={16} />
                Export Report
              </button>
            </div>
          </div>

          {/* ── FINANCIAL SUMMARY BANNER ── */}
          {result.financial_summary && (
            <div className="financial-summary-banner">
              <IndianRupee size={16} />
              <span><strong>Financial Bid Analysis:</strong> {result.financial_summary}</span>
            </div>
          )}

          <div className="vendors-grid">
            {result.top_vendors.map((vendor, index) => (
              <div key={index} className={`vendor-card rank-${index + 1}`}>
                <div className="vendor-rank">{getRankBadge(index)}</div>

                <div className="vendor-card-body">
                  <div className="vendor-main">
                    <div className="vendor-header">
                      <Building2 size={22} />
                      <div>
                        <h3>{vendor.company_name}</h3>
                        {vendor.source_file && (
                          <span className="source-file-tag">
                            <FileText size={12} /> {vendor.source_file}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="score-section">
                      <div className="score-bar-container">
                        <div className="score-bar-bg">
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${vendor.match_score}%`,
                              backgroundColor: getScoreColor(vendor.match_score)
                            }}
                          />
                        </div>
                        <span className="score-label" style={{ color: getScoreColor(vendor.match_score) }}>
                          {vendor.match_score}% Match
                        </span>
                      </div>
                      <div className="success-rate">
                        <TrendingUp size={14} />
                        <span>{vendor.success_rate}% Success Rate</span>
                      </div>
                    </div>

                    <div className="vendor-history">
                      <h4>Past Project History</h4>
                      <p>{vendor.past_history}</p>
                    </div>

                    <div className="pros-cons">
                      <div className="pros">
                        <h4><ThumbsUp size={14} /> Strengths</h4>
                        <ul>
                          {vendor.pros.map((pro, i) => (
                            <li key={i}>
                              <ChevronRight size={12} />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="cons">
                        <h4><ThumbsDown size={14} /> Weaknesses</h4>
                        <ul>
                          {vendor.cons.map((con, i) => (
                            <li key={i}>
                              <ChevronRight size={12} />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* ── FINANCIAL BID PANEL ── */}
                  <FinancialBidPanel vendor={vendor} />
                </div>

                  {/* ── RADAR CHART ── */}
                  <div className="vendor-radar">
                    <VendorRadarChart vendor={vendor} />
                  </div>
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="vendor-action-row">
                  <button className="automate-btn" onClick={() => triggerAutomation(vendor)}>
                    <Cpu size={15} />
                    Automate Bidding
                  </button>
                  <button className="ask-ai-btn" onClick={() => triggerChat(vendor)}>
                    <MessageSquare size={15} />
                    Ask AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MODALS ── */}
      {showEPortalModal && selectedVendorForBid && (
        <EPortalModal vendor={selectedVendorForBid} onClose={() => setShowEPortalModal(false)} />
      )}
      {showChatModal && selectedVendorForChat && (
        <ChatModal vendor={selectedVendorForChat} onClose={() => setShowChatModal(false)} />
      )}
      {showComparisonModal && result && (
        <ComparisonModal vendors={result.top_vendors} onClose={() => setShowComparisonModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
