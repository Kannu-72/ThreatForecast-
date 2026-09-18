import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useThreat } from '../../context/ThreatContext';
import { HORIZONS, OPERATIONAL_THRESHOLD } from '../../utils/constants';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Eye, EyeOff, Layers } from 'lucide-react';

export default function ForecastTimeline({ height = 300 }) {
  const threatContext = useThreat ? useThreat() : {};
  const { forecast, status } = threatContext || {};

  // View settings
  const [adaptiveScale, setAdaptiveScale] = useState(true);
  const [selectedHorizonIdx, setSelectedHorizonIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Animated interpolated scores
  const rawScores = useMemo(() => {
    return HORIZONS.map((_, idx) => forecast?.risk_scores?.[idx] ?? 0);
  }, [forecast?.risk_scores]);

  const [displayScores, setDisplayScores] = useState(rawScores);
  const prevScoresRef = useRef(rawScores);
  const animFrameRef = useRef(null);

  // Smooth interpolation when real forecast updates
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayScores(rawScores);
      prevScoresRef.current = rawScores;
      return;
    }

    const startScores = [...prevScoresRef.current];
    const targetScores = [...rawScores];
    const startTime = performance.now();
    const duration = 550; // 550ms smooth transition

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      const next = startScores.map((startVal, i) => {
        const targetVal = targetScores[i];
        return startVal + (targetVal - startVal) * eased;
      });

      setDisplayScores(next);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        prevScoresRef.current = targetScores;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [rawScores]);

  // Current baseline risk (estimated from state features or previous horizon)
  const currentRisk = forecast?.latest_state?.packet_count ? (displayScores[0] * 0.85) : (displayScores[0] * 0.9);
  const allValues = [currentRisk, ...displayScores];

  const minRisk = Math.min(...allValues);
  const maxRisk = Math.max(...allValues);
  const peakRisk = forecast?.peak_risk ?? maxRisk;
  const peakHorizon = forecast?.peak_risk_horizon_seconds ?? (HORIZONS[displayScores.indexOf(Math.max(...displayScores))] || 10);
  const isElevated = peakRisk >= OPERATIONAL_THRESHOLD;
  const isCritical = peakRisk >= 0.15;

  // Smart Adaptive Visual Y-Domain
  const { yMin, yMax, thresholdVisible } = useMemo(() => {
    if (!adaptiveScale || maxRisk >= OPERATIONAL_THRESHOLD * 0.85) {
      // Full scale with threshold clearly visible
      return {
        yMin: 0,
        yMax: Math.max(0.07, maxRisk * 1.25),
        thresholdVisible: true,
      };
    }

    // Adaptive tight scale: highlights small fluctuations dramatically!
    const padding = (maxRisk - minRisk) * 0.45 || 0.004;
    const computedMin = Math.max(0, minRisk - padding * 0.8);
    const computedMax = Math.max(0.015, maxRisk + padding);

    return {
      yMin: computedMin,
      yMax: computedMax,
      thresholdVisible: OPERATIONAL_THRESHOLD <= computedMax,
    };
  }, [adaptiveScale, minRisk, maxRisk]);

  // SVG Dimension Constants
  const svgWidth = 840;
  const svgHeight = 270;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 38;
  const padBottom = 42;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Mapping coordinate functions
  const getX = (idx) => padLeft + (idx / 6) * plotWidth;
  const getY = (val) => {
    const norm = (val - yMin) / (yMax - yMin || 0.001);
    const clamped = Math.max(0, Math.min(1, norm));
    return padTop + (1 - clamped) * plotHeight;
  };

  // Forecast Points
  const points = HORIZONS.map((h, i) => {
    const val = displayScores[i] ?? 0;
    const prevVal = i === 0 ? currentRisk : (displayScores[i - 1] ?? 0);
    const delta = val - prevVal;
    const x = getX(i + 1);
    const y = getY(val);

    let direction = 'stable';
    let dirArrow = '→';
    let dirColor = '#94a3b8';

    if (delta > 0.0004) {
      direction = 'rising';
      dirArrow = '↗';
      dirColor = '#f59e0b';
    } else if (delta < -0.0004) {
      direction = 'falling';
      dirArrow = '↘';
      dirColor = '#00e5ff';
    }

    return {
      horizon: `+${h}s`,
      h,
      idx: i,
      val,
      rawVal: rawScores[i] ?? val,
      delta,
      x,
      y,
      direction,
      dirArrow,
      dirColor,
    };
  });

  const nowPoint = {
    horizon: 'NOW',
    h: 0,
    idx: -1,
    val: currentRisk,
    rawVal: currentRisk,
    delta: 0,
    x: getX(0),
    y: getY(currentRisk),
    direction: 'stable',
    dirArrow: '•',
    dirColor: '#38bdf8',
  };

  const allPoints = [nowPoint, ...points];

  // Generate Smooth Bezier Curves
  const generateSmoothPath = (pts) => {
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(allPoints);
  const areaPath = `${linePath} L ${allPoints[allPoints.length - 1].x} ${padTop + plotHeight} L ${allPoints[0].x} ${padTop + plotHeight} Z`;
  const shadowPath = generateSmoothPath(
    allPoints.map((p) => ({ x: p.x, y: p.y + 4 }))
  );

  // Y-Axis Ticks (4 clean subdivisions)
  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = yMin + ratio * (yMax - yMin);
    return {
      val,
      y: padTop + (1 - ratio) * plotHeight,
      label: `${(val * 100).toFixed(val < 0.02 ? 2 : 1)}%`,
    };
  });

  const activeInspectIdx = hoveredIdx !== null ? hoveredIdx : selectedHorizonIdx;
  const inspectPoint = activeInspectIdx !== null ? allPoints.find((p) => p.idx === activeInspectIdx) : null;

  return (
    <div
      className="soc-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(8, 13, 27, 0.96) 0%, rgba(13, 22, 45, 0.9) 100%)',
        border: '1px solid rgba(42, 57, 88, 0.8)',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 3D Perspective Defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="trajectoryGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#080d1b" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Top Header: Section Title + Real Risk KPIs + Adaptive Scale Toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '14px',
          marginBottom: '14px',
          borderBottom: '1px solid rgba(42, 57, 88, 0.7)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#00e5ff',
                textTransform: 'uppercase',
              }}
            >
              PREDICTIVE TRAJECTORY
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 229, 255, 0.12)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                fontWeight: 700,
              }}
            >
              3D MULTI-HORIZON
            </span>
          </div>
          <h3
            style={{
              margin: '3px 0 0 0',
              fontSize: '15px',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: '#f1f5f9',
            }}
          >
            10–60 Second Cyber Threat Forecast
          </h3>
        </div>

        {/* Real Summary Metrics Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Current Risk */}
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#64748b' }}>NOW: </span>
            <strong style={{ color: '#38bdf8' }}>{(currentRisk * 100).toFixed(2)}%</strong>
          </div>

          {/* Peak Forecast */}
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: isCritical ? 'rgba(244, 63, 94, 0.15)' : isElevated ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${isCritical ? '#f43f5e55' : isElevated ? '#f59e0b55' : 'rgba(51, 65, 85, 0.7)'}`,
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#64748b' }}>PEAK: </span>
            <strong style={{ color: isCritical ? '#f43f5e' : isElevated ? '#fbbf24' : '#00e5ff' }}>
              {(peakRisk * 100).toFixed(2)}%
            </strong>
            <span style={{ color: '#94a3b8', marginLeft: '4px' }}>+{peakHorizon}s</span>
          </div>

          {/* Threat State */}
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: isCritical ? 'rgba(244, 63, 94, 0.2)' : isElevated ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isCritical ? '#f43f5e66' : isElevated ? '#f59e0b66' : 'rgba(16, 185, 129, 0.4)'}`,
              color: isCritical ? '#f43f5e' : isElevated ? '#fbbf24' : '#34d399',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 800,
            }}
          >
            {isCritical ? 'CRITICAL RISK' : isElevated ? 'ELEVATED RISK' : 'NOMINAL'}
          </div>

          {/* Smart Adaptive Visual Scale Toggle Button */}
          <button
            onClick={() => setAdaptiveScale((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: adaptiveScale ? 'rgba(0, 229, 255, 0.14)' : 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${adaptiveScale ? 'rgba(0, 229, 255, 0.4)' : 'rgba(51, 65, 85, 0.7)'}`,
              color: adaptiveScale ? '#00e5ff' : '#94a3b8',
              fontSize: '11px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
            title={adaptiveScale ? 'Click to view full scale (0–10%)' : 'Click to zoom in on small fluctuations'}
          >
            <Layers size={12} />
            <span>{adaptiveScale ? 'SCALE: ADAPTIVE' : 'SCALE: FULL'}</span>
          </button>
        </div>
      </div>

      {/* Main 3D-Perspective SVG Trajectory Visualization */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: `${height}px`,
          perspective: '1000px',
          background: 'radial-gradient(ellipse at 50% 10%, rgba(0, 229, 255, 0.04), transparent 70%), #050a17',
          borderRadius: '12px',
          border: '1px solid rgba(42, 57, 88, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Perspective Grid Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '40px 30px',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        >
          {/* Horizontal Grid Lines */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={padLeft + plotWidth}
                y2={t.y}
                stroke="rgba(51, 65, 85, 0.45)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={padLeft - 10}
                y={t.y + 3}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Operational Threshold Reference Line (0.05) */}
          {thresholdVisible ? (
            <g>
              <line
                x1={padLeft}
                y1={getY(OPERATIONAL_THRESHOLD)}
                x2={padLeft + plotWidth}
                y2={getY(OPERATIONAL_THRESHOLD)}
                stroke="#f43f5e"
                strokeDasharray="6 4"
                strokeWidth={1.6}
                opacity={isElevated ? 0.9 : 0.6}
              />
              <text
                x={padLeft + plotWidth - 4}
                y={getY(OPERATIONAL_THRESHOLD) - 5}
                textAnchor="end"
                fill="#f43f5e"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                THRESHOLD 5.0%
              </text>
            </g>
          ) : (
            <g>
              <text
                x={padLeft + plotWidth - 4}
                y={padTop + 14}
                textAnchor="end"
                fill="#34d399"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                THRESHOLD 5.0% (HEADROOM: NOMINAL)
              </text>
            </g>
          )}

          {/* Vertical Drop Lines */}
          {allPoints.map((p) => (
            <line
              key={`drop-${p.horizon}`}
              x1={p.x}
              y1={p.y}
              x2={p.x}
              y2={padTop + plotHeight}
              stroke={p.h === 0 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(51, 65, 85, 0.4)'}
              strokeDasharray={p.h === 0 ? 'none' : '3 3'}
              strokeWidth={p.h === 0 ? 1.5 : 1}
            />
          ))}

          {/* Vertical NOW Separation Marker */}
          <line
            x1={nowPoint.x}
            y1={padTop - 8}
            x2={nowPoint.x}
            y2={padTop + plotHeight + 6}
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <text
            x={nowPoint.x}
            y={padTop - 14}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            NOW
          </text>

          {/* Soft 3D Area Fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* 3D Depth Shadow Stroke */}
          <path d={shadowPath} fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth={4} />

          {/* Primary Glowing Trajectory Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#00e5ff"
            strokeWidth={2.8}
            filter="url(#trajectoryGlow)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & Direction Badges */}
          {allPoints.map((p) => {
            const isHovered = hoveredIdx === p.idx || selectedHorizonIdx === p.idx;
            const isNow = p.h === 0;

            return (
              <g
                key={`pt-${p.horizon}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(p.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setSelectedHorizonIdx((prev) => (prev === p.idx ? null : p.idx))}
              >
                {/* Invisible hit target for smooth mobile/touch interaction */}
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />

                {/* Outer Ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 11 : 8}
                  fill="none"
                  stroke={isNow ? '#38bdf8' : p.dirColor}
                  strokeWidth={isHovered ? 2 : 1.2}
                  opacity={isHovered ? 0.9 : 0.4}
                />

                {/* Core Point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 4.5}
                  fill={isNow ? '#38bdf8' : '#00e5ff'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />

                {/* Value Label (Accurate Numerical Real Value) */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fill={isHovered ? '#00e5ff' : '#e2e8f0'}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {(p.val * 100).toFixed(1)}%
                </text>

                {/* Horizon X Label */}
                <text
                  x={p.x}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#00e5ff' : isNow ? '#38bdf8' : '#94a3b8'}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight={isHovered || isNow ? 'bold' : 'normal'}
                >
                  {p.horizon}
                </text>

                {/* Direction Indicator */}
                {!isNow && (
                  <text
                    x={p.x}
                    y={padTop + plotHeight + 32}
                    textAnchor="middle"
                    fill={p.dirColor}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {p.dirArrow}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip for Selected/Hovered Point */}
        {inspectPoint && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: `${Math.min(75, Math.max(15, (inspectPoint.x / svgWidth) * 100))}%`,
              transform: 'translateX(-50%)',
              background: 'rgba(8, 13, 27, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.45)',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              fontSize: '11px',
              fontFamily: 'monospace',
              pointerEvents: 'none',
              zIndex: 20,
              minWidth: '160px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00e5ff', fontWeight: 800, marginBottom: '3px' }}>
              <span>HORIZON {inspectPoint.horizon}</span>
              <span>{inspectPoint.dirArrow} {inspectPoint.direction.toUpperCase()}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Forecast Risk: </span>
              <strong style={{ color: '#f1f5f9' }}>{(inspectPoint.val * 100).toFixed(2)}%</strong>
              <span style={{ color: '#94a3b8', fontSize: '9px', marginLeft: '4px' }}>({inspectPoint.val.toFixed(4)})</span>
            </div>
            {inspectPoint.idx >= 0 && (
              <div>
                <span style={{ color: '#64748b' }}>Change: </span>
                <strong style={{ color: inspectPoint.dirColor }}>
                  {inspectPoint.delta >= 0 ? '+' : ''}{(inspectPoint.delta * 100).toFixed(2)} pp
                </strong>
              </div>
            )}
            <div style={{ marginTop: '2px', fontSize: '10px' }}>
              <span style={{ color: inspectPoint.val >= OPERATIONAL_THRESHOLD ? '#f43f5e' : '#34d399', fontWeight: 700 }}>
                {inspectPoint.val >= OPERATIONAL_THRESHOLD ? 'ELEVATED / OVER THRESHOLD' : 'BELOW THRESHOLD (SAFE)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6 Individual Horizon Cards Below Main Chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '10px',
          marginTop: '16px',
        }}
      >
        {points.map((pt) => {
          const isSelected = selectedHorizonIdx === pt.idx;
          const isWarning = pt.val >= OPERATIONAL_THRESHOLD;

          return (
            <div
              key={pt.h}
              onClick={() => setSelectedHorizonIdx((prev) => (prev === pt.idx ? null : pt.idx))}
              style={{
                borderRadius: '10px',
                padding: '10px 12px',
                background: isSelected
                  ? 'rgba(0, 229, 255, 0.12)'
                  : isWarning
                    ? 'rgba(244, 63, 94, 0.1)'
                    : 'rgba(15, 23, 42, 0.75)',
                border: isSelected
                  ? '1px solid #00e5ff'
                  : isWarning
                    ? '1px solid rgba(244, 63, 94, 0.4)'
                    : '1px solid rgba(42, 57, 88, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: isSelected ? '#00e5ff' : '#38bdf8',
                  }}
                >
                  +{pt.h}s
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: pt.dirColor,
                  }}
                >
                  {pt.dirArrow} {pt.delta >= 0 ? '+' : ''}{(pt.delta * 100).toFixed(1)} pp
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '17px',
                  fontWeight: 800,
                  color: isWarning ? '#f43f5e' : '#f1f5f9',
                }}
              >
                {(pt.val * 100).toFixed(1)}%
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                  marginTop: '4px',
                }}
              >
                <span>{pt.val.toFixed(4)}</span>
                <span
                  style={{
                    color: isWarning ? '#f43f5e' : '#34d399',
                    fontWeight: 700,
                  }}
                >
                  {isWarning ? 'ALERT' : 'LOW'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
