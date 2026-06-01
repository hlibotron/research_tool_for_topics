import React from 'react';
import { Heart, Plus, Youtube, Globe2, Sparkles } from 'lucide-react';

const SOURCE_LABEL = {
  opportunities: 'Opportunities',
  trend_radar: 'Trend Radar',
  summary: 'Summary',
  competitors: 'YouTube',
  idea_lab: 'Idea Lab',
  manual: 'Manual',
  content_plan: 'Content Plan',
};

const SOURCE_ICON = {
  opportunities: <Sparkles size={12} />,
  trend_radar: <Globe2 size={12} />,
  summary: <Globe2 size={12} />,
  competitors: <Youtube size={12} />,
  idea_lab: <Sparkles size={12} />,
  manual: <Sparkles size={12} />,
  content_plan: <Sparkles size={12} />,
};

export default function BacklogReadyStrip({ ideas, total, onAddToPlan, onPark, onAddIdea, onShowAll }) {
  const shown = (ideas || []).slice(0, 4);
  return (
    <section className="backlog-ready-strip">
      <div className="backlog-ready-head">
        <h2>Готові до Плану контенту</h2>
        <button type="button" className="backlog-link-btn" onClick={onShowAll}>
          Показати всі ({total || ideas?.length || 0})
        </button>
      </div>
      <div className="backlog-ready-cards">
        {shown.map((idea) => (
          <article key={idea.id} className="backlog-ready-card">
            <header>
              <strong>{idea.title}</strong>
              <button type="button" className="backlog-ready-fav" onClick={() => onPark?.(idea)} aria-label="Паркувати">
                <Heart size={14} />
              </button>
            </header>
            <div className="backlog-ready-meta">
              <span className="backlog-ready-score">{idea.score}</span>
              <span className="backlog-ready-delta positive">
                +{Math.max(0, Math.round(Number(idea.score_delta_7d || 0)))} ↗
              </span>
              <span className="backlog-ready-source">
                {SOURCE_ICON[idea.source] || null}
                {SOURCE_LABEL[idea.source] || idea.source}
              </span>
            </div>
            <button type="button" className="backlog-ready-plan-btn" onClick={() => onAddToPlan?.(idea)}>В план</button>
          </article>
        ))}
        <button type="button" className="backlog-ready-add" onClick={onAddIdea}>
          <Plus size={16} />Додати в План контенту
        </button>
      </div>
    </section>
  );
}
