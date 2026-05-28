import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import {
  Search, Bell, RefreshCw, Users, Play, Flame, TrendingUp, Layers,
  Target, ExternalLink, MoreHorizontal, Youtube, ChevronDown, Info,
} from 'lucide-react';
import { api, usePolling, Link, ToastContext } from '../lib/shared.jsx';
import '../styles/competitors.css';

const PERIOD_OPTIONS = [
  { key: 1, label: '24 год' },
  { key: 7, label: '7 днів' },
  { key: 14, label: '14 днів' },
  { key: 30, label: '30 днів' },
];

const REGION_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'ukraine', label: 'Україна' },
  { key: 'europe', label: 'Європа' },
  { key: 'usa', label: 'США' },
];

const LANGUAGE_OPTIONS = [
  { key: 'all', label: 'Всі' },
  { key: 'uk', label: 'Укр' },
  { key: 'en', label: 'Англ' },
  { key: 'ru', label: 'Рос' },
];

const FORMAT_OPTIONS = [
  { key: 'all', label: 'Всі формати' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'long', label: 'Long' },
  { key: 'tutorial', label: 'Tutorial' },
  { key: 'review', label: 'Review' },
  { key: 'experiment', label: 'Experiment' },
  { key: 'news', label: 'News' },
  { key: 'comparison', label: 'Comparison' },
  { key: 'showcase', label: 'Showcase' },
];

const METRIC_OPTIONS = [
  { key: 'views_per_day', label: 'views/day' },
  { key: 'views', label: 'total views' },
  { key: 'comments_per_day', label: 'comments/day' },
  { key: 'engagement_rate', label: 'engagement rate' },
  { key: 'outlier_ratio', label: 'outlier ratio' },
];

const SERIES_COLORS = ['#6c8df5', '#4cb277', '#f5a623', '#a06bd1', '#4ea1ff'];

function compactNumber(n) {
  if (!Number.isFinite(Number(n))) return '0';
  const v = Number(n);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

function formatDateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function fmtDuration(seconds) {
  const s = Number(seconds) || 0;
  if (!s) return '';
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function useCompetitorMonitoring(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) qs.set(k, String(v));
  });
  return usePolling(
    () => api(`/api/competitors/monitoring?${qs.toString()}`),
    [qs.toString()],
    60000,
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

function CompetitorHeader({ search, setSearch, lastUpdated, refreshing, onRefresh }) {
  return (
    <header className="cmHeader">
      <div className="cmHeaderTitle">
        <h1>Моніторинг конкурентів</h1>
        <p>Візуальна аналітика каналів, відео, тем і outlier-сигналів</p>
      </div>
      <div className="cmHeaderActions">
        <div className="cmSearch">
          <Search size={16} />
          <input
            placeholder="Пошук..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="cmIconBtn" type="button" title="Notifications" aria-label="Notifications">
          <Bell size={18} />
          <span className="cmIconDot" />
        </button>
        <div className="cmAvatar"><Users size={14} /></div>
      </div>
      <div className="cmHeaderRefresh">
        <button className="cmRefreshBtn" type="button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={14} />
          {refreshing ? 'Оновлення...' : 'Оновити дані'}
        </button>
        <span className="cmUpdatedLabel">{lastUpdated}</span>
      </div>
    </header>
  );
}

// ── Filter bar ──────────────────────────────────────────────────────────────

function PillGroup({ options, value, onChange }) {
  return (
    <div className="cmPillGroup">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`cmPill ${value === opt.key ? 'active' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="cmSelectWrap">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
      </select>
      <ChevronDown size={14} />
    </div>
  );
}

function ToggleField({ label, value, onChange, accent }) {
  return (
    <label className={`cmToggle ${value ? 'active' : ''} ${accent || ''}`}>
      <span className="cmToggleTrack"><span className="cmToggleThumb" /></span>
      <span className="cmToggleLabel">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} hidden />
    </label>
  );
}

function FilterBar({ filters, setFilters, competitors }) {
  const update = (patch) => setFilters({ ...filters, ...patch });
  return (
    <section className="cmFilterBar">
      <div className="cmFilterRow">
        <FilterGroup label="Період">
          <PillGroup options={PERIOD_OPTIONS} value={filters.days} onChange={(v) => update({ days: v })} />
        </FilterGroup>
        <FilterGroup label="Регіон">
          <PillGroup options={REGION_OPTIONS} value={filters.region} onChange={(v) => update({ region: v })} />
        </FilterGroup>
        <FilterGroup label="Мова">
          <PillGroup options={LANGUAGE_OPTIONS} value={filters.language} onChange={(v) => update({ language: v })} />
        </FilterGroup>
        <FilterGroup label="Конкурент">
          <SelectField
            value={filters.competitor_id}
            onChange={(v) => update({ competitor_id: v })}
            options={[{ key: 'all', label: 'Всі конкуренти' }, ...competitors.map((c) => ({ key: c.channel_id, label: c.title }))]}
          />
        </FilterGroup>
        <FilterGroup label="Формат">
          <SelectField value={filters.format} onChange={(v) => update({ format: v })} options={FORMAT_OPTIONS} />
        </FilterGroup>
        <FilterGroup label="Метрика">
          <SelectField value={filters.metric} onChange={(v) => update({ metric: v })} options={METRIC_OPTIONS} />
        </FilterGroup>
      </div>
      <div className="cmFilterToggles">
        <ToggleField label="Тільки outliers" value={filters.only_outliers} onChange={(v) => update({ only_outliers: v })} />
        <ToggleField label="Тільки нові відео" value={filters.only_new} onChange={(v) => update({ only_new: v })} />
        <ToggleField label="High gap" value={filters.only_high_gap} onChange={(v) => update({ only_high_gap: v })} />
        <ToggleField label="Висока якість доказів" value={filters.high_evidence} onChange={(v) => update({ high_evidence: v })} accent="green" />
      </div>
    </section>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="cmFilterGroup">
      <span className="cmFilterLabel">{label}</span>
      {children}
    </div>
  );
}

// ── KPI cards ───────────────────────────────────────────────────────────────

const KPI_DEFS = [
  { key: 'active_competitors', label: 'Активні конкуренти', icon: <Users size={16} />, tone: 'blue', sub: 'канали в моніторингу', delta: 'active_competitors_delta', deltaFormat: 'signed' },
  { key: 'new_videos', label: 'Нові відео', icon: <Play size={16} />, tone: 'green', sub: (filters) => `за останні ${filters.days} днів`, delta: 'new_videos_delta_percent', deltaFormat: 'percent' },
  { key: 'outlier_videos', label: 'Outlier videos', icon: <Flame size={16} />, tone: 'orange', sub: 'outlier ratio > 1.5x', delta: 'outlier_videos_delta', deltaFormat: 'signed' },
  { key: 'fastest_growth_percent', label: 'Найшвидший ріст', icon: <TrendingUp size={16} />, tone: 'purple', sub: 'fastest_growth_label', deltaFormat: 'raw', valueFormat: 'percent' },
  { key: 'topic_clusters', label: 'Topic clusters', icon: <Layers size={16} />, tone: 'blue', sub: 'активних тем', delta: 'topic_clusters_delta', deltaFormat: 'signed' },
  { key: 'gap_opportunities', label: 'Gap opportunities', icon: <Target size={16} />, tone: 'cyan', sub: 'високий потенціал', delta: 'gap_opportunities_delta', deltaFormat: 'signed' },
];

function KpiCards({ kpis, filters, onCardClick }) {
  return (
    <section className="cmKpiRow">
      {KPI_DEFS.map((def) => {
        const value = kpis?.[def.key] ?? 0;
        const sub = typeof def.sub === 'function' ? def.sub(filters) : (def.sub === 'fastest_growth_label' ? (kpis?.fastest_growth_label || '—') : def.sub);
        const deltaVal = def.delta ? kpis?.[def.delta] : null;
        let deltaText = '';
        let deltaTone = 'green';
        if (deltaVal !== null && deltaVal !== undefined) {
          const n = Number(deltaVal);
          if (def.deltaFormat === 'signed') {
            deltaText = `${n >= 0 ? '+' : ''}${n}`;
            deltaTone = n >= 0 ? 'green' : 'red';
          } else if (def.deltaFormat === 'percent') {
            deltaText = `${n >= 0 ? '+' : ''}${n}%`;
            deltaTone = n >= 0 ? 'green' : 'red';
          }
        }
        const display = def.valueFormat === 'percent'
          ? `${value >= 0 ? '+' : ''}${value}%`
          : compactNumber(value);
        return (
          <button key={def.key} type="button" className="cmKpiCard" onClick={() => onCardClick?.(def.key)}>
            <div className="cmKpiHead">
              <span className={`cmKpiIcon ${def.tone}`}>{def.icon}</span>
              <span className="cmKpiLabel">{def.label}</span>
            </div>
            <div className="cmKpiBody">
              <span className="cmKpiValue">{display}</span>
              {deltaText && <span className={`cmKpiDelta ${deltaTone}`}>{deltaText}</span>}
            </div>
            <span className="cmKpiSub">{sub}</span>
          </button>
        );
      })}
    </section>
  );
}

// ── Chart ───────────────────────────────────────────────────────────────────

function TrendChart({ chart, focusedChannel, onPointClick }) {
  const series = chart?.series || [];
  const allPoints = series.flatMap((s) => s.points || []);
  const allValues = allPoints.map((p) => Number(p.value) || 0);
  const maxVal = Math.max(10, ...allValues);
  const dateLabels = series[0]?.points?.map((p) => p.date) || [];

  const W = 780;
  const H = 320;
  const PL = 44;
  const PR = 16;
  const PT = 12;
  const PB = 32;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const N = dateLabels.length;

  const xScale = (i) => PL + (N <= 1 ? CW / 2 : (i / (N - 1)) * CW);
  const yScale = (v) => PT + CH - (v / maxVal) * CH;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxVal));

  const [hover, setHover] = useState(null);

  const peak = useMemo(() => {
    let best = null;
    series.forEach((s, sIdx) => {
      (s.points || []).forEach((p, idx) => {
        const v = Number(p.value) || 0;
        if (!best || v > best.value) {
          best = { ...p, value: v, seriesIdx: sIdx, pointIdx: idx, channel: s.competitor_title };
        }
      });
    });
    return best;
  }, [series]);

  return (
    <div className="cmChartCard">
      <div className="cmChartHead">
        <h2>Динаміка конкурентів</h2>
        <div className="cmChartTypeSwitch">
          <button type="button" className="active">Лінійний <ChevronDown size={12} /></button>
        </div>
      </div>
      <div className="cmChartMetricTabs">
        {METRIC_OPTIONS.map((opt) => (
          <span key={opt.key} className={`cmMetricTab ${chart?.metric === opt.key ? 'active' : ''}`}>{opt.label}</span>
        ))}
      </div>
      <div className="cmChartBody">
        {N === 0 ? (
          <div className="cmEmptyState">Дані для побудови графіка ще збираються</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="cmChartSvg" preserveAspectRatio="none">
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1={PL} y1={yScale(tick)} x2={PL + CW} y2={yScale(tick)} stroke="rgba(120,140,180,0.15)" strokeDasharray="3,4" />
                <text x={PL - 8} y={yScale(tick) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
                  {compactNumber(tick)}
                </text>
              </g>
            ))}
            {series.map((s, sIdx) => {
              const color = SERIES_COLORS[sIdx % SERIES_COLORS.length];
              const focused = focusedChannel ? focusedChannel === s.competitor_id : true;
              const path = (s.points || []).map((p, i) => {
                const x = xScale(i);
                const y = yScale(Number(p.value) || 0);
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              return (
                <g key={s.competitor_id} opacity={focused ? 1 : 0.18}>
                  <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {(s.points || []).map((p, i) => (
                    <circle
                      key={i}
                      cx={xScale(i)}
                      cy={yScale(Number(p.value) || 0)}
                      r={hover && hover.sIdx === sIdx && hover.idx === i ? 5 : 3}
                      fill={color}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHover({ sIdx, idx: i, point: p, series: s, color })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onPointClick?.(s, p)}
                    />
                  ))}
                </g>
              );
            })}
            {dateLabels.map((d, i) => {
              if (i !== 0 && i !== dateLabels.length - 1 && i % Math.max(1, Math.floor(N / 6)) !== 0) return null;
              return (
                <text key={i} x={xScale(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">
                  {formatDateLabel(d)}
                </text>
              );
            })}
            {peak && (
              <g>
                <circle cx={xScale(peak.pointIdx)} cy={yScale(peak.value)} r={6} fill="none" stroke="#6c8df5" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}
        {hover && (
          <div className="cmChartTooltip" style={{
            left: `${(xScale(hover.idx) / W) * 100}%`,
            top: `${(yScale(Number(hover.point.value) || 0) / H) * 100}%`,
          }}>
            <strong>{hover.series.competitor_title}</strong>
            <small>{formatDateLabel(hover.point.date)} · {compactNumber(hover.point.value)} {chart?.metric}</small>
            {hover.point.video_title && <small className="cmTooltipVid">{hover.point.video_title}</small>}
            {hover.point.outlier_ratio ? <small>outlier {hover.point.outlier_ratio}x</small> : null}
          </div>
        )}
        {peak && (
          <div className="cmChartPeak" style={{
            left: `${Math.min(80, Math.max(15, (xScale(peak.pointIdx) / W) * 100 - 12))}%`,
          }}>
            <strong>Сплеск після публікації</strong>
            <span>{formatDateLabel(peak.date)}, {compactNumber(peak.value)} {chart?.metric}</span>
          </div>
        )}
      </div>
      <div className="cmChartLegend">
        {series.map((s, idx) => (
          <span key={s.competitor_id} className="cmLegendItem">
            <span className="cmLegendDot" style={{ background: SERIES_COLORS[idx % SERIES_COLORS.length] }} />
            {s.competitor_title}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Top movers ──────────────────────────────────────────────────────────────

function Sparkline({ values = [], color = '#4cb277' }) {
  if (!values.length) {
    // Generate slight upward trend placeholder
    values = [3, 4, 3, 5, 4, 6, 7];
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="cmSparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TopMoversPanel({ movers, onSelect, focusedChannel, onShowAll }) {
  return (
    <div className="cmCard cmMoversCard">
      <div className="cmCardHead">
        <h2>Лідери росту</h2>
        <button type="button" className="cmCardLink" onClick={onShowAll}>Переглянути всі</button>
      </div>
      <div className="cmMoversHeader">
        <span>Канал</span>
        <span>Views/day</span>
        <span>Зміна</span>
      </div>
      <ul className="cmMoversList">
        {movers.map((m, idx) => {
          const positive = m.change_percent >= 0;
          return (
            <li
              key={m.competitor_id}
              className={`cmMoverRow ${focusedChannel === m.competitor_id ? 'active' : ''}`}
              onClick={() => onSelect?.(m)}
            >
              <div className="cmMoverChannel">
                <span className="cmMoverAvatar" style={{ background: SERIES_COLORS[idx % SERIES_COLORS.length] }}>
                  {m.competitor_title.slice(0, 2).toUpperCase()}
                </span>
                <span>{m.competitor_title}</span>
              </div>
              <span className="cmMoverVpd">{compactNumber(m.views_per_day)}</span>
              <span className={`cmMoverDelta ${positive ? 'green' : 'red'}`}>
                <Sparkline color={positive ? '#4cb277' : '#e25c5c'} />
                {positive ? '+' : ''}{m.change_percent}%
              </span>
            </li>
          );
        })}
        {!movers.length && <li className="cmEmptyState small">Поки немає даних про лідерів росту</li>}
      </ul>
    </div>
  );
}

// ── Videos table ────────────────────────────────────────────────────────────

const REGION_LABEL = {
  ukraine: 'Україна',
  europe: 'Європа',
  usa: 'США',
  unknown: '—',
};
const LANGUAGE_LABEL = {
  uk: 'Укр',
  en: 'Англ',
  ru: 'Рос',
  unknown: '—',
};

function FormatBadge({ format }) {
  const map = {
    review: { label: 'Review', tone: 'blue' },
    tutorial: { label: 'Tutorial', tone: 'green' },
    shorts: { label: 'Shorts', tone: 'orange' },
    long: { label: 'Long', tone: 'neutral' },
    experiment: { label: 'Experiment', tone: 'purple' },
    news: { label: 'News', tone: 'red' },
    comparison: { label: 'Comparison', tone: 'blue' },
    showcase: { label: 'Showcase', tone: 'purple' },
  };
  const entry = map[format] || { label: format || '—', tone: 'neutral' };
  return <span className={`cmFormatBadge ${entry.tone}`}>{entry.label}</span>;
}

function OutlierBadge({ ratio }) {
  const r = Number(ratio) || 0;
  let tone = 'gray';
  if (r >= 2) tone = 'green';
  else if (r >= 1.5) tone = 'orange';
  else if (r >= 1.0) tone = 'yellow';
  return <span className={`cmOutlierBadge ${tone}`}>{r.toFixed(1)}x</span>;
}

function VideosTable({ videos, onDetails, onAction }) {
  const [visible, setVisible] = useState(12);
  const slice = videos.slice(0, visible);
  return (
    <section className="cmCard cmVideosCard">
      <div className="cmCardHead">
        <h2>Останні відео конкурентів</h2>
      </div>
      <div className="cmVideosTableWrap">
        <table className="cmVideosTable">
          <thead>
            <tr>
              <th>Відео</th>
              <th>Канал</th>
              <th>Регіон</th>
              <th>Мова</th>
              <th>Формат</th>
              <th>Опубліковано</th>
              <th>Views/day</th>
              <th>Engagement</th>
              <th>Outlier</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((v) => (
              <tr key={v.video_id}>
                <td>
                  <a href={v.url} target="_blank" rel="noreferrer" className="cmVideoCell">
                    <span className="cmVideoThumb" style={{ backgroundImage: v.thumbnail_url ? `url(${v.thumbnail_url})` : 'none' }}>
                      {fmtDuration(v.duration_seconds) && <span className="cmVideoDuration">{fmtDuration(v.duration_seconds)}</span>}
                    </span>
                    <span className="cmVideoTitle">{v.title}</span>
                  </a>
                </td>
                <td>
                  <div className="cmVideoChannel">
                    <span className="cmVideoChannelAvatar">{(v.channel_title || '?').slice(0, 2).toUpperCase()}</span>
                    <span>{v.channel_title}</span>
                  </div>
                </td>
                <td>{REGION_LABEL[v.region] || '—'}</td>
                <td>{LANGUAGE_LABEL[v.language] || '—'}</td>
                <td><FormatBadge format={v.format} /></td>
                <td>{(v.published_at || '').replace('T', ' ').slice(0, 16)}</td>
                <td>{compactNumber(v.views_per_day)}</td>
                <td>{((Number(v.engagement_rate) || 0) * 100).toFixed(1)}%</td>
                <td><OutlierBadge ratio={v.outlier_ratio} /></td>
                <td>
                  <div className="cmRowActions">
                    <a href={v.url} target="_blank" rel="noreferrer" className="cmActionBtn youtube" title="Відкрити на YouTube">
                      <Youtube size={14} />
                    </a>
                    <button type="button" className="cmActionBtn" onClick={() => onDetails?.(v)}>Деталі</button>
                    <button type="button" className="cmActionBtn icon" onClick={() => onAction?.(v)} title="Більше дій">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!slice.length && (
              <tr><td colSpan="10" className="cmEmptyState">Немає відео за поточними фільтрами</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {visible < videos.length && (
        <button type="button" className="cmShowMore" onClick={() => setVisible(visible + 12)}>
          Показати ще 12 відео <ChevronDown size={14} />
        </button>
      )}
    </section>
  );
}

// ── Outlier grid ────────────────────────────────────────────────────────────

function OutlierGrid({ outliers, onCreateOpportunity, onShowAll }) {
  return (
    <section className="cmCard cmOutlierCard">
      <div className="cmCardHead">
        <h2>Outlier videos</h2>
        <button type="button" className="cmCardLink" onClick={onShowAll}>Переглянути всі</button>
      </div>
      <div className="cmOutlierGrid">
        {outliers.slice(0, 3).map((v) => (
          <article key={v.video_id} className="cmOutlierItem">
            <a href={v.url} target="_blank" rel="noreferrer" className="cmOutlierThumb" style={{ backgroundImage: v.thumbnail_url ? `url(${v.thumbnail_url})` : 'none' }}>
              {fmtDuration(v.duration_seconds) && <span className="cmVideoDuration">{fmtDuration(v.duration_seconds)}</span>}
            </a>
            <h4>{v.title}</h4>
            <p className="cmOutlierMeta">{v.channel_title}</p>
            <div className="cmOutlierStats">
              <OutlierBadge ratio={v.outlier_ratio} />
              <span>{compactNumber(v.views_per_day)} views/day</span>
            </div>
            <button type="button" className="cmGhostBtn" onClick={() => onCreateOpportunity?.(v)}>
              Створити opportunity
            </button>
          </article>
        ))}
        {!outliers.length && <div className="cmEmptyState">Outlier-видо ще не виявлено</div>}
      </div>
    </section>
  );
}

// ── Topic clusters ──────────────────────────────────────────────────────────

const SATURATION_LABEL = { low: 'Низька насиченість', medium: 'Середня насиченість', high: 'Висока насиченість' };

function TopicClustersPanel({ clusters, onSelect, onShowAll }) {
  return (
    <section className="cmCard cmTopicsCard">
      <div className="cmCardHead">
        <h2>Теми, які повторюються</h2>
        <button type="button" className="cmCardLink" onClick={onShowAll}>Переглянути всі</button>
      </div>
      <ul className="cmTopicsList">
        {clusters.slice(0, 5).map((c) => (
          <li key={c.id} className="cmTopicRow" onClick={() => onSelect?.(c)}>
            <div>
              <h4>{c.title}</h4>
              <div className="cmTopicMeta">
                <span>{c.videos_count} відео</span>
                <span>{c.channels_count} каналів</span>
                <span>Формат: {c.dominant_format}</span>
              </div>
            </div>
            <span className={`cmSaturationBadge ${c.saturation_level}`}>{SATURATION_LABEL[c.saturation_level] || c.saturation_level}</span>
          </li>
        ))}
        {!clusters.length && <li className="cmEmptyState small">Топіків поки не виявлено</li>}
      </ul>
    </section>
  );
}

// ── Gaps panel ──────────────────────────────────────────────────────────────

function GapsPanel({ gaps, onEvidence, onSendToIdeaLab, onShowAll }) {
  return (
    <section className="cmCard cmGapsCard">
      <div className="cmCardHead">
        <h2>Gap проти конкурентів</h2>
        <button type="button" className="cmCardLink" onClick={onShowAll}>Переглянути всі</button>
      </div>
      <ul className="cmGapsList">
        {gaps.slice(0, 3).map((g) => (
          <li key={g.id} className="cmGapItem">
            <h4>{g.topic}</h4>
            <div className="cmGapColumns">
              <div>
                <span className="cmGapHint">Що роблять конкуренти</span>
                <strong>{g.competitor_behavior}</strong>
              </div>
              <div>
                <span className="cmGapHint">Що бракує</span>
                <strong>{g.missing_angle}</strong>
              </div>
            </div>
            <div className="cmGapColumns">
              <div>
                <span className="cmGapHint">Рекомендований формат</span>
                <strong>{g.recommended_format}</strong>
              </div>
              <div>
                <span className="cmGapHint">Впевненість</span>
                <strong className="cmGapConfidence">{g.confidence_percent}%</strong>
              </div>
            </div>
            <div className="cmGapActions">
              <button type="button" className="cmGhostBtn" onClick={() => onEvidence?.(g)}>Докази</button>
              <button type="button" className="cmPrimaryBtn" onClick={() => onSendToIdeaLab?.(g)}>В Idea Lab</button>
            </div>
          </li>
        ))}
        {!gaps.length && <li className="cmEmptyState small">Gap-можливостей поки не знайдено</li>}
      </ul>
    </section>
  );
}

// ── Empty / error states ────────────────────────────────────────────────────

function EmptyCompetitors() {
  return (
    <div className="cmFullEmpty">
      <h2>Конкуренти ще не додані.</h2>
      <p>Додайте канали конкурентів у Налаштуваннях, щоб увімкнути моніторинг.</p>
      <Link href="/settings" className="cmPrimaryBtn">Перейти в Налаштування</Link>
    </div>
  );
}

function EmptyData({ onRefresh }) {
  return (
    <div className="cmFullEmpty">
      <h2>Дані ще не зібрані.</h2>
      <p>Натисніть «Оновити дані», щоб запустити перший збір.</p>
      <button type="button" className="cmPrimaryBtn" onClick={onRefresh}>Оновити дані</button>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="cmFullEmpty error">
      <h2>Не вдалося завантажити моніторинг конкурентів.</h2>
      <p>{message || 'Перевірте API, ключ YouTube або список каналів.'}</p>
      <div className="cmFullEmptyActions">
        <button type="button" className="cmPrimaryBtn" onClick={onRetry}>Повторити</button>
        <Link href="/jobs" className="cmGhostBtn">Перейти в Data Sync</Link>
      </div>
    </div>
  );
}

// ── Detail modal ────────────────────────────────────────────────────────────

function VideoDetailsModal({ video, onClose }) {
  if (!video) return null;
  return (
    <div className="cmModalOverlay" onClick={onClose}>
      <div className="cmModal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>{video.title}</h3>
          <button type="button" onClick={onClose}>×</button>
        </header>
        <div className="cmModalGrid">
          <div>
            <span className="cmGapHint">Канал</span>
            <strong>{video.channel_title}</strong>
          </div>
          <div>
            <span className="cmGapHint">Outlier ratio</span>
            <strong>{(Number(video.outlier_ratio) || 0).toFixed(2)}x</strong>
          </div>
          <div>
            <span className="cmGapHint">Views</span>
            <strong>{compactNumber(video.views)}</strong>
          </div>
          <div>
            <span className="cmGapHint">Views/day</span>
            <strong>{compactNumber(video.views_per_day)}</strong>
          </div>
          <div>
            <span className="cmGapHint">Engagement</span>
            <strong>{((Number(video.engagement_rate) || 0) * 100).toFixed(2)}%</strong>
          </div>
          <div>
            <span className="cmGapHint">Регіон / Мова</span>
            <strong>{REGION_LABEL[video.region]} · {LANGUAGE_LABEL[video.language]}</strong>
          </div>
        </div>
        <footer>
          <a className="cmGhostBtn" href={video.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Відкрити на YouTube</a>
        </footer>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function CompetitorsPage() {
  const showToast = useContext(ToastContext);
  const [filters, setFilters] = useState({
    days: 7,
    region: 'all',
    language: 'all',
    competitor_id: 'all',
    format: 'all',
    metric: 'views_per_day',
    only_outliers: false,
    only_new: false,
    only_high_gap: false,
    high_evidence: true,
  });
  const [search, setSearch] = useState('');
  const [focusedChannel, setFocusedChannel] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const params = useMemo(() => ({ ...filters, search }), [filters, search]);
  const { data, error, loading, reload } = useCompetitorMonitoring(params);

  const videosTableRef = useRef(null);
  const topicsRef = useRef(null);
  const gapsRef = useRef(null);

  const kpis = data?.kpis || {};
  const competitors = data?.competitors || [];
  const movers = data?.top_movers || [];
  const videos = data?.videos || [];
  const outliers = data?.outliers || [];
  const clusters = data?.topic_clusters || [];
  const gaps = data?.gaps || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
      showToast?.('Дані оновлено', 'green');
    } catch {
      showToast?.('Не вдалося оновити дані', 'red');
    } finally {
      setRefreshing(false);
    }
  };

  const handleKpiClick = (key) => {
    if (key === 'new_videos') {
      videosTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'outlier_videos') {
      setFilters({ ...filters, only_outliers: true });
    } else if (key === 'topic_clusters') {
      topicsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'gap_opportunities') {
      gapsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (key === 'fastest_growth_percent' && movers.length) {
      setFocusedChannel(movers[0].competitor_id);
    } else if (key === 'active_competitors') {
      videosTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const lastUpdated = useMemo(() => {
    if (!data?.generated_at) return 'Очікування даних...';
    const t = new Date(data.generated_at);
    const minutes = Math.max(0, Math.round((Date.now() - t.getTime()) / 60000));
    return `Оновлено ${minutes} хв тому`;
  }, [data?.generated_at]);

  const handleCreateOpportunity = async (video) => {
    try {
      await api('/api/idea-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: video.title,
          source: 'competitor_monitoring',
          evidence: {
            video_id: video.video_id,
            channel_id: video.channel_id,
            channel_title: video.channel_title,
            region: video.region,
            language: video.language,
            views_per_day: video.views_per_day,
            outlier_ratio: video.outlier_ratio,
            topic_cluster_id: video.topic_cluster_id,
          },
        }),
      });
      showToast?.('Opportunity створено', 'green');
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    }
  };

  const handleGapToIdeaLab = async (gap) => {
    try {
      await api('/api/idea-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: gap.topic,
          source: 'competitor_gap',
          missing_angle: gap.missing_angle,
          recommended_format: gap.recommended_format,
          confidence: gap.confidence,
          confidence_percent: gap.confidence_percent,
          related_video_ids: gap.related_video_ids,
          evidence_count: gap.evidence_count,
          region: gap.region,
          language: gap.language,
        }),
      });
      showToast?.('Ідею додано в Idea Lab', 'green');
    } catch (e) {
      showToast?.(`Помилка: ${e.message || e}`, 'red');
    }
  };

  if (loading && !data) {
    return <div className="cmLoading">Завантаження моніторингу конкурентів...</div>;
  }
  if (error && !data) {
    return <div className="cmPage"><ErrorState message={error} onRetry={reload} /></div>;
  }

  if (data && (!competitors || competitors.length === 0)) {
    return <div className="cmPage"><EmptyCompetitors /></div>;
  }

  if (data && competitors.length > 0 && videos.length === 0 && outliers.length === 0 && !filters.only_outliers && !filters.only_new && !filters.high_evidence && !search) {
    return <div className="cmPage"><EmptyData onRefresh={handleRefresh} /></div>;
  }

  return (
    <div className="cmPage">
      <CompetitorHeader
        search={search}
        setSearch={setSearch}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      <FilterBar filters={filters} setFilters={setFilters} competitors={competitors} />
      <KpiCards kpis={kpis} filters={filters} onCardClick={handleKpiClick} />

      <div className="cmMainGrid">
        <TrendChart chart={data?.chart} focusedChannel={focusedChannel} onPointClick={(s) => setFocusedChannel(s.competitor_id)} />
        <TopMoversPanel
          movers={movers}
          focusedChannel={focusedChannel}
          onSelect={(m) => {
            setFocusedChannel(m.competitor_id);
            setFilters({ ...filters, competitor_id: m.competitor_id });
          }}
          onShowAll={() => showToast?.('Повний список лідерів росту: TBD', 'blue')}
        />
      </div>

      <div ref={videosTableRef}>
        <VideosTable
          videos={videos}
          onDetails={setActiveVideo}
          onAction={(v) => showToast?.(`Меню дій: ${v.title.slice(0, 40)}...`, 'blue')}
        />
      </div>

      <div className="cmBottomGrid">
        <OutlierGrid
          outliers={outliers}
          onCreateOpportunity={handleCreateOpportunity}
          onShowAll={() => setFilters({ ...filters, only_outliers: true })}
        />
        <div ref={topicsRef}>
          <TopicClustersPanel
            clusters={clusters}
            onSelect={(c) => showToast?.(`Фокус по темі: ${c.title}`, 'blue')}
            onShowAll={() => topicsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          />
        </div>
        <div ref={gapsRef}>
          <GapsPanel
            gaps={gaps}
            onEvidence={(g) => showToast?.(`Докази для ${g.topic}: ${g.evidence_count} відео`, 'blue')}
            onSendToIdeaLab={handleGapToIdeaLab}
            onShowAll={() => gapsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          />
        </div>
      </div>

      <div className="cmDisclosure">
        <Info size={14} />
        <span>LLM використано тільки для кластеризації тем, форматів і gap-пояснень. Метрики пораховані backend-логікою.</span>
      </div>

      <VideoDetailsModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}
