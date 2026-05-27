import React from 'react';
import { AlertTriangle } from 'lucide-react';

function isHighRisk(text) {
  return /висок|high|критич/i.test(String(text));
}

export default function BriefRisks({ brief }) {
  const { risks } = brief;

  if (!risks?.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Ризики не визначені. Потрібна додаткова перевірка.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-risks-list">
        {risks.slice(0, 5).map((risk, i) => (
          <div key={i} className={`brief-risk-item${isHighRisk(risk) ? ' high' : ''}`}>
            <AlertTriangle size={14} className="brief-risk-icon" />
            <span>{risk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
