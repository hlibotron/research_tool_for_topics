import React from 'react';

export const TABS = [
  { id: 'best', label: 'Найкраще зараз' },
  { id: 'quick', label: 'Легкі перемоги' },
  { id: 'high', label: 'Високий потенціал' },
  { id: 'adapt', label: 'Потрібна адаптація' },
  { id: 'avoid', label: 'Уникати' },
];

export function filterByTab(opportunities, tab) {
  return opportunities.filter(item => {
    const score = Number(item.opportunityScore || item.opportunity_score || 0);
    const action = item.recommendedAction || item.status || item.verdict || 'watch';
    const competition = item.competitionLevel || item.competition_level || item.competition || '';
    const confidence = item.confidence || '';
    const demandGrowth = Number(item.demandGrowth ?? item.demand_growth ?? item.trendGrowth ?? item.trend_growth ?? 0);

    if (tab === 'best') return score >= 70 && action !== 'avoid';
    if (tab === 'quick') return score >= 65 && competition === 'low' && (confidence === 'high' || confidence === 'medium');
    if (tab === 'high') return score >= 75 || demandGrowth >= 100;
    if (tab === 'adapt') return action === 'adapt' || confidence === 'medium' || competition === 'medium' || competition === 'high';
    if (tab === 'avoid') return action === 'avoid' || score < 50 || demandGrowth < 0;
    return true;
  });
}

export default function OpportunityTabs({ active, onChange }) {
  return (
    <div className="opportunities-tabs">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`opportunities-tab${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
