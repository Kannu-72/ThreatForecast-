import React from 'react';
import ExplainabilityPanel from '../components/intelligence/ExplainabilityPanel';

export default function ExplainPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ExplainabilityPanel />
    </div>
  );
}
