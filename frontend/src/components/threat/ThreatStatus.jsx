import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';
import { SEVERITY_LEVELS } from '../../utils/constants';

export default function ThreatStatus() {
  const { mitreData, forecast } = useThreat();

  const primaryAttack = mitreData?.candidates?.[0] || null;
  const isWarning = Boolean(forecast?.warning);
  const peakRisk = forecast?.peak_risk ?? 0;

  const severityKey = primaryAttack?.severity || (
    peakRisk >= 0.2 ? 'CRITICAL' :
    peakRisk >= 0.1 ? 'HIGH' :
    peakRisk >= 0.05 ? 'MEDIUM' : 'LOW'
  );

  const severity = SEVERITY_LEVELS[severityKey] || SEVERITY_LEVELS.LOW;

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="soc-card-header" style={{ marginBottom: 0 }}>
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">HEURISTIC ATTACK ASSESSMENT</span>
          <h3 className="soc-card-title">
            {primaryAttack
              ? primaryAttack.attack_type
              : isWarning
              ? 'Suspicious Network Deviation'
              : 'Nominal Traffic Signature'}
          </h3>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            color: severity.color,
            background: severity.bg,
            border: `1px solid ${severity.border}`,
          }}
        >
          {severity.label} SEVERITY
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {primaryAttack
          ? primaryAttack.interpretation ||
            'Network telemetry exhibits statistical patterns corresponding to early attack reconnaissance or scanning.'
          : 'The Transformer world model continuously evaluates the sliding 50-second state window against learned normal baseline behavior.'}
      </p>

      {/* Heuristic Evidence Tags */}
      {primaryAttack && Array.isArray(primaryAttack.evidence) && primaryAttack.evidence.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Telemetry Evidence Indicators
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {primaryAttack.evidence.map((item) => (
              <div
                key={item}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <CheckCircle2 size={13} color="var(--safe)" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heuristic Score Bar */}
      {primaryAttack && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Heuristic Correlation Score</span>
            <span className="mono">{primaryAttack.score.toFixed(4)}</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, primaryAttack.score * 100)}%`,
                height: '100%',
                background: severity.color,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
