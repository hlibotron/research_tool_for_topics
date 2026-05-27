import React, { useState, useMemo } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePolling, api } from '../lib/shared.jsx';
import OpportunityStats from '../components/opportunities/OpportunityStats.jsx';
import OpportunityTabs, { filterByTab } from '../components/opportunities/OpportunityTabs.jsx';
import OpportunityFilters, { applyFilters } from '../components/opportunities/OpportunityFilters.jsx';
import OpportunityGrid, { OpportunitiesGridSkeleton } from '../components/opportunities/OpportunityGrid.jsx';
import OpportunityEvidenceFooter from '../components/opportunities/OpportunityEvidenceFooter.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import { Link } from '../lib/shared.jsx';
import '../styles/opportunities.css';

function useOpportunities(days) {
  return usePolling(() => api(`/api/opportunities?days=${encodeURIComponent(days)}`), [days], 30000);
}

export default function OpportunitiesPage() {
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState('best');
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('all');
  const [confidence, setConfidence] = useState('all');
  const [format, setFormat] = useState('all');
  const [minScore, setMinScore] = useState(0);

  const { data, error, loading, reload } = useOpportunities(days);
  const allOpportunities = data?.opportunities || [];

  function resetFilters() {
    setQuery('');
    setVerdict('all');
    setConfidence('all');
    setFormat('all');
    setMinScore(0);
  }

  const tabFiltered = useMemo(() => filterByTab(allOpportunities, tab), [allOpportunities, tab]);

  const filtered = useMemo(
    () => applyFilters(tabFiltered, { query, verdict, confidence, format, minScore }),
    [tabFiltered, query, verdict, confidence, format, minScore]
  );

  const isFiltered = query || verdict !== 'all' || confidence !== 'all' || format !== 'all' || minScore > 0;

  if (error) {
    return (
      <div className="opportunities-page">
        <div className="opportunities-header">
          <div>
            <h1>Що знімати далі</h1>
          </div>
        </div>
        <div className="todayError">
          <p style={{ color: 'var(--red)' }}>Не вдалося завантажити можливості: {error}</p>
          <button className="button" onClick={reload}>
            <RefreshCw size={16} /> Повторити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="opportunities-page">
      <div className="opportunities-header">
        <div>
          <h1>
            <Sparkles size={22} className="opportunities-header-icon" />
            Що знімати далі
          </h1>
          <p className="opportunities-subtitle">
            Рекомендації на основі реальних даних YouTube та перевірених аналітичних сигналів.
          </p>
        </div>
        <button className="iconButton" onClick={reload} title="Оновити">
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <>
          <div className="opp-skeleton-stats">
            <SkeletonBlock height={96} radius={14} />
            <SkeletonBlock height={96} radius={14} />
            <SkeletonBlock height={96} radius={14} />
          </div>
          <SkeletonBlock height={44} radius={0} />
          <SkeletonBlock height={44} radius={8} />
          <OpportunitiesGridSkeleton />
        </>
      ) : allOpportunities.length === 0 ? (
        <div className="todayEmpty">
          <h2>Поки немає можливостей для аналізу</h2>
          <p>
            Система не отримала достатньо YouTube-даних для формування рекомендацій.
          </p>
          <div className="rowActions">
            <Link className="button ghost" href="/jobs">Перейти до Jobs</Link>
            <Link className="button ghost" href="/data-health">Перевірити Data Health</Link>
          </div>
        </div>
      ) : (
        <>
          <OpportunityStats opportunities={allOpportunities} />

          <OpportunityTabs active={tab} onChange={t => { setTab(t); resetFilters(); }} />

          <OpportunityFilters
            days={days}
            query={query}
            verdict={verdict}
            confidence={confidence}
            format={format}
            minScore={minScore}
            onDaysChange={setDays}
            onQueryChange={setQuery}
            onVerdictChange={setVerdict}
            onConfidenceChange={setConfidence}
            onFormatChange={setFormat}
            onMinScoreChange={setMinScore}
            onReset={resetFilters}
          />

          <OpportunityGrid
            opportunities={filtered}
            isFiltered={!!isFiltered}
            onResetFilters={resetFilters}
          />

          <OpportunityEvidenceFooter opportunities={allOpportunities} />
        </>
      )}
    </div>
  );
}
