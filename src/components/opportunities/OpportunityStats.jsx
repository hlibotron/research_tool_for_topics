import React from 'react';
import { Target, Settings2, XCircle } from 'lucide-react';

function getScore(item) {
  return Number(item.opportunityScore || item.opportunity_score || 0);
}

function getAction(item) {
  return item.suggestedAction || item.status || item.verdict || 'watch';
}

export default function OpportunityStats({ opportunities }) {
  const strong = opportunities.filter(o => {
    const score = getScore(o);
    const action = getAction(o);
    return score >= 75 && action !== 'avoid';
  }).length;

  const adapt = opportunities.filter(o => {
    const score = getScore(o);
    const action = getAction(o);
    return (action === 'adapt' || action === 'watch' || action === 'monitor') ||
      (score >= 50 && score < 75 && action !== 'avoid' && action !== 'shoot_now');
  }).length;

  const avoid = opportunities.filter(o => {
    const score = getScore(o);
    const action = getAction(o);
    return action === 'avoid' || score < 50;
  }).length;

  return (
    <div className="opportunities-stats">
      <div className="opportunities-stat-card opportunities-stat-green">
        <div className="opportunities-stat-left">
          <span className="opportunities-stat-label">Сильні можливості</span>
          <strong className="opportunities-stat-count">{strong}</strong>
        </div>
        <div className="opportunities-stat-icon-wrap">
          <Target size={24} />
        </div>
      </div>

      <div className="opportunities-stat-card opportunities-stat-orange">
        <div className="opportunities-stat-left">
          <span className="opportunities-stat-label">Потрібна адаптація</span>
          <strong className="opportunities-stat-count">{adapt}</strong>
        </div>
        <div className="opportunities-stat-icon-wrap">
          <Settings2 size={24} />
        </div>
      </div>

      <div className="opportunities-stat-card opportunities-stat-red">
        <div className="opportunities-stat-left">
          <span className="opportunities-stat-label">Уникати</span>
          <strong className="opportunities-stat-count">{avoid}</strong>
        </div>
        <div className="opportunities-stat-icon-wrap">
          <XCircle size={24} />
        </div>
      </div>
    </div>
  );
}
