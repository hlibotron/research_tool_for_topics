import React from 'react';
import { Info } from 'lucide-react';

const ROWS = [
  { key: 'velocity', label: 'Velocity' },
  { key: 'outlier', label: 'Outlier' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'freshness', label: 'Freshness' },
  { key: 'channelFit', label: 'Channel fit' },
  { key: 'feasibility', label: 'Feasibility' },
];

function toneFor(value) {
  if (value >= 80) return 'green';
  if (value >= 60) return 'blue';
  if (value >= 40) return 'orange';
  return 'red';
}

export default function ScoreBreakdown({ values = {}, finalScore = 0 }) {
  return (
    <div className="opp-score-breakdown">
      <div className="opp-score-breakdown-header">
        <span>Розклад балу</span>
        <Info size={13} className="opp-score-info" />
      </div>
      <div className="opp-score-rows">
        {ROWS.map(({ key, label }) => {
          if (values[key] == null) return null;
          const v = Math.max(0, Math.min(100, Math.round(Number(values[key]) || 0)));
          return (
            <div key={key} className="opp-score-row">
              <span className="opp-score-row-label">{label}</span>
              <div className="opp-score-bar">
                <div className={`opp-score-bar-fill opp-score-bar-${toneFor(v)}`} style={{ width: `${v}%` }} />
              </div>
              <span className="opp-score-row-value">{v}</span>
            </div>
          );
        })}
      </div>
      <div className="opp-score-final">
        <span>Фінальний бал</span>
        <strong>
          {Math.round(finalScore)}
          <small>/100</small>
        </strong>
      </div>
    </div>
  );
}
