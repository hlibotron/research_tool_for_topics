import React from 'react';
import { CheckCircle } from 'lucide-react';

const DEFAULT_TAGS = ['Практична цінність', 'Для початківців'];

export default function BriefConcept({ brief }) {
  const { concept, targetAudience } = brief;
  const rawTags = brief.conceptTags || brief.tags || brief.keywords || [];
  const tags = rawTags.length ? rawTags : (targetAudience ? [] : DEFAULT_TAGS);

  return (
    <div style={{ paddingTop: 16 }}>
      {concept ? (
        <p className="brief-concept-text">{concept}</p>
      ) : (
        <p className="brief-concept-text" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
          Концепт не визначено. Повернутися в Idea Lab для аналізу.
        </p>
      )}
      {tags.length > 0 && (
        <div className="brief-concept-tags">
          {tags.map((tag, i) => (
            <span key={i} className="brief-concept-tag">
              <CheckCircle size={11} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
