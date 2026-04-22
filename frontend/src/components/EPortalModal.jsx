import React, { useState, useEffect } from 'react';
import { Bot, Terminal, ShieldCheck, FileCheck, CircleDashed, CheckCircle2, ChevronRight, X, Copy } from 'lucide-react';

const STEPS = [
  { id: 'connect', title: 'Connecting to tntenders.gov.in/nicgep', icon: ShieldCheck, time: 2000 },
  { id: 'auth', title: 'Authenticating via e-Mudhra DSC', icon: ShieldCheck, time: 1800 },
  { id: 'payload', title: 'Encrypting Financial Bid (BoQ) & Tech Specs', icon: FileCheck, time: 2500 },
  { id: 'submit', title: 'Transmitting to Tamil Nadu NIC Server', icon: Bot, time: 3000 },
];

const TERMINAL_LOGS = [
  "> [SYSTEM] Initializing NICGEP connectivity protocol...",
  "> [AUTH] TLS handshake with tntenders.gov.in successful.",
  "> [AUTH] Verifying Digital Signature Certificate (Class 3)...",
  "> [SESSION] Token generated for TN-Tender Portal session.",
  "> [DATA] Extracting Technical Specifications matrix...",
  "> [DATA] Compiling Bill of Quantities (BoQ) Excel format...",
  "> [VALIDATION] Cross-checking Tamil Nadu Transparency in Tenders Act compliance... OK",
  "> [NETWORK] Transmitting encrypted payload to NIC servers...",
  "> [NETWORK] Waiting for portal acknowledgment receipt...",
  "> [SUCCESS] HTTP 201 Created. Bid successfully lodged on TN Tenders."
];

const EPortalModal = ({ vendor, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [refId, setRefId] = useState('');

  // ── Terminal Log Simulator ──
  useEffect(() => {
    if (isComplete) return;

    let logIndex = 0;
    const interval = setInterval(() => {
      setLogs((prev) => [...prev, TERMINAL_LOGS[logIndex]]);
      logIndex++;

      if (logIndex >= TERMINAL_LOGS.length) {
        clearInterval(interval);
      }
    }, 900); // New log every 900ms

    return () => clearInterval(interval);
  }, [isComplete]);

  // ── Workflow Stepper Simulator ──
  useEffect(() => {
    let stepIndex = 0;

    const processNextStep = () => {
      if (stepIndex >= STEPS.length) {
        setIsComplete(true);
        setRefId('BID-' + Math.random().toString(36).substr(2, 9).toUpperCase());
        return;
      }
      
      setCurrentStep(stepIndex);
      const delay = STEPS[stepIndex].time;
      
      stepIndex++;
      setTimeout(processNextStep, delay);
    };

    const timer = setTimeout(processNextStep, 500); // small delay to render
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content eportal-modal">
        {/* ── HEADER ── */}
        <div className="modal-header">
          <div className="modal-title">
            <div className="bot-icon-container">
              <Bot size={24} className="bot-icon animate-pulse" />
            </div>
            <div>
              <h3>TNTenders e-Procurement Sync</h3>
              <p>Vendor: <strong>{vendor.company_name}</strong></p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} disabled={!isComplete}>
            <X size={20} />
          </button>
        </div>

        {/* ── WORKFLOW ── */}
        <div className="bidding-workflow">
          {isComplete ? (
            <div className="completion-state">
              <CheckCircle2 size={64} className="success-check" />
              <h2>Bid Successfully Automated</h2>
              <p>The vendor proposal has been digitally locked on the Tamil Nadu e-Procurement portal.</p>
              
              <div className="ref-card">
                <span className="ref-label">Official Bid Reference ID</span>
                <div className="ref-value-row">
                  <code>{refId}</code>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(refId)}>
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="stepper">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isPassed = index < currentStep;
                const StepIcon = step.icon;

                return (
                  <div key={step.id} className={`step-item ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                    <div className="step-indicator">
                      {isPassed ? (
                        <CheckCircle2 size={20} className="step-icon-passed" />
                      ) : isActive ? (
                        <CircleDashed size={20} className="step-icon-active spin" />
                      ) : (
                        <div className="step-dot"></div>
                      )}
                      {index < STEPS.length - 1 && <div className="step-line"></div>}
                    </div>
                    <div className="step-content">
                      <h4 className="step-title">{step.title}</h4>
                      {isActive && <span className="step-status">Processing...</span>}
                      {isPassed && <span className="step-status success">Completed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── TERMINAL LOGS ── */}
        <div className="terminal-container">
          <div className="terminal-header">
            <Terminal size={14} />
            <span>sys_automation_x86.logs</span>
          </div>
          <div className="terminal-body">
            {logs.map((log, idx) => (
              <div key={idx} className={`log-line ${log.includes('[SUCCESS]') ? 'log-success' : ''} ${log.includes('[SYSTEM]') ? 'log-system' : ''}`}>
                <ChevronRight size={12} className="log-chevron" />
                <span>{log}</span>
              </div>
            ))}
            {!isComplete && <div className="typing-cursor">█</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EPortalModal;
