import React from 'react';
import { Play, Eye } from 'lucide-react';
import { numberFmt } from '../../lib/formatters.js';

const SCOPE_LABELS = {
  today: 'Сьогодні',
  opportunities: 'Можливості',
  idea_lab: 'Idea Lab',
  ideaLab: 'Idea Lab',
  trends: 'Trend Radar',
  trend_radar: 'Trend Radar',
  summary: 'Summary',
  briefs: 'Бріфи',
  reports: 'Reports',
};

export default function RecommendedRunCard({ recommendedGroup, running, runningGroup, onRun, onPreview }) {
  if (!recommendedGroup) {
    return (
      <div className="recommendedCard" style={{ gridTemplateColumns: '1fr' }}>
        <div className="rcLeft">
          <div className="rcTag">Рекомендовано запустити зараз</div>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>
            Немає доступних груп для запуску. Перевірте конфігурацію jobs у YAML.
          </p>
        </div>
      </div>
    );
  }

  const group = recommendedGroup;
  const isRunning = runningGroup === group.name;
  const isBusy = running !== '' || runningGroup !== '';
  const scopes = group.analytics_scope || [];
  const quotaEst = group.quota_estimate;

  return (
    <div className="recommendedCard">
      <div className="rcLeft">
        <div className="rcTag">Рекомендовано запустити зараз</div>

        <div>
          <h2>{group.title || group.name}</h2>
          <p className="rcTechName">{group.name}</p>
        </div>

        {group.description && (
          <div className="rcWhy">{group.description}</div>
        )}

        {scopes.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 }}>
              Що оновить
            </div>
            <div className="affectedPages">
              {scopes.map(scope => (
                <span key={scope} className="affectedPagePill">
                  {SCOPE_LABELS[scope] || scope}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 16 }}>
          <span>
            <strong style={{ color: 'var(--text)' }}>{group.jobs}</strong> jobs
          </span>
          <span>
            <strong style={{ color: 'var(--text)' }}>{group.enabled}</strong> активних
          </span>
          {group.heavy_jobs > 0 && (
            <span style={{ color: 'var(--orange)' }}>
              {group.heavy_jobs} heavy
            </span>
          )}
        </div>
      </div>

      <div className="rcRight">
        <div className="costCard">
          {quotaEst ? (
            <>
              <div className="costLabel">Витрати</div>
              <div className="costValue">~ {numberFmt.format(quotaEst)}</div>
              <div className="costSub">YouTube API quota</div>
              <div className="costTime">{group.heavy_jobs > 0 ? '15–60 хв' : '5–20 хв'}</div>
              <div className="costSub">Орієнтовний час</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Оцінка quota недоступна</div>
          )}
        </div>

        <button
          className="dsBtn primary"
          disabled={isBusy}
          onClick={() => onRun(group)}
        >
          <Play size={15} />
          {isRunning ? 'Запускається...' : 'Запустити зараз'}
        </button>

        <button
          className="dsBtn secondary"
          onClick={() => onPreview({ type: 'group', data: group })}
        >
          <Eye size={14} />
          Попередній перегляд
        </button>

        {group.next_run_ua && (
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
            Авто-запуск: {group.next_run_ua}
          </div>
        )}
      </div>
    </div>
  );
}
