import React from 'react';
import { ExternalLink } from 'lucide-react';

const STATUS_LABELS = {
  completed:     'Успішно',
  running:       'Виконується',
  failed:        'Помилка',
  stopped:       'Зупинено',
  skipped:       'Пропущено',
  obsolete_failed: 'Застаріло',
  unknown:       'Невідомо',
};

function StatusPill({ status }) {
  const key = STATUS_LABELS[status] ? status : 'unknown';
  return (
    <span className={`statusPillDs ${key}`}>
      {STATUS_LABELS[key] || status}
    </span>
  );
}

export default function LastRunsTable({ runs, jobs = [] }) {
  const recent = runs.slice(0, 12);
  const titleByName = new Map(jobs.map(job => [job.name, job.title || job.reason || job.name]));

  if (!recent.length) {
    return (
      <div className="lastRunsSection">
        <div className="lrsHeader">
          <h2>Історія запусків</h2>
        </div>
        <div className="dsEmpty">
          <p>Запусків ще не було.</p>
          <p>Запустіть рекомендоване оновлення, щоб побачити результати.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lastRunsSection">
      <div className="lrsHeader">
        <h2>Історія запусків</h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{runs.length} запусків</span>
      </div>

      <div className="lastRunsTable">
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Статус</th>
              <th>Запущено</th>
              <th>Оновлено</th>
              <th>Лог</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(run => (
              <tr key={run.log_path || `${run.job_name}-${run.started_at}`}>
                <td>
                  <strong>{titleByName.get(run.job_name) || run.job_name}</strong>
                  {titleByName.has(run.job_name) && <div className="runNoteDs">{run.job_name}</div>}
                  {run.note && <div className="runNoteDs">{run.note}</div>}
                </td>
                <td>
                  <StatusPill status={run.status} />
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {run.started_at || '—'}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {run.updated_at}
                </td>
                <td>
                  {run.log_path && (
                    <a
                      className="logLinkBtn"
                      href={`/file?path=${encodeURIComponent(run.log_path)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={12} />
                      Лог
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
