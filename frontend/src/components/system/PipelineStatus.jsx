import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

export default function PipelineStatus() {
  const { status, forecast } = useThreat();

  const isCapturing = status?.mode === 'live' || status?.mode === 'replay';
  const hasStates = (status?.state_count || 0) > 0;
  const historyReady = Boolean(status?.ready_for_forecast);
  const transformerPredicting = forecast !== null;

  const steps = [
    { label: 'Packet Ingestion', active: isCapturing, desc: isCapturing ? status.mode.toUpperCase() : 'STANDBY' },
    { label: '10s State Engine', active: hasStates, desc: `${status?.state_count || 0} States` },
    { label: '45-Feature Extraction', active: hasStates, desc: 'Feature Contract' },
    { label: '5-State History Buffer', active: historyReady, desc: historyReady ? '50s Window Ready' : 'Buffering' },
    { label: 'Transformer World Model', active: transformerPredicting, desc: transformerPredicting ? 'Forecasting 6H' : 'Standby' },
  ];

  return (
    <div className="soc-card" style={{ padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step.active ? 'var(--primary-dim)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${step.active ? 'rgba(85, 214, 255, 0.4)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step.active ? (
                  <CheckCircle2 size={14} color="var(--primary)" />
                ) : (
                  <Circle size={10} color="var(--text-dim)" />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: step.active ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {step.label}
                </div>
                <div className="mono" style={{ fontSize: '10px', color: step.active ? 'var(--primary)' : 'var(--text-dim)' }}>
                  {step.desc}
                </div>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <ArrowRight size={14} color="var(--border-glass)" style={{ flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
