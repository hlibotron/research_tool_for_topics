import React, { useState } from 'react';
import OpportunityCard from './OpportunityCard.jsx';
import { SkeletonBlock } from '../common/Skeleton.jsx';
import EmptyState from '../common/EmptyState.jsx';

const PAGE_SIZE = 6;

function sortOpportunities(items) {
  const confOrder = { high: 0, medium: 1, low: 2 };
  return [...items].sort((a, b) => {
    const scoreA = Number(a.opportunityScore || a.opportunity_score || 0);
    const scoreB = Number(b.opportunityScore || b.opportunity_score || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const confA = confOrder[a.confidence] ?? 3;
    const confB = confOrder[b.confidence] ?? 3;
    if (confA !== confB) return confA - confB;
    const growA = Number(a.demandGrowth ?? a.demand_growth ?? a.trendGrowth ?? 0);
    const growB = Number(b.demandGrowth ?? b.demand_growth ?? b.trendGrowth ?? 0);
    return growB - growA;
  });
}

export function OpportunitiesGridSkeleton() {
  return (
    <div className="opp-skeleton-grid">
      {[0, 1, 2, 3].map(i => (
        <SkeletonBlock key={i} height={320} radius={14} />
      ))}
    </div>
  );
}

export default function OpportunityGrid({ opportunities, onResetFilters, isFiltered }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sorted = sortOpportunities(opportunities);
  const shown = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;

  if (opportunities.length === 0) {
    if (isFiltered) {
      return (
        <EmptyState
          title="Немає результатів за фільтрами"
          text="Спробуйте змінити фільтри або скинути їх."
          action={
            onResetFilters && (
              <button className="button" onClick={onResetFilters}>Скинути фільтри</button>
            )
          }
        />
      );
    }
    return (
      <EmptyState
        title="Поки немає можливостей для аналізу"
        text="Система не отримала достатньо YouTube-даних для формування рекомендацій."
      />
    );
  }

  return (
    <div className="opportunities-grid">
      {shown.map(item => (
        <OpportunityCard
          key={item.id || item.topic_key || item.title}
          item={item}
        />
      ))}
      {hasMore && (
        <div className="opportunities-show-more">
          <button
            className="opportunities-show-more-btn"
            onClick={() => setVisible(v => v + PAGE_SIZE)}
          >
            Показати ще ({sorted.length - visible} залишилось)
          </button>
        </div>
      )}
    </div>
  );
}
