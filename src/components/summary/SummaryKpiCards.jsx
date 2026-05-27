import React from 'react';
import { Clock3, PlayCircle, TrendingDown, TrendingUp } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import { formatLabel } from '../../lib/formatters.js';

const NO_DATA = 'немає даних';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function percent(value) {
  if (!hasNumber(value)) return NO_DATA;
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${Math.round(number)}%`;
}

function trendStrength(value) {
  if (!hasNumber(value)) return { label: NO_DATA, tone: 'neutral' };
  return Math.abs(Number(value)) >= 80
    ? { label: 'Сильний тренд', tone: 'green' }
    : { label: 'Помірний тренд', tone: 'orange' };
}

function windowLabel(score) {
  if (!hasNumber(score)) return { label: NO_DATA, tone: 'neutral' };
  if (Number(score) >= 8) return { label: 'Відкрите зараз', tone: 'green' };
  if (Number(score) >= 5) return { label: 'Потрібна обережність', tone: 'orange' };
  return { label: 'Слабке', tone: 'red' };
}

function bestFormatRetention(summary) {
  const best = summary.formats.find((item) => String(item.label || item.key).toLowerCase() === String(summary.bestFormat || '').toLowerCase()) || summary.formats[0];
  if (!best || !hasNumber(best.retention)) return NO_DATA;
  const retention = Number(best.retention);
  return retention <= 1 ? `${Math.round(retention * 100)}%` : `${Math.round(retention)}%`;
}

export default function SummaryKpiCards({ summary, days }) {
  const growing = summary.bestGrowing;
  const declining = summary.bestDeclining;
  const growthBadge = trendStrength(growing?.effectiveChange);
  const window = windowLabel(summary.opportunityWindow?.score);
  const formatHasData = Boolean(summary.bestFormat);

  return (
    <section className="summary-kpi-grid">
      <Card className="summary-kpi-card summary-kpi-green">
        <div className="summary-kpi-icon"><TrendingUp size={18} /></div>
        <span>Що зростає</span>
        <strong>{growing?.label || NO_DATA}</strong>
        <b>{percent(growing?.effectiveChange)}</b>
        <small>за останні {days} днів</small>
        <Badge tone={growthBadge.tone}>{growthBadge.label}</Badge>
      </Card>
      <Card className="summary-kpi-card summary-kpi-red">
        <div className="summary-kpi-icon"><TrendingDown size={18} /></div>
        <span>Що падає</span>
        <strong>{declining?.label || NO_DATA}</strong>
        <b>{percent(declining?.effectiveChange)}</b>
        <small>за останні {days} днів</small>
        <Badge tone={declining ? 'red' : 'neutral'}>{declining ? 'Слабкий інтерес' : NO_DATA}</Badge>
      </Card>
      <Card className="summary-kpi-card summary-kpi-blue">
        <div className="summary-kpi-icon"><PlayCircle size={18} /></div>
        <span>Найкращий формат</span>
        <strong>{summary.bestFormat ? formatLabel(summary.bestFormat) : NO_DATA}</strong>
        <b>{bestFormatRetention(summary)}</b>
        <small>середній retention</small>
        <Badge tone={formatHasData ? 'blue' : 'neutral'}>{formatHasData ? 'Найвища ефективність' : NO_DATA}</Badge>
      </Card>
      <Card className="summary-kpi-card summary-kpi-orange">
        <div className="summary-kpi-icon"><Clock3 size={18} /></div>
        <span>Вікно можливостей</span>
        <strong>{hasNumber(summary.opportunityWindow?.score) ? `${summary.opportunityWindow.score}/10` : NO_DATA}</strong>
        <b>{window.label}</b>
        <small>{summary.opportunityWindow?.source === 'fallback' ? 'UI fallback на основі evidence' : 'дані API'}</small>
        <Badge tone={window.tone}>{window.label}</Badge>
      </Card>
    </section>
  );
}
