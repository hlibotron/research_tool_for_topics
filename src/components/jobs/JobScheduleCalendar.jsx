import React, { useMemo, useState } from 'react';
import { numberFmt } from '../../lib/formatters.js';
import { api } from '../../lib/shared.jsx';
import {
  WEEKDAY_KEYS,
  isNextMorning,
  operationalDayForScheduledDay,
  operationalSortValue,
  operationalTodayIndex,
  scheduledDayForOperationalDay,
} from '../../lib/operationalDay.js';
import DayDetailModal from './DayDetailModal.jsx';

const DAYS = WEEKDAY_KEYS;
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const PALETTE = [
  { border: '#2f7df6', text: '#2f7df6', bg: 'rgba(47,125,246,.08)' },
  { border: '#36c177', text: '#36c177', bg: 'rgba(54,193,119,.08)' },
  { border: '#f59e2e', text: '#d97706', bg: 'rgba(245,158,46,.08)' },
  { border: '#9b6cff', text: '#9b6cff', bg: 'rgba(155,108,255,.08)' },
  { border: '#e75d5d', text: '#e75d5d', bg: 'rgba(231,93,93,.08)' },
  { border: '#06b6d4', text: '#0891b2', bg: 'rgba(6,182,212,.08)' },
  { border: '#f97316', text: '#ea580c', bg: 'rgba(249,115,22,.08)' },
];

function palettFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offset);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function buildScheduleMap(jobs) {
  const map = new Map(DAYS.map(d => [d, []]));
  const seen = new Map(DAYS.map(d => [d, new Set()]));

  for (const job of jobs) {
    if (!job.enabled) continue;
    const sched = job.schedule || {};
    const time = sched.time || '';
    if (!time) continue;

    const add = (scheduledDay) => {
      const operationalDay = operationalDayForScheduledDay(scheduledDay, time);
      const daySet = seen.get(operationalDay);
      const key = `${job.name}:${scheduledDay}`;
      if (!daySet || daySet.has(key)) return;
      daySet.add(key);
      map.get(operationalDay).push({ job, time, scheduledDay, operationalDay });
    };

    if (!sched.type || sched.type === 'daily') {
      for (const day of DAYS) add(day);
    } else if (sched.type === 'weekly') {
      for (const day of (sched.days || []).map(d => String(d).toLowerCase())) {
        if (map.has(day)) add(day);
      }
    }
  }

  for (const entries of map.values()) {
    entries.sort((a, b) => operationalSortValue(a.time) - operationalSortValue(b.time));
  }
  return map;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) { return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`; }

function quotaFillClass(pct) {
  if (pct >= 80) return 'fill-good';
  if (pct >= 40) return 'fill-mid';
  return 'fill-low';
}

function DayColumn({ dayIndex, date, entries, isToday, quotaLimit, onDetail, isDragOver, onDragEnterCol, onDragLeaveCol, onDragOverCol, onDropCol }) {
  const totalQuota = entries.reduce((s, { job }) => s + (job.quota_estimate || 0), 0);
  const fillPct = quotaLimit > 0 ? Math.min(100, Math.round((totalQuota / quotaLimit) * 100)) : 0;
  const fillCls = quotaFillClass(fillPct);

  return (
    <div
      className={`schedCol${isToday ? ' schedColToday' : ''}${isDragOver ? ' schedColDragOver' : ''}`}
      onDragEnter={onDragEnterCol}
      onDragLeave={onDragLeaveCol}
      onDragOver={onDragOverCol}
      onDrop={onDropCol}
    >
      <div className="schedColHead">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="schedDayName">{DAY_LABELS[dayIndex]}</span>
            <span className="schedDayDate">{fmtDate(date)}</span>
          </div>
          {totalQuota > 0 && (
            <span className={`schedFillPct ${fillCls}`}>{fillPct}%</span>
          )}
        </div>
        <div className="schedQuotaBarWrap">
          <div className={`schedQuotaBarFill ${fillCls}`} style={{ width: `${fillPct}%` }} />
        </div>
        <span className="schedDayQuota">
          {totalQuota > 0
            ? `${numberFmt.format(totalQuota)} / ${numberFmt.format(quotaLimit)} q`
            : 'Нема запланованих jobs'}
        </span>
        <span className="schedDayWindow">10:00 - 10:00</span>
      </div>

      <div className="schedJobList">
        {entries.length === 0 ? (
          <div className="schedNone">—</div>
        ) : (
          entries.map(({ job, time, scheduledDay }) => {
            const color = palettFor(job.execution_group || '');
            const isWeekly = job.schedule?.type === 'weekly';
            const nextMorning = isNextMorning(time);
            return (
              <div
                key={`${job.name}:${scheduledDay || ''}`}
                className={`schedJobItem${isWeekly ? ' schedJobDraggable' : ''}`}
                style={{ borderLeftColor: color.border, background: color.bg }}
                draggable={isWeekly}
                onDragStart={isWeekly ? (e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    name: job.name,
                    fromDay: scheduledDay || DAYS[dayIndex],
                    days: job.schedule?.days || [],
                    time,
                  }));
                  e.currentTarget.classList.add('schedJobDragging');
                } : undefined}
                onDragEnd={isWeekly ? (e) => {
                  e.currentTarget.classList.remove('schedJobDragging');
                } : undefined}
              >
                <span className="schedJobTime">
                  {time}
                  {nextMorning && <span className="schedNextDay">+1д</span>}
                </span>
                <div className="schedJobBody">
                  <span className="schedJobName">{job.title || job.reason || job.name}</span>
                  <span className="schedJobGroup" style={{ color: color.text }}>
                    {job.execution_group}
                  </span>
                  {job.quota_estimate > 0 && (
                    <span className="schedJobQuota">~{numberFmt.format(job.quota_estimate)} q</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isDragOver && (
        <div className="schedDropHint">Перенести сюди</div>
      )}

      {entries.length > 0 && (
        <button className="schedDetailBtn" onClick={onDetail}>
          Детальніше
        </button>
      )}
    </div>
  );
}

const DAY_FULL_LABELS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота', 'Неділя'];

export default function JobScheduleCalendar({ jobs, quota, onRefresh }) {
  const weekDates  = useMemo(getWeekDates, []);
  const schedMap   = useMemo(() => buildScheduleMap(jobs), [jobs]);
  const todayIdx   = operationalTodayIndex();
  const [openDayIdx, setOpenDayIdx]   = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [dropError, setDropError]     = useState(null);

  const quotaLimit = quota?.limit || 10000;

  const scheduledCount = jobs.filter(j => j.enabled && j.schedule?.time).length;

  const groupsInSchedule = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const job of jobs) {
      if (!job.enabled || !job.schedule?.time) continue;
      if (!seen.has(job.execution_group)) {
        seen.add(job.execution_group);
        list.push(job.execution_group);
      }
    }
    return list;
  }, [jobs]);

  const avgDailyPct = useMemo(() => {
    const totals = DAYS.map(day =>
      (schedMap.get(day) || []).reduce((s, { job }) => s + (job.quota_estimate || 0), 0)
    );
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return quotaLimit > 0 ? Math.round((avg / quotaLimit) * 100) : 0;
  }, [schedMap, quotaLimit]);

  async function handleDrop(e, targetDayIndex) {
    e.preventDefault();
    setDragOverDay(null);
    setDropError(null);

    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return;
    }

    const { name, fromDay, days, time } = data;
    const targetDay = scheduledDayForOperationalDay(DAYS[targetDayIndex], time);
    if (fromDay === targetDay) return;

    const newDays = [...days.filter(d => d !== fromDay), targetDay];
    try {
      const result = await api('/api/update-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, changes: { schedule: { type: 'weekly', days: newDays } } }),
      });
      if (result.ok) {
        onRefresh?.();
      } else {
        setDropError(`${name}: ${result.error || 'Помилка'}`);
      }
    } catch (err) {
      setDropError(String(err));
    }
  }

  if (scheduledCount === 0) {
    return (
      <div className="schedSection">
        <div className="schedSectionHead">
          <h2>Розклад запусків</h2>
        </div>
        <div className="dsEmpty">
          <p>Розклад не налаштовано.</p>
          <p>Додайте поле schedule.time у конфігурацію jobs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedSection">
      <div className="schedSectionHead">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2>Розклад запусків</h2>
          <span className="schedWeekRange">
            {fmtDate(weekDates[0])} – {fmtDate(weekDates[6])}
          </span>
          <span className="schedWeekRange">
            плановий день 10:00-10:00
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {groupsInSchedule.length > 0 && (
            <div className="schedLegend">
              {groupsInSchedule.map(g => {
                const c = palettFor(g);
                return (
                  <span key={g} className="schedLegendItem">
                    <span className="schedLegendDot" style={{ background: c.border }} />
                    {g}
                  </span>
                );
              })}
            </div>
          )}
          <span style={{
            fontSize: 12,
            color: avgDailyPct >= 80 ? 'var(--green)' : avgDailyPct >= 40 ? 'var(--orange)' : 'var(--red)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            Використання квоти: ~{avgDailyPct}% / день
          </span>
        </div>
      </div>

      {dropError && (
        <div style={{ fontSize: 12, color: 'var(--red)', padding: '6px 0' }}>{dropError}</div>
      )}

      <div className="schedGrid">
        {DAYS.map((day, i) => (
          <DayColumn
            key={day}
            dayIndex={i}
            date={weekDates[i]}
            entries={schedMap.get(day) || []}
            isToday={i === todayIdx}
            quotaLimit={quotaLimit}
            isDragOver={dragOverDay === i}
            onDragEnterCol={e => { e.preventDefault(); setDragOverDay(i); }}
            onDragLeaveCol={e => {
              if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null);
            }}
            onDragOverCol={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onDropCol={e => handleDrop(e, i)}
            onDetail={() => setOpenDayIdx(i)}
          />
        ))}
      </div>

      {openDayIdx !== null && (
        <DayDetailModal
          dayLabel={DAY_FULL_LABELS[openDayIdx]}
            date={`${fmtDate(weekDates[openDayIdx])}.${weekDates[openDayIdx].getFullYear()}`}
            windowLabel={`${fmtDate(weekDates[openDayIdx])} 10:00 - ${fmtDate(new Date(weekDates[openDayIdx].getTime() + 24 * 3600000))} 10:00`}
            entries={schedMap.get(DAYS[openDayIdx]) || []}
          quota={quota}
          isToday={openDayIdx === todayIdx}
          onClose={() => setOpenDayIdx(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
