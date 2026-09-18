import React, { useState, useEffect } from 'react';
import { useThreat } from '../../context/ThreatContext';
import { Radio, ShieldCheck, Database, Zap, AlertTriangle } from 'lucide-react';

export default function TopBar() {
  const { health, status, wsState, forecast } = useThreat();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = status?.mode === 'live' || status?.mode === 'replay';
  const modelReady = Boolean(health?.model_loaded);
  const apiOk = health?.status === 'ok';
  const wsConnected = wsState === 'connected';
  const hasWarning = Boolean(forecast?.warning);

  return (
    <header className="top-bar">
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #55D6FF 0%, #7C8CFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(85, 214, 255, 0.35)',
          }}
        >
          <Zap size={18} color="#070B12" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.08em', color: '#fff' }}>
              THREAT<span style={{ color: 'var(--primary)' }}>FORECAST</span>
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              SOC v2.5
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Predictive Cyber Threat Intelligence Center
          </div>
        </div>
      </div>

      {/* Real-time System Health Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Live Traffic State */}
        <div className={`status-badge ${isLive ? 'cyan' : ''}`}>
          <Radio size={12} />
          <span>{isLive ? `CAPTURE: ${status.mode.toUpperCase()}` : 'CAPTURE: IDLE'}</span>
        </div>

        {/* Model State */}
        <div className={`status-badge ${modelReady ? 'safe' : 'warning'}`}>
          <Database size={12} />
          <span>{modelReady ? 'MODEL ONLINE' : 'MODEL OFFLINE'}</span>
        </div>

        {/* API Health */}
        <div className={`status-badge ${apiOk ? 'safe' : 'threat'}`}>
          <ShieldCheck size={12} />
          <span>{apiOk ? 'API HEALTHY' : 'API DEGRADED'}</span>
        </div>

        {/* WebSocket Stream */}
        <div className={`status-badge ${wsConnected ? 'safe' : 'warning'}`}>
          <span className="status-dot" />
          <span>WS: {wsState.toUpperCase()}</span>
        </div>

        {/* Threat State Pill */}
        {hasWarning && (
          <div className="status-badge threat">
            <AlertTriangle size={12} />
            <span>EARLY THREAT WARNING</span>
          </div>
        )}

        {/* UTC Clock */}
        <div
          className="mono"
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            marginLeft: '6px',
          }}
        >
          {timeStr}
        </div>
      </div>
    </header>
  );
}
