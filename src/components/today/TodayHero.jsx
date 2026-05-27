import React from 'react';
import { Play, Clock, Rocket } from 'lucide-react';
import { actionTone } from '../../lib/formatters.js';

const VERDICT_LABELS = {
  shoot_now: 'Знімати зараз',
  adapt: 'Адаптувати',
  watch: 'Слідкувати',
  avoid: 'Уникати',
  research_more: 'Дослідити',
};

function verdictLabel(best) {
  const action = best.recommendedAction || best.suggestedAction || best.status || best.verdict;
  return VERDICT_LABELS[action] || best.status || best.verdict || 'Слідкувати';
}

function ThumbnailPlaceholder() {
  return (
    <div className="todayThumbnail">
      <div className="todayThumbnailPlay">
        <Play size={22} fill="white" color="white" />
      </div>
    </div>
  );
}

export default function TodayHero({ best }) {
  if (!best) return null;

  const tone = actionTone(best.recommendedAction || best.status);
  const title = best.suggestedTitles?.[0] || best.title || best.topic || 'Рекомендація';
  const hook = best.hooks?.[0] || best.hook || best.suggestedHook || null;
  const lastUpdated = best.dataHealth?.lastUpdated || null;
  const verdict = verdictLabel(best);

  return (
    <div className="todayHeroInner">
      <div className="todayHeroLeft">
        <span className="todayBadge todayBadgegreen">РЕКОМЕНДАЦІЯ №1</span>
        <h2 className="todayHeroTitle">{title}</h2>
        <div className="todayHeroMeta">
          <span className={`todayVerdictBtn todayVerdict${tone}`}>
            <Rocket size={12} />
            {verdict}
          </span>
          {lastUpdated && (
            <span className="todayHeroTime">
              <Clock size={13} />
              Оновлено {lastUpdated}
            </span>
          )}
        </div>
      </div>
      <div className="todayHeroRight">
        <ThumbnailPlaceholder />
        {hook && (
          <div className="todayHookBox">
            <span className="todayHookLabel">ПРИКЛАД ХУКА</span>
            <blockquote className="todayHookText">"{hook}"</blockquote>
          </div>
        )}
      </div>
    </div>
  );
}
