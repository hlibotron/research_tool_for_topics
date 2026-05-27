import React from 'react';
import { Play, Monitor } from 'lucide-react';
import { confidenceTone, formatLabel } from '../../lib/formatters.js';

function ScoreGauge({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  const color = pct >= 70 ? '#36c177' : pct >= 50 ? '#f59e2e' : '#e75d5d';
  return (
    <div className="brief-score-gauge">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(27,49,72,0.9)" strokeWidth="4.5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="brief-score-gauge-label">
        <strong style={{ color }}>{Math.round(pct)}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

const CONFIDENCE_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };
const QUALITY_LABELS = { high: 'Висока', medium: 'Середня', low: 'Низька' };
const DOT_COLORS = { high: 'green', medium: 'orange', low: 'red' };

export default function BriefHeader({ brief }) {
  const { title, opportunityScore, confidence, recommendedFormat, evidenceQuality, verdict } = brief;
  const confTone = confidenceTone(confidence);

  return (
    <div className="brief-header-card">
      <div className="brief-header-top">
        <div>
          <span className="brief-header-badge">
            {verdict === 'shoot_now' || verdict === 'shoot' ? 'Знімати зараз' : 'Рекомендація №1'}
          </span>
          <h2 className="brief-header-title">{title || 'Без назви'}</h2>
        </div>
        <div className="brief-header-thumb">
          <Play size={20} color="rgba(142,163,184,0.5)" />
        </div>
      </div>

      <div className="brief-header-metrics">
        <div className="brief-header-metric">
          <span className="brief-header-metric-label">Opportunity Score</span>
          <div className="brief-header-metric-value">
            <ScoreGauge score={opportunityScore} />
          </div>
        </div>

        <div className="brief-header-metric">
          <span className="brief-header-metric-label">Впевненість</span>
          <div className="brief-header-metric-value">
            {confidence ? (
              <>
                <span className={`brief-dot brief-dot-${confTone}`} />
                {CONFIDENCE_LABELS[confidence] || confidence}
              </>
            ) : '—'}
          </div>
        </div>

        <div className="brief-header-metric">
          <span className="brief-header-metric-label">Найкращий формат</span>
          <div className="brief-header-metric-value">
            {recommendedFormat ? (
              <>
                <Monitor size={14} style={{ opacity: 0.7 }} />
                {formatLabel(recommendedFormat)}
              </>
            ) : '—'}
          </div>
        </div>

        <div className="brief-header-metric">
          <span className="brief-header-metric-label">Якість доказів</span>
          <div className="brief-header-metric-value" style={{ color: evidenceQuality ? `var(--${confidenceTone(evidenceQuality)})` : 'var(--muted)' }}>
            {evidenceQuality ? (QUALITY_LABELS[evidenceQuality] || evidenceQuality) : 'немає даних'}
          </div>
          {evidenceQuality === 'high' && (
            <span className="brief-header-metric-sub">На основі реальних даних</span>
          )}
        </div>
      </div>
    </div>
  );
}
