import React from 'react';

function parseStructureItem(item) {
  if (typeof item === 'string') {
    const match = item.match(/^(\d+:\d+(?:–\d+:\d+)?)\s+(.+)$/);
    if (match) return { time: match[1], title: match[2] };
    return { time: null, title: item };
  }
  if (item && typeof item === 'object') {
    return {
      time: item.time || item.timestamp || item.timecode || null,
      title: item.title || item.description || item.text || String(item),
    };
  }
  return { time: null, title: String(item) };
}

export default function BriefStructure({ brief }) {
  const { structure, recommendedFormat } = brief;

  if (!structure?.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Структура не згенерована. Поверніться в Idea Lab або перегенеруйте бріф.
      </div>
    );
  }

  const items = structure.map(parseStructureItem);
  const title = recommendedFormat ? `Структура відео (${recommendedFormat})` : null;

  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  const renderCol = col => col.map((item, i) => (
    <div key={i} className="brief-structure-row">
      {item.time ? (
        <span className="brief-structure-time">{item.time}</span>
      ) : (
        <span className="brief-structure-time" style={{ color: 'var(--muted)' }}>{i + 1}.</span>
      )}
      <span className="brief-structure-desc">{item.title}</span>
    </div>
  ));

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-structure-grid">
        <div>{renderCol(left)}</div>
        <div>{renderCol(right)}</div>
      </div>
    </div>
  );
}
