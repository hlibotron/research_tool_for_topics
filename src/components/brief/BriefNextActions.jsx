import React from 'react';

const FALLBACK_CHECKLIST = [
  'Підготувати комплектуючі та софт',
  'Написати сценарій і таймінг',
  'Зняти B-roll та основні етапи',
  'Змонтувати і протестувати утримання',
  'Опублікувати та відстежити метрики',
  'Оновити бріф після публікації',
];

export default function BriefNextActions({ brief }) {
  const { nextActions } = brief;
  const hasApiActions = nextActions?.length > 0;
  const items = hasApiActions ? nextActions : FALLBACK_CHECKLIST;

  return (
    <div style={{ paddingTop: 16 }}>
      {!hasApiActions && (
        <p className="brief-next-fallback-note">
          Базовий production checklist (API не повернув nextActions)
        </p>
      )}
      <div className="brief-next-actions-grid">
        {items.map((action, i) => (
          <div key={i} className="brief-action-item">
            <span className="brief-action-check" />
            <span>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
