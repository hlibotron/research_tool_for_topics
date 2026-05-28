import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

function parseStructureItem(item) {
  if (typeof item === 'string') {
    const match = item.match(/^(\d+:\d+(?:[–-]\d+:\d+)?)\s+(.+)$/);
    if (match) return { time: match[1], label: match[2], content: null };
    return { time: null, label: item, content: null };
  }
  if (item && typeof item === 'object') {
    return {
      time: item.time || item.timestamp || item.timecode || null,
      label: item.label || item.title || item.description || item.text || String(item),
      content: item.content || item.description || null,
    };
  }
  return { time: null, label: String(item), content: null };
}

function ScriptOutlineRow({ item, index }) {
  const [open, setOpen] = useState(false);
  const hasContent = !!item.content;
  return (
    <div className="brief-script-row">
      <button
        className={`brief-script-header${hasContent ? ' clickable' : ''}`}
        onClick={() => hasContent && setOpen(o => !o)}
        style={{ cursor: hasContent ? 'pointer' : 'default' }}
      >
        <div className="brief-script-meta">
          {item.time && <span className="brief-structure-time">{item.time}</span>}
          <span className="brief-script-label">{item.label}</span>
        </div>
        {hasContent && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </button>
      {open && item.content && (
        <div className="brief-script-content">{item.content}</div>
      )}
    </div>
  );
}

export default function BriefStructure({ brief }) {
  const { scriptOutline, structure } = brief;

  // Prefer scriptOutline (rich, from LLM) over legacy structure (simple strings)
  const hasScript = scriptOutline?.length > 0;
  const items = hasScript
    ? scriptOutline.map(parseStructureItem)
    : (structure || []).map(parseStructureItem);

  if (!items.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Структура не згенерована. Натисніть «Згенерувати AI бріф» щоб отримати детальний сценарій.
      </div>
    );
  }

  if (hasScript) {
    return (
      <div style={{ paddingTop: 16 }}>
        <div className="brief-script-outline">
          {items.map((item, i) => (
            <ScriptOutlineRow key={i} item={item} index={i} />
          ))}
        </div>
        <p className="brief-hook-recommended-note" style={{ marginTop: 8 }}>
          Натисніть на секцію щоб розгорнути детальний опис.
        </p>
      </div>
    );
  }

  // Legacy: two-column grid of simple steps
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
      <span className="brief-structure-desc">{item.label}</span>
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
