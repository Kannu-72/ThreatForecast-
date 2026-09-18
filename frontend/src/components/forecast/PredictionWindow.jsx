import React, { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, Cpu, Sparkles, Database, CheckCircle, AlertTriangle, Layers, Info } from 'lucide-react';
import { HORIZONS, OPERATIONAL_THRESHOLD } from '../../utils/constants';
import { useThreat } from '../../context/ThreatContext';

export default function PredictionWindow() {
  const threatContext = useThreat ? useThreat() : {};
  const { forecast, status } = threatContext || {};

  const riskScores = Array.isArray(forecast?.risk_scores) ? forecast.risk_scores : [];
  const stateCount = status?.state_count || 0;

  // Track updates for real-time temporal pulse
  const prevForecastKeyRef = useRef(null);
  const [pulseActive, setPulseActive] = useState(false);
  const [staggerIdx, setStaggerIdx] = useState(-1);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    if (!riskScores.length) return;
    const currentKey = `${forecast?.timestamp || ''}_${riskScores.join(',')}`;

    if (prevForecastKeyRef.current !== null && prevForecastKeyRef.current !== currentKey) {
      setPulseActive(true);

      // Stagger highlight through future horizons (+10s to +60s)
      let step = 0;
      const interval = setInterval(() => {
        setStaggerIdx(step);
        step += 1;
        if (step > 6) {
          clearInterval(interval);
          setTimeout(() => {
            setPulseActive(false);
            setStaggerIdx(-1);
          }, 350);
        }
      }, 100);

      prevForecastKeyRef.current = currentKey;
      return () => clearInterval(interval);
    }

    prevForecastKeyRef.current = currentKey;
  }, [forecast, riskScores]);

  const historyStates = [
    { label: '-50s', sub: 'State 1', window: 't-50 to t-40', offset: -5 },
    { label: '-40s', sub: 'State 2', window: 't-40 to t-30', offset: -4 },
    { label: '-30s', sub: 'State 3', window: 't-30 to t-20', offset: -3 },
    { label: '-20s', sub: 'State 4', window: 't-20 to t-10', offset: -2 },
    { label: '-10s', sub: 'State 5', window: 't-10 to t-0', offset: -1 },
  ];

  return (
    <div
      className="soc-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(8, 13, 27, 0.96) 0%, rgba(13, 22, 45, 0.9) 100%)',
        border: '1px solid rgba(42, 57, 88, 0.8)',
        borderRadius: '16px',
        padding: '22px 24px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes timelinePulse {
          0% { left: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes nowCoreGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.4)); }
          50% { transform: scale(1.18); opacity: 1; filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.8)); }
        }
        .temporal-card-3d {
          transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        @media (hover: hover) {
          .temporal-card-3d:hover {
            transform: translateY(-4px) scale(1.03);
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.4), 0 0 14px rgba(0, 229, 255, 0.15);
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(42, 57, 88, 0.7)',
        }}
      >
        <div className="soc-card-title-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#00e5ff',
                textTransform: 'uppercase',
              }}
            >
              ML ARCHITECTURE EXPLANATION
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 229, 255, 0.12)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                fontWeight: 700,
              }}
            >
              3D TEMPORAL PIPELINE
            </span>
          </div>
          <h3
            style={{
              margin: '3px 0 0 0',
              fontSize: '15px',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: '#f1f5f9',
            }}
          >
            Temporal Prediction Window
          </h3>
        </div>

        {/* Input Dimension Indicator HUD Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '6px',
            background: 'rgba(8, 13, 27, 0.85)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            color: '#00e5ff',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.4px',
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.1)',
          }}
        >
          <Clock size={13} />
          <span>(5, 45) INPUT → 6 HORIZONS</span>
        </div>
      </div>

      {/* Explanatory Architecture Specification */}
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#94a3b8',
          fontFamily: 'sans-serif',
        }}
      >
        ThreatForecast ingests 5 consecutive 10-second feature states (50 seconds of observed history) into a
        Temporal Transformer World Model to predict threat probability across 6 future horizons (+10s to +60s).
      </p>

      {/* Main 3D Shallow-Perspective Timeline Track */}
      <div
        style={{
          position: 'relative',
          padding: '22px 18px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0, 229, 255, 0.03), transparent 75%), rgba(5, 10, 20, 0.85)',
          borderRadius: '14px',
          border: '1px solid rgba(42, 57, 88, 0.8)',
          perspective: '1000px',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 12px 28px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Real-time Traveling Data Flow Photon Particle */}
        {pulseActive && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              width: '40px',
              height: '4px',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
              boxShadow: '0 0 12px #00e5ff',
              animation: 'timelinePulse 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              zIndex: 15,
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1.25fr) auto minmax(320px, 1.45fr)',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* 1. OBSERVED HISTORY (5 × 10s STATES) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                padding: '0 2px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#38bdf8',
                  letterSpacing: '0.8px',
                }}
              >
                OBSERVED HISTORY (5 × 10s STATES)
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                }}
              >
                50s CONTEXT
              </span>
            </div>

            {/* 5 Historical 3D State Modules */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
              }}
            >
              {historyStates.map((st, i) => {
                const depthZ = -12 + i * 2.5;
                const isSelected = selectedCard?.label === st.label;

                return (
                  <div
                    key={st.label}
                    className="temporal-card-3d"
                    onClick={() =>
                      setSelectedCard(
                        isSelected
                          ? null
                          : {
                              type: 'HISTORY',
                              title: `${st.sub} (${st.label})`,
                              timeRange: st.window,
                              features: '45 Aggregated Features',
                              status: 'Observed & Synced',
                            }
                      )
                    }
                    style={{
                      borderRadius: '10px',
                      padding: '12px 6px',
                      textAlign: 'center',
                      background: isSelected
                        ? 'linear-gradient(180deg, rgba(14, 38, 70, 0.95) 0%, rgba(9, 20, 42, 0.95) 100%)'
                        : 'linear-gradient(180deg, rgba(14, 26, 52, 0.85) 0%, rgba(8, 16, 34, 0.85) 100%)',
                      border: isSelected
                        ? '1px solid #00e5ff'
                        : '1px solid rgba(56, 189, 248, 0.3)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)',
                      transform: `translateZ(${depthZ}px)`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#f8fafc',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {st.label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: '#38bdf8',
                        marginTop: '3px',
                        fontWeight: 600,
                      }}
                    >
                      {st.sub}
                    </div>
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#00e5ff',
                        margin: '6px auto 0 auto',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CENTRAL NOW ANCHOR & TRANSFORMER INFERENCE BOUNDARY */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0 4px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Top Temporal Axis Line */}
            <div
              style={{
                width: '2px',
                height: '24px',
                background: 'linear-gradient(180deg, transparent, #f59e0b)',
              }}
            />

            {/* Central 3D NOW Temporal Anchor */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(245, 158, 11, 0.55)',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                transform: 'translateZ(18px)',
              }}
            >
              {/* Pulsing Core Pearl */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#fbbf24',
                  boxShadow: '0 0 10px #fbbf24',
                  animation: 'nowCoreGlow 2.5s infinite ease-in-out',
                }}
              />

              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#fbbf24',
                  letterSpacing: '1px',
                }}
              >
                NOW
              </span>

              <span
                style={{
                  fontSize: '8px',
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                TRANSFORMER
              </span>
            </div>

            {/* Bottom Temporal Axis Line */}
            <div
              style={{
                width: '2px',
                height: '24px',
                background: 'linear-gradient(180deg, #f59e0b, transparent)',
              }}
            />
          </div>

          {/* 3. PREDICTED FUTURE (TRANSFORMER HORIZONS) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                padding: '0 2px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#c084fc',
                  letterSpacing: '0.8px',
                }}
              >
                PREDICTED FUTURE (TRANSFORMER HORIZONS)
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                }}
              >
                6 DIRECT HEADS
              </span>
            </div>

            {/* 6 Projected 3D Future Horizon Modules */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px',
              }}
            >
              {HORIZONS.map((h, i) => {
                const score = riskScores[i];
                const isOver = score !== undefined && score >= OPERATIONAL_THRESHOLD;
                const isStaggerActive = staggerIdx === i;
                const isSelected = selectedCard?.horizon === `+${h}s`;

                return (
                  <div
                    key={h}
                    className="temporal-card-3d"
                    onClick={() =>
                      setSelectedCard(
                        isSelected
                          ? null
                          : {
                              type: 'HORIZON',
                              horizon: `+${h}s`,
                              title: `Horizon H${h / 10} (+${h}s)`,
                              probability: score !== undefined ? `${(score * 100).toFixed(2)}% (${score.toFixed(4)})` : 'Calculating...',
                              status: isOver ? 'Elevated Threat' : 'Nominal Probability',
                            }
                      )
                    }
                    style={{
                      borderRadius: '10px',
                      padding: '10px 4px',
                      textAlign: 'center',
                      background: isSelected
                        ? 'linear-gradient(180deg, rgba(40, 20, 60, 0.95) 0%, rgba(20, 10, 36, 0.95) 100%)'
                        : isStaggerActive
                          ? 'linear-gradient(180deg, rgba(60, 30, 90, 0.95) 0%, rgba(26, 14, 46, 0.95) 100%)'
                          : isOver
                            ? 'linear-gradient(180deg, rgba(40, 15, 25, 0.9) 0%, rgba(20, 10, 18, 0.9) 100%)'
                            : 'linear-gradient(180deg, rgba(20, 18, 44, 0.85) 0%, rgba(12, 10, 28, 0.85) 100%)',
                      border: isSelected
                        ? '1px solid #c084fc'
                        : isStaggerActive
                          ? '1px solid #00e5ff'
                          : isOver
                            ? '1px solid rgba(244, 63, 94, 0.4)'
                            : '1px solid rgba(192, 132, 252, 0.3)',
                      boxShadow: isStaggerActive
                        ? '0 0 14px rgba(0, 229, 255, 0.4)'
                        : '0 6px 16px rgba(0, 0, 0, 0.35)',
                      transform: `translateZ(${10 - i * 1.5}px)`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isOver ? '#f43f5e' : '#f8fafc',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      +{h}s
                    </div>

                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: '#c084fc',
                        marginTop: '2px',
                        fontWeight: 600,
                      }}
                    >
                      H{h / 10}
                    </div>

                    {/* Real Forecast Probability Output */}
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: score !== undefined ? (isOver ? '#f43f5e' : '#f1f5f9') : '#64748b',
                        marginTop: '4px',
                      }}
                    >
                      {score !== undefined ? `${(score * 100).toFixed(1)}%` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Card Details Overlay HUD */}
      {selectedCard && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(8, 13, 27, 0.95)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#00e5ff', fontWeight: 800 }}>TEMPORAL INSPECTOR:</span>
            <strong style={{ color: '#f1f5f9' }}>{selectedCard.title}</strong>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ color: '#94a3b8' }}>
              {selectedCard.timeRange || `Predicted Risk: ${selectedCard.probability}`}
            </span>
          </div>

          <button
            onClick={() => setSelectedCard(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            [CLOSE]
          </button>
        </div>
      )}
    </div>
  );
}
