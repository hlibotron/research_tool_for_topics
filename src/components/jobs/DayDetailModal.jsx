import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, Clock, Eye, EyeOff, Pencil } from 'lucide-react';
import { numberFmt } from '../../lib/formatters.js';
import { api } from '../../lib/shared.jsx';
import {
  OPERATIONAL_DAY_START_HOUR,
  isNextMorning,
  operationalSortValue,
  orderedOperationalHours,
} from '../../lib/operationalDay.js';

const PALETTE = [
  { border: '#2f7df6', text: '#2f7df6', bg: 'rgba(47,125,246,.10)' },
  { border: '#36c177', text: '#36c177', bg: 'rgba(54,193,119,.10)' },
  { border: '#f59e2e', text: '#d97706', bg: 'rgba(245,158,46,.10)' },
  { border: '#9b6cff', text: '#9b6cff', bg: 'rgba(155,108,255,.10)' },
  { border: '#e75d5d', text: '#e75d5d', bg: 'rgba(231,93,93,.10)' },
  { border: '#06b6d4', text: '#0891b2', bg: 'rgba(6,182,212,.10)' },
  { border: '#f97316', text: '#ea580c', bg: 'rgba(249,115,22,.10)' },
];

function palettFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

// Normalize "9:00" → "09:00" for <input type="time">
function padTime(t) {
  if (!t) return '00:00';
  const [h, m] = t.split(':');
  return `${String(h).padStart(2, '0')}:${String(m || '0').padStart(2, '0')}`;
}

function QuotaBar({ used, limit, scheduleTotal }) {
  if (!limit) return null;
  const usedPct    = Math.min(100, Math.round((used / limit) * 100));
  const schedPct   = Math.min(100 - usedPct, Math.round((scheduleTotal / limit) * 100));
  const afterTotal = used + scheduleTotal;
  const afterPct   = Math.round((afterTotal / limit) * 100);
  const barColor   = afterPct > 90 ? 'var(--red)' : afterPct > 70 ? 'var(--orange)' : 'var(--blue)';

  return (
    <div className="ddQuotaBlock">
      <div className="ddQuotaBar">
        <div className="ddQuotaBarUsed"  style={{ width: `${usedPct}%` }} />
        <div className="ddQuotaBarSched" style={{ width: `${schedPct}%`, background: barColor, opacity: 0.45 }} />
      </div>
      <div className="ddQuotaBarLabels">
        <span>
          Використано: <strong>{numberFmt.format(used)}</strong>
          {scheduleTotal > 0 && (
            <span style={{ color: 'var(--muted)' }}>
              {' '}+ ~{numberFmt.format(scheduleTotal)} за розкладом
            </span>
          )}
        </span>
        <span>Ліміт: <strong>{numberFmt.format(limit)}</strong></span>
      </div>
      {scheduleTotal > 0 && (
        <div className="ddQuotaAfter">
          Після всіх запусків: ~{numberFmt.format(Math.min(afterTotal, limit))} / {numberFmt.format(limit)}
          {afterPct > 90 && <span style={{ color: 'var(--red)', marginLeft: 6 }}>⚠ близько до ліміту</span>}
        </div>
      )}
    </div>
  );
}

function TimeEditInput({ value, onSave, onCancel }) {
  const [val, setVal] = useState(padTime(value));
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  function commit() { onSave(val); }

  return (
    <input
      ref={ref}
      type="time"
      className="ddTimeInput"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      }}
    />
  );
}

function HourCell({ hour, jobs, isStart, editingJob, onStartEdit, onSaveEdit, onCancelEdit }) {
  return (
    <div className={[
      'ddHourCell',
      jobs.length > 0 ? 'ddHourActive' : '',
      isStart ? 'ddHourReset' : '',
    ].filter(Boolean).join(' ')}>
      <div className="ddHourLabel">
        <span>{String(hour).padStart(2, '0')}</span>
        {isStart && <span className="ddResetMark" title="Початок планового дня">↺</span>}
      </div>

      {jobs.map(({ job, time }) => {
        const color     = palettFor(job.execution_group || '');
        const isEditing = editingJob?.name === job.name;
        const isSaving  = isEditing && editingJob.saving;
        const nextMorning = isNextMorning(time);

        return (
          <div
            key={job.name}
            className="ddHourJob"
            style={{ borderLeftColor: color.border, background: color.bg }}
          >
            {isEditing ? (
              <TimeEditInput
                value={editingJob.time}
                onSave={newTime => onSaveEdit(job.name, newTime)}
                onCancel={onCancelEdit}
              />
            ) : (
              <span
                className="ddHourJobTime ddHourJobTimeEdit"
                title="Клікни, щоб змінити час"
                onClick={() => onStartEdit(job.name, time)}
              >
                {padTime(time)}
                {nextMorning && <span className="ddNextDay">+1д</span>}
                {!isSaving && <Pencil size={8} className="ddEditIcon" />}
              </span>
            )}
            <span className="ddHourJobName">{job.title || job.reason || job.name}</span>
            {job.description && (
              <span className="ddHourJobDesc">{job.description}</span>
            )}
            {(job.data_collected || []).length > 0 && (
              <div className="ddHourJobTags">
                {job.data_collected.map(t => (
                  <span key={t} className="ddHourTag">{t}</span>
                ))}
              </div>
            )}
            {job.quota_estimate > 0 && (
              <span className="ddHourJobQuota">~{numberFmt.format(job.quota_estimate)} q</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DayDetailModal({ dayLabel, date, windowLabel, entries, quota, isToday, onClose, onRefresh }) {
  const [showEmpty, setShowEmpty]   = useState(false);
  const [editingJob, setEditingJob] = useState(null); // { name, time, saving, error }
  const [saveError, setSaveError]   = useState(null);

  const totalQuota = entries.reduce((s, { job }) => s + (job.quota_estimate || 0), 0);
  const quotaUsed  = quota?.used  || 0;
  const quotaLimit = quota?.limit || 10000;

  const hourMap = useMemo(() => {
    const map = new Map();
    for (let h = 0; h < 24; h++) map.set(h, []);
    for (const { job, time } of entries) {
      const h = parseInt((time || '').split(':')[0], 10);
      if (!isNaN(h) && h >= 0 && h < 24) map.get(h).push({ job, time });
    }
    for (const jobs of map.values()) {
      jobs.sort((a, b) => operationalSortValue(a.time) - operationalSortValue(b.time));
    }
    return map;
  }, [entries]);

  const activeHours = useMemo(
    () => Array.from({ length: 24 }, (_, h) => h).filter(h => (hourMap.get(h) || []).length > 0),
    [hourMap],
  );

  const displayHours = orderedOperationalHours(showEmpty, activeHours);

  const freeQuota = quotaLimit - totalQuota;
  const suggestions = entries
    .filter(({ job }) => job.quota_estimate > 0)
    .map(({ job }) => ({ job, extraRuns: Math.floor(freeQuota / job.quota_estimate) }))
    .filter(s => s.extraRuns > 0)
    .sort((a, b) => b.extraRuns - a.extraRuns)
    .slice(0, 3);

  function handleStartEdit(jobName, currentTime) {
    setSaveError(null);
    setEditingJob({ name: jobName, time: padTime(currentTime), saving: false });
  }

  async function handleSaveEdit(jobName, newTime) {
    if (!newTime) { setEditingJob(null); return; }
    setEditingJob(s => ({ ...s, saving: true }));
    setSaveError(null);
    try {
      const result = await api('/api/update-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: jobName, changes: { schedule: { time: newTime } } }),
      });
      if (result.ok) {
        setEditingJob(null);
        onRefresh?.();
      } else {
        setSaveError(result.error || 'Помилка збереження');
        setEditingJob(s => ({ ...s, saving: false }));
      }
    } catch (err) {
      setSaveError(String(err));
      setEditingJob(s => ({ ...s, saving: false }));
    }
  }

  return (
    <div
      className="runPreviewOverlay"
      style={{ justifyContent: 'center', alignItems: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ddModal">
        {/* Header */}
        <div className="ddModalHead">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2>{dayLabel}, {date}</h2>
              {isToday && <span className="ddTodayBadge">Сьогодні</span>}
            </div>
            <p className="ddModalSub">
              {windowLabel || `${date} 10:00 - 10:00`} · {entries.length} job{entries.length !== 1 ? 'ів' : ''} · ~{numberFmt.format(totalQuota)} quota
            </p>
          </div>
          <button className="closeBtn" onClick={onClose} aria-label="Закрити">
            <X size={14} />
          </button>
        </div>

        {/* Quota bar */}
        <div className="ddSection">
          <div className="ddSectionTitle">
            <Clock size={13} />
            Квота YouTube API
            <span className="ddResetNote">
              плановий день 10:00-10:00; jobs до 10:00 враховані у попередній день
            </span>
          </div>
          {quotaLimit > 0 ? (
            <QuotaBar used={quotaUsed} limit={quotaLimit} scheduleTotal={totalQuota} />
          ) : (
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Дані квоти недоступні</span>
          )}
        </div>

        <div className="drawerDivider" style={{ margin: '4px 0 12px' }} />

        {/* 24-hour timeline */}
        <div className="ddSection">
          <div className="ddSectionTitle" style={{ marginBottom: 10 }}>
            <span>
              Розклад по годинах
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                ↺ = старт о 10:00 · ранкові години показані як +1д · клікни на час щоб змінити
              </span>
            </span>
            <button
              className="ddToggleEmptyBtn"
              onClick={() => setShowEmpty(v => !v)}
              title={showEmpty ? 'Приховати порожні години' : 'Показати всі години'}
            >
              {showEmpty ? <EyeOff size={12} /> : <Eye size={12} />}
              {showEmpty ? 'Сховати порожні' : 'Показати всі'}
            </button>
          </div>

          {saveError && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8, padding: '6px 10px', background: 'rgba(231,93,93,.08)', borderRadius: 6 }}>
              {saveError}
            </div>
          )}

          <div className={showEmpty ? 'ddTimeGrid' : 'ddTimeGridCompact'}>
            {displayHours.map(h => (
              <HourCell
                key={h}
                hour={h}
                jobs={hourMap.get(h) || []}
                isStart={h === OPERATIONAL_DAY_START_HOUR}
                editingJob={editingJob}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => setEditingJob(null)}
              />
            ))}
          </div>
        </div>

        {/* Quota gap analysis */}
        {freeQuota > 0 && suggestions.length > 0 && (
          <>
            <div className="drawerDivider" style={{ margin: '4px 0 12px' }} />
            <div className="ddSection">
              <div className="ddSectionTitle" style={{ color: 'var(--orange)' }}>
                Вільна квота: ~{numberFmt.format(freeQuota)} од.
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>
                  ({Math.round((freeQuota / quotaLimit) * 100)}% ліміту не використано)
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {suggestions.map(({ job, extraRuns }) => (
                  <span key={job.name}>
                    + ще <strong style={{ color: 'var(--text)' }}>{extraRuns}×</strong>{' '}
                    <span>{job.title || job.name}</span>
                    {' '}(~{numberFmt.format(job.quota_estimate)} од./запуск)
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
