import React, { useContext } from 'react';
import { Eye, PlayCircle, Wand2, Pin, Sparkles, Archive, SlidersHorizontal } from 'lucide-react';
import { ToastContext } from '../../lib/shared.jsx';
import OpportunityBoardColumn from './OpportunityBoardColumn.jsx';

const COLUMNS = [
  { key: 'observe', label: 'Наблюдати', accent: 'cyan', icon: Eye },
  { key: 'shoot_now', label: 'Знімати зараз', accent: 'green', icon: PlayCircle },
  { key: 'adapt', label: 'Адаптувати', accent: 'orange', icon: Wand2 },
  { key: 'priority', label: 'Пріоритетно', accent: 'blue', icon: Pin },
  { key: 'high_potential', label: 'Високий потенціал', accent: 'purple', icon: Sparkles },
  { key: 'park', label: 'Паркувати', accent: 'gray', icon: Archive },
];

export default function OpportunityBoard({ board, total, onMove, onShowEvidence, onCreateBrief }) {
  const toast = useContext(ToastContext);

  function handleConfigure() {
    if (typeof toast === 'function') {
      toast('Налаштування board будуть у наступному релізі');
    }
  }

  return (
    <section className="opp-board">
      <header className="opp-board-header">
        <div className="opp-board-header-title">
          <span>Рішення по темах</span>
          <span className="opp-board-header-count">{total} можливостей</span>
        </div>
        <button type="button" className="opp-board-configure" onClick={handleConfigure}>
          <SlidersHorizontal size={14} />
          <span>Налаштувати</span>
        </button>
      </header>

      <div className="opp-board-grid-scroll">
        <div className="opp-board-grid">
          {COLUMNS.map(col => (
            <OpportunityBoardColumn
              key={col.key}
              column={col}
              items={board[col.key] || []}
              onMove={onMove}
              onShowEvidence={onShowEvidence}
              onCreateBrief={onCreateBrief}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
