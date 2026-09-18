import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { Activity, ShieldAlert, Radio, TrendingUp } from 'lucide-react';

export default function NetworkMetrics() {
  const { forecast, status, mitreData } = useThreat();

  const peakRisk = forecast?.peak_risk ?? null;
  const isWarning = Boolean(forecast?.warning);
  const primaryAttack = mitreData?.candidates?.[0] || null;

  const currentPackets = forecast?.latest_state?.packet_count ?? 0;
  const pps = currentPackets > 0 ? (currentPackets / 10).toFixed(1) : '0';

  const meanRisk = forecast?.risk_scores
    ? (forecast.risk_scores.reduce((a, b) => a + b, 0) / forecast.risk_scores.length).toFixed(4)
    : '—';

  const cards = [
    {
      title: 'Current Peak Risk',
      value: peakRisk != null ? (peakRisk * 100).toFixed(1) + '%' : '—',
      sub: forecast ? `+${forecast.peak_risk_horizon_seconds}s Horizon` : 'Standby',
      color: isWarning ? 'var(--threat)' : 'var(--safe)',
      icon: TrendingUp,
    },
    {
      title: 'Suspected Attack',
      value: primaryAttack ? primaryAttack.attack_type : 'None Detected',
      sub: primaryAttack ? `${primaryAttack.severity} Severity` : 'Heuristic Context',
      color: primaryAttack ? 'var(--warning)' : 'var(--text-main)',
      icon: ShieldAlert,
    },
    {
      title: 'Latest Throughput',
      value: currentPackets.toLocaleString(),
      sub: `${pps} pkts/sec (10s window)`,
      color: 'var(--primary)',
      icon: Radio,
    },
    {
      title: '6-Horizon Mean Risk',
      value: meanRisk,
      sub: `${forecast ? forecast.risk_scores.filter((r) => r >= 0.05).length : 0} / 6 above threshold`,
      color: 'var(--secondary)',
      icon: Activity,
    },
  ];

  return (
    <div className="grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.title} className="soc-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {c.title}
              </span>
              <Icon size={16} color={c.color} />
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: c.color, margin: '8px 0 2px' }}>
              {c.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
