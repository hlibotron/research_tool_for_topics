import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { formatLabel } from '../../lib/formatters.js';

const DIFFICULTY_LABEL = { low: 'Легка', medium: 'Середня', high: 'Складна' };

export default function OpportunityBoardCard({ item, onShowEvidence, onCreateBrief }) {
  function handleCardClick(e) {
    if (e.target.closest('button')) return;
    onShowEvidence(item.id);
  }

  return (
    <article className="opp-board-card" onClick={handleCardClick} role="button" tabIndex={0}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
      }}
      onKeyDown={e => { if (e.key === 'Enter') onShowEvidence(item.id); }}
    >
      <h4 className="opp-board-card-title">{item.title}</h4>

      <div className="opp-board-card-format">
        <span className="opp-board-card-format-chip">{formatLabel(item.format) || '—'}</span>
      </div>

      {item.whyShort && (
        <div className="opp-board-card-why">
          <span className="opp-board-card-why-label">Чому</span>
          <p className="opp-board-card-why-text">{item.whyShort}</p>
        </div>
      )}

      <div className="opp-board-card-meta">
        {item.gapPercent != null && (
          <span className="opp-board-card-meta-item">
            <span className="opp-board-card-meta-label">Gap</span>
            <strong>{item.gapPercent}%</strong>
          </span>
        )}
        {item.difficulty && (
          <span className="opp-board-card-meta-item">
            <span className={`opp-board-card-chip opp-chip-${item.difficulty}`}>{DIFFICULTY_LABEL[item.difficulty]}</span>
          </span>
        )}
        {item.noPurchase && (
          <span className="opp-board-card-meta-item">
            <span className="opp-board-card-chip opp-chip-no-purchase">Без покупок</span>
          </span>
        )}
      </div>

      <div className="opp-board-card-actions">
        <button type="button" className="opp-board-card-btn" onClick={() => onShowEvidence(item.id)}>
          <FileText size={13} />
          <span>Показати докази</span>
        </button>
        {onCreateBrief && (
          <button type="button" className="opp-board-card-btn-icon" onClick={() => onCreateBrief(item.id)} aria-label="Створити бриф">
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    </article>
  );
}
