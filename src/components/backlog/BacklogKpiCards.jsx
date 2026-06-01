import React from 'react';
import { ArrowUp, ArrowDown, FolderInput, TrendingUp, CircleCheck, AlertTriangle, Gauge } from 'lucide-react';

const CARD_CONFIG = [
  {
    key: 'total',
    label: 'У Backlog',
    icon: <FolderInput size={18} />,
    suffix: 'ідей збережено',
    deltaHint: 'за 7 днів',
    filter: {},
  },
  {
    key: 'growing',
    label: 'Ростуть сьогодні',
    icon: <TrendingUp size={18} />,
    suffix: 'стали перспективнішими',
    deltaHint: 'за 7 днів',
    filter: { status: 'growing' },
  },
  {
    key: 'ready_to_plan',
    label: 'Готові в план',
    icon: <CircleCheck size={18} />,
    suffix: 'можна брати в роботу',
    deltaHint: 'за 7 днів',
    filter: { status: 'ready_to_plan' },
  },
  {
    key: 'needs_review',
    label: 'Потребують перевірки',
    icon: <AlertTriangle size={18} />,
    suffix: 'треба перевірити',
    deltaHint: 'за 7 днів',
    filter: { status: 'needs_review' },
  },
  {
    key: 'avg_score',
    label: 'Середній Score',
    icon: <Gauge size={18} />,
    suffix: '',
    deltaHint: 'за 7 днів',
    filter: {},
  },
];

function Delta({ value, unit = '' }) {
  if (value === null || value === undefined) return null;
  const positive = value > 0;
  const negative = value < 0;
  const sign = positive ? '+' : '';
  return (
    <span className={`backlog-kpi-delta ${positive ? 'positive' : negative ? 'negative' : 'neutral'}`}>
      {positive ? <ArrowUp size={12} /> : negative ? <ArrowDown size={12} /> : null}
      <strong>{sign}{value}{unit}</strong>
    </span>
  );
}

export default function BacklogKpiCards({ kpis = {}, onFilter }) {
  return (
    <section className="backlog-kpi-grid">
      {CARD_CONFIG.map((card) => {
        const item = kpis[card.key] || {};
        const value = item.value ?? 0;
        const delta = item.delta_7d ?? 0;
        return (
          <button
            type="button"
            key={card.key}
            className={`backlog-kpi-card backlog-kpi-${card.key}`}
            onClick={() => onFilter?.(card.filter)}
          >
            <div className="backlog-kpi-head">
              <span className="backlog-kpi-label">{item.label || card.label}</span>
              <span className="backlog-kpi-icon">{card.icon}</span>
            </div>
            <div className="backlog-kpi-value">{value}</div>
            {card.suffix ? <p className="backlog-kpi-suffix">{card.suffix}</p> : null}
            <div className="backlog-kpi-footer">
              <Delta value={delta} />
              {delta !== null && delta !== undefined ? <span className="backlog-kpi-deltahint">{card.deltaHint}</span> : null}
            </div>
          </button>
        );
      })}
    </section>
  );
}
