import React, { useEffect, useState } from 'react';
import { X, Share2, CalendarClock, Sparkles, Pin, FileText } from 'lucide-react';
import { api } from '../../lib/shared.jsx';
import ValidationPanel, { LANE_LABEL } from '../validation/ValidationPanel.jsx';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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

export default function BacklogDetailsModal({ open, ideaId, onClose, onAddToPlan, onPark, onEvaluateOne, onCreateBrief }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drLoading, setDrLoading] = useState(false);
  const [drError, setDrError] = useState(null);

  function reload() {
    if (!ideaId) return;
    setLoading(true);
    api(`/api/backlog/${encodeURIComponent(ideaId)}`)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open || !ideaId) return;
    setDrError(null);
    reload();
  }, [open, ideaId]);

  async function handleDeepReview() {
    if (!ideaId) return;
    setDrLoading(true);
    setDrError(null);
    try {
      const res = await api(`/api/backlog/${encodeURIComponent(ideaId)}/deep-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'auto', force: true }),
      });
      if (res.validation) {
        setDetail((prev) => (prev ? { ...prev, validation: res.validation, item: { ...prev.item, validation: res.validation } } : prev));
      }
      if (!res.ok) setDrError(res.error || 'Deep review не вдався');
    } catch (err) {
      setDrError(String(err?.message || err));
    } finally {
      setDrLoading(false);
    }
  }

  if (!open) return null;

  const item = detail?.item;
  const validation = detail?.validation || item?.validation || null;
  const chart = detail?.chart || { values: [], dates: [], baseline: 0 };
  const lane = validation?.readiness?.lane || item?.status;
  const width = 720;
  const height = 220;
  const paddingY = 16;
  const validValues = (chart.values || []).filter((v) => v !== null && v !== undefined);
  const min = validValues.length ? Math.max(0, Math.min(...validValues) - 5) : 0;
  const max = validValues.length ? Math.min(100, Math.max(...validValues) + 5) : 100;
  const lastValue = validValues.length ? validValues[validValues.length - 1] : null;

  return (
    <div className="backlog-modal-backdrop" onClick={onClose}>
      <div className="backlog-modal" onClick={(e) => e.stopPropagation()}>
        <header className="backlog-modal-head">
          <div>
            <small>Детальна аналітика ідеї</small>
            <h2>{item?.title || (loading ? 'Завантаження...' : '—')}</h2>
            <div className="backlog-modal-meta">
              <span className="backlog-modal-source">{item?.source}</span>
              <span>· Категорія: {item?.category || '—'}</span>
              <span>· Додано: {formatDate(item?.created_at)}</span>
              {lane ? <span>· Lane: {LANE_LABEL[lane] || lane}</span> : null}
            </div>
          </div>
          <div className="backlog-modal-head-actions">
            <button type="button" className="backlog-modal-share"><Share2 size={14} />Поділитися</button>
            <button type="button" className="backlog-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </header>

        {loading && !item ? <p className="backlog-modal-loading">Завантаження...</p> : null}

        {item ? (
          <>
            {drError ? <div className="backlog-modal-dr-error">{drError}</div> : null}

            {validValues.length ? (
              <section className="backlog-panel backlog-modal-chart">
                <div className="backlog-panel-head"><h3>Динаміка market score за 14 днів</h3></div>
                <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Динаміка score">
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
                  <path className="backlog-chart-line" d={buildPath(chart.values || [], width, height, paddingY, min, max)} stroke="#2f7df6" />
                  {lastValue !== null ? (
                    <circle
                      cx={width}
                      cy={height - paddingY - ((lastValue - min) / Math.max(1, max - min)) * (height - paddingY * 2)}
                      r="4"
                      fill="#2f7df6"
                    />
                  ) : null}
                </svg>
              </section>
            ) : null}

            {validation ? (
              <ValidationPanel
                validation={validation}
                onDeepReview={handleDeepReview}
                deepReviewLoading={drLoading}
              />
            ) : (
              <p className="muted" style={{ padding: 16 }}>
                Ще немає даних валідації. Запустіть «Оцінити зараз», щоб побудувати market layer.
              </p>
            )}

            <footer className="backlog-modal-footer">
              <button type="button" className="backlog-action-primary" onClick={() => onAddToPlan?.(item)}>
                <CalendarClock size={14} />В план
              </button>
              <button type="button" className="backlog-action-orange" onClick={() => onEvaluateOne?.(item)}>
                <Sparkles size={14} />Оцінити зараз
              </button>
              <button type="button" className="backlog-action-secondary" onClick={() => onCreateBrief?.(item)}>
                <FileText size={14} />Створити бріф
              </button>
              <button type="button" className="backlog-action-secondary" onClick={() => onPark?.(item)}>
                <Pin size={14} />Паркувати
              </button>
            </footer>
          </>
        ) : null}
      </div>
    </div>
  );
}
