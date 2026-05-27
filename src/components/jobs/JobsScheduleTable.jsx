import React, { useMemo, useState } from 'react';
import { CalendarPlus, ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../../lib/shared.jsx';
import { numberFmt } from '../../lib/formatters.js';
import { isNextMorning, operationalDayForScheduledDay } from '../../lib/operationalDay.js';

const DAY_OPTIONS = [
  ['monday', 'Пн'],
  ['tuesday', 'Вт'],
  ['wednesday', 'Ср'],
  ['thursday', 'Чт'],
  ['friday', 'Пт'],
  ['saturday', 'Сб'],
  ['sunday', 'Нд'],
];

const DAY_LABELS = Object.fromEntries(DAY_OPTIONS);

const PURPOSE_LABELS = {
  pulse: 'Швидкий зріз',
  refresh: 'Оновлення метрик',
  discovery: 'Пошук трендів',
  competitor: 'Конкуренти',
  decision: 'Рекомендації',
  quota: 'Квота',
  export: 'Експорт',
};

const SOURCE_LABELS = {
  ua_market: 'Ринок України',
  ukrainian: 'Україномовний YouTube',
  global: 'Глобальний YouTube',
  competitors: 'Конкуренти',
  internal: 'Внутрішні дані',
};

const DATA_LABELS = {
  trends: 'тренди',
  videos: 'відео',
  hashtags: 'хештеги',
  opportunities: 'можливості',
  data_health: 'якість даних',
  'mostPopular videos': 'популярні відео',
  views: 'перегляди',
  channels: 'канали',
  categories: 'категорії',
  velocity: 'швидкість росту',
  growth: 'зростання',
  competition: 'конкуренція',
  'search results': 'результати пошуку',
  'video stats': 'статистика відео',
  'channel stats': 'статистика каналів',
  formats: 'формати',
  topics: 'теми',
  recommendations: 'рекомендації',
  reports: 'звіти',
};

function hasUkrainianText(value) {
  return /[А-Яа-яІіЇїЄєҐґ]/.test(String(value || ''));
}

function dataLabel(value) {
  return DATA_LABELS[value] || String(value || '').replaceAll('_', ' ');
}

function jobTopic(job) {
  const text = `${job.name || ''} ${job.job_file || ''}`.toLowerCase();
  if (text.includes('science_tech')) return 'технології та наука';
  if (text.includes('howto_style')) return 'практичні інструкції та стиль';
  if (text.includes('entertainment')) return 'розваги та пакування відео';
  if (text.includes('creator_tools')) return 'інструменти для авторів';
  if (text.includes('tech_diy')) return 'техніка та саморобні рішення';
  if (text.includes('budget_alternatives')) return 'бюджетні альтернативи';
  if (text.includes('open_source_ai')) return 'відкриті інструменти штучного інтелекту';
  if (text.includes('hashtag')) return 'хештеги та категорії';
  if (text.includes('shorts')) return 'короткі відео';
  if (text.includes('longform')) return 'довгі відео';
  return 'усі теми';
}

function sourceLabel(source) {
  return SOURCE_LABELS[source] || source || 'джерело не вказано';
}

function uiJobTitle(job) {
  if (hasUkrainianText(job.title)) return job.title;
  const name = String(job.name || '');
  const file = String(job.job_file || '');
  const topic = jobTopic(job);
  const source = sourceLabel(job.source).toLowerCase();
  if (job.purpose === 'pulse' || name.startsWith('pulse_') || file.includes('top_daily')) {
    return `Швидкий зріз популярних відео: ${source}, ${topic}`;
  }
  if (job.purpose === 'refresh' || name.includes('refresh_tracked_video_snapshots')) {
    return 'Оновити метрики вже знайдених відео';
  }
  if (name.includes('outliers') || file.includes('outliers')) {
    return `Пошук відео з аномальним ростом: ${source}, ${topic}`;
  }
  if (name.includes('hashtag') || file.includes('hashtag')) {
    return `Аналіз хештегів і категорій: ${source}`;
  }
  if (job.purpose === 'competitor' || name.startsWith('competitor_')) {
    if (name.includes('underperformers')) return 'Конкуренти: теми, що провалюються';
    if (name.includes('shorts')) return 'Конкуренти: сильні хуки коротких відео';
    return 'Конкуренти: теми, що переграють середнє';
  }
  if (name.includes('analyze_youtube_opportunities')) return 'Зібрати рекомендації: знімати / адаптувати / уникати';
  if (name.includes('report_youtube_quota')) return 'Оновити звіт по квоті YouTube';
  if (name.includes('export_research_duckdb')) return 'Експорт зібраної аналітики';
  return name.replaceAll('_', ' ');
}

function uiJobDescription(job) {
  if (hasUkrainianText(job.description)) return job.description;
  if (hasUkrainianText(job.explanation)) return job.explanation;
  const name = String(job.name || '');
  const file = String(job.job_file || '');
  const topic = jobTopic(job);
  const source = sourceLabel(job.source).toLowerCase();
  if (job.purpose === 'pulse' || name.startsWith('pulse_') || file.includes('top_daily')) {
    return `Збирає актуальні популярні відео, канали, категорії, перегляди та базові метрики. Джерело: ${source}; фокус: ${topic}.`;
  }
  if (job.purpose === 'refresh' || name.includes('refresh_tracked_video_snapshots')) {
    return 'Повторно читає статистику вже знайдених відео, щоб бачити швидкість росту, зміни переглядів і свіжість доказів.';
  }
  if (name.includes('outliers') || file.includes('outliers')) {
    return `Шукає відео, які ростуть швидше за норму. Збирає результати пошуку, статистику відео, канали, формат і сигнали попиту. Джерело: ${source}.`;
  }
  if (name.includes('hashtag') || file.includes('hashtag')) {
    return `Збирає попит по хештегах, категоріях і темах, щоб бачити сигнали зростання та падіння. Джерело: ${source}.`;
  }
  if (job.purpose === 'competitor' || name.startsWith('competitor_')) {
    return 'Збирає відео конкурентів, результативність, теми та формати, які варто повторити або уникати.';
  }
  if (name.includes('analyze_youtube_opportunities')) {
    return 'Не витрачає квоту YouTube: агрегує вже зібрані сигнали у практичні рекомендації.';
  }
  if (name.includes('report_youtube_quota')) {
    return 'Не витрачає квоту YouTube: перераховує використання квоти і планову витрату за днем 10:00-10:00.';
  }
  if (name.includes('export_research_duckdb')) {
    return 'Не витрачає квоту YouTube: експортує накопичену аналітику для локального аналізу.';
  }
  return 'Оновлює дані для аналітики YouTube.';
}

function parseKyivTimestamp(str) {
  if (!str) return null;
  const [datePart, timePart] = String(str).split(' ');
  if (!datePart) return null;
  const [day, month, year] = datePart.split('.');
  const [hour = '0', minute = '0'] = (timePart || '').split(':');
  const ts = Date.UTC(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10) - 3,
    Number.parseInt(minute, 10),
  );
  return Number.isNaN(ts) ? null : new Date(ts);
}

function freshness(job) {
  const date = parseKyivTimestamp(job.last_output);
  if (!date) return { label: 'ще немає даних', tone: 'muted' };
  const hours = (Date.now() - date.getTime()) / 3600000;
  if (hours < 1) return { label: 'щойно', tone: 'fresh' };
  if (hours < 24) return { label: `${Math.floor(hours)} год тому`, tone: 'fresh' };
  if (hours < 72) return { label: `${Math.floor(hours / 24)} дн тому`, tone: 'stale' };
  return { label: `${Math.floor(hours / 24)} дн тому`, tone: 'critical' };
}

function scheduleFrequency(schedule) {
  if (!schedule?.time) return 'Не в розкладі';
  if (!schedule.type || schedule.type === 'daily') return 'Щодня';
  if (schedule.type === 'weekly') return 'Щотижня';
  return schedule.type;
}

function scheduleDays(schedule) {
  if (!schedule?.time) return '—';
  if (!schedule.type || schedule.type === 'daily') return 'Щодня';
  const days = (schedule.days || []).map(day => DAY_LABELS[day] || day).join(', ');
  return days || '—';
}

function scheduleTimeLabel(schedule) {
  if (!schedule?.time) return '—';
  return `${schedule.time}${isNextMorning(schedule.time) ? ' +1д' : ''}`;
}

function scheduledOperationalNote(schedule) {
  if (!schedule?.time || !isNextMorning(schedule.time)) return null;
  if (!schedule.type || schedule.type === 'daily') {
    return 'Показується у попередньому плановому дні.';
  }
  const operationalDays = (schedule.days || [])
    .map(day => operationalDayForScheduledDay(day, schedule.time))
    .map(day => DAY_LABELS[day] || day)
    .join(', ');
  return operationalDays ? `У плані 10:00-10:00 потрапляє в: ${operationalDays}.` : null;
}

function defaultEditorState(job) {
  const schedule = job.schedule || {};
  const type = schedule.type || 'daily';
  return {
    type,
    time: schedule.time || '10:00',
    days: type === 'weekly'
      ? [...(schedule.days || ['monday'])]
      : ['monday'],
  };
}

function JobScheduleEditor({ job, saving, onCancel, onSave }) {
  const [form, setForm] = useState(() => defaultEditorState(job));
  const selectedDays = new Set(form.days);

  function toggleDay(day) {
    setForm(current => {
      const set = new Set(current.days);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...current, days: [...set] };
    });
  }

  function submit(e) {
    e.preventDefault();
    onSave(job, {
      type: form.type,
      time: form.time,
      days: form.type === 'weekly' ? form.days : [],
    });
  }

  return (
    <form className="jobScheduleEditor" onSubmit={submit}>
      <label>
        Частота
        <select
          value={form.type}
          onChange={e => setForm(current => ({ ...current, type: e.target.value }))}
        >
          <option value="daily">Щодня</option>
          <option value="weekly">Щотижня</option>
        </select>
      </label>

      <label>
        Час
        <input
          type="time"
          value={form.time}
          onChange={e => setForm(current => ({ ...current, time: e.target.value }))}
        />
      </label>

      {form.type === 'weekly' && (
        <div className="jobDayPicker" aria-label="Дні тижня">
          {DAY_OPTIONS.map(([day, label]) => (
            <button
              key={day}
              type="button"
              className={selectedDays.has(day) ? 'active' : ''}
              onClick={() => toggleDay(day)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="jobScheduleEditorActions">
        <button type="submit" className="dsBtn primary" disabled={saving || (form.type === 'weekly' && form.days.length === 0)}>
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
        <button type="button" className="dsBtn secondary" onClick={onCancel} disabled={saving}>
          Скасувати
        </button>
      </div>
    </form>
  );
}

export default function JobsScheduleTable({ jobs, groups, onRefresh, onPreview }) {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [editing, setEditing] = useState('');
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  const groupTitles = useMemo(() => {
    const titles = new Map(groups.map(group => [group.name, group.title || group.name]));
    return titles;
  }, [groups]);

  const groupMeta = useMemo(() => new Map(groups.map(group => [group.name, group])), [groups]);

  const filteredJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter(job => {
      if (groupFilter !== 'all' && job.execution_group !== groupFilter) return false;
      if (statusFilter === 'scheduled' && !job.schedule?.time) return false;
      if (statusFilter === 'unscheduled' && job.schedule?.time) return false;
      if (statusFilter === 'disabled' && job.enabled) return false;
      if (statusFilter === 'enabled' && !job.enabled) return false;
      if (!needle) return true;
      return [
        uiJobTitle(job),
        uiJobDescription(job),
        job.name,
        job.execution_group,
        ...(job.data_collected || []),
      ].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [jobs, query, groupFilter, statusFilter]);

  const totals = useMemo(() => ({
    all: jobs.length,
    scheduled: jobs.filter(job => job.schedule?.time).length,
    enabled: jobs.filter(job => job.enabled).length,
    groups: new Set(jobs.map(job => job.execution_group)).size,
  }), [jobs]);

  const groupedJobs = useMemo(() => {
    const byGroup = new Map();
    for (const group of groups) {
      byGroup.set(group.name, { group, jobs: [] });
    }
    for (const job of filteredJobs) {
      const name = job.execution_group || 'ungrouped';
      if (!byGroup.has(name)) {
        byGroup.set(name, {
          group: {
            name,
            title: groupTitles.get(name) || name,
            description: '',
          },
          jobs: [],
        });
      }
      byGroup.get(name).jobs.push(job);
    }
    return Array.from(byGroup.values())
      .filter(item => item.jobs.length > 0)
      .sort((a, b) => {
        const ai = groups.findIndex(group => group.name === a.group.name);
        const bi = groups.findIndex(group => group.name === b.group.name);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return String(a.group.title || a.group.name).localeCompare(String(b.group.title || b.group.name));
      });
  }, [filteredJobs, groups, groupTitles]);

  function toggleExpanded(name) {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleGroup(name) {
    setCollapsedGroups(current => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function collapseAllGroups() {
    setCollapsedGroups(new Set(groupedJobs.map(item => item.group.name)));
  }

  function expandAllGroups() {
    setCollapsedGroups(new Set());
  }

  function groupStats(groupName, visibleJobs) {
    const allJobs = jobs.filter(job => (job.execution_group || 'ungrouped') === groupName);
    const enabled = allJobs.filter(job => job.enabled).length;
    const scheduled = allJobs.filter(job => job.schedule?.time).length;
    const quota = allJobs.reduce((sum, job) => sum + Number(job.quota_estimate || 0), 0);
    const visibleQuota = visibleJobs.reduce((sum, job) => sum + Number(job.quota_estimate || 0), 0);
    return { all: allJobs.length, visible: visibleJobs.length, enabled, scheduled, quota, visibleQuota };
  }

  async function saveSchedule(job, schedule) {
    setSaving(job.name);
    setError('');
    try {
      const result = await api('/api/update-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: job.name,
          changes: {
            enabled: true,
            schedule,
          },
        }),
      });
      if (!result.ok) throw new Error(result.error || 'Не вдалося зберегти розклад');
      setEditing('');
      onRefresh?.();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving('');
    }
  }

  return (
    <div className="jobsScheduleSection">
      <div className="jobsScheduleHead">
        <div>
          <h2>Всі завдання у розкладі</h2>
          <p>
            Що збирає кожне завдання, у яку групу входить, наскільки свіжі дані і коли воно запускається.
          </p>
        </div>
        <div className="jobsScheduleStats">
          <span>{totals.all} завдань</span>
          <span>{totals.enabled} активних</span>
          <span>{totals.scheduled} у розкладі</span>
          <span>{totals.groups} груп</span>
        </div>
      </div>

      <div className="jobsScheduleToolbar">
        <label className="jobsSearch">
          <Search size={14} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Пошук завдання, групи або даних..."
          />
        </label>

        <label>
          <SlidersHorizontal size={14} />
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
            <option value="all">Всі групи</option>
            {groups.map(group => (
              <option key={group.name} value={group.name}>{group.title || group.name}</option>
            ))}
          </select>
        </label>

        <label>
          Статус
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Всі</option>
            <option value="enabled">Активні</option>
            <option value="disabled">Вимкнені</option>
            <option value="scheduled">У розкладі</option>
            <option value="unscheduled">Без розкладу</option>
          </select>
        </label>

        <div className="jobsGroupTools">
          <button type="button" onClick={expandAllGroups}>Розгорнути</button>
          <button type="button" onClick={collapseAllGroups}>Згорнути</button>
        </div>
      </div>

      {error && <div className="dsNotice red">{error}</div>}

      <div className="jobsScheduleTableWrap">
        <table className="jobsScheduleTable">
          <thead>
            <tr>
              <th>Завдання</th>
              <th>Ціль / що робить</th>
              <th>Дані</th>
              <th>Свіжість</th>
              <th>Розклад</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {groupedJobs.map(({ group, jobs: groupJobs }) => {
              const groupName = group.name;
              const isGroupCollapsed = collapsedGroups.has(groupName);
              const stats = groupStats(groupName, groupJobs);
              return (
                <React.Fragment key={groupName}>
                  <tr className="jobGroupHeaderRow">
                    <td colSpan="6">
                      <div className="jobGroupHeader">
                        <button
                          className="jobGroupToggle"
                          type="button"
                          onClick={() => toggleGroup(groupName)}
                          aria-label={isGroupCollapsed ? 'Розгорнути групу' : 'Згорнути групу'}
                        >
                          {isGroupCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <div className="jobGroupHeaderMain">
                          <div>
                            <strong>{group.title || groupTitles.get(groupName) || groupName}</strong>
                            <span>{group.description || groupMeta.get(groupName)?.description || 'Група завдань зі спільною ціллю збору даних.'}</span>
                          </div>
                          <div className="jobGroupHeaderStats">
                            <span>{stats.visible} показано / {stats.all} завдань</span>
                            <span>{stats.enabled} активних</span>
                            <span>{stats.scheduled} у розкладі</span>
                            <span>~{numberFmt.format(stats.visibleQuota || stats.quota)} quota</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {!isGroupCollapsed && groupJobs.map(job => {
                    const fresh = freshness(job);
                    const isOpen = expanded.has(job.name);
                    const note = scheduledOperationalNote(job.schedule);
                    const collected = job.data_collected || [];
                    return (
                      <React.Fragment key={job.name}>
                        <tr className={job.enabled ? 'jobNestedRow' : 'jobNestedRow jobRowDisabled'}>
                          <td>
                            <button className="jobExpandBtn" onClick={() => toggleExpanded(job.name)} aria-label="Показати деталі">
                              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <div className="jobNameCell">
                              <strong>{uiJobTitle(job)}</strong>
                              <span>{job.name}</span>
                            </div>
                          </td>
                          <td>{uiJobDescription(job)}</td>
                          <td>
                            <div className="jobDataTags">
                              {collected.slice(0, 4).map(item => (
                                <span key={item}>{dataLabel(item)}</span>
                              ))}
                              {collected.length > 4 && <span>+{collected.length - 4}</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`jobFreshness ${fresh.tone}`}>{fresh.label}</span>
                          </td>
                          <td>
                            <div className="jobScheduleCell">
                              <strong>{scheduleFrequency(job.schedule)}</strong>
                              <span>{scheduleDays(job.schedule)} · {scheduleTimeLabel(job.schedule)}</span>
                              {note && <em>{note}</em>}
                            </div>
                          </td>
                          <td>
                            <button
                              className="jobScheduleAction"
                              onClick={() => setEditing(editing === job.name ? '' : job.name)}
                            >
                              <CalendarPlus size={13} />
                              {job.enabled && job.schedule?.time ? 'Змінити' : 'Додати'}
                            </button>
                          </td>
                        </tr>

                        {(isOpen || editing === job.name) && (
                          <tr className="jobDetailRow">
                            <td colSpan="6">
                              <div className="jobDetailPanel">
                                <div>
                                  <h3>Деталі завдання</h3>
                                  <p>{uiJobDescription(job)}</p>
                                  <div className="jobDetailMeta">
                                    <span>Джерело: {SOURCE_LABELS[job.source] || job.source || '—'}</span>
                                    <span>Тип: {PURPOSE_LABELS[job.purpose] || job.purpose || '—'}</span>
                                    <span>Квота: {job.quota_estimate ? `~${numberFmt.format(job.quota_estimate)}` : job.quota_class || '—'}</span>
                                    <span>Файл: {job.job_file || job.command || '—'}</span>
                                  </div>
                                  <button className="logLinkBtn" type="button" onClick={() => onPreview?.({ type: 'job', data: job })}>
                                    Детальний перегляд
                                  </button>
                                </div>

                                {editing === job.name && (
                                  <JobScheduleEditor
                                    job={job}
                                    saving={saving === job.name}
                                    onCancel={() => setEditing('')}
                                    onSave={saveSchedule}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filteredJobs.length && (
        <div className="dsEmpty">
          <p>Немає завдань за цими фільтрами.</p>
          <p>Змініть пошук, групу або статус.</p>
        </div>
      )}
    </div>
  );
}
