import React from 'react';

const LETTERS = ['A', 'B', 'C'];

export default function BriefHookLab({ brief }) {
  const hooks = brief.hooks || [];
  const recommendedIdx = brief.recommendedHookIndex ?? 0;

  if (!hooks.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Хуки не визначено. Повернутися в Idea Lab.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-hook-cards">
        {hooks.slice(0, 3).map((hook, i) => (
          <div key={i} className={`brief-hook-card${i === recommendedIdx ? ' recommended' : ''}`}>
            <span className="brief-hook-letter">{LETTERS[i] || String(i + 1)}</span>
            <p className="brief-hook-text">{hook}</p>
          </div>
        ))}
      </div>
      <p className="brief-hook-recommended-note">
        Рекомендований хук: {LETTERS[recommendedIdx] || 'A'} (найвищий потенціал утримання за даними)
      </p>
    </div>
  );
}
