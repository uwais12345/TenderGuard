import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import BiasCheckerDashboard from './components/BiasCheckerDashboard';
import TenderDrafter from './components/TenderDrafter';
import VendorDirectory from './components/VendorDirectory';
import TNTendersPortal from './components/TNTendersPortal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MarketIntelDashboard from './components/MarketIntelDashboard';
import { Search, Scale, PenTool, Database, Radar, BarChart2, Globe } from 'lucide-react';

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
        <button 
          className={`nav-tab ${activeTab === 'tntenders' ? 'active' : ''}`}
          onClick={() => setActiveTab('tntenders')}
        >
          <Radar size={18} /> TN Tenders Portal
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={18} /> Analytics
        </button>
        <button 
          className={`nav-tab ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <Globe size={18} /> Market Intel
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
      <div style={{ display: activeTab === 'tntenders' ? 'block' : 'none' }}>
        <TNTendersPortal />
      </div>
      <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
        <AnalyticsDashboard />
      </div>
      <div style={{ display: activeTab === 'market' ? 'block' : 'none' }}>
        <MarketIntelDashboard />
      </div>
    </div>
  )
}

export default App
