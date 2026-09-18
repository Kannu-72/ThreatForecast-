import React from 'react';
import RuntimeControls from '../components/system/RuntimeControls';
import TelemetryStream from '../components/network/TelemetryStream';
import PipelineStatus from '../components/network/PipelineStatus';

export default function LiveMonitor() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: 'auto' }}>
      {/* Central Source & Replay Controls */}
      <RuntimeControls />
      
      {/* Pipeline Status Flow Strip */}
      <PipelineStatus />



      {/* Full Live Telemetry Terminal */}
      <div style={{ width: '100%', height: 'auto' }}>
        <TelemetryStream maxDisplay={150} showControls={true} />
      </div>
    </div>
  );
}
