import React from 'react';
import { Hash, Lightbulb, PlayCircle } from 'lucide-react';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { formatLabel } from '../../lib/formatters.js';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function percent(value) {
  if (!hasNumber(value)) return 'немає даних';
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${Math.round(number)}%`;
}

function retention(value) {
  if (!hasNumber(value)) return 'немає даних';
  const number = Number(value);
  return number <= 1 ? `${Math.round(number * 100)}%` : `${Math.round(number)}%`;
}

function TrendList({ rows, tone }) {
  return (
    <div className="summary-mini-list">
      {rows.map((item) => (
        <div key={item.id || item.label}>
          <span>{item.label}</span>
          <strong className={tone}>{percent(item.effectiveChange)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function SummaryInsightPanels({ summary }) {
  return (
    <section className="summary-insight-panels">
      <Card className="summary-insight-card">
        <div className="summary-panel-title"><h2><Hash size={17} />Хештеги</h2><a href="/summary#rankings">Показати всі хештеги</a></div>
        <h3>Ростуть</h3>
        {summary.risingHashtags.length ? <TrendList rows={summary.risingHashtags.slice(0, 5)} tone="green" /> : <EmptyState title="Немає rising hashtags" text="API не повернув хештеги зі зростанням." />}
        <h3>Падають</h3>
        {summary.fallingHashtags.length ? <TrendList rows={summary.fallingHashtags.slice(0, 5)} tone="red" /> : <p className="muted">Падаючих хештегів у цьому зрізі немає.</p>}
      </Card>
      <Card className="summary-insight-card">
        <div className="summary-panel-title"><h2><Lightbulb size={17} />Теми</h2><a href="/opportunities">Переглянути всі</a></div>
        <h3>Ростуть</h3>
        {summary.risingTopics.length ? <TrendList rows={summary.risingTopics.slice(0, 5)} tone="green" /> : <EmptyState title="Немає rising topics" text="API не повернув теми зі зростанням." />}
        <h3>Падають</h3>
        {summary.fallingTopics.length ? <TrendList rows={summary.fallingTopics.slice(0, 5)} tone="red" /> : <p className="muted">Падаючих тем у цьому зрізі немає.</p>}
      </Card>
      <Card className="summary-insight-card">
        <div className="summary-panel-title"><h2><PlayCircle size={17} />Формати</h2><a href="/trends">Переглянути всі</a></div>
        <div className="summary-format-list">
          {summary.formats.slice(0, 5).map((item) => (
            <div key={item.id || item.label}>
              <div><strong>{formatLabel(item.label)}</strong><span>retention: {retention(item.retention)}</span></div>
              <b>{item.performance === null ? 'немає даних' : Math.round(item.performance).toLocaleString('uk-UA')}</b>
            </div>
          ))}
          {!summary.formats.length ? <EmptyState title="Немає даних форматів" text="API не повернув format_mix або retention/performance." /> : null}
        </div>
      </Card>
    </section>
  );
}
