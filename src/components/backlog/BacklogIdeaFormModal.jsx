import React, { useState } from 'react';
import { X } from 'lucide-react';

const FORMAT_OPTIONS = [
  { value: '', label: 'Не вказано' },
  { value: 'long', label: 'Long' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'review', label: 'Review' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'experiment', label: 'Experiment' },
  { value: 'diy', label: 'DIY' },
  { value: 'news', label: 'News' },
  { value: 'comparison', label: 'Comparison' },
];

const STATUS_OPTIONS = [
  { value: 'needs_review', label: 'Потребує перевірки' },
  { value: 'watching', label: 'Спостерігати' },
  { value: 'growing', label: 'Ріст' },
  { value: 'ready_to_plan', label: 'Готова в план' },
  { value: 'parked', label: 'Запаркована' },
];

export default function BacklogIdeaFormModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    format: '',
    status: 'needs_review',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await onCreate?.({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || null,
        format: form.format || null,
        status: form.status,
        source: 'manual',
      });
      onClose?.();
      setForm({ title: '', description: '', category: '', format: '', status: 'needs_review' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="backlog-modal-backdrop" onClick={onClose}>
      <form className="backlog-modal backlog-add-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="backlog-modal-head">
          <div>
            <small>Нова ідея</small>
            <h2>Додати ідею в Backlog</h2>
          </div>
          <button type="button" className="backlog-modal-close" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="backlog-form-grid">
          <label className="backlog-form-field">
            <span>Назва *</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Тест бюджетних петличних мікрофонів"
            />
          </label>
          <label className="backlog-form-field">
            <span>Опис / нотатка</span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Пояснення, чому це може спрацювати..."
            />
          </label>
          <label className="backlog-form-field">
            <span>Категорія</span>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              placeholder="Техніка, Гейминг, DIY..."
            />
          </label>
          <label className="backlog-form-field">
            <span>Формат</span>
            <select value={form.format} onChange={(e) => update('format', e.target.value)}>
              {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <p className="backlog-form-hint">
            Теги і хештеги додасться автоматично — після «Оцінити сьогодні» система знайде релевантні хештеги
            з research-даних і прив'яже їх до ідеї.
          </p>
          <label className="backlog-form-field">
            <span>Початковий статус</span>
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        <footer className="backlog-modal-footer">
          <button type="button" className="backlog-action-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="backlog-action-primary" disabled={submitting || !form.title.trim()}>
            {submitting ? 'Створюю...' : 'Створити ідею'}
          </button>
        </footer>
      </form>
    </div>
  );
}
