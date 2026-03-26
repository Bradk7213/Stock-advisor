// pages/auth.tsx - Login & Signup page
'use client';

import React, { useState } from 'react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const action = isLogin ? 'login' : 'signup';
      const body = isLogin
        ? { action, email, password }
        : { action, email, password, fullName };

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background-tertiary)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--color-background-primary)',
        padding: '2rem',
        borderRadius: '12px',
        border: '0.5px solid var(--color-border-tertiary)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', marginBottom: '0.5rem', textAlign: 'center' }}>
          📈 Stock Advisor
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          AI-powered stock research for teams
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {!isLogin && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--color-text-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 0.5rem' }}>📚 Features:</p>
          <ul style={{ margin: 0, paddingLeft: '1rem', listStyle: 'none' }}>
            <li>✓ AI stock research</li>
            <li>✓ Daily screening</li>
            <li>✓ Price alerts</li>
            <li>✓ Team collaboration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
