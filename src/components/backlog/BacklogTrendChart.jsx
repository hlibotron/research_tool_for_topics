import React, { useMemo, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

const COLORS = ['#2f7df6', '#36c177', '#f59e2e', '#e75d5d', '#9b6cff', '#ec4899', '#0891b2', '#ca8a04'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function buildPath(values, width, height, paddingY, min, max) {
  const span = Math.max(1, max - min);
  const points = [];
  values.forEach((value, index) => {
    if (value === null || value === undefined) return;
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - paddingY - ((value - min) / span) * (height - paddingY * 2);
    points.push(`${points.length === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  return points.join(' ');
}

export default function BacklogTrendChart({
  chart,
  ideas,
  activeIdeaIds,
  hiddenIds,
  onToggleVisibility,
  onSelectIdeas,
  tab,
  onTabChange,
  days,
  onDaysChange,
}) {
  const [hover, setHover] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const width = 920;
  const height = 260;
  const paddingY = 18;

  const series = useMemo(() => {
    if (!chart || !Array.isArray(chart.series)) return [];
    return chart.series.filter((s) => !hiddenIds.includes(s.idea_id));
  }, [chart, hiddenIds]);

  const visibleValues = series.flatMap((s) => (s.values || []).filter((v) => v !== null && v !== undefined));
  const min = visibleValues.length ? Math.max(0, Math.min(...visibleValues) - 5) : 0;
  const max = visibleValues.length ? Math.min(100, Math.max(...visibleValues) + 5) : 100;
  const dates = chart?.dates || [];

  function handlePointHover(seriesItem, index) {
    setHover({
      title: seriesItem.title,
      score: seriesItem.values?.[index],
      date: dates[index],
      idea_id: seriesItem.idea_id,
    });
  }

  const hasSeries = chart && series.length > 0 && visibleValues.length > 0;

  return (
    <section className="backlog-panel backlog-chart-panel">
      <div className="backlog-panel-head">
        <h2>Аналітика беклогу</h2>
        <div className="backlog-day-toggle">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              className={days === d ? 'active' : ''}
              onClick={() => onDaysChange(d)}
            >{d} днів</button>
          ))}
        </div>
      </div>

      <div className="backlog-chart-tabs">
        <button
          type="button"
          className={tab === 'all' ? 'active' : ''}
          onClick={() => onTabChange('all')}
        >Усі ідеї</button>
        <button
          type="button"
          className={tab === 'selected' ? 'active' : ''}
          onClick={() => onTabChange('selected')}
        >Вибрані ідеї <span className="badge">{(chart?.series || []).length}</span></button>
        <button
          type="button"
          className={tab === 'opportunities' ? 'active' : ''}
          onClick={() => onTabChange('opportunities')}
        ><Sparkles size={12} />З Можливостей</button>
      </div>

      <div className="backlog-chart-controls">
        <span className="backlog-chart-title">Вибрані ідеї ({(chart?.series || []).length})</span>
        <div className="backlog-chart-chips">
          {(chart?.series || []).slice(0, 4).map((s) => (
            <span key={s.idea_id} className="backlog-chart-chip">
              {s.title} <button type="button" onClick={() => onToggleVisibility?.(s.idea_id)}>×</button>
            </span>
          ))}
          {(chart?.series || []).length > 4 ? (
            <span className="backlog-chart-chip muted">Ще {(chart.series.length) - 4}</span>
          ) : null}
        </div>
        <div className="backlog-picker">
          <button type="button" className="backlog-picker-btn" onClick={() => setPickerOpen((v) => !v)}>
            Обрати ідеї <ChevronDown size={14} />
          </button>
          {pickerOpen ? (
            <div className="backlog-picker-menu" onMouseLeave={() => setPickerOpen(false)}>
              {ideas.slice(0, 30).map((idea) => {
                const checked = activeIdeaIds.includes(idea.id);
                return (
                  <label key={idea.id} className="backlog-picker-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onSelectIdeas?.(idea.id)}
                    />
                    <span>{idea.title}</span>
                    <small>{idea.score}</small>
                  </label>
                );
              })}
              {!ideas.length ? <p className="backlog-picker-empty">Немає ідей у backlog.</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="backlog-chart-canvas">
        {hasSeries ? (
          <>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Динаміка score ідей">
              {[0, 25, 50, 75, 100].map((tick) => {
                const span = Math.max(1, max - min);
                const y = height - paddingY - ((tick - min) / span) * (height - paddingY * 2);
                if (y < 0 || y > height) return null;
                return (
                  <g key={tick}>
                    <line className="backlog-chart-grid" x1="0" x2={width} y1={y} y2={y} />
                    <text x="4" y={y - 4} className="backlog-chart-axis">{tick}</text>
                  </g>
                );
              })}
              {series.map((s) => (
                <g key={s.idea_id}>
                  <path
                    className="backlog-chart-line"
                    d={buildPath(s.values || [], width, height, paddingY, min, max)}
                    stroke={COLORS[s.color_index % COLORS.length]}
                  />
                  {(s.values || []).map((value, index) => {
                    if (value === null || value === undefined) return null;
                    const span = Math.max(1, max - min);
                    const x = s.values.length === 1 ? 0 : (index / (s.values.length - 1)) * width;
                    const y = height - paddingY - ((value - min) / span) * (height - paddingY * 2);
                    return (
                      <circle
                        key={index}
                        className="backlog-chart-dot"
                        cx={x}
                        cy={y}
                        r="3"
                        fill={COLORS[s.color_index % COLORS.length]}
                        onMouseEnter={() => handlePointHover(s, index)}
                        onMouseLeave={() => setHover(null)}
                      />
                    );
                  })}
                </g>
              ))}
            </svg>
            <div className="backlog-chart-x-axis">
              {dates.filter((_, idx) => idx % Math.max(1, Math.round(dates.length / 12)) === 0).map((d) => (
                <span key={d}>{formatDate(d)}</span>
              ))}
            </div>
            {hover ? (
              <div className="backlog-chart-tooltip">
                <strong>{formatDate(hover.date)}</strong>
                <span>{hover.title}</span>
                <em>Score: {hover.score}</em>
              </div>
            ) : null}
          </>
        ) : (
          <div className="backlog-chart-empty">
            <p>Недостатньо історії для графіку. Оцініть ідеї сьогодні, щоб почати збір динаміки.</p>
          </div>
        )}
      </div>

    </section>
  );
}
