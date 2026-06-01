import React, { useState } from 'react';
import { Pencil, MoreVertical, Youtube, Globe2, Sparkles, Clock } from 'lucide-react';
import { marketDisplay, conceptDisplay, evidenceSummary, laneInfo } from '../../lib/validationView.js';

const SOURCE_ICON = {
  opportunities: <Sparkles size={12} />,
  trend_radar: <Globe2 size={12} />,
  summary: <Globe2 size={12} />,
  competitors: <Youtube size={12} />,
  idea_lab: <Sparkles size={12} />,
  manual: <Pencil size={12} />,
  content_plan: <Sparkles size={12} />,
};

const SOURCE_LABEL = {
  opportunities: 'Opportunities',
  trend_radar: 'Trend Radar',
  summary: 'Summary',
  competitors: 'YouTube',
  idea_lab: 'Idea Lab',
  manual: 'Manual',
  content_plan: 'Content Plan',
};

function MarketPill({ validation, fallbackScore }) {
  const m = marketDisplay(validation, fallbackScore);
  return <span className={`backlog-score-pill backlog-score-${m.tone}`} title={m.isDash ? 'Недостатньо даних' : ''}>{m.value}</span>;
}

function ConceptPill({ validation }) {
  const c = conceptDisplay(validation);
  if (c.stale) {
    return (
      <span className="backlog-concept-stale" title="Deep review застарів — перегенеруйте">
        {c.value} <Clock size={10} />
      </span>
    );
  }
  return <span className={`backlog-score-pill backlog-score-${c.tone}`} title={c.isDash ? 'Deep review ще не виконано' : ''}>{c.value}</span>;
}

function EvidenceCell({ validation }) {
  const summary = evidenceSummary(validation);
  if (!summary) return <span className="muted">—</span>;
  return <span className="backlog-evidence-cell">{summary}</span>;
}

function LaneCell({ idea }) {
  const info = laneInfo(idea.validation, idea.status);
  return (
    <div className="backlog-lane-cell">
      <span className={`backlog-status-pill tone-${info.tone}`} title={info.failedGates.join('\n')}>
        {info.label}
      </span>
      {info.stale ? <span className="backlog-stale-badge" title="Deep review застарів"><Clock size={10} />stale</span> : null}
    </div>
  );
}

function DeltaPill({ value }) {
  if (value === null || value === undefined) return <span className="backlog-delta neutral">— стабільно</span>;
  const numeric = Number(value);
  if (Math.abs(numeric) < 1) return <span className="backlog-delta neutral">— стабільно</span>;
  const positive = numeric > 0;
  return (
    <span className={`backlog-delta ${positive ? 'positive' : 'negative'}`}>
      {positive ? '+' : ''}{Math.round(numeric)} {positive ? '↗' : '↘'}
    </span>
  );
}

export default function BacklogIdeasTable({ ideas, onDetails, onTogglePlan, onEditTitle, onMore }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  function startEdit(idea) {
    setEditingId(idea.id);
    setDraft(idea.title || '');
  }

  function commitEdit(idea) {
    const next = draft.trim();
    setEditingId(null);
    if (next && next !== idea.title) onEditTitle?.(idea.id, next);
  }

  return (
    <section className="backlog-panel backlog-table-panel">
      <table className="backlog-ideas-table">
        <thead>
          <tr>
            <th>Ідея</th>
            <th title="Підтверджений інтерес ринку (deterministic, без LLM)">Market</th>
            <th title="Редакційна сила як відео (LLM deep review)">Concept</th>
            <th>Докази</th>
            <th>Lane</th>
            <th>Динаміка</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          {(ideas || []).map((idea) => {
            const source = idea.source || 'manual';
            return (
              <tr key={idea.id}>
                <td className="backlog-idea-cell">
                  <div className="backlog-idea-row">
                    {editingId === idea.id ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => commitEdit(idea)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(idea);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="backlog-idea-edit-input"
                      />
                    ) : (
                      <strong>{idea.title}</strong>
                    )}
                    <button type="button" className="backlog-icon-btn" onClick={() => startEdit(idea)} aria-label="Редагувати назву">
                      <Pencil size={12} />
                    </button>
                  </div>
                  {idea.short_conclusion || idea.description ? (
                    <p className="backlog-idea-desc">{idea.short_conclusion || idea.description}</p>
                  ) : null}
                  <div className="backlog-idea-chips">
                    <span className="backlog-source-chip">
                      {SOURCE_ICON[source]} {SOURCE_LABEL[source] || source}
                    </span>
                    {(idea.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="backlog-tag">{tag}</span>
                    ))}
                  </div>
                </td>
                <td><MarketPill validation={idea.validation} fallbackScore={idea.score} /></td>
                <td><ConceptPill validation={idea.validation} /></td>
                <td><EvidenceCell validation={idea.validation} /></td>
                <td><LaneCell idea={idea} /></td>
                <td><DeltaPill value={idea.score_delta_7d} /></td>
                <td>
                  <div className="backlog-action-cell">
                    <button type="button" className="backlog-details-btn" onClick={() => onDetails?.(idea)}>Деталі</button>
                    <button type="button" className="backlog-icon-btn" onClick={() => onTogglePlan?.(idea)} aria-label="У план" title={idea.plan_item_id ? 'Прибрати з плану' : 'Додати в план'}>
                      <Sparkles size={14} style={{ color: idea.plan_item_id ? 'var(--purple, #8b5cf6)' : 'var(--muted, #999)' }} />
                    </button>
                    <button type="button" className="backlog-icon-btn" onClick={() => onMore?.(idea)} aria-label="Більше дій">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!ideas?.length ? (
            <tr>
              <td colSpan="7" className="backlog-empty-row">Немає ідей за поточними фільтрами.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
