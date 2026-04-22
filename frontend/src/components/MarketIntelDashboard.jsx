import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, RefreshCw, Filter, Search, ExternalLink, TrendingUp,
  AlertCircle, Clock, Zap, BarChart2, Building2, Tag, Loader,
  ChevronDown, Activity
} from 'lucide-react';

const SOURCE_META = {
  'TN Tenders':      { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.35)' },
  'Central CPPP':    { color: '#ffffff', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)' },
  'GeM / High Value':{ color: '#a3a3a3', bg: 'rgba(163,163,163,0.12)', border: 'rgba(163,163,163,0.3)' },
};

const VALUE_META = {
  'High Value (>₹1 Cr)':    { color: '#dc2626', icon: '🔥' },
  'Medium (₹10L-₹1Cr)':     { color: '#ffffff', icon: '💰' },
  'Small (<₹10L)':           { color: '#888',    icon: '📦' },
};

const CLOSING_META = {
  'Closing Soon': { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', pulse: true },
  'Active':       { color: '#fff',    bg: 'rgba(255,255,255,0.06)', pulse: false },
};

const ALL_SOURCES = ['TN Tenders', 'Central CPPP', 'GeM / High Value'];
const ALL_CATEGORIES = ['All', 'Works / Civil', 'IT & Electronics', 'Electrical', 'Medical & Health', 'Vehicles', 'Goods & Supplies', 'Services', 'Industrial', 'General'];
const ALL_VALUES = ['All', 'High Value (>₹1 Cr)', 'Medium (₹10L-₹1Cr)', 'Small (<₹10L)'];

// ── Stat Card ──────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div style={{
    background: '#111',
    border: `1px solid ${accent || '#333'}`,
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: '160px',
  }}>
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px',
      background: `${accent || '#333'}22`,
      border: `1px solid ${accent || '#333'}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={18} style={{ color: accent || '#888' }} />
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '3px' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: accent || '#555', marginTop: '1px' }}>{sub}</div>}
    </div>
  </div>
);

// ── Category Bar Chart ─────────────────────────────────
const CategoryBar = ({ categories }) => {
  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const colors = ['#dc2626','#ffffff','#a3a3a3','#777777','#444444','#991b1b','#ef4444','#555555'];
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <BarChart2 size={16} style={{ color: '#dc2626' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ccc' }}>Tenders by Category</span>
      </div>
      {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count], i) => (
        <div key={cat} style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>{cat}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{count}</span>
          </div>
          <div style={{ height: '4px', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(count / total) * 100}%`,
              background: colors[i % colors.length],
              borderRadius: '4px',
              transition: 'width 1s ease-out'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Source Pill ────────────────────────────────────────
const SourcePill = ({ source }) => {
  const meta = SOURCE_META[source] || { color: '#888', bg: '#222', border: '#444' };
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px',
      borderRadius: '20px', background: meta.bg,
      color: meta.color, border: `1px solid ${meta.border}`,
      textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0
    }}>{source}</span>
  );
};

// ── Tender Card ────────────────────────────────────────
const TenderCard = ({ tender }) => {
  const closingMeta = CLOSING_META[tender.closing_status] || CLOSING_META['Active'];
  const valueMeta = VALUE_META[tender.value_band] || VALUE_META['Small (<₹10L)'];

  return (
    <div style={{
      background: '#0f0f0f',
      border: '1px solid #1e1e1e',
      borderRadius: '12px',
      padding: '16px 18px',
      transition: 'border-color 0.2s, transform 0.15s',
      cursor: 'default'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Row 1: badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <SourcePill source={tender.source} />
        <span style={{
          fontSize: '0.65rem', padding: '2px 7px', borderRadius: '12px',
          background: closingMeta.bg, color: closingMeta.color,
          border: `1px solid ${closingMeta.color}44`, fontWeight: 700
        }}>
          {closingMeta.pulse ? '⚡ ' : ''}{tender.closing_status}
        </span>
        <span style={{
          fontSize: '0.65rem', padding: '2px 7px', borderRadius: '12px',
          background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a'
        }}>
          {tender.id}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: valueMeta.color, fontWeight: 700 }}>
          {valueMeta.icon} {tender.value_band}
        </span>
      </div>

      {/* Row 2: title */}
      <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#fff', lineHeight: 1.4, fontWeight: 600 }}>
        {tender.title}
      </h3>

      {/* Row 3: department & category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Building2 size={12} style={{ color: '#555' }} />
          <span style={{ fontSize: '0.78rem', color: '#777' }}>{tender.department}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Tag size={12} style={{ color: '#555' }} />
          <span style={{ fontSize: '0.78rem', color: '#777' }}>{tender.category}</span>
        </div>
      </div>

      {/* Row 4: CTA */}
      <a
        href={tender.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#ccc', padding: '6px 12px', borderRadius: '8px',
          fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ccc'; }}
      >
        <ExternalLink size={12} /> View on {tender.source}
      </a>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────
const MarketIntelDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterValue, setFilterValue] = useState('All');
  const [activeSources, setActiveSources] = useState(new Set(ALL_SOURCES));
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeSources.size < ALL_SOURCES.length
        ? `?sources=${[...activeSources].join(',')}`
        : '';
      const res = await fetch(`http://localhost:5000/api/market-intel${params}`);
      const d = await res.json();
      setData(d);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeSources]);

  useEffect(() => { fetchData(); }, []);

  const toggleSource = (src) => {
    setActiveSources(prev => {
      const next = new Set(prev);
      if (next.has(src)) { if (next.size > 1) next.delete(src); }
      else next.add(src);
      return next;
    });
  };

  const filteredTenders = (data?.tenders || []).filter(t => {
    if (!activeSources.has(t.source)) return false;
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    if (filterValue !== 'All' && t.value_band !== filterValue) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 60px', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(220,38,38,0.3)'
          }}>
            <Globe size={26} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                Market Intelligence
              </h1>
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                color: '#dc2626', fontSize: '0.68rem', fontWeight: 800,
                padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            </div>
            <p style={{ margin: '3px 0 0', color: '#555', fontSize: '0.85rem' }}>
              Unified feed from TN Tenders · Central CPPP · GeM
              {lastRefresh && <span style={{ marginLeft: '12px', color: '#444' }}>
                Last refreshed: {lastRefresh.toLocaleTimeString('en-IN')}
              </span>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: loading ? '#1a1a1a' : 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            color: '#dc2626', padding: '10px 20px', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Fetching...' : 'Refresh All Sources'}
        </button>
      </div>

      {/* ── SOURCE TOGGLES ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ALL_SOURCES.map(src => {
          const meta = SOURCE_META[src];
          const active = activeSources.has(src);
          return (
            <button
              key={src}
              onClick={() => toggleSource(src)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                background: active ? meta.bg : '#111',
                border: `1px solid ${active ? meta.border : '#222'}`,
                color: active ? meta.color : '#555'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? meta.color : '#444' }} />
              {src}
              {data?.sources?.[src] !== undefined && (
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({data.sources[src] || 0})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── STATS STRIP ── */}
      {data && !loading && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <StatCard icon={Globe} label="Total Live Tenders" value={data.total} accent="#dc2626" />
          <StatCard icon={Zap} label="Closing Soon" value={data.closing_soon} sub="Urgent action needed" accent="#dc2626" />
          <StatCard icon={TrendingUp} label="High Value Tenders" value={data.high_value_count} sub=">₹1 Crore" accent="#ffffff" />
          <StatCard icon={Activity} label="Active Sources" value={activeSources.size} sub="portals synced" accent="#a3a3a3" />
        </div>
      )}

      <div className="market-intel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* ── LEFT: Feed ── */}
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex', gap: '10px', marginBottom: '18px',
            background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '10px 14px',
            flexWrap: 'wrap', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '7px 12px' }}>
              <Search size={14} style={{ color: '#555' }} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search tenders, departments..."
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', width: '100%' }}
              />
            </div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#ccc', padding: '7px 10px', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
              style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#ccc', padding: '7px 10px', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              {ALL_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span style={{ fontSize: '0.78rem', color: '#555', whiteSpace: 'nowrap' }}>
              {filteredTenders.length} result{filteredTenders.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tender Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
              <Loader className="spin" size={36} style={{ color: '#dc2626', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>Simultaneously fetching from 3 government portals...</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                {ALL_SOURCES.map(s => (
                  <span key={s} style={{ fontSize: '0.75rem', color: SOURCE_META[s].color, padding: '2px 8px', borderRadius: '6px', background: SOURCE_META[s].bg, border: `1px solid ${SOURCE_META[s].border}` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
              <AlertCircle size={32} style={{ marginBottom: '12px' }} />
              <p>No tenders match your filters. Try clearing some filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {filteredTenders.map(tender => (
                <TenderCard key={tender.id} tender={tender} />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="market-intel-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '100px' }}>
          {/* Category chart */}
          {data?.categories && <CategoryBar categories={data.categories} />}

          {/* Portal Links */}
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Globe size={16} style={{ color: '#dc2626' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ccc' }}>Portal Quick Links</span>
            </div>
            {[
              { name: 'TN Tenders Portal', url: 'https://tntenders.gov.in/nicgep/app', color: '#dc2626' },
              { name: 'Central CPPP', url: 'https://eprocure.gov.in/cppp/latestactivetendersnew', color: '#ffffff' },
              { name: 'GeM High-Value Bids', url: 'https://eprocure.gov.in/cppp/highvaluetenders', color: '#a3a3a3' },
              { name: 'Tender Closing Today', url: 'https://eprocure.gov.in/cppp/tendersclosingbydays/bytoday', color: '#ffffff' },
              { name: 'TN Debarment List', url: 'https://tntenders.gov.in/nicgep/app?page=FrontEndDebarmentList&service=page', color: '#888' },
            ].map(link => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #1a1a1a',
                  textDecoration: 'none', color: link.color, fontSize: '0.8rem', fontWeight: 500,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {link.name}
                <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelDashboard;
