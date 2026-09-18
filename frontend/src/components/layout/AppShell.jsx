import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { AlertCircle, X } from 'lucide-react';

export default function AppShell({ children }) {
  const { err, setErr } = useThreat();

  return (
    <div className="app-shell">
      <div className="ambient-bg" />
      <TopBar />
      <div className="shell-body">
        <Sidebar />
        <main className="main-workspace">
          {err && (
            <div className="error-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} color="var(--threat)" />
                <span>{err}</span>
              </div>
              <button
                onClick={() => setErr('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
