import React from 'react';

function normalizeHashtag(h) {
  if (typeof h === 'string') return h.startsWith('#') ? h : `#${h}`;
  if (h && typeof h === 'object') {
    const raw = h.hashtag || h.tag || h.name || h.value || '';
    return raw.startsWith('#') ? raw : `#${raw}`;
  }
  return String(h);
}

export default function BriefHashtags({ brief }) {
  const raw = brief.hashtags || [];
  if (!raw.length) return null;

  const tags = raw.slice(0, 12).map(normalizeHashtag).filter(t => t !== '#');

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-hashtag-list">
        {tags.map((tag, i) => (
          <span key={i} className="brief-hashtag">{tag}</span>
        ))}
      </div>
    </div>
  );
}
