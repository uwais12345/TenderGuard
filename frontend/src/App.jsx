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

      {activeTab === 'vendor' && <Dashboard />}
      {activeTab === 'drafter' && <TenderDrafter />}
      {activeTab === 'bias' && <BiasCheckerDashboard />}
      {activeTab === 'directory' && <VendorDirectory />}
    </div>
  )
}

export default App
