import React from 'react';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { compactNumber } from '../../lib/formatters.js';

function percent(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'немає даних';
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${Math.round(number)}%`;
}

function RankingTable({ title, rows, tone }) {
  return (
    <section>
      <h3>{title}</h3>
      {rows.length ? (
        <table className="summary-ranking-table">
          <thead><tr><th>#</th><th>Хештег</th><th>Зміна</th><th>Попит</th></tr></thead>
          <tbody>
            {rows.slice(0, 5).map((item, index) => (
              <tr key={item.id || item.label}>
                <td>{index + 1}</td>
                <td>{item.label}</td>
                <td className={tone}>{percent(item.effectiveChange)}</td>
                <td>{item.demand === null || item.demand === undefined ? 'немає даних' : compactNumber(item.demand)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <EmptyState title="Немає даних" text="API не повернув рядки для цього рейтингу." />}
    </section>
  );
}

export default function SummaryRankings({ summary }) {
  return (
    <Card className="summary-rankings" id="rankings">
      <RankingTable title="Топ зростаючих хештегів" rows={summary.risingHashtags} tone="green" />
      <RankingTable title="Топ падаючих хештегів" rows={summary.fallingHashtags} tone="red" />
    </Card>
  );
}
