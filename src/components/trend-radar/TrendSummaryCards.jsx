import React from 'react';
import { PlayCircle, TrendingDown, TrendingUp, Users } from 'lucide-react';
import Card from '../common/Card.jsx';
import { formatLabel, numberFmt } from '../../lib/formatters.js';

const NO_DATA = 'немає даних';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function avg(values) {
  const numbers = values.filter(hasNumber).map(Number);
  if (!numbers.length) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function formatPercent(value) {
  if (!hasNumber(value)) return NO_DATA;
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${Math.round(number)}%`;
}

function competitionAnswer(items) {
  const levels = items.map((item) => String(item.competitionLevel || '').toLowerCase()).filter(Boolean);
  if (!levels.length) return { value: NO_DATA, hint: 'немає точного рівня конкуренції', tone: 'neutral' };
  const high = levels.filter((level) => level === 'high').length;
  const medium = levels.filter((level) => level === 'medium').length;
  if (high / levels.length >= 0.5) return { value: 'Так', hint: `${high} сигналів з високою конкуренцією`, tone: 'red' };
  if (high || medium / levels.length >= 0.5) return { value: 'Частково', hint: `${high + medium} сигналів із середньою або високою конкуренцією`, tone: 'orange' };
  return { value: 'Ні', hint: 'переважає низька конкуренція', tone: 'green' };
}

function strongestFormat(formats) {
  const scored = formats
    .map((item) => {
      const raw = item.raw || {};
      const score = raw.avgRetention ?? raw.avg_retention ?? raw.retention ?? item.evidenceQuality;
      return Number.isFinite(Number(score)) ? { item, score: Number(score) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

export default function TrendSummaryCards({ data }) {
  const topicAndHashtagItems = [...(data.topics || []), ...(data.hashtags || [])];
  const rising = topicAndHashtagItems.filter((item) => item.direction === 'rising');
  const falling = topicAndHashtagItems.filter((item) => item.direction === 'falling');
  const avgGrowth = avg(rising.map((item) => item.demandGrowth));
  const bestFormat = strongestFormat(data.formats || []);
  const saturation = competitionAnswer(topicAndHashtagItems);

  return (
    <section className="trend-summary-cards">
      <Card className="trend-summary-card trend-summary-card-green">
        <div className="trend-summary-icon"><TrendingUp size={18} /></div>
        <div>
          <span>Що зростає зараз</span>
          <strong>{numberFmt.format(rising.length)}</strong>
          <p>{avgGrowth === null ? NO_DATA : `${formatPercent(avgGrowth)} у середньому`}</p>
        </div>
      </Card>
      <Card className="trend-summary-card trend-summary-card-red">
        <div className="trend-summary-icon"><TrendingDown size={18} /></div>
        <div>
          <span>Що падає</span>
          <strong>{numberFmt.format(falling.length)}</strong>
          <p>{falling.length ? 'сигналів втрачають попит' : NO_DATA}</p>
        </div>
      </Card>
      <Card className="trend-summary-card trend-summary-card-blue">
        <div className="trend-summary-icon"><PlayCircle size={18} /></div>
        <div>
          <span>Найсильніший формат</span>
          <strong>{bestFormat ? formatLabel(bestFormat.item.label) : NO_DATA}</strong>
          <p>{bestFormat ? `доказовість/retention: ${Math.round(bestFormat.score)}` : 'немає retention/evidence'}</p>
        </div>
      </Card>
      <Card className={`trend-summary-card trend-summary-card-${saturation.tone}`}>
        <div className="trend-summary-icon"><Users size={18} /></div>
        <div>
          <span>Ніша перенасичена?</span>
          <strong>{saturation.value}</strong>
          <p>{saturation.hint}</p>
        </div>
      </Card>
    </section>
  );
}
