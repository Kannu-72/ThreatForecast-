import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { Cpu, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

export default function ExplainabilityPanel() {
  const { exp, forecast, status, busy, runShapExplanation } = useThreat();

  const peakHorizon = forecast?.peak_risk_horizon_seconds || 10;
  const readyForShap = status?.ready_for_forecast && forecast !== null;

  const features = exp?.feature_contributions || [];
  const temporal = exp?.temporal_contributions || [];

  const positiveDrivers = features.filter((f) => f.shap_value > 0).slice(0, 8);
  const negativeDrivers = features.filter((f) => f.shap_value < 0).slice(0, 8);

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="soc-card-header" style={{ marginBottom: 0 }}>
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">AI EXPLAINABILITY</span>
          <h3 className="soc-card-title">Why This Forecast? (Kernel SHAP Attribution)</h3>
        </div>

        <button
          className="soc-btn"
          disabled={!readyForShap || busy}
          onClick={() => runShapExplanation()}
        >
          <Sparkles size={14} />
          <span>{busy ? 'Evaluating SHAP...' : `Explain Peak Horizon (+${peakHorizon}s)`}</span>
        </button>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        SHAP (SHapley Additive exPlanations) identifies exact feature and temporal contributions driving the
        Transformer model's risk output. Positive values increase threat risk; negative values suppress threat risk.
      </p>

      {!exp ? (
        <div
          style={{
            padding: '48px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            borderRadius: '8px',
            background: 'rgba(5, 10, 18, 0.5)',
            border: '1px dashed var(--border-glass)',
          }}
        >
          {readyForShap
            ? 'Click "Explain Peak Horizon" above to compute SHAP attributions for the current state.'
            : 'SHAP requires at least 5 complete 10-second states before feature attribution can be computed.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(85, 214, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(85, 214, 255, 0.15)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
              Explaining Forecast for Horizon +{exp.horizon_seconds}s
            </span>
            <span className="mono" style={{ fontSize: '13px', color: '#fff' }}>
              Base Risk: <b>{Number(exp.risk_score).toFixed(5)}</b>
            </span>
          </div>

          {/* Feature Drivers Grid */}
          <div className="grid-cols-2">
            {/* Positive Contributors */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(5, 10, 18, 0.6)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ArrowUpRight size={16} color="var(--threat)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--threat)' }}>
                  INCREASING THREAT PROBABILITY
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {positiveDrivers.map((item) => (
                  <div key={item.feature} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span className="mono" style={{ color: 'var(--text-main)' }}>{item.feature}</span>
                      <span className="mono" style={{ color: 'var(--threat)', fontWeight: 700 }}>
                        +{Number(item.shap_value).toFixed(5)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)' }}>
                      <div
                        style={{
                          width: `${Math.min(100, item.abs_shap * 1000)}%`,
                          height: '100%',
                          background: 'var(--threat)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Contributors */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(5, 10, 18, 0.6)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ArrowDownRight size={16} color="var(--safe)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--safe)' }}>
                  REDUCING THREAT PROBABILITY (NORMALIZING)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {negativeDrivers.map((item) => (
                  <div key={item.feature} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span className="mono" style={{ color: 'var(--text-main)' }}>{item.feature}</span>
                      <span className="mono" style={{ color: 'var(--safe)', fontWeight: 700 }}>
                        {Number(item.shap_value).toFixed(5)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)' }}>
                      <div
                        style={{
                          width: `${Math.min(100, item.abs_shap * 1000)}%`,
                          height: '100%',
                          background: 'var(--safe)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Temporal Attribution */}
          {temporal.length > 0 && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(5, 10, 18, 0.6)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '12px' }}>
                TEMPORAL STATE ATTRIBUTIONS (-50s TO -10s)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {temporal.map((t) => (
                  <div
                    key={t.relative_time}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      textAlign: 'center',
                    }}
                  >
                    <div className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                      {t.relative_time}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: t.shap_sum >= 0 ? 'var(--threat)' : 'var(--safe)',
                        marginTop: '4px',
                      }}
                    >
                      {t.shap_sum >= 0 ? '+' : ''}{Number(t.shap_sum).toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
