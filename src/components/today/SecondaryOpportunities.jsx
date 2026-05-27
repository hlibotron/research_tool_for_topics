import React from 'react';
import { ChevronRight } from 'lucide-react';
import { actionTone } from '../../lib/formatters.js';
import { Link } from '../../lib/shared.jsx';

const VERDICT_LABELS = {
  shoot_now: 'Знімати зараз',
  adapt: 'Адаптувати',
  watch: 'Слідкувати',
  avoid: 'Уникати',
  research_more: 'Дослідити',
};

function SecondaryCard({ opportunity, rank }) {
  const tone = actionTone(opportunity.recommendedAction || opportunity.status);
  const title = opportunity.suggestedTitles?.[0] || opportunity.title || opportunity.topic || 'Ідея';
  const score = Math.round(Number(opportunity.opportunityScore ?? opportunity.opportunity_score ?? 0));
  const reason = opportunity.whyRecommended?.[0] || opportunity.suggested_angle || '';
  const action = opportunity.recommendedAction || opportunity.status || '';
  const verdict = VERDICT_LABELS[action] || opportunity.verdict || 'Слідкувати';
  const briefHref = `/brief?id=${encodeURIComponent(opportunity.id || opportunity.topic_key || opportunity.title || '')}`;

  return (
    <article className="todaySecondaryCard">
      <span className="todaySecondaryRank">{rank}</span>
      <div className="todaySecondaryBody">
        <div className="todaySecondaryTitleRow">
          <h3 className="todaySecondaryTitle">{title}</h3>
          <span className="todaySecondaryScore">{score}<span>/100</span></span>
        </div>
        <div className="todaySecondaryMeta">
          <span className={`todayBadge todayBadge${tone}`} style={{ fontSize: 10 }}>{verdict}</span>
          {reason && <span className="todaySecondaryReason">{reason}</span>}
        </div>
      </div>
      <Link className="todaySecondaryBtn" href={briefHref}>
        <ChevronRight size={14} />
      </Link>
    </article>
  );
}

export default function SecondaryOpportunities({ opportunities }) {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <section className="todaySecondarySection">
      <div className="todaySecondaryHeader">
        <h2 className="todaySectionTitle">Що ще варто розглянути</h2>
        <Link className="todayLinkMore" href="/opportunities">Переглянути всі →</Link>
      </div>
      <div className="todaySecondaryList">
        {opportunities.slice(0, 3).map((opp, i) => (
          <SecondaryCard
            key={opp.id || opp.topic_key || opp.title || i}
            opportunity={opp}
            rank={i + 2}
          />
        ))}
        <Link className="button ghost todayMoreOppBtn" href="/opportunities">
          Показати більше можливостей
        </Link>
      </div>
    </section>
  );
}
