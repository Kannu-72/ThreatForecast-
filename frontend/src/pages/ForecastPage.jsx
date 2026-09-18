import React from 'react';
import ForecastTimeline from '../components/forecast/ForecastTimeline';
import ForecastCard from '../components/forecast/ForecastCard';
import PredictionWindow from '../components/forecast/PredictionWindow';

export default function ForecastPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 6 Individual Horizon Output Cards */}
      <ForecastCard />

      {/* Main Predictive Trajectory Graph */}
      <ForecastTimeline height={340} />

      {/* ML Prediction Window Diagram */}
      <PredictionWindow />
    </div>
  );
}
