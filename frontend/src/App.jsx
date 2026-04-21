import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import BiasCheckerDashboard from './components/BiasCheckerDashboard';
import { Search, Scale } from 'lucide-react';

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
          className={`nav-tab ${activeTab === 'bias' ? 'active' : ''}`}
          onClick={() => setActiveTab('bias')}
        >
          <Scale size={18} /> Bias & Vigilance Check
        </button>
      </div>

      {activeTab === 'vendor' ? <Dashboard /> : <BiasCheckerDashboard />}
    </div>
  )
}

export default App
