import React, { useContext } from 'react';
import { RefreshCw, FileText, ChevronRight, Lightbulb, Bookmark } from 'lucide-react';
import { api, usePolling, ToastContext, Link } from '../lib/shared.jsx';
import TodayHero from '../components/today/TodayHero.jsx';
import DecisionMetricStrip from '../components/today/DecisionMetricStrip.jsx';
import EvidencePanel from '../components/today/EvidencePanel.jsx';
import SecondaryOpportunities from '../components/today/SecondaryOpportunities.jsx';
import QuickIdeaCheck from '../components/today/QuickIdeaCheck.jsx';
import NicheChanges from '../components/today/NicheChanges.jsx';
import DataEvidenceFooter from '../components/today/DataEvidenceFooter.jsx';
import TodayPageSkeleton from '../components/common/Skeleton.jsx';
import '../styles/today.css';

function useDashboardToday() {
  return usePolling(() => api('/api/dashboard'), [], 30000);
}

function useOpportunitiesToday() {
  return usePolling(() => api('/api/opportunities?days=30'), [], 30000);
}

function useDataHealthToday() {
  return usePolling(() => api('/api/data-health'), [], 30000);
}

function WhyRecommended({ best }) {
  const reasons = best?.whyRecommended || best?.why_recommended || best?.reasons || [];
  if (!reasons.length) {
    return (
      <p className="todayMuted">
        Недостатньо пояснень. Потрібно оновити opportunity analysis.
      </p>
    );
  }
  return (
    <ul className="todayWhyList">
      {reasons.slice(0, 3).map((reason, i) => (
        <li key={i} className="todayWhyItem">
          <span className="todayWhyCheck">✓</span>
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TodayPage() {
  const showToast = useContext(ToastContext);
  const opportunitiesState = useOpportunitiesToday();
  const dashboardState = useDashboardToday();
  const healthState = useDataHealthToday();

  const opportunities = opportunitiesState.data?.opportunities || [];
  const best = opportunitiesState.data?.best || opportunities[0] || null;
  const topThree = opportunities.slice(best ? 1 : 0, best ? 4 : 3);
  const health = healthState.data || {};

  const videosAnalyzed =
    best?.dataHealth?.videosAnalyzed ??
    health.videos_analyzed ??
    health.videosAnalyzed ??
    0;

  const channelsAnalyzed =
    best?.dataHealth?.sourcesCount ??
    health.channels_analyzed ??
    health.channelsAnalyzed ??
    0;

  const lastUpdated =
    best?.dataHealth?.lastUpdated ??
    health.last_updated ??
    health.lastUpdated ??
    dashboardState.data?.updated_at ??
    null;

  const loading = opportunitiesState.loading;
  const error = opportunitiesState.error || dashboardState.error;

  function reload() {
    opportunitiesState.reload();
    dashboardState.reload();
    healthState.reload();
  }

  function saveToPlan() {
    showToast('Планування буде підключено окремо', 'blue');
  }

  if (loading) return <TodayPageSkeleton />;

  if (error) {
    return (
      <div className="todayError">
        <p style={{ color: 'var(--red)' }}>{error}</p>
        <button className="button" onClick={reload}>
          <RefreshCw size={16} />Повторити
        </button>
      </div>
    );
  }

  if (!best) {
    return (
      <div className="todayEmpty">
        <h2>Поки немає надійної рекомендації</h2>
        <p>
          Система не знайшла достатньо YouTube-даних для впевненої поради.
          Запустіть збір даних або розширте період аналізу.
        </p>
        <div className="rowActions">
          <Link className="button ghost" href="/data-health">Перейти до Data Health</Link>
          <Link className="button ghost" href="/jobs">Перейти до Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="todayPage">
      <div className="todayPageHeader">
        <div>
          <h1>Що знімати зараз</h1>
          <p className="todaySubtitle">
            Рекомендації на основі реальних YouTube-даних: попит, конкуренція,
            утримання та свіжість тренду.
          </p>
        </div>
        <button className="iconButton" onClick={reload} title="Оновити">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="todayHero">
        <TodayHero best={best} onSaveToPlan={saveToPlan} />
        <DecisionMetricStrip
          best={best}
          videosAnalyzed={videosAnalyzed}
          channelsAnalyzed={channelsAnalyzed}
        />
      </div>

      <div className="todayWhySection">
        <div>
          <h2 className="todaySectionTitle">Чому радимо знімати</h2>
          <WhyRecommended best={best} />
        </div>
        <div className="todayHeroActionBtns">
          <Link
            className="button todayBriefBtn"
            href={`/brief?id=${encodeURIComponent(best.id || best.topic_key || best.title || '')}`}
          >
            <FileText size={16} />Відкрити бріф<ChevronRight size={16} />
          </Link>
          <Link
            className="button ghost todayIdeaCheckBtn"
            href={`/idea-lab?compare=${encodeURIComponent(best.title || best.topic || '')}`}
          >
            <Lightbulb size={16} />Перевірити мою ідею
          </Link>
          <button className="todaySavePlanBtn" onClick={saveToPlan}>
            <Bookmark size={15} />Зберегти в план
          </button>
        </div>
      </div>

      <div className="todayTwoCol">
        <SecondaryOpportunities opportunities={topThree} />
        <EvidencePanel
          best={best}
          videosAnalyzed={videosAnalyzed}
          channelsAnalyzed={channelsAnalyzed}
          lastUpdated={lastUpdated}
        />
      </div>

      <QuickIdeaCheck />

      <NicheChanges dashboardData={dashboardState.data} />

      <DataEvidenceFooter
        videosAnalyzed={videosAnalyzed}
        channelsAnalyzed={channelsAnalyzed}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
