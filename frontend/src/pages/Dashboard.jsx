import React from 'react';
import ThreatEnvironment from '../components/threat/ThreatEnvironment';
import RiskGauge from '../components/threat/RiskGauge';
import ThreatStatus from '../components/threat/ThreatStatus';
import NetworkMetrics from '../components/network/NetworkMetrics';
import ForecastTimeline from '../components/forecast/ForecastTimeline';
import PipelineStatus from '../components/system/PipelineStatus';
import TelemetryStream from '../components/network/TelemetryStream';
import { useThreat } from '../context/ThreatContext';
import { ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { setActiveTab } = useThreat();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero 3D Constellation + Risk Gauge */}
      <div className="grid-hero">
        <ThreatEnvironment />
        <RiskGauge />
      </div>

      {/* KPI Cards */}
      <NetworkMetrics />

      {/* Threat Assessment & Predictive Trajectory */}
      <div className="grid-cols-2">
        <ThreatStatus />
        <ForecastTimeline height={230} />
      </div>

      {/* Pipeline Status Flow Strip */}
      <PipelineStatus />

      {/* Quick Telemetry Stream Snippet */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="soc-eyebrow">RECENT TELEMETRY PREVIEW</span>
          <button
            className="soc-btn secondary"
            style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
            onClick={() => setActiveTab('live')}
          >
            <span>Open Full Live Monitor</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
        <TelemetryStream maxDisplay={6} showControls={false} />
      </div>
    </div>
  );
}
