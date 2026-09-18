import React from 'react';
import { Radio, Layers, Database, HardDrive, Cpu, ArrowRight, ArrowDown, Box } from 'lucide-react';
import { useThreat } from '../../context/ThreatContext';

export default function PipelineStatus() {
  const threatContext = useThreat ? useThreat() : {};
  const { status, health, forecast } = threatContext || {};

  const isCapturing = status?.mode === 'live' || status?.mode === 'replay';
  const stateCount = status?.state_count || 0;
  const hasStates = stateCount > 0;
  const isHistoryReady = Boolean(status?.ready_for_forecast || stateCount >= 5);
  const isModelReady = Boolean(health?.model_loaded || status?.model_loaded);
  const hasForecast = forecast !== null;

  const stages = [
    {
      id: 'capture',
      stageNum: 'STAGE 01',
      subtitle: 'PACKET CAPTURE',
      title: 'Packet Ingestion',
      descriptor: 'LIVE STREAM',
      icon: Radio,
      active: isCapturing,
      stateBadge: isCapturing ? (status?.mode === 'live' ? 'LIVE' : 'REPLAY') : 'IDLE',
      badgeColor: isCapturing
        ? { bg: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: 'rgba(0, 229, 255, 0.4)', shadow: '0 0 12px rgba(0, 229, 255, 0.25)' }
        : { bg: 'rgba(15, 23, 42, 0.8)', color: '#64748b', border: 'rgba(51, 65, 85, 0.6)' },
      metric: `${(status?.packet_counter ?? status?.packet_count) || 0} pkts`,
    },
    {
      id: 'window',
      stageNum: 'STAGE 02',
      subtitle: '10s STATE',
      title: '10s State Engine',
      descriptor: 'STATE BIN',
      icon: Layers,
      active: hasStates,
      stateBadge: `${stateCount} States`,
      badgeColor: hasStates
        ? { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)', shadow: '0 0 12px rgba(59, 130, 246, 0.25)' }
        : isCapturing
          ? { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' }
          : { bg: 'rgba(15, 23, 42, 0.8)', color: '#64748b', border: 'rgba(51, 65, 85, 0.6)' },
      metric: `${stateCount} windows`,
    },
    {
      id: 'features',
      stageNum: 'STAGE 03',
      subtitle: '45 FEATURES',
      title: '45-Feature Extraction',
      descriptor: 'FEATURE VECTOR',
      icon: Database,
      active: hasStates,
      stateBadge: 'Feature Contract',
      badgeColor: hasStates
        ? { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.4)', shadow: '0 0 12px rgba(99, 102, 241, 0.25)' }
        : { bg: 'rgba(15, 23, 42, 0.8)', color: '#64748b', border: 'rgba(51, 65, 85, 0.6)' },
      metric: '45-D VECTOR',
    },
    {
      id: 'history',
      stageNum: 'STAGE 04',
      subtitle: '5-STATE HISTORY',
      title: '5-State History Buffer',
      descriptor: 'TEMPORAL',
      icon: HardDrive,
      active: isHistoryReady,
      stateBadge: isHistoryReady ? '50s Window Ready' : 'Buffering',
      badgeColor: isHistoryReady
        ? { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)', shadow: '0 0 12px rgba(16, 185, 129, 0.25)' }
        : hasStates
          ? { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' }
          : { bg: 'rgba(15, 23, 42, 0.8)', color: '#64748b', border: 'rgba(51, 65, 85, 0.6)' },
      metric: '50s CONTEXT',
    },
    {
      id: 'transformer',
      stageNum: 'STAGE 05',
      subtitle: 'TRANSFORMER',
      title: 'Transformer World Model',
      descriptor: 'ATTENTION INFERENCE',
      icon: Cpu,
      active: isModelReady && (hasForecast || isCapturing),
      stateBadge: 'Forecasting 6H',
      badgeColor: isModelReady
        ? { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.4)', shadow: '0 0 12px rgba(168, 85, 247, 0.25)' }
        : { bg: 'rgba(15, 23, 42, 0.8)', color: '#64748b', border: 'rgba(51, 65, 85, 0.6)' },
      metric: '+10s–+60s',
    },
  ];

  const horizons = ['+10s', '+20s', '+30s', '+40s', '+50s', '+60s'];

  return (
    <div
      className="soc-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(8, 13, 27, 0.95) 0%, rgba(13, 22, 45, 0.85) 100%)',
        border: '1px solid rgba(42, 57, 88, 0.8)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
      }}
    >
      <style>{`
        @keyframes photonBeam {
          0% { transform: translateX(-100%); opacity: 0; }
          40% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes cyberPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 6px #00e5ff); }
        }
        .pipeline-card-3d {
          transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .pipeline-card-3d:hover {
          transform: translateY(-4px) rotateX(-2deg) rotateY(2deg);
        }
      `}</style>

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(42, 57, 88, 0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isCapturing ? '#00e5ff' : '#475569',
              boxShadow: isCapturing ? '0 0 10px #00e5ff' : 'none',
              animation: isCapturing ? 'cyberPulse 2s infinite ease-in-out' : 'none',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                }}
              >
                END-TO-END TEMPORAL FORECASTING PIPELINE
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: '#00e5ff',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                }}
              >
                <Box size={10} /> 3D PIPELINE
              </span>
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>
              Real-time Ingress Stream → 10s Windowing → 45-Feature Vectors → 5-State Attention Memory
            </div>
          </div>
        </div>

        {/* Pipeline Breadcrumb Flow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            background: 'rgba(8, 13, 27, 0.8)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(42, 57, 88, 0.8)',
          }}
        >
          <span style={{ color: '#00e5ff', fontWeight: 700 }}>STREAM</span>
          <span style={{ color: '#475569' }}>→</span>
          <span style={{ color: '#cbd5e1' }}>10s BINS</span>
          <span style={{ color: '#475569' }}>→</span>
          <span style={{ color: '#cbd5e1' }}>45 FEATURES</span>
          <span style={{ color: '#475569' }}>→</span>
          <span style={{ color: '#cbd5e1' }}>5 STATES</span>
          <span style={{ color: '#475569' }}>→</span>
          <span style={{ color: '#c084fc', fontWeight: 700 }}>ATTENTION INFERENCE</span>
        </div>
      </div>

      {/* 5-Stage 3D Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          perspective: '1200px',
        }}
      >
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className="pipeline-card-3d"
              style={{
                position: 'relative',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: stage.active
                  ? 'linear-gradient(180deg, rgba(17, 26, 50, 0.95) 0%, rgba(10, 16, 35, 0.95) 100%)'
                  : 'rgba(10, 16, 32, 0.65)',
                border: stage.active
                  ? '1px solid rgba(0, 229, 255, 0.35)'
                  : '1px solid rgba(42, 57, 88, 0.6)',
                boxShadow: stage.active
                  ? '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 229, 255, 0.08)'
                  : '0 6px 16px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              {/* Laser Top Illumination */}
              {stage.active && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
                    boxShadow: '0 0 8px #00e5ff',
                  }}
                />
              )}

              {/* Stage Top Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: stage.active ? 'rgba(0, 229, 255, 0.12)' : 'rgba(15, 23, 42, 0.8)',
                      border: stage.active ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(42, 57, 88, 0.6)',
                      color: stage.active ? '#00e5ff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        color: stage.active ? '#00e5ff' : '#64748b',
                      }}
                    >
                      {stage.stageNum}
                    </div>
                    <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#475569', textTransform: 'uppercase' }}>
                      {stage.subtitle}
                    </div>
                  </div>
                </div>

                {/* Primary Title */}
                <h4
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: '#f1f5f9',
                    textTransform: 'uppercase',
                  }}
                >
                  {stage.title}
                </h4>

                {/* Technical Descriptor */}
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#475569' }} />
                  {stage.descriptor}
                </div>
              </div>

              {/* Status Badge & Metric Footer */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(42, 57, 88, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                }}
              >
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: stage.badgeColor.bg,
                    color: stage.badgeColor.color,
                    border: `1px solid ${stage.badgeColor.border}`,
                    boxShadow: stage.badgeColor.shadow || 'none',
                    letterSpacing: '0.4px',
                  }}
                >
                  {stage.stateBadge}
                </span>

                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{stage.metric}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3D Animated Cyber Conduits Between Stages */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '10px',
          padding: '0 4px',
        }}
      >
        {stages.map((stage, idx) => {
          if (idx === stages.length - 1) return <div key={stage.id} />;
          return (
            <div
              key={`conduit-${stage.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '120px',
                  height: '18px',
                  borderRadius: '999px',
                  background: 'rgba(8, 13, 27, 0.9)',
                  border: '1px solid rgba(42, 57, 88, 0.8)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {/* Conduit Track Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '8px',
                    right: '8px',
                    height: '2px',
                    background: 'rgba(42, 57, 88, 0.8)',
                  }}
                />

                {/* Traveling Photon Beam */}
                {stage.active && isCapturing && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '24px',
                      height: '4px',
                      borderRadius: '4px',
                      background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
                      boxShadow: '0 0 8px #00e5ff',
                      animation: 'photonBeam 1.8s infinite ease-in-out',
                      animationDelay: `${idx * 0.3}s`,
                    }}
                  />
                )}

                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569', zIndex: 1 }} />
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569', zIndex: 1 }} />
                <ArrowRight size={12} color={stage.active && isCapturing ? '#00e5ff' : '#475569'} style={{ zIndex: 1 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Architectural Footer */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(42, 57, 88, 0.7)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#94a3b8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
            5 historical states × 10 seconds = 50-second temporal context
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <span>Transformer attention → six direct forecast horizons:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {horizons.map((h) => (
              <span
                key={h}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(8, 13, 27, 0.9)',
                  border: '1px solid rgba(42, 57, 88, 0.9)',
                  color: '#00e5ff',
                  fontWeight: 800,
                  fontSize: '10px',
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
