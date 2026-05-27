import React from 'react';
import { BarChart2, CheckCircle, Info } from 'lucide-react';

export default function IdeaEvidence({ result }) {
  // result.evidence is an object {opportunities, videos, patterns} — use whyItWorks (normalized) or patterns
  const rawEvidence = result.whyItWorks || result.evidencePatterns || result.whyRecommended || result.reasons || [];
  const items = Array.isArray(rawEvidence) ? rawEvidence : [];

  return (
    <div className="idea-evidence">
      <h3 className="idea-evidence-title">
        <BarChart2 size={16} style={{ color: 'var(--blue)' }} />
        Чому це спрацює
      </h3>

      {items.length > 0 ? (
        <ul className="idea-evidence-list">
          {items.slice(0, 4).map((item, i) => (
            <li key={i} className="idea-evidence-item">
              <CheckCircle size={15} className="idea-evidence-check" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="idea-evidence-empty">
          Недостатньо доказів для впевненої рекомендації. Потрібно зібрати більше YouTube-даних.
        </p>
      )}

      <div className="idea-evidence-note">
        <Info size={12} />
        Дані оновлені з реальних сигналів YouTube.
      </div>
    </div>
  );
}
