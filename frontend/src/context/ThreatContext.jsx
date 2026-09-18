import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/api';
import liveWsService from '../services/websocket';

const ThreatContext = createContext(null);

export function ThreatProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [livePackets, setLivePackets] = useState([]);
  const [mitreData, setMitreData] = useState({ candidates: [] });
  const [exp, setExp] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wsState, setWsState] = useState('connecting');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Traffic controls
  const [iface, setIface] = useState('');
  const [pcapFile, setPcapFile] = useState(null);
  const [speed, setSpeed] = useState(1);

  // Poll refresh
  const refresh = useCallback(async () => {
    try {
      const [healthRes, statusRes, mitreRes] = await Promise.all([
        api.health(),
        api.status(),
        api.mitre(),
      ]);

      setHealth(healthRes);
      setStatus(statusRes);
      setMitreData(mitreRes);

      if (Array.isArray(statusRes?.recent_packets) && statusRes.recent_packets.length > 0) {
        setLivePackets((prev) => {
          if (prev.length === 0) {
            return statusRes.recent_packets.slice().reverse().slice(0, 150);
          }
          return prev;
        });
      }

      if (statusRes?.latest) {
        setForecast(statusRes.latest);
      }
    } catch (e) {
      setErr(e.message || 'Failed to fetch status');
    }
  }, []);

  // Run async action with busy state and auto-refresh
  const runAction = useCallback(async (actionFn) => {
    try {
      setErr('');
      setBusy(true);
      const res = await actionFn();
      await refresh();
      return res;
    } catch (e) {
      setErr(e.message || 'Action failed');
      throw e;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const startLiveCapture = useCallback(() => {
    return runAction(() => api.start(iface));
  }, [runAction, iface]);

  const stopCapture = useCallback(() => {
    return runAction(api.stop);
  }, [runAction]);

  const uploadAndReplay = useCallback(() => {
    if (!pcapFile) {
      setErr('Choose a .pcap, .pcapng, or .cap file first.');
      return;
    }
    return runAction(() => api.replayUpload(pcapFile, Number(speed)));
  }, [pcapFile, speed, runAction]);

  const runShapExplanation = useCallback(async (customHorizon, customEvals = 600) => {
    const horizon = customHorizon || forecast?.peak_risk_horizon_seconds || 10;
    try {
      setBusy(true);
      setErr('');
      const explanation = await api.shap(horizon, customEvals);
      setExp(explanation);
      return explanation;
    } catch (e) {
      setErr(e.message || 'SHAP calculation failed');
    } finally {
      setBusy(false);
    }
  }, [forecast]);

  // Initial load and periodic refresh
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  // WebSocket Subscription
  useEffect(() => {
    liveWsService.connect();

    const unsubStatus = liveWsService.on('status', (s) => setWsState(s));

    const unsubPacket = liveWsService.on('packet', (packet) => {
      setLivePackets((prev) => [packet, ...prev].slice(0, 150));
    });

    const unsubForecast = liveWsService.on('forecast', (fc) => {
      setForecast(fc);
      api.mitre().then(setMitreData).catch(() => {});
    });

    return () => {
      unsubStatus();
      unsubPacket();
      unsubForecast();
      liveWsService.disconnect();
    };
  }, []);

  const value = {
    health,
    status,
    forecast,
    livePackets,
    mitreData,
    exp,
    err,
    setErr,
    busy,
    wsState,
    activeTab,
    setActiveTab,
    iface,
    setIface,
    pcapFile,
    setPcapFile,
    speed,
    setSpeed,
    refresh,
    startLiveCapture,
    stopCapture,
    uploadAndReplay,
    runShapExplanation,
  };

  return (
    <ThreatContext.Provider value={value}>
      {children}
    </ThreatContext.Provider>
  );
}

export function useThreat() {
  const ctx = useContext(ThreatContext);
  if (!ctx) {
    throw new Error('useThreat must be used within a ThreatProvider');
  }
  return ctx;
}

export default ThreatContext;
