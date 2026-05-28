import React, { useEffect, useMemo, useState } from 'react';
import { Activity, LineChart, Search, X } from 'lucide-react';
import Card from '../common/Card.jsx';
import { api } from '../../lib/shared.jsx';
import { compactNumber } from '../../lib/formatters.js';

const METRIC_OPTIONS = [
  { value: 'videos', label: 'К-сть відео' },
  { value: 'views', label: 'Перегляди' },
  { value: 'velocity', label: 'Швидкість (пер./день)' },
];

const DIMENSION_OPTIONS = [
  { value: 'all', label: 'Усі (загальна сума)' },
  { value: 'topics', label: 'Теми' },
  { value: 'hashtags', label: 'Хештеги' },
  { value: 'formats', label: 'Формати' },
  { value: 'categories', label: 'Категорії' },
  { value: 'videos', label: 'Канали' },
];

const FORMAT_OPTIONS = [
  { value: 'any', label: 'Будь-який формат' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'longform', label: 'Long-form' },
];

const REGION_OPTIONS = [
  { value: 'any', label: 'Будь-який регіон' },
  { value: 'UA', label: 'Україна' },
  { value: 'EU', label: 'Європа' },
  { value: 'US', label: 'США' },
];

const LANGUAGE_OPTIONS = [
  { value: 'any', label: 'Будь-яка мова' },
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'Англійська' },
  { value: 'ru', label: 'Російська' },
];

const PERIOD_OPTIONS = [
  { value: 7, label: '7 днів' },
  { value: 14, label: '14 днів' },
  { value: 30, label: '30 днів' },
  { value: 90, label: '90 днів' },
];

const SERIES_COLORS = ['#2f7df6', '#36c177', '#f59e2e', '#e75d5d', '#a777ff', '#0fb8b8'];
const OTHER_COLOR = '#5f7790';

function formatValue(value, metric) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '0';
  if (metric === 'views' || metric === 'velocity') return compactNumber(value);
  return String(Math.round(Number(value)));
}

function formatDateLabel(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}`;
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(handle);
  }, [value, ms]);
  return debounced;
}

function ChartLegend({ seriesKeys, totals, metric, otherTotal }) {
  if (!seriesKeys.length) return null;
  return (
    <div className="trend-dyn-legend">
      {seriesKeys.map((key, index) => (
        <div className="trend-dyn-legend-item" key={key}>
          <span className="trend-dyn-legend-swatch" style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }} />
          <span className="trend-dyn-legend-label" title={key}>{key}</span>
          <span className="trend-dyn-legend-total">{formatValue(totals[key], metric)}</span>
        </div>
      ))}
      {otherTotal > 0 ? (
        <div className="trend-dyn-legend-item">
          <span className="trend-dyn-legend-swatch" style={{ background: OTHER_COLOR }} />
          <span className="trend-dyn-legend-label">інше</span>
          <span className="trend-dyn-legend-total">{formatValue(otherTotal, metric)}</span>
        </div>
      ) : null}
    </div>
  );
}

function MultiLineChart({ chart, seriesKeys, metric }) {
  const W = 760;
  const H = 280;
  const PL = 52;
  const PR = 16;
  const PT = 14;
  const PB = 32;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const N = chart.length;
  const [hover, setHover] = useState(null);

  const keys = useMemo(() => (seriesKeys.length ? seriesKeys : ['__total']), [seriesKeys]);

  const maxValue = useMemo(() => {
    if (!N) return 10;
    const values = chart.flatMap((row) => keys.map((key) => Number(row[key] || 0)));
    return Math.max(10, ...values);
  }, [chart, keys, N]);

  const xScale = (i) => PL + (N <= 1 ? CW / 2 : (i / (N - 1)) * CW);
  const yScale = (v) => PT + CH - (v / maxValue) * CH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxValue));
  const xLabels = useMemo(() => {
    if (!N) return [];
    const step = Math.max(1, Math.floor(N / 7));
    return chart.map((row, index) => ({ ...row, index })).filter((row) => row.index % step === 0 || row.index === N - 1);
  }, [chart, N]);

  function linePath(key) {
    if (!N) return '';
    return chart.map((row, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(Number(row[key] || 0)).toFixed(1)}`).join(' ');
  }

  function handleMove(event) {
    if (!N) return;
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    if (x < PL || x > W - PR) {
      setHover(null);
      return;
    }
    const ratio = (x - PL) / CW;
    const idx = Math.round(ratio * (N - 1));
    setHover(Math.max(0, Math.min(N - 1, idx)));
  }

  if (!N) {
    return (
      <div className="trend-dyn-chart-empty">
        <LineChart size={28} />
        <p>Немає даних для побудови графіка. Спробуйте змінити фільтри або період.</p>
      </div>
    );
  }

  const hoverRow = hover !== null ? chart[hover] : null;

  return (
    <div className="trend-dyn-chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="trend-dyn-chart-svg"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line x1={PL} x2={W - PR} y1={yScale(tick)} y2={yScale(tick)} className="trend-dyn-grid" />
            <text x={PL - 8} y={yScale(tick) + 4} textAnchor="end" className="trend-dyn-axis">{formatValue(tick, metric)}</text>
          </g>
        ))}
        {keys.map((key, index) => (
          <path key={key} d={linePath(key)} fill="none" stroke={SERIES_COLORS[index % SERIES_COLORS.length]} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {xLabels.map((row) => (
          <text key={`x-${row.date}`} x={xScale(row.index)} y={H - 10} textAnchor="middle" className="trend-dyn-axis">{formatDateLabel(row.date)}</text>
        ))}
        {hover !== null ? (
          <line x1={xScale(hover)} x2={xScale(hover)} y1={PT} y2={PT + CH} className="trend-dyn-hover-line" />
        ) : null}
      </svg>
      {hoverRow ? (
        <div className="trend-dyn-tooltip">
          <strong>{formatDateLabel(hoverRow.date)}</strong>
          <ul>
            {keys.map((key, index) => Number(hoverRow[key] || 0) > 0 ? (
              <li key={key}>
                <span className="trend-dyn-tooltip-swatch" style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }} />
                <span className="trend-dyn-tooltip-label">{key}</span>
                <span className="trend-dyn-tooltip-value">{formatValue(hoverRow[key], metric)}</span>
              </li>
            ) : null)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function TrendDynamicsChart() {
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState('videos');
  const [dimension, setDimension] = useState('topics');
  const [fmt, setFmt] = useState('any');
  const [region, setRegion] = useState('any');
  const [language, setLanguage] = useState('any');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 350);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams({
      days: String(days),
      metric,
      dimension,
      format: fmt,
      region,
      language,
      search,
    }).toString();
    let abort = false;
    setLoading(true);
    setError('');
    api(`/api/trends/timeseries?${qs}`)
      .then((payload) => { if (!abort) setData(payload); })
      .catch((err) => { if (!abort) setError(err.message || String(err)); })
      .finally(() => { if (!abort) setLoading(false); });
    return () => { abort = true; };
  }, [days, metric, dimension, fmt, region, language, search]);

  const chart = data?.chart || [];
  const seriesKeys = data?.series_keys || [];
  const totals = data?.series_totals || {};
  const otherTotal = Number(data?.other_total || 0);
  const summary = data?.summary || {};

  return (
    <Card className="trend-dyn-card">
      <div className="trend-dyn-header">
        <div className="trend-dyn-title">
          <Activity size={18} />
          <div>
            <h2>Динаміка трендів</h2>
            <p>Графік опублікованих відео за фільтрами. Дані: реальні YouTube-сигнали.</p>
          </div>
        </div>
        {summary.signals_filtered !== undefined ? (
          <div className="trend-dyn-summary">
            <span>{summary.signals_filtered} сигналів</span>
            <span>{summary.unique_keys} унікальних значень</span>
          </div>
        ) : null}
      </div>

      <div className="trend-dyn-filters">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Період">
          {PERIOD_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={dimension} onChange={(e) => setDimension(e.target.value)} aria-label="Тип параметра">
          {DIMENSION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={metric} onChange={(e) => setMetric(e.target.value)} aria-label="Метрика">
          {METRIC_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={fmt} onChange={(e) => setFmt(e.target.value)} aria-label="Формат відео">
          {FORMAT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Регіон">
          {REGION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Мова відео">
          {LANGUAGE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <label className="trend-dyn-search">
          <Search size={14} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ключове слово у назві/тегах..."
            aria-label="Ключове слово"
          />
          {searchInput ? (
            <button type="button" onClick={() => setSearchInput('')} aria-label="Очистити" className="trend-dyn-search-clear">
              <X size={13} />
            </button>
          ) : null}
        </label>
      </div>

      <div className="trend-dyn-body">
        <div className="trend-dyn-chart">
          {loading && !data ? (
            <div className="trend-dyn-chart-empty"><p>Завантаження…</p></div>
          ) : error ? (
            <div className="trend-dyn-chart-empty"><p>Помилка: {error}</p></div>
          ) : (
            <MultiLineChart chart={chart} seriesKeys={seriesKeys} metric={metric} />
          )}
        </div>
        <ChartLegend
          seriesKeys={seriesKeys}
          totals={totals}
          metric={metric}
          otherTotal={dimension === 'all' ? 0 : otherTotal}
        />
      </div>
    </Card>
  );
}
