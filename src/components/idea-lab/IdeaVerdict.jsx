import React from 'react';
import { confidenceTone } from '../../lib/formatters.js';

const VERDICT_MAP = {
  shoot_now: { label: 'Знімати', tone: 'green' },
  shoot: { label: 'Знімати', tone: 'green' },
  recommended: { label: 'Знімати', tone: 'green' },
  adapt: { label: 'Адаптувати і знімати', tone: 'orange' },
  needs_adaptation: { label: 'Адаптувати і знімати', tone: 'orange' },
  watch: { label: 'Слідкувати', tone: 'blue' },
  monitor: { label: 'Слідкувати', tone: 'blue' },
  avoid: { label: 'Не знімати зараз', tone: 'red' },
};

function normalizeVerdict(action, score) {
  if (VERDICT_MAP[action]) return VERDICT_MAP[action];
  const s = Number(score) || 0;
  if (s >= 75) return { label: 'Знімати', tone: 'green' };
  if (s >= 50) return { label: 'Адаптувати і знімати', tone: 'orange' };
  return { label: 'Не знімати зараз', tone: 'red' };
}

function ScoreGauge({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  const color = pct >= 70 ? '#36c177' : pct >= 50 ? '#f59e2e' : '#e75d5d';
  return (
    <div className="idea-score-gauge">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(27,49,72,0.9)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div className="idea-score-gauge-label">
        <strong style={{ color }}>{Math.round(pct)}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

const CONFIDENCE_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };
const QUALITY_LABELS = { high: 'Висока', medium: 'Середня', low: 'Низька' };

export default function IdeaVerdict({ result }) {
  const action = result.verdict || result.suggestedAction || result.action || 'watch';
  const score = result.opportunityScore || result.opportunity_score || result.score || 0;
  const confidence = result.confidence || null;
  const evidenceQuality = result.evidenceQuality || result.evidence_quality || null;
  const updatedAt = result.updatedAt || result.updated_at || result.dataHealth?.lastUpdated || null;
  const summary = result.summary || result.reason || result.recommendation || null;

  const { label: verdictLabel, tone: verdictTone } = normalizeVerdict(action, score);
  const confidenceToneVal = confidenceTone(confidence);
  const qualityTone = confidenceTone(evidenceQuality);
  const qualityLabel = QUALITY_LABELS[evidenceQuality] || (evidenceQuality ? String(evidenceQuality) : null);
  const qualityPct = evidenceQuality === 'high' ? '85%' : evidenceQuality === 'medium' ? '55%' : evidenceQuality === 'low' ? '30%' : null;

  const hasLLMOnly = !result.dataHealth?.videosAnalyzed && !result.videos_analyzed;

  return (
    <div className="idea-verdict">
      <div>
        <span className="idea-verdict-label">Вердикт</span>
        <h2 className={`idea-verdict-text ${verdictTone}`}>{verdictLabel}</h2>
        {summary && <p className="idea-verdict-summary">{summary}</p>}
        {hasLLMOnly && (
          <div className="idea-lab-warning" style={{ marginTop: 12 }}>
            Рекомендація має недостатньо структурованих доказів. Потрібна перевірка через YouTube data jobs.
          </div>
        )}
      </div>

      <div className="idea-verdict-metrics">
        <div className="idea-verdict-metric">
          <span className="idea-verdict-metric-label">Opportunity Score</span>
          <ScoreGauge score={score} />
        </div>

        {confidence && (
          <div className="idea-verdict-metric">
            <span className="idea-verdict-metric-label">Впевненість</span>
            <div className="idea-confidence-value">
              <span className={`idea-dot idea-dot-${confidenceToneVal}`} />
              <span>{CONFIDENCE_LABELS[confidence] || confidence}</span>
            </div>
          </div>
        )}

        {qualityLabel && (
          <div className="idea-verdict-metric">
            <span className="idea-verdict-metric-label">Якість доказів</span>
            <div>
              {qualityPct && <div style={{ fontSize: 15, fontWeight: 700, color: `var(--${qualityTone})` }}>{qualityPct}</div>}
              <span className={`idea-quality-badge ${qualityTone}`}>{qualityLabel}</span>
            </div>
          </div>
        )}

        {!qualityLabel && (
          <div className="idea-verdict-metric">
            <span className="idea-verdict-metric-label">Якість доказів</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>немає даних</span>
          </div>
        )}

        {updatedAt && (
          <div className="idea-verdict-metric">
            <span className="idea-verdict-metric-label">Оновлено</span>
            <div className="idea-updated-value">{updatedAt}</div>
          </div>
        )}
      </div>
    </div>
  );
}
