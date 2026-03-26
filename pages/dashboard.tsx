import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('research');
  const [ticker, setTicker] = useState('');
  const [userContext, setUserContext] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [alertTicker, setAlertTicker] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify-token', token })
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          loadTeamMembers(data.user.teamId);
          loadReports(data.user.userId);
          loadPriceAlerts(data.user.userId);
        } else {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth error:', error);
        window.location.href = '/login';
      }
    };

    loadUser();
  }, []);

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'team-members', teamId })
      });
      const data = await response.json();
      setTeamMembers(data.members || []);
    } catch (error) {
      console.error('Load team members error:', error);
    }
  };

  const loadReports = async (userId: string) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-reports', userId })
      });
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Load reports error:', error);
    }
  };

  const loadPriceAlerts = async (userId: string) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-alerts', userId })
      });
      const data = await response.json();
      setPriceAlerts(data.alerts || []);
    } catch (error) {
      console.error('Load alerts error:', error);
    }
  };

  const handleAnalyzeStock = async () => {
    if (!ticker.trim()) {
      alert('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stock-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          ticker: ticker.toUpperCase(),
          userId: user.userId,
          userContext
        })
      });

      const data = await response.json();
      if (response.ok) {
        setReports([data, ...reports]);
        setTicker('');
        setUserContext('');
        setActiveTab('reports');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error analyzing stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverIdeas = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover', category, userId: user.userId })
      });

      const data = await response.json();
      if (response.ok) {
        setReports([
          {
            ticker: `Discovery: ${category}`,
            analysis: data.ideas,
            timestamp: new Date().toLocaleString()
          },
          ...reports
        ]);
        setActiveTab('reports');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error discovering ideas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!alertTicker.trim() || !alertPrice.trim()) {
      alert('Please enter a ticker and target price');
      return;
    }

    try {
      const response = await fetch('/api/stock-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'price-alert',
          ticker: alertTicker.toUpperCase(),
          targetPrice: parseFloat(alertPrice),
          alertType,
          userId: user.userId
        })
      });

      if (response.ok) {
        setAlertTicker('');
        setAlertPrice('');
        loadPriceAlerts(user.userId);
        alert('Price alert created!');
      } else {
        const data = await response.json();
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error creating alert: ' + error.message);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newMemberEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-member',
          teamId: user.teamId,
          email: newMemberEmail
        })
      });

      if (response.ok) {
        setNewMemberEmail('');
        loadTeamMembers(user.teamId);
        alert('Team member added!');
      } else {
        const data = await response.json();
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'research', label: 'Research' },
    { id: 'discover', label: 'Discover' },
    { id: 'reports', label: `Reports (${reports.length})` },
    { id: 'alerts', label: `Alerts (${priceAlerts.length})` },
    { id: 'team', label: 'Team' },
  ];

  return (
    <>
      <Head>
        <title>Stock Advisor — Dashboard</title>
      </Head>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)' }}>

        {/* Header */}
        <div style={{ backgroundColor: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '1rem 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>📈 Stock Advisor</h1>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Welcome back, {user.fullName || user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{ padding: '7px 14px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: '14px',
                  marginBottom: '-0.5px',
                  transition: 'color 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* RESEARCH TAB */}
          {activeTab === 'research' && (
            <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '1rem' }}>Analyze a Stock or ETF</h2>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <input
                  type="text"
                  placeholder="Ticker symbol (e.g., AAPL, VOO, MSFT)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeStock()}
                  style={{ flex: 1, minWidth: '220px', padding: '9px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '14px' }}
                />
                <button
                  onClick={handleAnalyzeStock}
                  disabled={loading}
                  style={{ padding: '9px 24px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  {loading ? 'Researching...' : 'Research ↗'}
                </button>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Investment context (optional — helps Claude tailor the analysis)
                </label>
                <textarea
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder="e.g., 'I'm already heavy in tech' or 'Looking for dividend income' or 'Long-term hold for retirement'"
                  style={{ width: '100%', minHeight: '80px', padding: '9px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>
                Analysis takes 15–30 seconds. Results will appear in the Reports tab.
              </p>
            </div>
          )}

          {/* DISCOVER TAB */}
          {activeTab === 'discover' && (
            <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '0.5rem' }}>Discover Stock Ideas</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Let AI surface ideas across different investment themes. Results appear in the Reports tab.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                {[
                  { label: '🔥 Trending Now', category: 'trending', desc: 'Momentum & market buzz' },
                  { label: '💰 Undervalued', category: 'undervalued', desc: 'Trading below fair value' },
                  { label: '📈 High Growth', category: 'high-growth', desc: 'Strong upside potential' },
                  { label: '💵 Dividend Payers', category: 'dividend', desc: 'Solid yields & income' },
                  { label: '🎯 ETF Screener', category: 'etf-screening', desc: 'Top broad-market ETFs' },
                  { label: '⭐ Sector Leaders', category: 'sector-leaders', desc: 'Best-in-class by sector' },
                ].map(item => (
                  <button
                    key={item.category}
                    onClick={() => handleDiscoverIdeas(item.category)}
                    disabled={loading}
                    style={{ padding: '1rem', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, textAlign: 'left', transition: 'border-color 0.15s' }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>{item.label}</div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                  </button>
                ))}
              </div>
              {loading && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '1.5rem', fontSize: '13px' }}>
                  Generating ideas... this takes 15–30 seconds.
                </p>
              )}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '1.5rem' }}>Research Reports</h2>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No reports yet.</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '0.5rem' }}>
                    Start by analyzing a stock in the Research tab or discovering ideas.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {reports.map((report, i) => (
                    <div key={i} style={{ padding: '1.25rem', background: 'var(--color-background-secondary)', borderRadius: '10px', border: '0.5px solid var(--color-border-tertiary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>{report.ticker}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {report.timestamp ? new Date(report.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '300px', overflowY: 'auto' }}>
                        {report.analysis}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Create alert */}
              <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '1rem' }}>Create Price Alert</h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="Ticker (e.g., AAPL)"
                    value={alertTicker}
                    onChange={(e) => setAlertTicker(e.target.value)}
                    style={{ flex: 1, minWidth: '140px', padding: '9px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '14px' }}
                  />
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    style={{ padding: '9px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '14px' }}
                  >
                    <option value="above">Goes above</option>
                    <option value="below">Falls below</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Target price $"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    style={{ width: '150px', padding: '9px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '14px' }}
                  />
                  <button
                    onClick={handleCreateAlert}
                    style={{ padding: '9px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                  >
                    Set Alert
                  </button>
                </div>
              </div>

              {/* Existing alerts */}
              <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '1rem' }}>Your Alerts</h2>
                {priceAlerts.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0', fontSize: '14px' }}>
                    No price alerts yet. Create one above to monitor stocks.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {priceAlerts.map((alert, i) => (
                      <div key={i} style={{ padding: '1rem', background: 'var(--color-background-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{alert.ticker}</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            Alert when price goes {alert.alert_type} ${alert.target_price}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: alert.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                          {alert.is_active ? '🔔 Active' : '✓ Triggered'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '0.5rem' }}>Add Team Member</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  They must sign up first at this app's URL, then you can add them here.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="email"
                    placeholder="Enter their email address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '14px' }}
                  />
                  <button
                    onClick={handleAddTeamMember}
                    style={{ padding: '9px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '1rem' }}>Team Members ({teamMembers.length})</h2>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {teamMembers.map((member, i) => (
                    <div key={i} style={{ padding: '0.875rem 1rem', background: 'var(--color-background-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.full_name || member.email}</div>
                        {member.full_name && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{member.email}</div>
                        )}
                      </div>
                      {member.id === user.userId && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', background: 'var(--color-background-tertiary)', padding: '2px 8px', borderRadius: '999px' }}>You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
