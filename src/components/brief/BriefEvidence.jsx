import React from 'react';
import { CheckCircle } from 'lucide-react';
import { compactNumber, percentValue } from '../../lib/formatters.js';

function EvidenceMetric({ label, value, valueCls, sub }) {
  return (
    <div className="brief-evidence-metric-card">
      <span className="brief-evidence-metric-label">{label}</span>
      <span className={`brief-evidence-metric-value ${valueCls || 'neutral'}`}>{value}</span>
      {sub && <span className="brief-evidence-metric-sub">{sub}</span>}
    </div>
  );
}

export default function BriefEvidence({ brief }) {
  const demandGrowth = brief.source?.demandGrowth ?? brief.source?.demand_growth ?? null;
  const searchInterest = brief.source?.searchInterest ?? brief.source?.search_interest ?? null;
  const videosAnalyzed = brief.videosAnalyzed || 0;
  const channelsAnalyzed = brief.channelsAnalyzed || 0;
  const competition = brief.competitionLevel || brief.source?.competitionLevel || null;
  const whyItems = Array.isArray(brief.evidence) ? brief.evidence.slice(0, 3) : [];

  const hasAnyData = demandGrowth != null || searchInterest != null || videosAnalyzed > 0;

  if (!hasAnyData && !whyItems.length) {
    return (
      <div style={{ paddingTop: 16, color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
        Докази відсутні. Запустіть збір YouTube-даних для покращення бріфу.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="brief-evidence-layout">
        {demandGrowth != null && (
          <EvidenceMetric
            label="Попит у динаміці"
            value={percentValue(demandGrowth)}
            valueCls={Number(demandGrowth) >= 0 ? 'green' : 'red'}
            sub="за останні 7 днів"
          />
        )}
        {searchInterest != null && (
          <EvidenceMetric
            label="Інтерес у пошуку"
            value={percentValue(searchInterest)}
            valueCls={Number(searchInterest) >= 0 ? 'green' : 'red'}
            sub="за останні 7 днів"
          />
        )}
        {videosAnalyzed > 0 && (
          <EvidenceMetric
            label="Кількість що знімають"
            value={compactNumber(videosAnalyzed)}
            valueCls="neutral"
            sub={competition ? `${competition === 'low' ? 'Низька' : competition === 'high' ? 'Висока' : 'Середня'} конкуренція` : ''}
          />
        )}
        {whyItems.length > 0 && (
          <div className="brief-evidence-why">
            <span className="brief-evidence-why-title">Чому це працює</span>
            {whyItems.map((item, i) => (
              <div key={i} className="brief-evidence-why-item">
                <CheckCircle size={12} className="brief-evidence-why-check" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
