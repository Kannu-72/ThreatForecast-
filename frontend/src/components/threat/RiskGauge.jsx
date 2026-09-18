import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { OPERATIONAL_THRESHOLD, SEVERITY_LEVELS } from '../../utils/constants';

export default function RiskGauge() {
  const { forecast } = useThreat();

  const peakRisk = forecast?.peak_risk ?? 0;
  const peakHorizon = forecast?.peak_risk_horizon_seconds ?? 10;
  const hasWarning = Boolean(forecast?.warning) || peakRisk >= OPERATIONAL_THRESHOLD;

  // Determine Severity Level
  let severity = SEVERITY_LEVELS.LOW;
  if (peakRisk >= 0.2) severity = SEVERITY_LEVELS.CRITICAL;
  else if (peakRisk >= 0.1) severity = SEVERITY_LEVELS.HIGH;
  else if (peakRisk >= OPERATIONAL_THRESHOLD) severity = SEVERITY_LEVELS.MEDIUM;

  // SVG Gauge Calculations
  const radius = 70;
  const strokeWidth = 10;
  const normalizedRisk = Math.min(1, Math.max(0, peakRisk / 0.35)); // Scale 0 to 35%
  const circumference = Math.PI * radius; // 180 degree semi-circle
  const strokeDashoffset = circumference - normalizedRisk * circumference;

  // Threshold angle on semi-circle
  const thresholdRatio = OPERATIONAL_THRESHOLD / 0.35;
  const thresholdAngle = Math.PI * (1 - thresholdRatio);
  const threshX = 100 + radius * Math.cos(thresholdAngle);
  const threshY = 95 - radius * Math.sin(thresholdAngle);

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
      <div className="soc-card-header">
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">RISK INSTRUMENT</span>
          <h3 className="soc-card-title">Peak Attack Probability</h3>
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
          {severity.label}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ position: 'relative', width: '200px', height: '110px' }}>
          <svg width="200" height="110" viewBox="0 0 200 110">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#55D6A5" />
                <stop offset="45%" stopColor="#55D6FF" />
                <stop offset="70%" stopColor="#FFB454" />
                <stop offset="100%" stopColor="#FF5C6C" />
              </linearGradient>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Arc */}
            <path
              d="M 30 95 A 70 70 0 0 1 170 95"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Value Arc */}
            <path
              d="M 30 95 A 70 70 0 0 1 170 95"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter={hasWarning ? 'url(#gaugeGlow)' : undefined}
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />

            {/* Threshold Tick Marker */}
            <circle cx={threshX} cy={threshY} r="3" fill="#FF5C6C" />
          </svg>

          {/* Central Peak Risk Number */}
          <div
            style={{
              position: 'absolute',
              bottom: '0px',
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            <div className="mono" style={{ fontSize: '32px', fontWeight: 800, color: severity.color, lineHeight: 1 }}>
              {forecast ? (peakRisk * 100).toFixed(2) + '%' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Score: <span className="mono">{forecast ? peakRisk.toFixed(5) : '0.00000'}</span>
            </div>
          </div>
        </div>

        {/* Operational Threshold and Horizon Specs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PEAK HORIZON</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
              +{peakHorizon}s
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OP THRESHOLD</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: '#ff7c8b' }}>
              {OPERATIONAL_THRESHOLD.toFixed(2)} (5.0%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
