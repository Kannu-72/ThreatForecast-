import React, { useState, useEffect, useRef } from 'react';
import { useThreat } from '../../context/ThreatContext';
import { HORIZONS, OPERATIONAL_THRESHOLD } from '../../utils/constants';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ForecastCard() {
  const threatContext = useThreat ? useThreat() : {};
  const { forecast } = threatContext || {};

  const riskScores = Array.isArray(forecast?.risk_scores) ? forecast.risk_scores : [];
  const peakHorizon = forecast?.peak_risk_horizon_seconds ?? null;

  // Track data updates to trigger subtle highlight pulse
  const prevScoresRef = useRef([]);
  const [updatedIndices, setUpdatedIndices] = useState(new Set());

  useEffect(() => {
    if (!riskScores.length) return;

    const changed = new Set();
    riskScores.forEach((val, idx) => {
      if (prevScoresRef.current[idx] !== undefined && prevScoresRef.current[idx] !== val) {
        changed.add(idx);
      }
    });

    prevScoresRef.current = [...riskScores];

    if (changed.size > 0) {
      setUpdatedIndices(changed);
      const timer = setTimeout(() => {
        setUpdatedIndices(new Set());
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [riskScores]);

  // Find peak index for subtle emphasis
  const maxScore = riskScores.length ? Math.max(...riskScores) : -1;

  return (
    <div className="w-full" style={{ width: '100%' }}>
      <style>{`
        .horizon-module-3d {
          transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease, border-color 0.3s ease;
        }
        @media (hover: hover) {
          .horizon-module-3d:hover {
            transform: translateY(-3px) rotateX(-2deg) rotateY(2deg);
            box-shadow: 0 14px 28px rgba(0, 0, 0, 0.5), 0 0 16px rgba(0, 229, 255, 0.12);
          }
        }
        @keyframes borderPulseHighlight {
          0% { border-color: rgba(0, 229, 255, 0.8); box-shadow: 0 0 12px rgba(0, 229, 255, 0.35); }
          100% { border-color: rgba(42, 57, 88, 0.7); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); }
        }
      `}</style>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '0 2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1px',
              color: '#94a3b8',
              textTransform: 'uppercase',
            }}
          >
            MULTI-HORIZON PROJECTION GRID
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 229, 255, 0.12)',
              color: '#00e5ff',
              border: '1px solid rgba(0, 229, 255, 0.3)',
            }}
          >
            6 STEPS
          </span>
        </div>

        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
          Threshold: <strong style={{ color: '#f43f5e' }}>{OPERATIONAL_THRESHOLD}</strong>
        </span>
      </div>

      {/* 6 Dimensionally-Styled Forecast Horizon Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          perspective: '800px',
        }}
      >
        {HORIZONS.map((h, idx) => {
          const val = riskScores[idx] !== undefined ? riskScores[idx] : null;
          const isWarning = val !== null && val >= OPERATIONAL_THRESHOLD;
          const isCritical = val !== null && val >= 0.15;
          const isPeak = (peakHorizon === h) || (val !== null && val === maxScore && maxScore > 0);
          const isNearTerm = idx === 0;
          const isUpdated = updatedIndices.has(idx);

          // Micro 3D Meter position (0.00 to 0.10 mapped across 0% to 100%, so 0.05 is exactly at 50% midpoint)
          const meterPercent = val !== null ? Math.min(100, Math.max(0, (val / 0.10) * 100)) : 0;

          return (
            <div
              key={h}
              className="soc-card horizon-module-3d"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px 15px',
                borderRadius: '12px',
                background: isCritical
                  ? 'linear-gradient(180deg, rgba(30, 16, 28, 0.95) 0%, rgba(13, 17, 34, 0.95) 100%)'
                  : isWarning
                    ? 'linear-gradient(180deg, rgba(32, 24, 18, 0.95) 0%, rgba(13, 18, 36, 0.95) 100%)'
                    : isNearTerm
                      ? 'linear-gradient(180deg, rgba(14, 26, 52, 0.95) 0%, rgba(10, 16, 32, 0.95) 100%)'
                      : 'linear-gradient(180deg, rgba(13, 20, 40, 0.92) 0%, rgba(9, 14, 28, 0.92) 100%)',
                border: isPeak
                  ? '1px solid rgba(0, 229, 255, 0.5)'
                  : isWarning
                    ? '1px solid rgba(244, 63, 94, 0.4)'
                    : isNearTerm
                      ? '1px solid rgba(56, 189, 248, 0.35)'
                      : '1px solid rgba(42, 57, 88, 0.7)',
                boxShadow: isPeak
                  ? '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 14px rgba(0, 229, 255, 0.12)'
                  : '0 8px 20px rgba(0, 0, 0, 0.35)',
                animation: isUpdated ? 'borderPulseHighlight 0.65s ease-out' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle radial inner glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isWarning ? 'rgba(244, 63, 94, 0.12)' : 'rgba(0, 229, 255, 0.08)',
                  filter: 'blur(10px)',
                  pointerEvents: 'none',
                }}
              />

              {/* Top Header: Horizon Clock & Peak Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} color={isNearTerm ? '#00e5ff' : '#94a3b8'} />
                  <span
                    style={{
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: isNearTerm ? '#00e5ff' : '#f1f5f9',
                    }}
                  >
                    +{h}s
                  </span>
                </div>

                {isPeak ? (
                  <span
                    style={{
                      fontSize: '8px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: '3px',
                      background: 'rgba(0, 229, 255, 0.18)',
                      color: '#00e5ff',
                      border: '1px solid rgba(0, 229, 255, 0.35)',
                      letterSpacing: '0.4px',
                    }}
                  >
                    PEAK
                  </span>
                ) : isNearTerm ? (
                  <span
                    style={{
                      fontSize: '8px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '3px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                    }}
                  >
                    NEAR
                  </span>
                ) : null}
              </div>

              {/* Risk Score Numerical Display */}
              <div style={{ margin: '6px 0' }}>
                <div
                  style={{
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    color: '#64748b',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  RISK SCORE
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color:
                      val !== null
                        ? isCritical
                          ? '#f43f5e'
                          : isWarning
                            ? '#fbbf24'
                            : '#f8fafc'
                        : '#475569',
                    margin: '2px 0 4px 0',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {val !== null ? val.toFixed(4) : '—'}
                </div>
              </div>

              {/* Micro 3D Risk Meter */}
              <div style={{ position: 'relative', width: '100%', margin: '8px 0 10px 0' }}>
                {/* Track Groove */}
                <div
                  style={{
                    height: '5px',
                    borderRadius: '999px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(42, 57, 88, 0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Fill */}
                  <div
                    style={{
                      height: '100%',
                      width: `${meterPercent}%`,
                      background: isCritical
                        ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                        : isWarning
                          ? 'linear-gradient(90deg, #38bdf8, #f59e0b)'
                          : 'linear-gradient(90deg, #00e5ff, #38bdf8)',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>

                {/* Threshold reference marker notch at 50% (0.05) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '50%',
                    width: '1px',
                    height: '9px',
                    background: 'rgba(244, 63, 94, 0.55)',
                    pointerEvents: 'none',
                  }}
                  title="Threshold 0.05"
                />

                {/* 3D Indicator Pearl */}
                {val !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: `calc(${meterPercent}% - 4.5px)`,
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: isCritical
                        ? '0 0 8px #f43f5e'
                        : isWarning
                          ? '0 0 8px #f59e0b'
                          : '0 0 8px #00e5ff',
                      transition: 'left 0.5s ease-out',
                    }}
                  />
                )}
              </div>

              {/* Status Indicator & Threshold Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(42, 57, 88, 0.6)',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                    color: isCritical ? '#f43f5e' : isWarning ? '#fbbf24' : '#34d399',
                  }}
                >
                  {isCritical ? (
                    <>
                      <AlertTriangle size={11} /> CRITICAL
                    </>
                  ) : isWarning ? (
                    <>
                      <AlertTriangle size={11} /> ELEVATED
                    </>
                  ) : (
                    <>
                      <CheckCircle size={11} /> NORMAL
                    </>
                  )}
                </span>

                <span style={{ color: '#64748b' }}>T: {OPERATIONAL_THRESHOLD}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Temporal Progression Timeline Conduit */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '12px',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#64748b',
        }}
      >
        <span style={{ color: '#00e5ff', fontWeight: 700 }}>NEAR TERM</span>
        <span>+10s</span>
        <span style={{ color: '#475569' }}>→</span>
        <span>+20s</span>
        <span style={{ color: '#475569' }}>→</span>
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>MID TERM</span>
        <span>+30s</span>
        <span style={{ color: '#475569' }}>→</span>
        <span>+40s</span>
        <span style={{ color: '#475569' }}>→</span>
        <span style={{ color: '#a855f7', fontWeight: 700 }}>FAR TERM</span>
        <span>+50s</span>
        <span style={{ color: '#475569' }}>→</span>
        <span>+60s</span>
      </div>
    </div>
  );
}
