import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, TrendingUp, AlertOctagon, Building2, Search, IndianRupee, RefreshCw } from 'lucide-react';

const VendorDirectory = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/vendors');
      setVendors(response.data.vendor_stats || []);
    } catch (err) {
      setError('Could not load vendor data. Is MongoDB connected?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter(v => 
    v.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="directory-container">
      <div className="directory-header">
        <Database size={32} className="db-icon" />
        <h2>Global Vendor Directory</h2>
        <p>Historical reputation, win-rates, and aggregations across all past public tenders.</p>
      </div>

      <div className="directory-controls">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search vendors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={fetchVendors}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="directory-loading">
          <div className="skeleton-line" style={{ height: '50px', marginBottom: '10px' }}></div>
          <div className="skeleton-line" style={{ height: '50px', marginBottom: '10px' }}></div>
          <div className="skeleton-line" style={{ height: '50px', marginBottom: '10px' }}></div>
        </div>
      ) : error ? (
        <div className="error-msg"><AlertOctagon size={16} /> {error}</div>
      ) : filteredVendors.length === 0 ? (
        <div className="directory-empty">
          <Building2 size={48} />
          <h3>No Vendors Found</h3>
          <p>Run some evaluations to start populating your vendor database.</p>
        </div>
      ) : (
        <div className="table-wrapper directory-table-wrapper">
          <table className="directory-table">
            <thead>
              <tr>
                <th>Vendor / Company Name</th>
                <th>Total Tenders Evaluated</th>
                <th>L1 Win Rate</th>
                <th>Average AI Score</th>
                <th>Avg. Bid Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((v, i) => (
                <tr key={i}>
                  <td className="firm-name">
                    <Building2 size={14} /> {v.company_name}
                  </td>
                  <td className="text-center">{v.total_bids}</td>
                  <td>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${v.win_rate || 0}%`, background: v.win_rate > 50 ? '#10b981' : '#f59e0b' }}></div>
                    </div>
                    <span className="rate-text">{v.win_rate ? v.win_rate.toFixed(1) : 0}% ({v.wins} wins)</span>
                  </td>
                  <td className="text-center score-td">
                    <span className="score-badge" style={{ color: v.average_score > 80 ? '#10b981' : '#f59e0b', borderColor: v.average_score > 80 ? '#10b981' : '#f59e0b' }}>
                      {v.average_score}%
                    </span>
                  </td>
                  <td className="currency-td">
                    <IndianRupee size={12} />
                    {v.average_bid_value ? v.average_bid_value.toLocaleString('en-IN') : 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorDirectory;
