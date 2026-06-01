import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/shared.jsx';

export default function BacklogImportModal({ open, onClose, onImported }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState('opportunities');
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    api('/api/backlog/candidates')
      .then((d) => {
        setData(d);
        const firstWithItems = (d.sources || []).find((s) => (s.items || []).length > 0);
        if (firstWithItems) setActiveSource(firstWithItems.key);
      })
      .catch((err) => setError(err.message || 'Не вдалося завантажити кандидатів'))
      .finally(() => setLoading(false));
  }, [open]);

  const sources = data?.sources || [];
  const activeItems = useMemo(
    () => (sources.find((s) => s.key === activeSource)?.items || []),
    [sources, activeSource],
  );
  const selectedCount = Object.values(selected).filter(Boolean).length;

  function toggle(key) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit() {
    const chosen = [];
    sources.forEach((source) => {
      (source.items || []).forEach((item) => {
        if (selected[item.candidate_key]) {
          chosen.push({ ...item, source: source.key });
        }
      });
    });
    if (!chosen.length) return;
    setSubmitting(true);
    try {
      await api('/api/backlog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: chosen }),
      });
      onImported?.(chosen.length);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Помилка імпорту');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="backlog-modal-backdrop" onClick={onClose}>
      <div className="backlog-modal backlog-import-modal" onClick={(e) => e.stopPropagation()}>
        <header className="backlog-modal-head">
          <div>
            <small>Імпорт кандидатів</small>
            <h2>Імпортувати ідеї до Backlog</h2>
          </div>
          <button type="button" className="backlog-modal-close" onClick={onClose}><X size={18} /></button>
        </header>

        {error ? <div className="backlog-import-error">{error}</div> : null}

        <div className="backlog-import-tabs">
          {sources.map((source) => (
            <button
              key={source.key}
              type="button"
              className={activeSource === source.key ? 'active' : ''}
              onClick={() => setActiveSource(source.key)}
            >{source.label} <span className="badge">{(source.items || []).length}</span></button>
          ))}
        </div>

        <div className="backlog-import-list">
          {loading ? <p className="backlog-modal-loading">Завантаження...</p> : null}
          {!loading && !activeItems.length ? (
            <p className="muted">Поки немає кандидатів у цьому джерелі.</p>
          ) : null}
          {activeItems.map((item) => {
            const checked = Boolean(selected[item.candidate_key]);
            return (
              <label key={item.candidate_key} className={`backlog-import-row ${item.already_added ? 'added' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={item.already_added}
                  onChange={() => toggle(item.candidate_key)}
                />
                <div>
                  <strong>{item.title}</strong>
                  {item.subtitle ? <p>{item.subtitle}</p> : null}
                </div>
                <div className="backlog-import-meta">
                  <span>Score {item.score || 0}</span>
                  {item.already_added ? <span className="backlog-import-added-badge">вже додано</span> : null}
                </div>
              </label>
            );
          })}
        </div>

        <footer className="backlog-modal-footer">
          <button type="button" className="backlog-action-secondary" onClick={onClose}>Скасувати</button>
          <button
            type="button"
            className="backlog-action-primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedCount}
          >Імпортувати вибрані ({selectedCount})</button>
        </footer>
      </div>
    </div>
  );
}
