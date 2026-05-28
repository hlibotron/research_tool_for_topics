import React from 'react';
import { ChevronDown, Layout, Globe, UserCheck, Gauge, ShoppingCart, ShieldCheck, EyeOff } from 'lucide-react';
import { hasActiveFilters } from '../../lib/opportunityModel.js';

const FORMAT_OPTIONS = [
  { value: 'all', label: 'Будь-який' },
  { value: 'review', label: 'Review' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'long_video', label: 'Long video' },
];

const CHANNEL_FIT_OPTIONS = [
  { value: 'all', label: 'Будь-який' },
  { value: 'excellent', label: 'Відмінно' },
  { value: 'good', label: 'Добре' },
  { value: 'fair', label: 'Прийнятно' },
  { value: 'poor', label: 'Слабко' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Будь-яка' },
  { value: 'low', label: 'Легка' },
  { value: 'medium', label: 'Середня' },
  { value: 'high', label: 'Складна' },
];

const PERIOD_OPTIONS = [7, 14, 30];

function DropdownPill({ icon: Icon, label, value, options, onChange }) {
  const current = options.find(o => o.value === value);
  const isActive = value !== 'all';
  return (
    <label className={`opp-fb-pill opp-fb-pill-select${isActive ? ' is-active' : ''}`}>
      {Icon ? <Icon size={14} /> : null}
      <span className="opp-fb-pill-label">{label}{current && current.value !== 'all' ? `: ${current.label}` : ''}</span>
      <ChevronDown size={13} className="opp-fb-pill-caret" />
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function TogglePill({ icon: Icon, label, active, onChange }) {
  return (
    <button
      type="button"
      className={`opp-fb-pill opp-fb-pill-toggle${active ? ' is-active' : ''}`}
      onClick={() => onChange(!active)}
    >
      {Icon ? <Icon size={14} /> : null}
      <span className="opp-fb-pill-label">{label}</span>
    </button>
  );
}

export default function OpportunityFilterBar({ days, filters, marketOptions, onDaysChange, onFiltersChange, onReset }) {
  function update(key, value) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const marketsForSelect = [{ value: 'all', label: 'Будь-який' }, ...marketOptions.map(m => ({ value: m, label: m }))];

  return (
    <div className="opp-filterbar">
      <DropdownPill icon={Layout} label="Формат" value={filters.format} options={FORMAT_OPTIONS} onChange={v => update('format', v)} />
      <DropdownPill icon={Globe} label="Ринок" value={filters.market} options={marketsForSelect} onChange={v => update('market', v)} />
      <DropdownPill icon={UserCheck} label="Channel fit" value={filters.channelFit} options={CHANNEL_FIT_OPTIONS} onChange={v => update('channelFit', v)} />
      <DropdownPill icon={Gauge} label="Складність" value={filters.difficulty} options={DIFFICULTY_OPTIONS} onChange={v => update('difficulty', v)} />

      <TogglePill icon={ShoppingCart} label="Без покупок" active={filters.noPurchase} onChange={v => update('noPurchase', v)} />
      <TogglePill icon={ShieldCheck} label="Висока якість доказів" active={filters.highEvidence} onChange={v => update('highEvidence', v)} />
      <TogglePill icon={EyeOff} label="Приховати low-confidence" active={filters.hideLowConfidence} onChange={v => update('hideLowConfidence', v)} />

      <div className="opp-fb-spacer" />

      <div className="opp-fb-period">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            className={`opp-fb-period-btn${days === opt ? ' is-active' : ''}`}
            onClick={() => onDaysChange(opt)}
          >
            {opt} днів
          </button>
        ))}
      </div>

      {hasActiveFilters(filters) && (
        <button type="button" className="opp-fb-reset" onClick={onReset}>Скинути</button>
      )}
    </div>
  );
}
