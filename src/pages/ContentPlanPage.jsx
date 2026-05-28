import React, { useState, useEffect, useMemo, useRef, useContext, useCallback } from 'react';
import {
  Plus, Download, Sparkles, Bell, Search, ChevronDown, ChevronLeft, ChevronRight,
  Calendar, FileText, Layers, CheckSquare, Filter, Info, Clock, AlertTriangle,
  Megaphone, X, MoreHorizontal, ListChecks,
} from 'lucide-react';
import { api, usePolling, Link, ToastContext } from '../lib/shared.jsx';
import '../styles/content-plan.css';

// ── Reference data ───────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { key: 7, label: '7 днів' },
  { key: 14, label: '14 днів' },
  { key: 30, label: '30 днів' },
];

const STATUS_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'validate', label: 'Validate' },
  { key: 'brief_ready', label: 'Brief ready' },
  { key: 'ready_to_shoot', label: 'Ready to shoot' },
  { key: 'filming', label: 'Filming' },
  { key: 'editing', label: 'Editing' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
];

const FORMAT_OPTIONS = [
  { key: 'all', label: 'Всі формати' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'long', label: 'Long' },
  { key: 'review', label: 'Review' },
  { key: 'tutorial', label: 'Tutorial' },
  { key: 'experiment', label: 'Experiment' },
  { key: 'diy', label: 'DIY' },
  { key: 'news', label: 'News' },
  { key: 'comparison', label: 'Comparison' },
  { key: 'showcase', label: 'Showcase' },
];

const PRIORITY_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

const SOURCE_OPTIONS = [
  { key: 'all', label: 'Всі джерела' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'idea_lab', label: 'Idea Lab' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'trend_radar', label: 'Trend Radar' },
  { key: 'manual', label: 'Manual' },
  { key: 'summary', label: 'Summary' },
];

const DIFFICULTY_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'easy', label: 'Легка' },
  { key: 'medium', label: 'Середня' },
  { key: 'hard', label: 'Складна' },
];

const BRIEF_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'missing', label: 'Немає' },
  { key: 'draft', label: 'Чернетка' },
  { key: 'ready', label: 'Готовий' },
];

const PURCHASE_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'yes', label: 'Потрібна' },
  { key: 'no', label: 'Не потрібна' },
];

const PRIORITY_TONE = { high: 'red', medium: 'orange', low: 'green' };
const PRIORITY_LABEL = { high: 'Високий', medium: 'Середній', low: 'Низький' };
const PRIORITY_BANNER_LABEL = { high: 'Високий пріоритет', medium: 'Середній пріоритет', low: 'Низький пріоритет' };

const FORMAT_LABEL = {
  shorts: 'Shorts', long: 'Long', review: 'Review', tutorial: 'Tutorial',
  experiment: 'Experiment', diy: 'DIY', news: 'News',
  comparison: 'Comparison', showcase: 'Showcase',
};

const SOURCE_LABEL = {
  opportunities: 'Opportunities', idea_lab: 'Idea Lab', competitors: 'Competitors',
  trend_radar: 'Trend Radar', manual: 'Manual', summary: 'Summary',
};

const DIFFICULTY_LABEL = { easy: 'Легка', medium: 'Середня', hard: 'Складна' };

function deadlineLabel(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const months = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
  return `${d.getDate()} ${months[d.getMonth()]}.`;
}

function shortDateLabel(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' });
}

function compactNumber(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

// ── Header ───────────────────────────────────────────────────────────────────

function PlanHeader({ onAddIdea, onImport, onWeeklyPlan, weeklyLoading }) {
  return (
    <header className="cpHeader">
      <div className="cpHeaderTitle">
        <h1>План контенту</h1>
        <p>Перехід від аналітики до зйомки, монтажу і публікації</p>
      </div>
      <div className="cpHeaderActions">
        <button type="button" className="cpGhostBtn" onClick={onAddIdea}>
          <Plus size={14} /> Додати ідею
        </button>
        <button type="button" className="cpGhostBtn" onClick={onImport}>
          <Download size={14} /> Додати з джерел
        </button>
        <button type="button" className="cpPrimaryBtn" onClick={onWeeklyPlan} disabled={weeklyLoading}>
          <Sparkles size={14} /> {weeklyLoading ? 'Підбираю...' : 'Створити тижневий план'}
        </button>
        <button type="button" className="cpIconBtn" title="Notifications">
          <Bell size={16} />
          <span className="cpIconDot" />
        </button>
        <div className="cpAvatar" />
      </div>
    </header>
  );
}

// ── Filter bar ───────────────────────────────────────────────────────────────

function FilterPill({ icon, label, value, onChange, options }) {
  return (
    <div className="cpFilterPill">
      <div className="cpFilterPillLabel">{icon}<span>{label}</span></div>
      <div className="cpFilterPillSelect">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
        </select>
        <ChevronDown size={12} />
      </div>
    </div>
  );
}

function FilterBar({ filters, setFilters, onShowAll }) {
  const update = (patch) => setFilters({ ...filters, ...patch });
  return (
    <section className="cpFilterBar">
      <FilterPill icon={<Calendar size={11} />} label="Період" value={filters.period_days} onChange={(v) => update({ period_days: Number(v) || 0 })} options={PERIOD_OPTIONS} />
      <FilterPill icon={<Layers size={11} />} label="Статус" value={filters.status} onChange={(v) => update({ status: v })} options={STATUS_OPTIONS} />
      <FilterPill icon={<FileText size={11} />} label="Формат" value={filters.format} onChange={(v) => update({ format: v })} options={FORMAT_OPTIONS} />
      <FilterPill icon={<AlertTriangle size={11} />} label="Пріоритет" value={filters.priority} onChange={(v) => update({ priority: v })} options={PRIORITY_OPTIONS} />
      <FilterPill icon={<Sparkles size={11} />} label="Джерело" value={filters.source} onChange={(v) => update({ source: v })} options={SOURCE_OPTIONS} />
      <FilterPill icon={<Clock size={11} />} label="Складність" value={filters.difficulty} onChange={(v) => update({ difficulty: v })} options={DIFFICULTY_OPTIONS} />
      <FilterPill icon={<FileText size={11} />} label="Бріф" value={filters.brief_status} onChange={(v) => update({ brief_status: v })} options={BRIEF_OPTIONS} />
      <FilterPill icon={<Megaphone size={11} />} label="Покупка" value={filters.purchase} onChange={(v) => update({ purchase: v })} options={PURCHASE_OPTIONS} />
      <button type="button" className="cpAdvancedFilters" onClick={onShowAll}>
        <Filter size={13} /> Фільтри
      </button>
    </section>
  );
}

// ── KPI cards ────────────────────────────────────────────────────────────────

const KPI_DEFS = [
  { key: 'in_week', label: 'У плані цього тижня', sub: '+2 від минулого тижня', valueKey: 'in_week', deltaKey: 'in_week_delta', icon: <Calendar size={14} />, tone: 'cyan' },
  { key: 'ready', label: 'Готові до зйомки', sub: '+11 можна знімати', valueKey: 'ready', deltaKey: 'ready_delta', icon: <CheckSquare size={14} />, tone: 'green' },
  { key: 'validate', label: 'Потребують рішення', sub: 'потребують уточнення', valueKey: 'validate', icon: <AlertTriangle size={14} />, tone: 'orange' },
  { key: 'urgent', label: 'Дедлайни трендів', sub: 'до 48 годин', valueKey: 'urgent', icon: <Clock size={14} />, tone: 'red' },
  { key: 'effort', label: 'Навантаження', sub: 'оцінка роботи', valueKey: 'total_effort_hours', icon: <Clock size={14} />, tone: 'blue', suffix: ' год' },
  { key: 'scheduled', label: 'Заплановано', sub: 'публікацій', valueKey: 'scheduled', icon: <Megaphone size={14} />, tone: 'purple' },
];

function KpiCards({ kpis, onCardClick }) {
  return (
    <section className="cpKpiRow">
      {KPI_DEFS.map((def) => {
        const value = kpis?.[def.valueKey] ?? 0;
        const delta = def.deltaKey ? kpis?.[def.deltaKey] : null;
        return (
          <button type="button" key={def.key} className="cpKpiCard" onClick={() => onCardClick?.(def.key)}>
            <div className="cpKpiHead">
              <span className="cpKpiLabel">{def.label}</span>
              <span className={`cpKpiIcon ${def.tone}`}>{def.icon}</span>
            </div>
            <div className="cpKpiValue">
              {value}{def.suffix || ''}
              {delta ? <span className="cpKpiDelta">+{delta}</span> : null}
            </div>
            <div className="cpKpiSub">{def.sub}</div>
          </button>
        );
      })}
    </section>
  );
}

// ── Recommendation card ─────────────────────────────────────────────────────

function RecommendationCard({ item, onOpenBrief, onSchedule, onShowTasks }) {
  const priority = item.priority || 'medium';
  return (
    <article className={`cpRecCard priority-${priority}`}>
      <span className={`cpRecBanner ${PRIORITY_TONE[priority] || 'orange'}`}>
        <span className="cpDot" /> {PRIORITY_BANNER_LABEL[priority] || 'Пріоритет'}
      </span>
      <h3>{item.title}</h3>
      <div className="cpRecBadges">
        <span className="cpBadge format">{FORMAT_LABEL[item.format] || item.format}</span>
        <span className="cpBadge source">{SOURCE_LABEL[item.source] || item.source}</span>
      </div>
      <div className={`cpRecDeadline ${priority === 'high' ? 'red' : ''}`}>
        Дедлайн: {deadlineLabel(item.deadline)}
      </div>
      <div className="cpRecMeta">
        <div className="cpRecMetaRow">
          <span>Потенціал</span>
          <strong>{item.priority_score || 0}/100</strong>
        </div>
        <div className="cpRecMetaRow">
          <span>Складність</span>
          <strong className={`cpDifficulty ${item.difficulty || 'medium'}`}>
            <span className="cpDot" />{DIFFICULTY_LABEL[item.difficulty] || 'Середня'}
          </strong>
        </div>
      </div>
      <div className="cpRecActions">
        <button type="button" className="cpRecActionBtn" onClick={() => onOpenBrief?.(item)}>Відкрити бриф</button>
        <button type="button" className="cpRecActionIcon" title="Поставити в календар" onClick={() => onSchedule?.(item)}>
          <Calendar size={14} />
        </button>
        <button type="button" className="cpRecActionIcon" title="Показати задачі" onClick={() => onShowTasks?.(item)}>
          <ListChecks size={14} />
        </button>
      </div>
    </article>
  );
}

function WeeklyRecommendations({ recommendations, onOpenBrief, onSchedule, onShowTasks, onShowAll }) {
  const scrollerRef = useRef(null);
  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };
  return (
    <section className="cpSection">
      <div className="cpSectionHead">
        <h2>Що знімати цього тижня <Info size={12} /></h2>
        <button type="button" className="cpSectionLink" onClick={onShowAll}>Показати всі</button>
      </div>
      <div className="cpRecScrollerWrap">
        <button type="button" className="cpScrollNav left" onClick={() => scrollBy(-1)} aria-label="Прокрутити вліво">
          <ChevronLeft size={16} />
        </button>
        <div className="cpRecScroller" ref={scrollerRef}>
          {recommendations.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              onOpenBrief={onOpenBrief}
              onSchedule={onSchedule}
              onShowTasks={onShowTasks}
            />
          ))}
          {!recommendations.length && <div className="cpEmptyState">Поки немає рекомендацій. Імпортуй ідеї з можливостей.</div>}
        </div>
        <button type="button" className="cpScrollNav right" onClick={() => scrollBy(1)} aria-label="Прокрутити вправо">
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

// ── Production board ────────────────────────────────────────────────────────

function BoardCard({ item, compact, onOpen, onDragStart, onDragEnd }) {
  const priority = item.priority || 'medium';
  const checklistDone = (item.checklist || []).filter((s) => s.done).length;
  const checklistTotal = (item.checklist || []).length;
  return (
    <article
      className={`cpBoardCard ${compact ? 'compact' : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, item)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen?.(item)}
    >
      <h4>{item.title}</h4>
      <div className="cpBoardBadges">
        <span className="cpBadge format">{FORMAT_LABEL[item.format] || item.format}</span>
        <span className="cpBadge source">{SOURCE_LABEL[item.source] || item.source}</span>
      </div>
      <div className="cpBoardMetaRow">
        <span className={`cpPriorityChip ${PRIORITY_TONE[priority]}`}>{PRIORITY_LABEL[priority]}</span>
        <span className={`cpDifficulty inline ${item.difficulty || 'medium'}`}><span className="cpDot" />{DIFFICULTY_LABEL[item.difficulty] || 'Середня'}</span>
      </div>
      {checklistTotal > 0 && (
        <div className="cpChecklistProgress">
          <CheckSquare size={12} />
          {checklistDone}/{checklistTotal}
        </div>
      )}
    </article>
  );
}

function BoardColumn({ column, compact, onOpen, onDrop, onAdd, onDragStart, onDragEnd, isDropTarget, setIsDropTarget }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDropTarget?.(column.key);
  };
  const handleDragLeave = () => setIsDropTarget?.(null);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropTarget?.(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) onDrop?.(itemId, column.key);
  };
  return (
    <div
      className={`cpBoardColumn ${isDropTarget ? 'dropTarget' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="cpBoardColHead">
        <div className="cpBoardColTitle">
          <span>{column.label}</span>
          <span className="cpBoardColCount">{column.count}</span>
        </div>
        <button type="button" className="cpBoardColAddIcon" onClick={() => onAdd?.(column.key)} aria-label="Додати в колонку">
          <Plus size={14} />
        </button>
      </header>
      <div className="cpBoardColList">
        {column.items.map((item) => (
          <BoardCard
            key={item.id}
            item={item}
            compact={compact}
            onOpen={onOpen}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
      {column.key === 'backlog' && (
        <button type="button" className="cpBoardAddRow" onClick={() => onAdd?.('backlog')}>
          <Plus size={12} /> Додати ідею
        </button>
      )}
    </div>
  );
}

function ProductionBoard({ columns, onOpen, onMove, onAdd }) {
  const scrollerRef = useRef(null);
  const [compact, setCompact] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const dragItemRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const handleDragStart = (e, item) => {
    dragItemRef.current = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };
  const handleDragEnd = () => { dragItemRef.current = null; setDropTarget(null); };

  return (
    <section className="cpSection">
      <div className="cpSectionHead">
        <h2>Production board <Info size={12} /></h2>
        <div className="cpBoardToolbar">
          <button type="button" className="cpBoardToolPill">
            <Layers size={12} /> Групувати за статусом <ChevronDown size={11} />
          </button>
          <button type="button" className={`cpBoardToolPill ${compact ? 'active' : ''}`} onClick={() => setCompact((c) => !c)}>
            <FileText size={12} /> Компактний вигляд <ChevronDown size={11} />
          </button>
        </div>
      </div>
      <div className="cpBoardWrap">
        <button type="button" className="cpScrollNav board left" onClick={() => scrollBy(-1)} aria-label="Прокрутити board вліво">
          <ChevronLeft size={16} />
        </button>
        <div className="cpBoardScroller" ref={scrollerRef}>
          {columns.map((col) => (
            <BoardColumn
              key={col.key}
              column={col}
              compact={compact}
              onOpen={onOpen}
              onDrop={onMove}
              onAdd={onAdd}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isDropTarget={dropTarget === col.key}
              setIsDropTarget={setDropTarget}
            />
          ))}
        </div>
        <button type="button" className="cpScrollNav board right" onClick={() => scrollBy(1)} aria-label="Прокрутити board вправо">
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────

const CALENDAR_KIND_LABEL = {
  shoot: 'Зйомка', edit: 'Монтаж', publish: 'Публікація', deadline: 'Дедлайн',
};
const CALENDAR_KIND_TONE = {
  shoot: 'green', edit: 'blue', publish: 'purple', deadline: 'red',
};

function startOfWeek(date) {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function PlanCalendar({ entries, onSelect }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const groupedByDayAndKind = useMemo(() => {
    const map = new Map();
    for (const day of days) {
      const key = ymd(day);
      map.set(key, { shoot: [], edit: [], publish: [], deadline: [] });
    }
    for (const e of entries || []) {
      if (map.has(e.date) && map.get(e.date)[e.kind]) {
        map.get(e.date)[e.kind].push(e);
      }
    }
    return map;
  }, [days, entries]);

  const today = ymd(new Date());

  return (
    <section className="cpCard cpCalendarCard">
      <div className="cpCardHead">
        <h2>Календар плану</h2>
      </div>
      <div className="cpCalendarTabs">
        <button type="button" className="active">Тиждень</button>
        <button type="button">Місяць</button>
        <button type="button">Список</button>
      </div>
      <div className="cpCalendarHead">
        <button type="button" className="cpCalNavBtn" onClick={() => setAnchor(addDays(anchor, -7))}>
          <ChevronLeft size={14} />
        </button>
        <span className="cpCalendarRange">
          {weekStart.getDate()}–{addDays(weekStart, 6).getDate()} {weekStart.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}
        </span>
        <button type="button" className="cpCalNavBtn" onClick={() => setAnchor(addDays(anchor, 7))}>
          <ChevronRight size={14} />
        </button>
        <button type="button" className="cpCalTodayBtn" onClick={() => setAnchor(new Date())}>
          Сьогодні
        </button>
      </div>
      <div className="cpCalendarGrid">
        <div className="cpCalendarRowLabels">
          <div />
          {days.map((d) => {
            const key = ymd(d);
            const isToday = key === today;
            return (
              <div key={key} className={`cpCalDay ${isToday ? 'today' : ''}`}>
                <span>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'][(d.getDay() + 6) % 7]} {d.getDate()}</span>
              </div>
            );
          })}
        </div>
        {[
          { key: 'shoot', label: 'Зйомка' },
          { key: 'edit', label: 'Монтаж' },
          { key: 'publish', label: 'Публікація' },
        ].map((row) => (
          <div key={row.key} className="cpCalendarRow">
            <div className="cpCalendarRowLabel">{row.label}</div>
            {days.map((d) => {
              const key = ymd(d);
              const cell = groupedByDayAndKind.get(key);
              const cellEntries = cell?.[row.key] || [];
              return (
                <div key={key} className="cpCalendarCell">
                  {cellEntries.map((e) => (
                    <button
                      key={`${e.item_id}-${e.kind}`}
                      type="button"
                      className={`cpCalendarChip ${CALENDAR_KIND_TONE[e.kind]}`}
                      onClick={() => onSelect?.(e)}
                    >
                      <span className="cpCalendarChipTitle">{e.title}</span>
                      <span className="cpCalendarChipTime">{e.time}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="cpCalendarLegend">
        <span><span className="cpDot green" />Зйомка</span>
        <span><span className="cpDot blue" />Монтаж</span>
        <span><span className="cpDot purple" />Публікація</span>
        <span><span className="cpDot red" />Дедлайн</span>
      </div>
    </section>
  );
}

// ── Backlog ──────────────────────────────────────────────────────────────────

function BacklogPanel({ items, onSelect, onAdd, onShowAll }) {
  return (
    <section className="cpCard cpBacklogCard">
      <div className="cpCardHead">
        <h2>Backlog / Парковка</h2>
        <button type="button" className="cpSectionLink" onClick={onShowAll}>Показати всі</button>
      </div>
      <ul className="cpBacklogList">
        {items.map((item) => (
          <li key={item.id} className="cpBacklogRow" onClick={() => onSelect?.(item)}>
            <span className="cpBacklogTitle">{item.title}</span>
            <div className="cpBacklogBadges">
              <span className="cpBadge format">{FORMAT_LABEL[item.format] || item.format}</span>
              <span className={`cpPriorityChip ${PRIORITY_TONE[item.priority] || 'orange'}`}>{PRIORITY_LABEL[item.priority] || '—'}</span>
              <span className={`cpDifficulty inline ${item.difficulty || 'medium'}`}><span className="cpDot" />{DIFFICULTY_LABEL[item.difficulty] || 'Середня'}</span>
            </div>
          </li>
        ))}
        {!items.length && <li className="cpEmptyState small">Немає відкладених ідей</li>}
      </ul>
      <button type="button" className="cpBoardAddRow" onClick={onAdd}><Plus size={12} /> Додати ідею</button>
    </section>
  );
}

// ── Published ────────────────────────────────────────────────────────────────

function PublishedPanel({ items, onSelect, onShowAll }) {
  return (
    <section className="cpCard cpPublishedCard">
      <div className="cpCardHead">
        <h2>Опубліковано / Аналітика <Info size={12} /></h2>
        <button type="button" className="cpSectionLink" onClick={onShowAll}>Показати всі</button>
      </div>
      <ul className="cpPublishedList">
        {items.map((item) => (
          <li key={item.id} className="cpPublishedRow" onClick={() => onSelect?.(item)}>
            <span className="cpPublishedThumb" />
            <div className="cpPublishedBody">
              <strong>{item.title}</strong>
              <span className="cpPublishedMeta">Опубліковано {shortDateLabel(item.calendar?.publish_date)}</span>
              <div className="cpPublishedStats">
                <div><strong>{compactNumber(item.analytics?.views)}</strong><span>перегляди</span></div>
                <div><strong>{(item.analytics?.ctr ?? 0).toFixed(1)}%</strong><span>CTR</span></div>
                <div><strong>{item.analytics?.comments ?? 0}</strong><span>коментарів</span></div>
              </div>
            </div>
          </li>
        ))}
        {!items.length && <li className="cpEmptyState small">Опублікованих відео немає</li>}
      </ul>
    </section>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ item, onClose, onChecklist, onStatus }) {
  if (!item) return null;
  return (
    <div className="cpDrawerOverlay" onClick={onClose}>
      <aside className="cpDrawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h3>{item.title}</h3>
            <small>{FORMAT_LABEL[item.format] || item.format} · {SOURCE_LABEL[item.source] || item.source}</small>
          </div>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </header>
        <section className="cpDrawerMeta">
          <div><span>Статус</span><strong>{STATUS_OPTIONS.find((s) => s.key === item.status)?.label || item.status}</strong></div>
          <div><span>Пріоритет</span><strong>{PRIORITY_LABEL[item.priority] || '—'}({item.priority_score}/100)</strong></div>
          <div><span>Дедлайн</span><strong>{deadlineLabel(item.deadline)}</strong></div>
          <div><span>Робота</span><strong>{item.effort_hours || 0} год</strong></div>
          <div><span>Складність</span><strong>{DIFFICULTY_LABEL[item.difficulty] || '—'}</strong></div>
          <div><span>Бриф</span><strong>{item.brief_status === 'ready' ? 'Готовий' : item.brief_status === 'draft' ? 'Чернетка' : 'Немає'}</strong></div>
        </section>
        <section>
          <h4>Чек-лист</h4>
          <ul className="cpChecklist">
            {(item.checklist || []).map((step) => (
              <li key={step.key} className={step.done ? 'done' : ''}>
                <input
                  type="checkbox"
                  checked={!!step.done}
                  onChange={(e) => onChecklist?.(step.key, e.target.checked)}
                />
                <span>{step.label}</span>
              </li>
            ))}
            {!item.checklist?.length && <li className="cpEmptyState small">Чек-листу ще немає</li>}
          </ul>
        </section>
        <section>
          <h4>Наступна дія</h4>
          <p>{item.next_action || '—'}</p>
        </section>
        <section>
          <h4>Перемістити статус</h4>
          <div className="cpStatusPicker">
            {STATUS_OPTIONS.filter((s) => s.key !== 'all').map((s) => (
              <button
                type="button"
                key={s.key}
                className={`cpStatusOption ${item.status === s.key ? 'active' : ''}`}
                onClick={() => onStatus?.(s.key)}
              >{s.label}</button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

// ── Add idea modal ───────────────────────────────────────────────────────────

function AddIdeaModal({ open, onClose, onCreate, defaultStatus = 'backlog' }) {
  const [form, setForm] = useState(() => ({
    title: '', format: 'long', priority: 'medium', deadline: '',
    effort_hours: 5, requires_purchase: false, note: '',
    status: defaultStatus,
  }));
  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, status: defaultStatus }));
    }
  }, [open, defaultStatus]);
  if (!open) return null;
  const update = (patch) => setForm({ ...form, ...patch });
  return (
    <div className="cpDrawerOverlay" onClick={onClose}>
      <div className="cpModal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Додати ідею</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </header>
        <form
          className="cpForm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            onCreate({ ...form, source: 'manual' });
          }}
        >
          <label>Назва<input required value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Як зняти..." /></label>
          <div className="cpFormRow">
            <label>Формат<select value={form.format} onChange={(e) => update({ format: e.target.value })}>
              {FORMAT_OPTIONS.filter((o) => o.key !== 'all').map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select></label>
            <label>Пріоритет<select value={form.priority} onChange={(e) => update({ priority: e.target.value })}>
              {PRIORITY_OPTIONS.filter((o) => o.key !== 'all').map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select></label>
          </div>
          <div className="cpFormRow">
            <label>Дедлайн<input type="date" value={form.deadline} onChange={(e) => update({ deadline: e.target.value })} /></label>
            <label>Робота, год<input type="number" min="1" value={form.effort_hours} onChange={(e) => update({ effort_hours: Number(e.target.value) })} /></label>
          </div>
          <label className="cpCheckbox">
            <input type="checkbox" checked={form.requires_purchase} onChange={(e) => update({ requires_purchase: e.target.checked })} />
            Потрібна покупка
          </label>
          <label>Нотатка<textarea value={form.note} onChange={(e) => update({ note: e.target.value })} rows={3} /></label>
          <footer>
            <button type="button" className="cpGhostBtn" onClick={onClose}>Скасувати</button>
            <button type="submit" className="cpPrimaryBtn">Додати в план</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

// ── Confirm-from-sources modal ───────────────────────────────────────────────

const TARGET_STATUS_OPTIONS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'validate', label: 'Validate' },
  { key: 'brief_ready', label: 'Brief ready' },
];

function ConfirmCandidatesModal({ open, onClose, onConfirm }) {
  const [sources, setSources] = useState([]);
  const [activeSource, setActiveSource] = useState('opportunities');
  const [picked, setPicked] = useState({});
  const [targetStatus, setTargetStatus] = useState('validate');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setPicked({});
    api('/api/content-plan/candidates')
      .then((d) => {
        setSources(d.sources || []);
        const firstWithItems = (d.sources || []).find((s) => s.items.length > 0);
        if (firstWithItems) setActiveSource(firstWithItems.key);
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const togglePick = (item) => {
    if (item.already_added) return;
    setPicked((prev) => {
      const next = { ...prev };
      if (next[item.candidate_key]) delete next[item.candidate_key];
      else next[item.candidate_key] = item;
      return next;
    });
  };

  const pickedList = Object.values(picked);

  const handleConfirm = async () => {
    if (!pickedList.length) return;
    setSubmitting(true);
    try {
      await onConfirm(pickedList.map((it) => ({ ...it, status: targetStatus })));
    } finally {
      setSubmitting(false);
    }
  };

  const activeItems = (sources.find((s) => s.key === activeSource)?.items) || [];

  return (
    <div className="cpDrawerOverlay" onClick={onClose}>
      <div className="cpModal cpConfirmModal" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h3>Підтвердити теми для плану</h3>
            <small className="cpFormHint">Жодне відео не потрапляє в план автоматично — обери і підтверди вручну.</small>
          </div>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </header>

        <div className="cpConfirmTabs">
          {sources.map((s) => (
            <button
              type="button"
              key={s.key}
              className={`cpConfirmTab ${activeSource === s.key ? 'active' : ''}`}
              onClick={() => setActiveSource(s.key)}
            >
              {s.label}
              <span className="cpConfirmTabCount">{s.items.length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="cpEmptyState">Завантаження кандидатів...</p>
        ) : (
          <ul className="cpImportList cpConfirmList">
            {activeItems.map((it) => {
              const checked = !!picked[it.candidate_key];
              return (
                <li
                  key={it.candidate_key}
                  className={`${checked ? 'picked' : ''} ${it.already_added ? 'disabled' : ''}`}
                  onClick={() => togglePick(it)}
                >
                  <input type="checkbox" checked={checked} disabled={it.already_added} readOnly />
                  <div className="cpCandidateBody">
                    <strong>{it.title}</strong>
                    {it.subtitle && <small>{it.subtitle}</small>}
                    <div className="cpCandidateBadges">
                      <span className="cpBadge format">{FORMAT_LABEL[it.format] || it.format}</span>
                      <span className={`cpPriorityChip ${PRIORITY_TONE[it.priority] || 'orange'}`}>
                        {PRIORITY_LABEL[it.priority] || '—'} · {it.priority_score}
                      </span>
                      {it.already_added && <span className="cpBadge already">Вже в плані</span>}
                    </div>
                  </div>
                </li>
              );
            })}
            {!activeItems.length && <li className="cpEmptyState small">Немає кандидатів у цьому джерелі</li>}
          </ul>
        )}

        <div className="cpConfirmTarget">
          <span>Додати у статус:</span>
          <div className="cpConfirmStatusPicker">
            {TARGET_STATUS_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.key}
                className={`cpStatusOption ${targetStatus === opt.key ? 'active' : ''}`}
                onClick={() => setTargetStatus(opt.key)}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <footer>
          <button type="button" className="cpGhostBtn" onClick={onClose}>Скасувати</button>
          <button
            type="button"
            className="cpPrimaryBtn"
            disabled={!pickedList.length || submitting}
            onClick={handleConfirm}
          >{submitting ? 'Додаю...' : `Підтвердити та додати${pickedList.length ? ` (${pickedList.length})` : ''}`}</button>
        </footer>
      </div>
    </div>
  );
}

// ── Weekly plan review modal ────────────────────────────────────────────────

function WeeklyPlanModal({ open, picks, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="cpDrawerOverlay" onClick={onClose}>
      <div className="cpModal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Тижневий план</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </header>
        <p className="cpFormHint">Авто-підбір на основі пріоритету, дедлайнів і навантаження. Перегляньте перед підтвердженням.</p>
        <ul className="cpImportList">
          {picks.map((it) => (
            <li key={it.id}>
              <Calendar size={14} />
              <div>
                <strong>{it.title}</strong>
                <small>Зйомка {shortDateLabel(it.calendar?.shoot_date)} · Монтаж {shortDateLabel(it.calendar?.edit_date)} · Публікація {shortDateLabel(it.calendar?.publish_date)}</small>
              </div>
            </li>
          ))}
          {!picks.length && <li className="cpEmptyState small">Слотів немає</li>}
        </ul>
        <footer>
          <button type="button" className="cpGhostBtn" onClick={onClose}>Закрити</button>
          <button type="button" className="cpPrimaryBtn" onClick={onConfirm}>Підтвердити план</button>
        </footer>
      </div>
    </div>
  );
}

// ── Empty plan hero ──────────────────────────────────────────────────────────

function EmptyPlanHero({ onAddIdea, onConfirm }) {
  return (
    <section className="cpEmptyHero">
      <div className="cpEmptyHeroIcon"><ListChecks size={28} /></div>
      <h2>План порожній — додай теми вручну</h2>
      <p>
        Жодне відео не потрапляє в план автоматично. Підтверди ідеї з можливостей,
        outlier-відео конкурентів, gap-аналізу або Trend Radar — або додай власну ідею.
      </p>
      <div className="cpEmptyHeroActions">
        <button type="button" className="cpPrimaryBtn" onClick={onConfirm}>
          <Download size={14} /> Підтвердити з джерел
        </button>
        <button type="button" className="cpGhostBtn" onClick={onAddIdea}>
          <Plus size={14} /> Додати свою ідею
        </button>
      </div>
      <ul className="cpEmptyHeroHints">
        <li><strong>Можливості</strong> · top opportunity-теми за останні 30 днів</li>
        <li><strong>Outlier-відео конкурентів</strong> · видавці з різким ростом</li>
        <li><strong>Gap проти конкурентів</strong> · теми, де конкуренти не закривають потребу</li>
        <li><strong>Trend Radar</strong> · трендові кластери з аналітики</li>
      </ul>
    </section>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ContentPlanPage() {
  const showToast = useContext(ToastContext);
  const [filters, setFilters] = useState({
    period_days: 7, status: 'all', format: 'all', priority: 'all',
    source: 'all', difficulty: 'all', brief_status: 'all', purchase: 'all',
  });
  const [activeItem, setActiveItem] = useState(null);
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [addIdeaStatus, setAddIdeaStatus] = useState('backlog');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [weeklyPicks, setWeeklyPicks] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const recommendationsRef = useRef(null);
  const boardRef = useRef(null);
  const calendarRef = useRef(null);

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') u.set(k, String(v));
    });
    return u.toString();
  }, [filters]);

  const { data, error, loading, reload } = usePolling(
    () => api(`/api/content-plan${qs ? `?${qs}` : ''}`),
    [qs],
    30000,
  );

  const kpis = data?.kpis || {};
  const columns = data?.columns || [];
  const recommendations = data?.recommendations || [];
  const backlog = data?.backlog || [];
  const published = data?.published || [];
  const calendarEntries = data?.calendar || [];

  const totalItems = columns.reduce((sum, c) => sum + (c.count || 0), 0);
  const isEmptyPlan = !loading && totalItems === 0;

  const handleKpiClick = useCallback((key) => {
    if (key === 'in_week') recommendationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (key === 'ready') setFilters((f) => ({ ...f, status: 'ready_to_shoot' }));
    else if (key === 'validate') setFilters((f) => ({ ...f, status: 'validate' }));
    else if (key === 'scheduled') calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (key === 'urgent' || key === 'effort') boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleMove = useCallback(async (itemId, newStatus) => {
    try {
      await api('/api/content-plan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, changes: { status: newStatus } }),
      });
      showToast?.('Статус оновлено', 'green');
      reload();
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    }
  }, [reload, showToast]);

  const handleChecklistToggle = useCallback(async (stepKey, done) => {
    if (!activeItem) return;
    const updated = (activeItem.checklist || []).map((s) => s.key === stepKey ? { ...s, done } : s);
    setActiveItem({ ...activeItem, checklist: updated });
    try {
      await api('/api/content-plan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeItem.id, changes: { checklist: updated } }),
      });
      reload();
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    }
  }, [activeItem, reload, showToast]);

  const handleStatusChange = useCallback(async (newStatus) => {
    if (!activeItem) return;
    await handleMove(activeItem.id, newStatus);
    setActiveItem({ ...activeItem, status: newStatus });
  }, [activeItem, handleMove]);

  const handleCreate = useCallback(async (payload) => {
    try {
      await api('/api/content-plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setAddIdeaOpen(false);
      showToast?.('Ідею додано в план', 'green');
      reload();
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    }
  }, [reload, showToast]);

  const handleConfirmCandidates = useCallback(async (candidates) => {
    try {
      const res = await api('/api/content-plan/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      });
      setConfirmOpen(false);
      const added = res.added?.length || 0;
      const skipped = res.skipped?.length || 0;
      showToast?.(`Підтверджено ${added}${skipped ? ` (пропущено ${skipped})` : ''}`, 'green');
      reload();
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    }
  }, [reload, showToast]);

  const handleWeeklyPlan = useCallback(async () => {
    setWeeklyLoading(true);
    try {
      const res = await api('/api/content-plan/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setWeeklyPicks(res.weekly || []);
      setWeeklyOpen(true);
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    } finally {
      setWeeklyLoading(false);
    }
  }, [showToast]);

  if (loading && !data) {
    return <div className="cpLoading">Завантаження плану контенту...</div>;
  }
  if (error && !data) {
    return <div className="cpPage"><div className="cpEmptyState">Помилка: {error}</div></div>;
  }

  return (
    <div className="cpPage">
      <PlanHeader
        onAddIdea={() => { setAddIdeaStatus('backlog'); setAddIdeaOpen(true); }}
        onImport={() => setConfirmOpen(true)}
        onWeeklyPlan={handleWeeklyPlan}
        weeklyLoading={weeklyLoading}
      />
      <FilterBar filters={filters} setFilters={setFilters} onShowAll={() => showToast?.('Розширені фільтри: TBD', 'blue')} />
      <KpiCards kpis={kpis} onCardClick={handleKpiClick} />

      {isEmptyPlan ? (
        <EmptyPlanHero
          onAddIdea={() => { setAddIdeaStatus('backlog'); setAddIdeaOpen(true); }}
          onConfirm={() => setConfirmOpen(true)}
        />
      ) : null}

      {!isEmptyPlan && (
        <div ref={recommendationsRef}>
          <WeeklyRecommendations
            recommendations={recommendations}
            onOpenBrief={(item) => window.location.href = `/brief?id=${encodeURIComponent(item.id)}`}
            onSchedule={(item) => setActiveItem(item)}
            onShowTasks={setActiveItem}
            onShowAll={() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
        </div>
      )}

      {!isEmptyPlan && (
        <div ref={boardRef}>
          <ProductionBoard
            columns={columns}
            onOpen={setActiveItem}
            onMove={handleMove}
            onAdd={(status) => { setAddIdeaStatus(status); setAddIdeaOpen(true); }}
          />
        </div>
      )}

      {!isEmptyPlan && (
      <div ref={calendarRef} className="cpBottomGrid">
        <PlanCalendar
          entries={calendarEntries}
          onSelect={(e) => {
            const item = (columns.flatMap((c) => c.items) || []).find((i) => i.id === e.item_id);
            if (item) setActiveItem(item);
          }}
        />
        <div className="cpBottomColumn">
          <BacklogPanel
            items={backlog}
            onSelect={setActiveItem}
            onAdd={() => { setAddIdeaStatus('backlog'); setAddIdeaOpen(true); }}
            onShowAll={() => setFilters({ ...filters, status: 'backlog' })}
          />
          <PublishedPanel
            items={published}
            onSelect={setActiveItem}
            onShowAll={() => setFilters({ ...filters, status: 'published' })}
          />
        </div>
      </div>
      )}

      <div className="cpDisclosure">
        <Info size={14} />
        LLM допомагає пріоритезувати план і сформувати задачі. Метрики, статуси і дедлайни базуються на backend-даних.
      </div>

      <DetailDrawer
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onChecklist={handleChecklistToggle}
        onStatus={handleStatusChange}
      />
      <AddIdeaModal
        open={addIdeaOpen}
        onClose={() => setAddIdeaOpen(false)}
        onCreate={(payload) => handleCreate({ ...payload, status: addIdeaStatus })}
        defaultStatus={addIdeaStatus}
      />
      <ConfirmCandidatesModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmCandidates}
      />
      <WeeklyPlanModal
        open={weeklyOpen}
        picks={weeklyPicks}
        onClose={() => setWeeklyOpen(false)}
        onConfirm={() => { setWeeklyOpen(false); showToast?.('Тижневий план підтверджено', 'green'); reload(); }}
      />
    </div>
  );
}
