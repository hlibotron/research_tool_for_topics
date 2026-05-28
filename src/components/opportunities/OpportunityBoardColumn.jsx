import React from 'react';
import { Plus } from 'lucide-react';
import OpportunityBoardCard from './OpportunityBoardCard.jsx';

export default function OpportunityBoardColumn({ column, items, onShowEvidence, onCreateBrief }) {
  const Icon = column.icon;
  return (
    <div className={`opp-board-column opp-board-column-${column.accent}`}>
      <div className="opp-board-column-header">
        <span className={`opp-board-column-dot opp-board-column-dot-${column.accent}`}>
          {Icon ? <Icon size={13} /> : null}
        </span>
        <span className="opp-board-column-title">{column.label}</span>
        <span className="opp-board-column-count">{items.length}</span>
      </div>

      <div className="opp-board-column-body">
        {items.map(item => (
          <OpportunityBoardCard
            key={item.id}
            item={item}
            onShowEvidence={onShowEvidence}
            onCreateBrief={onCreateBrief}
          />
        ))}

        <button type="button" className="opp-board-column-add" disabled title="Скоро">
          <Plus size={13} />
          <span>Додати тему</span>
        </button>
      </div>
    </div>
  );
}
