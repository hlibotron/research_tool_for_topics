import React from 'react';
import { Crosshair, Monitor, Zap, Shield, TrendingUp } from 'lucide-react';
import { formatLabel } from '../../lib/formatters.js';

const ROWS = [
  { key: 'angle', label: 'Кут (Angle)', icon: <Crosshair size={14} /> },
  { key: 'format', label: 'Формат', icon: <Monitor size={14} /> },
  { key: 'hook', label: 'Хук', icon: <Zap size={14} /> },
  { key: 'risk', label: 'Ризик', icon: <Shield size={14} /> },
  { key: 'potential', label: 'Потенціал', icon: <TrendingUp size={14} /> },
];

const POTENTIAL_LABELS = {
  high: { label: 'Високий', color: 'var(--green)' },
  medium: { label: 'Середній', color: 'var(--orange)' },
  low: { label: 'Низький', color: 'var(--red)' },
};

const RISK_LABELS = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
};

function getValue(result, idea, key) {
  switch (key) {
    case 'angle':
      return {
        original: result.originalIdea || idea || 'не визначено',
        improved: result.improvedIdea || result.optimizedIdea || result.rewrittenIdea ||
          result.angle || result.suggestedAngle || result.suggested_angle || null,
      };
    case 'format': {
      const orig = null;
      const imp = result.recommendedFormat || result.recommended_format;
      return { original: orig, improved: imp ? formatLabel(imp) : null };
    }
    case 'hook':
      return {
        original: null,
        improved: result.hooks?.[0] || result.hook || null,
      };
    case 'risk':
      return {
        original: null,
        improved: RISK_LABELS[result.riskLevel || result.risk_level] || result.riskLevel || null,
      };
    case 'potential':
      return {
        original: null,
        improved: result.potential || result.scoreLabel || null,
        isPotential: true,
      };
    default:
      return { original: null, improved: null };
  }
}

function PotentialCell({ value, isImproved }) {
  const info = POTENTIAL_LABELS[String(value || '').toLowerCase()];
  if (!info) return <span className="idea-comparison-cell improved">{value || 'не визначено'}</span>;
  return (
    <div className="idea-comparison-cell potential-row" style={{ color: isImproved ? info.color : 'var(--muted)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, display: 'inline-block' }} />
      {info.label}
    </div>
  );
}

export default function IdeaComparison({ result, idea }) {
  return (
    <div className="idea-comparison">
      <div className="idea-comparison-head">
        <div className="idea-comparison-head-cell" />
        <div className="idea-comparison-head-cell">Моя ідея</div>
        <div className="idea-comparison-head-cell improved">Покращена data-backed версія</div>
      </div>
      {ROWS.map(row => {
        const vals = getValue(result, idea, row.key);
        const original = vals.original || 'не визначено';
        const improved = vals.improved || 'не визначено';

        if (row.key === 'potential') {
          return (
            <div key={row.key} className="idea-comparison-row">
              <div className="idea-comparison-cell criterion">
                {row.icon}
                {row.label}
              </div>
              <PotentialCell value={vals.original} isImproved={false} />
              <PotentialCell value={vals.improved} isImproved={true} />
            </div>
          );
        }

        return (
          <div key={row.key} className="idea-comparison-row">
            <div className="idea-comparison-cell criterion">
              {row.icon}
              {row.label}
            </div>
            <div className="idea-comparison-cell">{original}</div>
            <div className={`idea-comparison-cell ${vals.improved ? 'improved' : ''}`}>{improved}</div>
          </div>
        );
      })}
    </div>
  );
}
