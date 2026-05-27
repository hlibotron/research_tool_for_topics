import React from 'react';
import { Search, Calendar } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 7, label: 'Останні 7 днів' },
  { value: 14, label: 'Останні 14 днів' },
  { value: 30, label: 'Останні 30 днів' },
];

const VERDICT_OPTIONS = [
  { value: 'all', label: 'Будь-який' },
  { value: 'shoot_now', label: 'Знімати зараз' },
  { value: 'adapt', label: 'Адаптувати' },
  { value: 'watch', label: 'Слідкувати' },
  { value: 'avoid', label: 'Уникати' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'all', label: 'Будь-яка' },
  { value: 'high', label: 'Висока' },
  { value: 'medium', label: 'Середня' },
  { value: 'low', label: 'Низька' },
];

const FORMAT_OPTIONS = [
  { value: 'all', label: 'Будь-який' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'long_video', label: 'Long video' },
  { value: 'long-form', label: 'Long-form' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'comparison', label: 'Comparison' },
];

export function applyFilters(opportunities, { query, verdict, confidence, format, minScore }) {
  const needle = query.trim().toLowerCase();
  return opportunities.filter(item => {
    const text = [item.topic, item.title, item.suggested_angle, item.suggestedTitles?.[0]]
      .filter(Boolean).join(' ').toLowerCase();
    if (needle && !text.includes(needle)) return false;

    const action = item.suggestedAction || item.status || item.verdict || 'watch';
    if (verdict !== 'all' && action !== verdict) return false;

    if (confidence !== 'all' && item.confidence !== confidence) return false;

    const fmt = item.recommendedFormat || item.recommended_format || item.format || '';
    if (format !== 'all' && fmt !== format) return false;

    const score = Number(item.opportunityScore || item.opportunity_score || 0);
    if (score < minScore) return false;

    return true;
  });
}

export default function OpportunityFilters({ days, query, verdict, confidence, format, minScore, onDaysChange, onQueryChange, onVerdictChange, onConfidenceChange, onFormatChange, onMinScoreChange, onReset }) {
  const hasFilters = query || verdict !== 'all' || confidence !== 'all' || format !== 'all' || minScore > 0;

  return (
    <div className="opportunities-filters">
      <div className="opp-filter-period">
        <Calendar size={14} />
        <select value={days} onChange={e => onDaysChange(Number(e.target.value))}>
          {PERIOD_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="opp-filter-search">
        <Search size={14} />
        <input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Пошук за ключовим словом..."
        />
      </div>

      <select className="opp-filter-select" value={verdict} onChange={e => onVerdictChange(e.target.value)}>
        {VERDICT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className="opp-filter-select" value={confidence} onChange={e => onConfidenceChange(e.target.value)}>
        {CONFIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className="opp-filter-select" value={format} onChange={e => onFormatChange(e.target.value)}>
        {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div className="opp-filter-score">
        <span>Min. Score</span>
        <input
          type="number"
          min={0}
          max={100}
          value={minScore}
          onChange={e => onMinScoreChange(Number(e.target.value) || 0)}
        />
      </div>

      {hasFilters && (
        <button className="opp-filter-reset" onClick={onReset}>
          Скинути
        </button>
      )}
    </div>
  );
}
