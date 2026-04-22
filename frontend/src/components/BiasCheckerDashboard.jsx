import React, { useState } from 'react';
import axios from 'axios';
import { Upload, AlertTriangle, ShieldAlert, CheckCircle, Loader2, FileText, ChevronRight, Scale } from 'lucide-react';

const BiasCheckerDashboard = () => {
  const [file, setFile] = useState(null);
  const [officerName, setOfficerName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a Draft Tender PDF.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('officer_name', officerName || 'Vigilance Officer');

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-bias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data.bias_analysis);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze document.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 30) return '#ffffff'; // Green - neutral
    if (score < 70) return '#dc2626'; // Yellow - warning
    return '#dc2626'; // Red - highly restrictive
  };

  return (
    <div className="bias-dashboard">
      <div className="bias-header">
        <Scale size={32} className="scale-icon" />
        <h2>Vigilance & Procurement Audit</h2>
        <p>Analyze draft tenders for bias, brand-locking, and restrictive criteria before publication.</p>
      </div>

      <div className="bias-uploader card">
        <div className="upload-box">
          <input type="file" id="draft-upload" accept=".pdf" onChange={handleFileChange} />
          <label htmlFor="draft-upload" className="upload-label">
            <Upload size={32} />
            <span>{file ? file.name : "Upload Draft Tender PDF"}</span>
          </label>
        </div>

        <div className="officer-name-row" style={{ marginTop: '20px' }}>
          <ShieldAlert size={16} />
          <input
            type="text"
            className="officer-input"
            placeholder="Auditing Officer Name"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
          />
        </div>

        <button onClick={handleAnalyze} disabled={analyzing} className="analyze-btn">
          {analyzing ? (
            <><Loader2 size={20} className="spin" /> Analyzing Clauses...</>
          ) : (
            <><ShieldAlert size={20} /> Analyze Bias & Restrictiveness</>
          )}
        </button>

        {error && <div className="error-msg"><AlertTriangle size={16} /> {error}</div>}
      </div>

      {result && (
        <div className="bias-results">
          {/* Main Score Card */}
          <div className="score-card" style={{ borderTop: `4px solid ${getScoreColor(result.restrictive_score)}` }}>
            <div className="score-header">
              <div className="score-circle" style={{ backgroundColor: getScoreColor(result.restrictive_score) }}>
                {result.restrictive_score}
              </div>
              <div className="score-text">
                <h3>Restrictive Score</h3>
                <p>{result.overall_assessment}</p>
              </div>
            </div>
          </div>

          {/* Flagged Clauses */}
          {result.flagged_clauses && result.flagged_clauses.length > 0 ? (
            <div className="flagged-clauses-section">
              <h3><AlertTriangle size={18} style={{ color: '#dc2626' }}/> Flagged Clauses ({result.flagged_clauses.length})</h3>
              <div className="clauses-grid">
                {result.flagged_clauses.map((flag, idx) => (
                  <div key={idx} className="flag-card">
                    <div className="flag-type">{flag.issue_type}</div>
                    <div className="clause-quote">"{flag.clause}"</div>
                    <div className="flag-body">
                      <div><strong>Issue:</strong> {flag.explanation}</div>
                      <div className="flag-suggestion"><strong>Fix:</strong> {flag.suggestion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="clean-bill">
              <CheckCircle size={32} style={{ color: '#ffffff' }}/>
              <h3>No Major Restrictive Clauses Found</h3>
              <p>This draft appears neutral and fair for public tendering.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BiasCheckerDashboard;
