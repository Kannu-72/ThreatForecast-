import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { ShieldAlert, ExternalLink, Check } from 'lucide-react';
import { ATTACK_COLORS } from '../../utils/constants';

export default function MitrePanel({ limit }) {
  const { mitreData } = useThreat();

  const candidates = mitreData?.candidates || [];
  const displayed = limit ? candidates.slice(0, limit) : candidates;

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="soc-card-header" style={{ marginBottom: 0 }}>
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">MITRE ATT&CK CONTEXT</span>
          <h3 className="soc-card-title">Technique Correlation Matrix</h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {candidates.length} Detected Techniques
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Heuristic correlation maps observed statistical deviations to MITRE ATT&CK enterprise tactics and techniques.
        This provides contextual intelligence rather than transformer-inferred execution proof.
      </p>

      {displayed.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            borderRadius: '8px',
            background: 'rgba(5, 10, 18, 0.5)',
            border: '1px dashed var(--border-glass)',
          }}
        >
          No ATT&CK technique currently exceeds the heuristic correlation threshold.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: limit ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
          {displayed.map((c) => {
            const attackColor = ATTACK_COLORS[c.attack_type] || '#55D6FF';

            return (
              <div
                key={`${c.technique_id}-${c.attack_type}`}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(5, 10, 18, 0.65)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      color: attackColor,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${attackColor}40`,
                    }}
                  >
                    {c.attack_type}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: c.severity === 'HIGH' || c.severity === 'CRITICAL' ? 'var(--threat)' : 'var(--warning)',
                    }}
                  >
                    {c.severity}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    {c.technique_id} · {c.name}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Tactic: <span style={{ color: 'var(--secondary)' }}>{c.tactic}</span>
                  </div>
                </div>

                {/* Score Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Heuristic Score</span>
                    <span className="mono">{c.score.toFixed(4)}</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '5px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, c.score * 100)}%`,
                        height: '100%',
                        background: attackColor,
                      }}
                    />
                  </div>
                </div>

                {/* Evidence */}
                {Array.isArray(c.evidence) && c.evidence.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                    {c.evidence.map((ev) => (
                      <span
                        key={ev}
                        style={{
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
                  {c.interpretation}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
