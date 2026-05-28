import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const LETTERS = ['A', 'B', 'C'];
const TYPE_LABELS = {
  question: 'Питання',
  promise: 'Обіцянка',
  provocation: 'Провокація',
  default: 'Гачок',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button className="brief-hook-copy" onClick={handleCopy} title="Скопіювати">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export default function BriefHookLab({ brief }) {
  const rawHooks = brief.hooks || [];
  const recommendedIdx = brief.recommendedHookIndex ?? 0;

  if (!rawHooks.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Хуки не визначено. Повернутися в Idea Lab або згенерувати AI бріф.
      </div>
    );
  }

  // Support both string[] (legacy) and object[] with {type, text}
  const hooks = rawHooks.map(h => typeof h === 'string' ? { type: 'default', text: h } : h);

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-hook-cards">
        {hooks.slice(0, 3).map((hook, i) => (
          <div key={i} className={`brief-hook-card${i === recommendedIdx ? ' recommended' : ''}`}>
            <div className="brief-hook-card-header">
              <span className="brief-hook-letter">{LETTERS[i] || String(i + 1)}</span>
              {hook.type && hook.type !== 'default' && (
                <span className="brief-hook-type-badge">{TYPE_LABELS[hook.type] || hook.type}</span>
              )}
              <CopyButton text={hook.text || ''} />
            </div>
            <p className="brief-hook-text">{hook.text || hook}</p>
          </div>
        ))}
      </div>
      {hooks.length > 1 && (
        <p className="brief-hook-recommended-note">
          Рекомендований хук: {LETTERS[recommendedIdx] || 'A'} (найвищий потенціал утримання за даними)
        </p>
      )}
    </div>
  );
}
