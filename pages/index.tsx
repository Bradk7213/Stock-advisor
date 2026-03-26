import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Root page — redirect to login if not authenticated, dashboard if authenticated
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background-tertiary)'
    }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading...</p>
    </div>
  );
}
