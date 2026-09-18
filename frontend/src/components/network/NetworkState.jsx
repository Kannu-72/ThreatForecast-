import React from 'react';
import { useThreat } from '../../context/ThreatContext';
import { Network, Activity, Layers, Hash } from 'lucide-react';

export default function NetworkState() {
  const { forecast, status } = useThreat();

  const latestState = forecast?.latest_state;
  const features = latestState?.features || [];
  const currentPackets = latestState?.packet_count ?? 0;
  const pps = currentPackets > 0 ? (currentPackets / 10).toFixed(1) : '0';

  const metrics = [
    { label: 'State Packets', val: currentPackets.toLocaleString(), sub: `${pps} pkts/sec` },
    { label: 'States Observed', val: status?.state_count ?? 0, sub: '10s intervals' },
    { label: 'Source IPs', val: features[8] != null ? features[8] : '—', sub: 'Unique endpoints' },
    { label: 'Dest IPs', val: features[9] != null ? features[9] : '—', sub: 'Unique targets' },
    { label: 'Flow Pairs', val: features[10] != null ? features[10] : '—', sub: 'Conversation pairs' },
    { label: 'TCP Ratio', val: features[15] != null ? Number(features[15]).toFixed(3) : '—', sub: 'Traffic share' },
    { label: 'SYN Ratio', val: features[19] != null ? Number(features[19]).toFixed(3) : '—', sub: 'Conn attempts' },
    { label: 'RST Ratio', val: features[24] != null ? Number(features[24]).toFixed(3) : '—', sub: 'Aborted flows' },
    { label: 'IP Entropy', val: features[34] != null ? Number(features[34]).toFixed(3) : '—', sub: 'Dispersion metric' },
    { label: 'Port Entropy', val: features[35] != null ? Number(features[35]).toFixed(3) : '—', sub: 'Scan concentration' },
    { label: 'IAT Burstiness', val: features[40] != null ? Number(features[40]).toFixed(3) : '—', sub: 'Arrival variance' },
    { label: 'Active Duration', val: features[39] != null ? `${Number(features[39]).toFixed(1)}s` : '—', sub: 'Window occupancy' },
  ];

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="soc-card-header" style={{ marginBottom: 0 }}>
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">NETWORK STATE ENGINE</span>
          <h3 className="soc-card-title">Latest 10-Second Traffic Features</h3>
        </div>
        <div className="status-badge cyan">
          <Layers size={12} />
          <span>WINDOW: 10s · 45 METRICS</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(5, 10, 18, 0.55)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.label}</div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '4px 0 2px' }}>
              {m.val}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
