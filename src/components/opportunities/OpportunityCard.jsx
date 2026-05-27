import React from 'react';
import { ArrowRight, Lightbulb, Monitor } from 'lucide-react';
import { compactNumber, percentValue, formatLabel, confidenceTone } from '../../lib/formatters.js';
import { navigateTo } from '../../lib/shared.jsx';

function normalizeAction(action, score) {
  const s = Number(score) || 0;
  if (action === 'avoid') return { label: 'Уникати', tone: 'red' };
  if (action === 'shoot_now' || action === 'shoot' || action === 'recommended' || s >= 75) {
    return { label: 'Знімати зараз', tone: 'green' };
  }
  if (action === 'adapt' || action === 'needs_adaptation') {
    return { label: 'Адаптувати', tone: 'orange' };
  }
  if (action === 'watch' || action === 'monitor') {
    return { label: 'Слідкувати', tone: 'blue' };
  }
  if (s >= 50) return { label: 'Адаптувати', tone: 'orange' };
  return { label: 'Уникати', tone: 'red' };
}

function riskInfo(item) {
  const level = item.riskLevel || item.risk_level;
  const risks = item.risks || item.riskFactors || item.risk_factors || [];
  if (level === 'low') return { label: 'Низький', cls: 'opportunity-risk-low' };
  if (level === 'medium') return { label: 'Середній', cls: 'opportunity-risk-medium' };
  if (level === 'high') return { label: 'Високий', cls: 'opportunity-risk-high' };
  if (risks[0]) {
    const text = String(risks[0]);
    if (/low|низьк/i.test(text)) return { label: 'Низький', cls: 'opportunity-risk-low' };
    if (/high|висок/i.test(text)) return { label: 'Високий', cls: 'opportunity-risk-high' };
    return { label: text.slice(0, 60), cls: 'opportunity-risk-medium' };
  }
  return { label: 'Не визначено', cls: 'opportunity-risk-unknown' };
}

function qualityBadge(quality) {
  const labels = { high: 'Висока', medium: 'Середня', low: 'Низька' };
  const label = labels[quality] || quality || '—';
  const cls = quality === 'high' ? 'opp-quality-badge-green'
    : quality === 'medium' ? 'opp-quality-badge-orange'
    : quality === 'low' ? 'opp-quality-badge-red'
    : 'opp-quality-badge-neutral';
  return <span className={`opp-quality-badge ${cls}`}>{label}</span>;
}

function scoreColor(score) {
  if (score >= 75) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
}

function competitionColor(level) {
  if (level === 'low') return 'green';
  if (level === 'high') return 'red';
  return 'orange';
}

function competitionLabel(level) {
  return { low: 'Low', medium: 'Medium', high: 'High' }[level] || level || '—';
}

function confidenceLabel(c) {
  return { high: 'High', medium: 'Medium', low: 'Low' }[c] || c || '—';
}

function DotMetric({ value, color }) {
  return (
    <div className="opportunity-metric-sub">
      <span className={`opp-dot opp-dot-${color}`} />
      <span style={{ color: `var(--${color})`, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function OpportunityCard({ item }) {
  const id = item.id || item.topic || item.title;
  const title = item.suggestedTitles?.[0] || item.title || item.topic || 'Без назви';
  const score = Math.round(Number(item.opportunityScore || item.opportunity_score || 0));
  const confidence = item.confidence || null;
  const action = item.recommendedAction || item.status || item.verdict || 'watch';
  const format = item.recommendedFormat || item.recommended_format || item.format || null;
  const demandGrowth = item.demandGrowth ?? item.demand_growth ?? item.trendGrowth ?? item.trend_growth ?? null;
  const competition = item.competitionLevel || item.competition_level || item.competition || null;
  const videosAnalyzed = item.dataHealth?.videosAnalyzed || item.videosAnalyzed || item.videos_analyzed || 0;
  const evidenceQuality = item.evidenceQuality || item.evidence_quality || item.confidence || null;
  const reasons = item.whyRecommended || item.why_recommended || item.reasons || [];

  const { label: verdictLabel, tone: verdictTone } = normalizeAction(action, score);
  const risk = riskInfo(item);

  function openBrief() {
    navigateTo(id ? `/brief?id=${encodeURIComponent(id)}` : '/brief');
  }

  function compareIdea() {
    navigateTo(`/idea-lab?compare=${encodeURIComponent(title)}`);
  }

  return (
    <article className="opportunity-card">
      <div className="opportunity-card-header">
        <h3 className="opportunity-card-title">{title}</h3>
        <span className={`opportunity-verdict opportunity-verdict-${verdictTone}`}>{verdictLabel}</span>
      </div>

      <div className="opportunity-metrics-row">
        <div className="opportunity-metric">
          <span className="opportunity-metric-label">Opportunity Score</span>
          <span className={`opportunity-metric-value ${scoreColor(score)}`}>
            {score}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>/100</span>
          </span>
        </div>

        <div className="opportunity-metric">
          <span className="opportunity-metric-label">Впевненість</span>
          {confidence
            ? <DotMetric value={confidenceLabel(confidence)} color={confidenceTone(confidence)} />
            : <span className="opportunity-metric-value neutral">—</span>}
        </div>

        <div className="opportunity-metric">
          <span className="opportunity-metric-label">Попит (7 днів)</span>
          {demandGrowth != null
            ? <span className={`opportunity-metric-value ${Number(demandGrowth) >= 0 ? 'green' : 'red'}`}>
                {percentValue(demandGrowth)}
              </span>
            : <span className="opportunity-metric-value neutral">—</span>}
        </div>

        <div className="opportunity-metric">
          <span className="opportunity-metric-label">Конкуренція</span>
          {competition
            ? <DotMetric value={competitionLabel(competition)} color={competitionColor(competition)} />
            : <span className="opportunity-metric-value neutral">—</span>}
        </div>
      </div>

      <div className="opportunity-details-row">
        <div className="opportunity-detail">
          <span className="opportunity-detail-label">Формат</span>
          <span className="opportunity-detail-value">
            <Monitor size={13} style={{ opacity: 0.6 }} />
            {format ? formatLabel(format) : '—'}
          </span>
        </div>
        <div className="opportunity-detail">
          <span className="opportunity-detail-label">Відео проаналізовано</span>
          <span className="opportunity-detail-value">
            {videosAnalyzed > 0 ? compactNumber(videosAnalyzed) : '—'}
          </span>
        </div>
        <div className="opportunity-detail">
          <span className="opportunity-detail-label">Якість доказів</span>
          <span className="opportunity-detail-value">
            {qualityBadge(evidenceQuality)}
          </span>
        </div>
      </div>

      <div className="opportunity-why">
        <span className="opportunity-why-label">Чому рекомендуємо</span>
        {reasons.length > 0 ? (
          <ul className="opportunity-why-list">
            {reasons.slice(0, 2).map((r, i) => (
              <li key={i} className="opportunity-why-item">
                <span className="opportunity-why-bullet">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="opportunity-why-empty">
            Недостатньо пояснень. Потрібно оновити opportunity analysis.
          </p>
        )}
      </div>

      <div className="opportunity-risk">
        <span className="opportunity-risk-label">Ризик: </span>
        <span className={risk.cls}>{risk.label}</span>
      </div>

      <div className="opportunity-actions">
        <button className="opp-btn-primary" onClick={openBrief}>
          Відкрити бріф <ArrowRight size={14} />
        </button>
        <button className="opp-btn-secondary" onClick={compareIdea}>
          <Lightbulb size={14} />
          Порівняти з моєю ідеєю
        </button>
      </div>
    </article>
  );
}
