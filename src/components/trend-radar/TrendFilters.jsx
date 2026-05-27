import React from 'react';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function TrendFilters({ days, filters, categories, onDaysChange, onChange, onReset }) {
  return (
    <section className="trend-filters" aria-label="Фільтри Trend Radar">
      <label className="trend-filter-control trend-filter-period">
        <CalendarDays size={15} />
        <select value={days} onChange={(event) => onDaysChange(Number(event.target.value))} aria-label="Період">
          <option value={7}>Останні 7 днів</option>
          <option value={14}>Останні 14 днів</option>
          <option value={30}>Останні 30 днів</option>
        </select>
      </label>
      <label className="trend-filter-search">
        <Search size={15} />
        <input
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Пошук теми або ключового слова..."
          aria-label="Пошук теми або ключового слова"
        />
      </label>
      <select className="trend-filter-select" value={filters.category} onChange={(event) => onChange({ category: event.target.value })} aria-label="Категорія">
        <option value="all">Усі категорії</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </select>
      <select className="trend-filter-select" value={filters.direction} onChange={(event) => onChange({ direction: event.target.value })} aria-label="Напрям тренду">
        <option value="all">Усі напрями</option>
        <option value="rising">Зростає</option>
        <option value="stable">Стабільно</option>
        <option value="falling">Падає</option>
      </select>
      <select className="trend-filter-select" value={filters.minEvidence} onChange={(event) => onChange({ minEvidence: Number(event.target.value) })} aria-label="Мінімальний рівень доказів">
        <option value={0}>Будь-яка якість</option>
        <option value={40}>Докази 40+</option>
        <option value={60}>Докази 60+</option>
        <option value={80}>Докази 80+</option>
      </select>
      <Button ghost className="trend-filter-reset" onClick={onReset}>
        <SlidersHorizontal size={15} />Скинути
      </Button>
    </section>
  );
}
