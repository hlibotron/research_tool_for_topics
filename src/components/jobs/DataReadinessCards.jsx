import React from 'react';
import { numberFmt } from '../../lib/formatters.js';

function parseKyivTimestamp(str) {
  if (!str) return null;
  const [datePart, timePart] = (str || '').split(' ');
  if (!datePart) return null;
  const parts = datePart.split('.');
  if (parts.length < 3) return null;
  const [day, month, year] = parts;
  const [hour = '0', minute = '0'] = (timePart || '').split(':');
  const ts = Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10) - 3,
    parseInt(minute, 10),
  );
  return isNaN(ts) ? null : new Date(ts);
}

function hoursAgoLabel(date) {
  if (!date) return null;
  const diff = (Date.now() - date.getTime()) / 3600000;
  if (diff < 1) return 'Щойно';
  if (diff < 24) return `${Math.floor(diff)} год тому`;
  return `${Math.floor(diff / 24)} дн тому`;
}

function ReadinessCard({ label, value, statusClass, statusDot, statusText, sub }) {
  return (
    <div className="readinessCard">
      <div className="rcLabel">{label}</div>
      <div className="rcValue">{value}</div>
      <div className={`rcStatus ${statusClass}`}>
        <div className={`readinessDot ${statusDot}`} />
        {statusText}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

export default function DataReadinessCards({ jobs, quota, runs, scheduleHealth }) {
  // ── Freshness ──────────────────────────────────────────────────────────────
  const outputDates = jobs.map(j => parseKyivTimestamp(j.last_output)).filter(Boolean);
  const newestOutput = outputDates.length
    ? new Date(Math.max(...outputDates.map(d => d.getTime())))
    : null;
  const hoursAgo = newestOutput ? (Date.now() - newestOutput.getTime()) / 3600000 : null;
  const freshnessClass =
    hoursAgo === null ? 'neutral' : hoursAgo > 24 ? 'critical' : hoursAgo > 12 ? 'stale' : 'fresh';
  const freshnessNote =
    freshnessClass === 'fresh'    ? 'Свіжо' :
    freshnessClass === 'stale'    ? 'Потрібно оновити' :
    freshnessClass === 'critical' ? 'Критично застаріло' : 'Немає даних';

  // ── Quota ──────────────────────────────────────────────────────────────────
  const quotaUsed = quota?.used || 0;
  const quotaLimit = quota?.limit || 10000;
  const quotaPct = quota?.pct ?? Math.round((quotaUsed / quotaLimit) * 100);
  const quotaRemaining = quota?.remaining ?? (quotaLimit - quotaUsed);
  const quotaClass = quotaPct > 85 ? 'critical' : quotaPct > 65 ? 'stale' : 'fresh';

  // ── Evidence score ─────────────────────────────────────────────────────────
  const enabledJobs = jobs.filter(j => j.enabled);
  const withOutput = enabledJobs.filter(j => j.last_output).length;
  const freshCount = enabledJobs.filter(j => {
    const d = parseKyivTimestamp(j.last_output);
    return d && (Date.now() - d.getTime()) < 24 * 3600000;
  }).length;
  const coverage = enabledJobs.length ? withOutput / enabledJobs.length : 0;
  const freshness = enabledJobs.length ? freshCount / enabledJobs.length : 0;
  const recentSuccess = Math.min(runs.filter(r => r.status === 'completed').length, 5);
  const evidenceScore = enabledJobs.length
    ? Math.round((coverage * 40 + freshness * 40 + (recentSuccess / 5) * 20) * 100)
    : 0;
  const evidenceLevel =
    evidenceScore >= 75 ? 'Висока' :
    evidenceScore >= 50 ? 'Середня' :
    evidenceScore > 0   ? 'Низька' : 'Немає даних';
  const evidenceClass =
    evidenceScore >= 75 ? 'fresh' : evidenceScore >= 50 ? 'stale' : evidenceScore > 0 ? 'critical' : 'neutral';

  // ── Last run ───────────────────────────────────────────────────────────────
  const lastSuccess = runs.find(r => r.status === 'completed');

  // ── Guard ──────────────────────────────────────────────────────────────────
  const guardEnabled = !!scheduleHealth?.guard_enabled;
  const allowedCount = jobs.filter(j => j.guard?.allowed).length;
  const blockedCount = jobs.filter(j => j.guard && !j.guard.allowed).length;

  return (
    <div className="dataReadinessGrid">
      <ReadinessCard
        label="Свіжість даних"
        value={hoursAgo !== null ? hoursAgoLabel(newestOutput) : '—'}
        statusClass={freshnessClass}
        statusDot={freshnessClass}
        statusText={freshnessNote}
      />

      <ReadinessCard
        label="Quota 10:00-10:00"
        value={quota?.used != null ? `${numberFmt.format(quotaUsed)} / ${numberFmt.format(quotaLimit)}` : '—'}
        statusClass={quotaClass}
        statusDot={quotaClass}
        statusText={quota?.used != null ? `${quotaPct}% використано` : 'Quota недоступна'}
        sub={quota?.used != null
          ? `Залишилось: ${numberFmt.format(quotaRemaining)} · плановий день з 10:00`
          : undefined}
      />

      <ReadinessCard
        label="Якість доказів"
        value={enabledJobs.length ? `${evidenceScore} / 100` : '—'}
        statusClass={evidenceClass}
        statusDot={evidenceClass}
        statusText={evidenceLevel}
      />

      <ReadinessCard
        label="Останній запуск"
        value={lastSuccess ? lastSuccess.job_name : '—'}
        statusClass={lastSuccess ? 'fresh' : 'neutral'}
        statusDot={lastSuccess ? 'fresh' : 'neutral'}
        statusText={lastSuccess ? lastSuccess.updated_at : 'Запусків ще не було'}
      />

      <ReadinessCard
        label="Guard"
        value={guardEnabled ? 'Активний' : 'Вимкнено'}
        statusClass={guardEnabled ? 'fresh' : 'neutral'}
        statusDot={guardEnabled ? 'fresh' : 'neutral'}
        statusText={`${allowedCount} дозволено · ${blockedCount} заблоковано`}
      />
    </div>
  );
}
