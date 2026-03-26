// pages/dashboard.tsx - Main React dashboard component
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('research');
  const [ticker, setTicker] = useState('');
  const [userContext, setUserContext] = useState('');
  const [reports, setReports] = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Load user data on mount
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

  const loadTeamMembers = async (teamId) => {
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

  const loadReports = async (userId) => {
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

  const loadPriceAlerts = async (userId) => {
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
      alert('Please enter a ticker');
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
        alert('Report saved!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error analyzing stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverIdeas = async (category) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'discover',
          category,
          userId: user.userId
        })
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
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error discovering ideas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newMemberEmail.trim()) {
      alert('Please enter an email');
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
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!user) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '500', margin: '0 0 0.5rem' }}>📈 Stock Advisor</h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>Welcome, {user.fullName}!</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', marginBottom: '2rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          {['research', 'discover', 'reports', 'alerts', 'team'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '500' : '400',
                color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--color-text-primary)' : 'none',
                marginBottom: '-0.5px'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* RESEARCH TAB */}
        {activeTab === 'research' && (
          <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1rem' }}>Analyze a Stock or ETF</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <input
                type="text"
                placeholder="Enter ticker (e.g., AAPL, VOO)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px' }}
              />
              <button onClick={handleAnalyzeStock} disabled={loading} style={{ padding: '8px 24px', background: 'var(--color-text-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Researching...' : 'Research ↗'}
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '14px', display: 'block', marginBottom: '0.5rem' }}>Investment Context (optional)</label>
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="e.g., 'I'm tech-heavy already' or 'Looking for dividend income'"
                style={{ width: '100%', minHeight: '80px', padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1.5rem' }}>Get Stock Ideas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { label: '🔥 Trending Now', category: 'trending' },
                { label: '💰 Undervalued', category: 'undervalued' },
                { label: '📈 High Growth', category: 'high-growth' },
                { label: '💵 Dividend Payers', category: 'dividend' },
                { label: '🎯 ETF Screener', category: 'etf-screening' },
                { label: '⭐ Sector Leaders', category: 'sector-leaders' }
              ].map(item => (
                <button
                  key={item.category}
                  onClick={() => handleDiscoverIdeas(item.category)}
                  disabled={loading}
                  style={{ padding: '1rem', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, textAlign: 'center' }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '0.5rem' }}>{item.label.split(' ')[0]}</div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.label.slice(2)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1.5rem' }}>Research Reports</h3>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No reports yet. Start by analyzing a stock!</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {reports.map((report, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--color-background-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{report.ticker}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{report.timestamp || new Date().toLocaleString()}</div>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '200px', overflow: 'hidden' }}>
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
          <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1.5rem' }}>Price Alerts</h3>
            {priceAlerts.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No price alerts set. Create one to monitor stocks.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {priceAlerts.map((alert, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--color-background-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{alert.ticker}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Alert when price goes {alert.alert_type} ${alert.target_price}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {alert.is_active ? '🔔 Active' : '✓ Triggered'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div style={{ backgroundColor: 'var(--color-background-primary)', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1.5rem' }}>Team Members</h3>
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '500', marginBottom: '0.75rem' }}>Add Team Member</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px' }}
                />
                <button onClick={handleAddTeamMember} style={{ padding: '8px 16px', background: 'var(--color-text-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Add
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>They must sign up first before being added to the team.</p>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '500', marginBottom: '0.75rem' }}>Current Team</h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {teamMembers.map((member, i) => (
                <div key={i} style={{ padding: '0.75rem', background: 'var(--color-background-secondary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.full_name || member.email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
