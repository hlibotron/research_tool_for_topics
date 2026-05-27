import React, { useState } from 'react';
import { Monitor, Play, BarChart2, GitCompare, Camera, Film } from 'lucide-react';

function guessIcon(text) {
  const t = String(text).toLowerCase();
  if (/екран|screen|запис/.test(t)) return <Monitor size={14} />;
  if (/тест|demo|швидк/.test(t)) return <Play size={14} />;
  if (/граф|chart|темпер/.test(t)) return <BarChart2 size={14} />;
  if (/порівн|хмар|cloud/.test(t)) return <GitCompare size={14} />;
  if (/кадр|зйомк|shoot/.test(t)) return <Camera size={14} />;
  return <Film size={14} />;
}

export default function BriefBroll({ brief }) {
  const { broll } = brief;
  const [showAll, setShowAll] = useState(false);

  if (!broll?.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        B-roll список не визначено.
      </div>
    );
  }

  const MAX = 8;
  const shown = showAll ? broll : broll.slice(0, MAX);

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-broll-grid">
        {shown.map((item, i) => (
          <div key={i} className="brief-broll-item">
            <span className="brief-broll-icon">{guessIcon(item)}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      {broll.length > MAX && !showAll && (
        <button className="brief-show-more" onClick={() => setShowAll(true)}>
          Показати всі ({broll.length - MAX} ще)
        </button>
      )}
    </div>
  );
}
