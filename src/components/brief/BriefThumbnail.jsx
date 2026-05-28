import React from 'react';
import { ImageIcon } from 'lucide-react';

const STYLE_LABELS = {
  before_after: 'До / Після',
  face_reaction: 'Реакція',
  comparison: 'Порівняння',
  text_focus: 'Текст',
  screenshot: 'Скріншот',
};

export default function BriefThumbnail({ brief }) {
  const concepts = brief.thumbnailConcepts || [];

  if (!concepts.length) return null;

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-thumbnail-grid">
        {concepts.slice(0, 3).map((concept, i) => (
          <div key={i} className="brief-thumbnail-card">
            <div className="brief-thumbnail-card-num">#{i + 1}</div>
            <div className="brief-thumbnail-visual">
              <ImageIcon size={16} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }} />
              <span>{concept.visual || concept.description || '—'}</span>
            </div>
            {concept.text_overlay && (
              <div className="brief-thumbnail-text-overlay">
                {concept.text_overlay}
              </div>
            )}
            {concept.style && (
              <div className="brief-thumbnail-style-badge">
                {STYLE_LABELS[concept.style] || concept.style}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
