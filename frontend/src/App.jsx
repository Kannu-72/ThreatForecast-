import React from 'react';
import { ThreatProvider, useThreat } from './context/ThreatContext';
import AppShell from './components/layout/AppShell';

import Dashboard from './pages/Dashboard';
import LiveMonitor from './pages/LiveMonitor';
import NetworkStatePage from './pages/NetworkStatePage';
import ForecastPage from './pages/ForecastPage';
import MitrePage from './pages/MitrePage';
import ExplainPage from './pages/ExplainPage';

function WorkspaceRouter() {
  const { activeTab } = useThreat();

  switch (activeTab) {
    case 'live':
      return <LiveMonitor />;
    case 'network':
      return <NetworkStatePage />;
    case 'forecast':
      return <ForecastPage />;
    case 'mitre':
      return <MitrePage />;
    case 'explain':
      return <ExplainPage />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <ThreatProvider>
      <AppShell>
        <WorkspaceRouter />
      </AppShell>
    </ThreatProvider>
  );
}