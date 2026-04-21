import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import BiasCheckerDashboard from './components/BiasCheckerDashboard';
import TenderDrafter from './components/TenderDrafter';
import VendorDirectory from './components/VendorDirectory';
import { Search, Scale, PenTool, Database } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('vendor');

  return (
    <div className="App">
      <div className="app-nav">
        <button 
          className={`nav-tab ${activeTab === 'vendor' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendor')}
        >
          <Search size={18} /> Vendor Evaluation
        </button>
        <button 
          className={`nav-tab ${activeTab === 'drafter' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafter')}
        >
          <PenTool size={18} /> Tender Drafter
        </button>
        <button 
          className={`nav-tab ${activeTab === 'bias' ? 'active' : ''}`}
          onClick={() => setActiveTab('bias')}
        >
          <Scale size={18} /> Bias & Vigilance Check
        </button>
        <button 
          className={`nav-tab ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Database size={18} /> Vendor Directory
        </button>
      </div>

      <div style={{ display: activeTab === 'vendor' ? 'block' : 'none' }}>
        <Dashboard />
      </div>
      <div style={{ display: activeTab === 'drafter' ? 'block' : 'none' }}>
        <TenderDrafter />
      </div>
      <div style={{ display: activeTab === 'bias' ? 'block' : 'none' }}>
        <BiasCheckerDashboard />
      </div>
      <div style={{ display: activeTab === 'directory' ? 'block' : 'none' }}>
        <VendorDirectory />
      </div>
    </div>
  )
}

export default App
