import React from 'react';
import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function TrendFilters({ filters, categories, onChange, onReset }) {
  return (
    <section className="trend-filters" aria-label="Фільтри Trend Radar">
      <label className="trend-filter-control trend-filter-period">
        <CalendarDays size={15} />
        <select value={filters.days} onChange={(event) => onChange({ days: Number(event.target.value) })} aria-label="Період">
          <option value={7}>Останні 7 днів</option>
          <option value={14}>Останні 14 днів</option>
          <option value={30}>Останні 30 днів</option>
        </select>
      </label>
      <select className="trend-filter-select" value={filters.lane} onChange={(event) => onChange({ lane: event.target.value })} aria-label="Контекст">
        <option value="core">Core ніша</option>
        <option value="context">Context lane</option>
        <option value="all">Core + Context</option>
      </select>
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
      <select className="trend-filter-select" value={filters.format} onChange={(event) => onChange({ format: event.target.value })} aria-label="Формат">
        <option value="any">Усі формати</option>
        <option value="shorts">Shorts</option>
        <option value="longform">Long-form</option>
      </select>
      <select className="trend-filter-select" value={filters.language} onChange={(event) => onChange({ language: event.target.value })} aria-label="Мова">
        <option value="any">Усі мови</option>
        <option value="uk">Українська</option>
        <option value="en">Англійська</option>
        <option value="ru">Російська</option>
      </select>
      <select className="trend-filter-select" value={filters.region} onChange={(event) => onChange({ region: event.target.value })} aria-label="Регіон">
        <option value="any">Усі регіони</option>
        <option value="UA">Україна</option>
        <option value="EU">Європа</option>
        <option value="US">США</option>
      </select>
      <input className="trend-filter-select" value={filters.source === 'any' ? '' : filters.source} onChange={(event) => onChange({ source: event.target.value || 'any' })} placeholder="Джерело: будь-яке" aria-label="Джерело" />
      <input className="trend-filter-select" type="number" min="0" value={filters.minVph} onChange={(event) => onChange({ minVph: Number(event.target.value) })} placeholder="min VPH" aria-label="Мінімальний VPH" />
      <input className="trend-filter-select" type="number" min="0" step="0.1" value={filters.minOutlier} onChange={(event) => onChange({ minOutlier: Number(event.target.value) })} placeholder="min outlier" aria-label="Мінімальний outlier" />
      <Button ghost className="trend-filter-reset" onClick={onReset}>
        <SlidersHorizontal size={15} />Скинути
      </Button>
    </section>
  );
}
