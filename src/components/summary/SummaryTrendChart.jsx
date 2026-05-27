import React from 'react';
import Card from '../common/Card.jsx';

function hasSeries(summary) {
  if (Array.isArray(summary.timeSeries) && summary.timeSeries.length) return true;
  return summary.hashtags.some((item) => Array.isArray(item.sparkline) && item.sparkline.length > 1);
}

function pathFrom(values, width, height) {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * height;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function averageSparkline(rows) {
  const seriesRows = rows.map((item) => item.sparkline).filter((row) => Array.isArray(row) && row.length > 1);
  if (!seriesRows.length) return [];
  const length = Math.min(...seriesRows.map((row) => row.length));
  return Array.from({ length }, (_, index) => {
    const values = seriesRows.map((row) => Number(row[index] || 0));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  });
}

function fallbackRows(summary) {
  return [...summary.risingHashtags.slice(0, 4), ...summary.fallingHashtags.slice(0, 4)];
}

export default function SummaryTrendChart({ summary }) {
  const growing = averageSparkline(summary.risingHashtags.slice(0, 5));
  const falling = averageSparkline(summary.fallingHashtags.slice(0, 5));
  const canDraw = hasSeries(summary) && (growing.length || falling.length);
  const width = 680;
  const height = 230;

  return (
    <Card className="summary-trend-chart">
      <div className="summary-chart-head">
        <div>
          <h2>Динаміка інтересу до ніші</h2>
          <p className="muted">Показується тільки коли API повертає реальні series/sparkline дані.</p>
        </div>
      </div>
      {canDraw ? (
        <>
          <div className="summary-chart-legend"><span className="green">Зростаючі теми</span><span className="red">Падаючі теми</span></div>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Динаміка інтересу до ніші">
            <path className="summary-chart-grid" d={`M 0 ${height * .25} H ${width} M 0 ${height * .5} H ${width} M 0 ${height * .75} H ${width}`} />
            {growing.length ? <path className="summary-chart-line green" d={pathFrom(growing, width, height)} /> : null}
            {falling.length ? <path className="summary-chart-line red" d={pathFrom(falling, width, height)} /> : null}
          </svg>
        </>
      ) : (
        <div className="summary-chart-fallback">
          {fallbackRows(summary).map((item) => (
            <div key={item.id || item.label}>
              <span>{item.label}</span>
              <strong className={item.effectiveChange >= 0 ? 'green' : 'red'}>{item.effectiveChange > 0 ? '+' : ''}{Math.round(item.effectiveChange || 0)}%</strong>
            </div>
          ))}
          {!fallbackRows(summary).length ? <p className="muted">Немає time series і growth values для порівняння.</p> : null}
        </div>
      )}
    </Card>
  );
}
