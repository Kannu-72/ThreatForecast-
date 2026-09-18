import React from 'react';
import NetworkState from '../components/network/NetworkState';
import { useThreat } from '../context/ThreatContext';
import { FEATURE_NAMES } from '../utils/constants';

export default function NetworkStatePage() {
  const { forecast, status } = useThreat();
  const features = forecast?.latest_state?.features || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 10s Window High-Level Summary */}
      <NetworkState />

      {/* Full 45-Feature Contract Table */}
      <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="soc-card-header" style={{ marginBottom: 0 }}>
          <div className="soc-card-title-group">
            <span className="soc-eyebrow">PRODUCTION CONTRACT</span>
            <h3 className="soc-card-title">45-Dimensional Feature Vector</h3>
          </div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Vector Size: {features.length} / 45
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Each 10-second traffic interval is mapped into a normalized 45-dimensional feature vector, matching the
          contract expected by the production scaler and transformer model.
        </p>

        {features.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              background: 'rgba(5, 10, 18, 0.5)',
              border: '1px dashed var(--border-glass)',
            }}
          >
            No feature vector computed yet. Ingest network traffic to view real-time state vectors.
          </div>
        ) : (
          <div
            style={{
              maxHeight: '460px',
              overflowY: 'auto',
              borderRadius: '8px',
              background: 'rgba(5, 10, 18, 0.7)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#0e1422', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>INDEX</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>FEATURE NAME</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>OBSERVED VALUE</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_NAMES.map((name, idx) => {
                  const val = features[idx];
                  return (
                    <tr
                      key={name}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}
                    >
                      <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
                        #{String(idx).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '6px 12px', color: '#fff', fontWeight: 600 }}>
                        {name}
                      </td>
                      <td style={{ padding: '6px 12px', color: 'var(--primary)' }}>
                        {val != null ? (typeof val === 'number' ? val.toFixed(5) : val) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
