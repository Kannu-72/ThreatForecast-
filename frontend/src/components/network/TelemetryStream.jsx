import React, { useState } from 'react';
import { useThreat } from '../../context/ThreatContext';
import { formatTimestamp, formatBytes } from '../../utils/formatters';
import { Search, Pause, Play, Shield } from 'lucide-react';

export default function TelemetryStream({ maxDisplay = 100, showControls = true }) {
  const { livePackets } = useThreat();
  const [filterText, setFilterText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [frozenPackets, setFrozenPackets] = useState([]);

  const togglePause = () => {
    if (!isPaused) {
      setFrozenPackets([...livePackets]);
    }
    setIsPaused(!isPaused);
  };

  const displayedList = isPaused ? frozenPackets : livePackets;

  const filtered = displayedList.filter((p) => {
    if (!filterText) return true;
    const term = filterText.toLowerCase();
    return (
      (p.source && p.source.toLowerCase().includes(term)) ||
      (p.destination && p.destination.toLowerCase().includes(term)) ||
      (p.protocol && p.protocol.toLowerCase().includes(term)) ||
      (p.tcp_flags && p.tcp_flags.toLowerCase().includes(term))
    );
  }).slice(0, maxDisplay);

  const getProtocolColor = (proto) => {
    switch (proto?.toUpperCase()) {
      case 'TCP': return '#55D6FF';
      case 'UDP': return '#7C8CFF';
      case 'ICMP': return '#FFB454';
      default: return '#9AAEC7';
    }
  };

  return (
    <div className="soc-card" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: 'fit-content' }}>
      <div className="soc-card-header">
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">LIVE TELEMETRY STREAM</span>
          <h3 className="soc-card-title">Real-Time Packet Ingestion Console</h3>
        </div>

        {showControls && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search Filter */}
            <div style={{ position: 'relative', width: '200px' }}>
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '10px', top: '9px' }}
              />
              <input
                className="soc-input mono"
                style={{ width: '100%', paddingLeft: '30px', fontSize: '11px', height: '32px' }}
                placeholder="Filter IP, port, proto..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>

            {/* Pause / Resume Button */}
            <button
              className={`soc-btn ${isPaused ? 'danger' : 'secondary'}`}
              style={{ height: '32px', fontSize: '11px', padding: '0 12px' }}
              onClick={togglePause}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              <span>{isPaused ? 'Resume Stream' : 'Freeze Stream'}</span>
            </button>

            {/* Packet Counter */}
            <span
              className="mono"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(85, 214, 255, 0.1)',
                color: 'var(--primary)',
                border: '1px solid rgba(85, 214, 255, 0.25)',
              }}
            >
              {livePackets.length} BUFFERED
            </span>
          </div>
        )}
      </div>

      {/* Terminal Table */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '440px',
          borderRadius: '8px',
          background: 'rgba(5, 10, 18, 0.7)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <table
          className="mono"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: '#0e1422',
                borderBottom: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
              }}
            >
              <th style={{ padding: '8px 12px' }}>#</th>
              <th style={{ padding: '8px 12px' }}>TIMESTAMP</th>
              <th style={{ padding: '8px 12px' }}>SOURCE</th>
              <th style={{ padding: '8px 12px' }}>DESTINATION</th>
              <th style={{ padding: '8px 12px' }}>PROTO</th>
              <th style={{ padding: '8px 12px' }}>LENGTH</th>
              <th style={{ padding: '8px 12px' }}>FLAGS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '48px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  No live packets captured yet. Start live monitoring or upload a PCAP replay file.
                </td>
              </tr>
            ) : (
              filtered.map((pkt) => (
                <tr
                  key={`${pkt.packet_id}-${pkt.timestamp}`}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '7px 12px', color: 'var(--secondary)' }}>
                    {String(pkt.packet_id || '—').padStart(8, '0')}
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatTimestamp(pkt.timestamp)}
                  </td>
                  <td style={{ padding: '7px 12px', color: '#fff', whiteSpace: 'nowrap' }}>
                    {pkt.source || '-'}
                  </td>
                  <td style={{ padding: '7px 12px', color: '#fff', whiteSpace: 'nowrap' }}>
                    {pkt.destination || '-'}
                  </td>
                  <td style={{ padding: '7px 12px', color: getProtocolColor(pkt.protocol), fontWeight: 700 }}>
                    {pkt.protocol || 'OTHER'}
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>
                    {Number(pkt.packet_length || 0).toLocaleString()} B
                  </td>
                  <td
                    style={{
                      padding: '7px 12px',
                      color: pkt.tcp_flags ? 'var(--warning)' : 'var(--text-muted)',
                    }}
                  >
                    {pkt.tcp_flags || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
