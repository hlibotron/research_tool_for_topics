import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Останні 7 днів' },
  { value: '30', label: 'Останні 30 днів' },
  { value: '90', label: 'Останні 90 днів' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: 'growing', label: 'Ростуть' },
  { value: 'ready_to_plan', label: 'Готові в план' },
  { value: 'needs_review', label: 'Потребують перевірки' },
  { value: 'parked', label: 'Запарковані' },
  { value: 'planned', label: 'В плані' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: 'manual', label: 'Manual' },
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'summary', label: 'Summary' },
  { value: 'trend_radar', label: 'Trend Radar' },
  { value: 'competitors', label: 'Competitors' },
  { value: 'idea_lab', label: 'Idea Lab' },
];

const SCORE_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: '75+', label: '75+' },
  { value: '60-74', label: '60–74' },
  { value: 'lt60', label: '<60' },
];

const TREND_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: 'rising', label: 'Росте' },
  { value: 'falling', label: 'Падає' },
  { value: 'stable', label: 'Стабільно' },
];

const PLANNED_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: 'planned', label: 'У плані' },
  { value: 'not_planned', label: 'Не в плані' },
];

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="backlog-filter-control">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function BacklogFilters({ filters, days, onChange, onDaysChange, onMoreFilters }) {
  return (
    <section className="backlog-filters">
      <FilterSelect label="Період" value={String(days)} onChange={(v) => onDaysChange(Number(v))} options={PERIOD_OPTIONS} />
      <FilterSelect label="Статус" value={filters.status} onChange={(v) => onChange({ status: v })} options={STATUS_OPTIONS} />
      <FilterSelect label="Джерело" value={filters.source} onChange={(v) => onChange({ source: v })} options={SOURCE_OPTIONS} />
      <FilterSelect label="Перспективність" value={filters.score} onChange={(v) => onChange({ score: v })} options={SCORE_OPTIONS} />
      <FilterSelect label="Динаміка" value={filters.trend} onChange={(v) => onChange({ trend: v })} options={TREND_OPTIONS} />
      <FilterSelect label="У плані / Не в плані" value={filters.planned} onChange={(v) => onChange({ planned: v })} options={PLANNED_OPTIONS} />
      <button type="button" className="backlog-more-filters" onClick={onMoreFilters}>
        <SlidersHorizontal size={14} />Більше фільтрів
      </button>
      <label className="backlog-search">
        <Search size={14} />
        <input
          type="search"
          placeholder="Пошук ідей"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </label>
    </section>
  );
}
