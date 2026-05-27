import React from 'react';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function SummaryFilters({ days, filters, categories, onDaysChange, onChange, onReset }) {
  return (
    <section className="summary-filters" aria-label="Фільтри Summary">
      <label className="summary-filter-control">
        <span>Період</span>
        <div><CalendarDays size={15} /><select value={days} onChange={(event) => onDaysChange(Number(event.target.value))}>
          <option value={7}>7 днів</option>
          <option value={14}>14 днів</option>
          <option value={30}>30 днів</option>
        </select></div>
      </label>
      <label className="summary-filter-control">
        <span>Формат</span>
        <select value={filters.format} onChange={(event) => onChange({ format: event.target.value })}>
          <option value="all">Усі формати</option>
          <option value="shorts">Shorts</option>
          <option value="long-form">Long-form</option>
          <option value="live">Live</option>
          <option value="mid-form">Mid-form</option>
        </select>
      </label>
      <label className="summary-filter-control">
        <span>Категорія</span>
        <select value={filters.category} onChange={(event) => onChange({ category: event.target.value })}>
          <option value="all">Усі категорії</option>
          {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="summary-filter-search">
        <Search size={16} />
        <input value={filters.search} onChange={(event) => onChange({ search: event.target.value })} placeholder="Пошук тем або хештегів..." />
      </label>
      <label className="summary-filter-control">
        <span>Статус тренду</span>
        <select value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
          <option value="all">Усі</option>
          <option value="growing">Growing</option>
          <option value="declining">Declining</option>
          <option value="stable">Stable</option>
        </select>
      </label>
      <Button ghost onClick={onReset}><SlidersHorizontal size={15} />Скинути</Button>
    </section>
  );
}
