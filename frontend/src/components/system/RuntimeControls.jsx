import React, { useState } from 'react';
import { useThreat } from '../../context/ThreatContext';
import {
  Play,
  Square,
  Upload,
  Radio,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Loader2,
  ArrowRight,
  Database
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export default function RuntimeControls() {
  const {
    iface,
    setIface,
    pcapFile,
    setPcapFile,
    speed,
    setSpeed,
    busy,
    status,
    startLiveCapture,
    stopCapture,
    uploadAndReplay,
    err,
  } = useThreat();

  const isLive = status?.mode === 'live';
  const isReplay = status?.mode === 'replay';
  const isRunning = isLive || isReplay;

  const speedPresets = [1, 2, 5, 10];

  // Upload & processing states driven by REAL asynchronous requests
  const [uploadPhase, setUploadPhase] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError] = useState(null);

  const handleReplayClick = async () => {
    if (!pcapFile || busy || isRunning) return;
    setUploadPhase('uploading');
    setUploadError(null);

    try {
      await uploadAndReplay();
      // REAL request succeeded and backend started replay
      setUploadPhase('success');
      setTimeout(() => {
        setUploadPhase('idle');
      }, 1800);
    } catch (e) {
      setUploadPhase('error');
      setUploadError(e?.message || err || 'PCAP replay request failed');
    }
  };

  const getFileExtension = (name) => {
    if (!name) return 'PCAP';
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PCAP';
  };

  return (
    <div
      className="soc-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: 'auto',
        minHeight: 'fit-content',
        overflow: 'visible',
      }}
    >
      {/* Scoped CSS animations for PCAP upload & data flow */}
      <style>{`
        @keyframes pcapPulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes pcapBeamFlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes pcapIndeterminateMove {
          0% { left: -30%; width: 25%; }
          50% { left: 35%; width: 45%; }
          100% { left: 105%; width: 25%; }
        }
        .pcap-beam-particle {
          animation: pcapBeamFlow 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pcap-indeterminate-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent);
          border-radius: 3px;
          animation: pcapIndeterminateMove 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .pcap-beam-particle,
          .pcap-indeterminate-bar {
            animation: none !important;
          }
        }
      `}</style>

      {/* Header with Title & Live Backend Status */}
      <div className="soc-card-header" style={{ marginBottom: 0, alignItems: 'flex-start' }}>
        <div className="soc-card-title-group">
          <span className="soc-eyebrow">TRAFFIC SOURCE CONTROL</span>
          <h3 className="soc-card-title">Network Ingestion Engine</h3>
          <span className="soc-card-subtitle">
            Ingest live packets from a local network interface or replay recorded PCAP / PCAPNG traces
          </span>
        </div>

        {/* Status Indicator */}
        <div className={`status-badge ${isRunning ? 'cyan' : ''}`} style={{ flexShrink: 0 }}>
          <Radio size={13} />
          <span>
            {isLive
              ? 'ACTIVE (LIVE MONITORING)'
              : isReplay
              ? 'ACTIVE (PCAP REPLAY)'
              : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Two-Column Option Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        {/* =========================================================================
            OPTION A: LIVE INTERFACE MONITORING
           ========================================================================= */}
        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            background: 'rgba(5, 10, 18, 0.75)',
            border: isLive
              ? '1px solid rgba(85, 214, 255, 0.4)'
              : '1px solid rgba(85, 214, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
            boxShadow: isLive ? '0 0 20px rgba(85, 214, 255, 0.08)' : 'none',
          }}
        >
          {/* Option A Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'rgba(85, 214, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Radio size={15} color="var(--primary)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--primary)' }}>
                OPTION A &middot; LIVE INTERFACE
              </span>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              Live Interface Monitoring
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Capture packets directly from an available network adapter via Scapy socket.
            </p>
          </div>

          {/* Option A Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Network Interface
            </label>
            <input
              className="soc-input mono"
              style={{ width: '100%', fontSize: '12px', padding: '10px 14px' }}
              placeholder="Wi-Fi, Ethernet, eth0 (leave blank for default)"
              value={iface}
              onChange={(e) => setIface(e.target.value)}
              disabled={busy || isRunning}
            />
          </div>

          {/* Option A Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            {isRunning && isLive ? (
              <button
                className="soc-btn danger"
                style={{ width: '100%', padding: '10px 16px', fontSize: '13px' }}
                disabled={busy}
                onClick={stopCapture}
              >
                <Square size={15} />
                <span>Stop Monitoring</span>
              </button>
            ) : (
              <button
                className="soc-btn"
                style={{ width: '100%', padding: '10px 16px', fontSize: '13px' }}
                disabled={busy || isRunning}
                onClick={startLiveCapture}
              >
                <Play size={15} />
                <span>Start Monitoring</span>
              </button>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isLive ? (
                <>
                  <span className="status-dot" style={{ background: 'var(--primary)', width: '6px', height: '6px' }} />
                  <span style={{ color: 'var(--primary)' }}>
                    Streaming packets from interface: {status?.interface || 'default adapter'}
                  </span>
                </>
              ) : (
                <span>Leaves blank to auto-detect the default network adapter.</span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            OPTION B: PCAP / PCAPNG UPLOAD & REPLAY
           ========================================================================= */}
        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            background: 'rgba(5, 10, 18, 0.75)',
            border: isReplay
              ? '1px solid rgba(124, 140, 255, 0.45)'
              : uploadPhase === 'uploading'
              ? '1px solid rgba(56, 189, 248, 0.5)'
              : '1px solid rgba(124, 140, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
            boxShadow: isReplay
              ? '0 0 24px rgba(124, 140, 255, 0.12)'
              : uploadPhase === 'uploading'
              ? '0 0 24px rgba(56, 189, 248, 0.15)'
              : 'none',
            position: 'relative',
            perspective: '1000px',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* Option B Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'rgba(124, 140, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={15} color="var(--secondary)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--secondary)' }}>
                OPTION B &middot; PCAP REPLAY
              </span>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              PCAP / PCAPNG Upload &amp; Replay
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Replay recorded traffic through the existing backend pipeline.
            </p>
          </div>

          {/* Option B Controls & Animated Data States */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* File Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Upload PCAP / PCAPNG File
              </label>
              <input
                className="soc-input"
                type="file"
                accept=".pcap,.pcapng,.cap"
                onChange={(e) => {
                  setPcapFile(e.target.files?.[0] || null);
                  setUploadPhase('idle');
                  setUploadError(null);
                }}
                disabled={busy || isRunning || uploadPhase === 'uploading'}
                style={{ width: '100%', fontSize: '12px', padding: '8px 12px', cursor: 'pointer' }}
              />

              {/* Enhanced 3D File Telemetry Card */}
              {pcapFile ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: uploadPhase === 'uploading' ? 'rgba(8, 20, 36, 0.9)' : 'rgba(8, 14, 26, 0.8)',
                    border: uploadPhase === 'uploading'
                      ? '1px solid rgba(56, 189, 248, 0.45)'
                      : '1px solid rgba(124, 140, 255, 0.25)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginTop: '2px',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '5px',
                        background: uploadPhase === 'uploading' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(124, 140, 255, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: uploadPhase === 'uploading' ? '#38bdf8' : 'var(--secondary)',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#fff',
                          fontFamily: 'var(--font-mono)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px',
                        }}
                        title={pcapFile.name}
                      >
                        {pcapFile.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{getFileExtension(pcapFile.name)}</span>
                        <span>&bull;</span>
                        <span>{formatBytes(pcapFile.size)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      background: uploadPhase === 'uploading'
                        ? 'rgba(56, 189, 248, 0.15)'
                        : isReplay
                        ? 'rgba(124, 140, 255, 0.15)'
                        : 'rgba(85, 214, 165, 0.12)',
                      color: uploadPhase === 'uploading'
                        ? '#38bdf8'
                        : isReplay
                        ? 'var(--secondary)'
                        : 'var(--primary)',
                      border: '1px solid',
                      borderColor: uploadPhase === 'uploading'
                        ? 'rgba(56, 189, 248, 0.3)'
                        : isReplay
                        ? 'rgba(124, 140, 255, 0.3)'
                        : 'rgba(85, 214, 165, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {uploadPhase === 'uploading'
                      ? 'Uploading...'
                      : isReplay
                      ? 'Replaying'
                      : 'Ready for replay'}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>Supports .pcap, .pcapng, .cap datasets</span>
                </div>
              )}
            </div>

            {/* Replay Speed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Replay Speed
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {speedPresets.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    disabled={busy || isRunning || uploadPhase === 'uploading'}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: Number(speed) === s ? 'var(--secondary)' : 'var(--border-subtle)',
                      background: Number(speed) === s ? 'rgba(124, 140, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      color: Number(speed) === s ? '#fff' : 'var(--text-muted)',
                      cursor: isRunning || uploadPhase === 'uploading' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s}&times;
                  </button>
                ))}
                <input
                  className="soc-input mono"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  disabled={busy || isRunning || uploadPhase === 'uploading'}
                  style={{ width: '70px', padding: '6px 8px', fontSize: '12px', textAlign: 'center' }}
                  title="Custom replay speed multiplier"
                />
              </div>
            </div>

            {/* ===================================================================
                UPLOADING DATA FLOW TELEMETRY ANIMATION (Active during real upload)
               =================================================================== */}
            {uploadPhase === 'uploading' && (
              <div
                aria-live="polite"
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.95) 0%, rgba(6, 12, 24, 0.98) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transform: 'translateZ(6px)',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Flow Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 8px #38bdf8',
                        animation: 'pcapPulseGlow 1.2s infinite ease-in-out',
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      UPLOADING PCAP
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    SPEED: {speed}&times;
                  </span>
                </div>

                {/* Visual Pipeline: [PCAP FILE] -> Particles -> [REPLAY ENGINE] */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(5, 10, 20, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left Node: PCAP Source */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', zIndex: 2 }}>
                    <FileText size={12} color="#38bdf8" />
                    <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                      PCAP FILE
                    </span>
                  </div>

                  {/* Flow Data Bus Track with Moving Particle Beam */}
                  <div
                    style={{
                      flex: 1,
                      height: '3px',
                      margin: '0 10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      borderRadius: '2px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="pcap-beam-particle"
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '40px',
                        background: 'linear-gradient(90deg, transparent, #38bdf8, #fff, transparent)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>

                  {/* Right Node: Replay Engine Destination */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', zIndex: 2 }}>
                    <Cpu size={12} color="var(--secondary)" />
                    <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                      REPLAY ENGINE
                    </span>
                  </div>
                </div>

                {/* Indeterminate Telemetry Bar (No fake percentages) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      borderRadius: '2px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="pcap-indeterminate-bar" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Streaming PCAP bytes to replay engine</span>
                    <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>STREAMING RAW BYTES</span>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                REPLAYING PIPELINE STAGES ANIMATION (When active replay is running)
               =================================================================== */}
            {isReplay && uploadPhase !== 'uploading' && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(124, 140, 255, 0.08)',
                  border: '1px solid rgba(124, 140, 255, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="status-dot" style={{ background: 'var(--secondary)', width: '6px', height: '6px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>
                      REPLAYING PCAP
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    SPEED: {speed}&times;
                  </span>
                </div>

                {/* 5-Stage Ingestion Flow */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255, 255, 255, 0.75)',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    background: 'rgba(5, 10, 20, 0.65)',
                    border: '1px solid rgba(124, 140, 255, 0.15)',
                    overflowX: 'auto',
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: 600 }}>PCAP</span>
                  <span style={{ color: 'var(--secondary)' }}>&rarr;</span>
                  <span>RAW BYTES</span>
                  <span style={{ color: 'var(--secondary)' }}>&rarr;</span>
                  <span>REPLAY ENGINE</span>
                  <span style={{ color: 'var(--secondary)' }}>&rarr;</span>
                  <span>10s WINDOWS</span>
                  <span style={{ color: 'var(--secondary)' }}>&rarr;</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>FORECAST</span>
                </div>
              </div>
            )}

            {/* ===================================================================
                REAL SUCCESS TRANSITION BANNER
               =================================================================== */}
            {uploadPhase === 'success' && (
              <div
                aria-live="polite"
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(85, 214, 165, 0.12)',
                  border: '1px solid rgba(85, 214, 165, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 16px rgba(85, 214, 165, 0.15)',
                }}
              >
                <CheckCircle2 size={14} />
                <span>✓ PCAP REPLAY STARTED</span>
              </div>
            )}

            {/* ===================================================================
                REAL ERROR BANNER
               =================================================================== */}
            {uploadPhase === 'error' && (
              <div
                aria-live="polite"
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 92, 108, 0.12)',
                  border: '1px solid rgba(255, 92, 108, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  color: 'var(--threat)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  <AlertTriangle size={13} />
                  <span>⚠ PCAP REPLAY FAILED</span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.75)' }}>
                  {uploadError || 'Upload request failed. Verify backend server is reachable.'}
                </div>
              </div>
            )}
          </div>

          {/* Option B Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            {isRunning && isReplay ? (
              <button
                className="soc-btn danger"
                style={{ width: '100%', padding: '10px 16px', fontSize: '13px' }}
                disabled={busy}
                onClick={stopCapture}
              >
                <Square size={15} />
                <span>Stop Replay</span>
              </button>
            ) : (
              <button
                className="soc-btn"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13px',
                  background: uploadPhase === 'uploading'
                    ? 'rgba(56, 189, 248, 0.2)'
                    : pcapFile
                    ? 'rgba(124, 140, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                  borderColor: uploadPhase === 'uploading'
                    ? 'rgba(56, 189, 248, 0.5)'
                    : pcapFile
                    ? 'rgba(124, 140, 255, 0.4)'
                    : 'var(--border-subtle)',
                  color: uploadPhase === 'uploading'
                    ? '#38bdf8'
                    : pcapFile
                    ? 'var(--secondary)'
                    : 'var(--text-muted)',
                  cursor: !pcapFile || busy || isRunning || uploadPhase === 'uploading' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                disabled={busy || !pcapFile || isRunning || uploadPhase === 'uploading'}
                onClick={handleReplayClick}
              >
                {uploadPhase === 'uploading' ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Uploading PCAP...</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Replay PCAP</span>
                  </>
                )}
              </button>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isReplay ? (
                <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  Replaying packet stream through the transformer pipeline at {speed}&times; speed
                </span>
              ) : (
                <span>Streams raw PCAP bytes directly to backend replay engine.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
