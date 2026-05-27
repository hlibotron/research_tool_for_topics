import React from 'react';

export default function BriefTitles({ brief }) {
  const { titles, thumbnails } = brief;

  if (!titles?.length && !thumbnails?.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Назви не визначено.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16, display: 'grid', gap: 16 }}>
      {titles?.length > 0 && (
        <ul className="brief-titles-list">
          {titles.slice(0, 3).map((t, i) => (
            <li key={i} className="brief-title-item">
              <span className="brief-title-num">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}

      {thumbnails?.length > 0 && (
        <div className="brief-thumbnails-grid">
          {thumbnails.slice(0, 3).map((thumb, i) => {
            const text = typeof thumb === 'string' ? thumb : (thumb.text || thumb.label || `Thumbnail ${i + 1}`);
            const url = thumb?.url || thumb?.image || null;
            return (
              <div key={i} className="brief-thumbnail-card">
                {url ? (
                  <img src={url} alt={text} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span className="brief-thumbnail-label">{text}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
