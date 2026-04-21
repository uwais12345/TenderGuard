import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { PenTool, Loader2, Download, AlertTriangle, FileText } from 'lucide-react';

const TenderDrafter = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the tender you want to create.");
      return;
    }

    setGenerating(true);
    setError(null);
    setResult('');

    try {
      const response = await axios.post('http://localhost:5000/api/generate-tender', { prompt });
      setResult(response.data.tender_markdown);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate tender.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Draft_Tender_${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="drafter-container">
      <div className="drafter-header">
        <PenTool size={32} className="drafter-icon" />
        <h2>Tender Drafter (Generative AI)</h2>
        <p>Instantly generate standard, non-restrictive Government RFP documents from a simple prompt.</p>
      </div>

      <div className="drafter-split">
        {/* Left: Input */}
        <div className="drafter-left">
          <div className="drafter-card">
            <h3>Tender Requirements</h3>
            <p className="drafter-sub">Describe what you are procuring. Include quantities, location, and constraints.</p>
            <textarea
              className="drafter-textarea"
              placeholder="e.g., We need 500 electric buses for Mumbai with a 5-year comprehensive warranty. Delivery must be within 6 months. Minimum bidder turnover of 10 Crores."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button onClick={handleGenerate} disabled={generating} className="generate-btn">
              {generating ? (
                <><Loader2 size={18} className="spin" /> Drafting Document...</>
              ) : (
                <><PenTool size={18} /> Generate Tender</>
              )}
            </button>

            {error && <div className="error-msg" style={{marginTop: '16px'}}><AlertTriangle size={16} /> {error}</div>}
          </div>
        </div>

        {/* Right: Output */}
        <div className="drafter-right">
          <div className="drafter-output-card">
            <div className="output-header">
              <h3><FileText size={18} /> Generated RFP Document</h3>
              {result && (
                <button onClick={handleDownload} className="download-btn-small">
                  <Download size={14} /> Export .MD
                </button>
              )}
            </div>
            
            <div className="output-body">
              {generating ? (
                <div className="drafter-loading">
                  <div className="skeleton-line" style={{ width: '60%', height: '24px', marginBottom: '20px' }}></div>
                  <div className="skeleton-line" style={{ width: '100%' }}></div>
                  <div className="skeleton-line" style={{ width: '100%' }}></div>
                  <div className="skeleton-line" style={{ width: '80%', marginBottom: '20px' }}></div>
                  
                  <div className="skeleton-line" style={{ width: '40%', height: '20px', marginBottom: '15px' }}></div>
                  <div className="skeleton-line" style={{ width: '100%' }}></div>
                  <div className="skeleton-line" style={{ width: '90%' }}></div>
                </div>
              ) : result ? (
                <div className="markdown-preview">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="drafter-empty">
                  Your generated document will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDrafter;
