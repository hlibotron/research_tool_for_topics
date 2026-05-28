import React, { useState, useMemo } from 'react';
import { RefreshCw, Sparkles, ChevronDown, ChevronUp, Brain, AlertTriangle, BarChart2 } from 'lucide-react';
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

function formatRelativeTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} хв тому`;
  if (diffH < 24) return `${diffH} год тому`;
  return `${Math.floor(diffH / 24)} дн тому`;
}

function LlmSynthesisPanel({ text }) {
  const [open, setOpen] = useState(false);
  if (!text || text.trim().length < 40) return null;
  return (
    <div className="opp-llm-panel">
      <button className="opp-llm-toggle" onClick={() => setOpen(o => !o)}>
        <Brain size={16} />
        <span>AI стратегічний аналіз</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="opp-llm-body">
          <pre className="opp-llm-text">{text.trim()}</pre>
        </div>
      )}
    </div>
  );
}

function DiagnosticsBanner({ signalsAnalyzed, clusters, generatedAt, warnings }) {
  const relTime = formatRelativeTime(generatedAt);
  const isStale = signalsAnalyzed < 30 && signalsAnalyzed >= 0;
  const hasWarnings = warnings && warnings.length > 0;
  if (!isStale && !hasWarnings && !relTime) return null;
  return (
    <div className={`opp-diagnostics${isStale ? ' opp-diagnostics-warn' : ''}`}>
      {isStale && <AlertTriangle size={15} className="opp-diag-icon-warn" />}
      {!isStale && <BarChart2 size={15} className="opp-diag-icon" />}
      <div className="opp-diag-body">
        <span className="opp-diag-meta">
          {relTime && <span>Оновлено {relTime}</span>}
          {signalsAnalyzed > 0 && <span>{signalsAnalyzed} сигналів → {clusters} кластерів</span>}
        </span>
        {hasWarnings && (
          <ul className="opp-diag-warnings">
            {warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
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

      <DiagnosticsBanner
        signalsAnalyzed={data?.signals_analyzed ?? -1}
        clusters={data?.clusters ?? 0}
        generatedAt={data?.generated_at}
        warnings={data?.warnings}
      />

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
        <>
          <LlmSynthesisPanel text={data?.llm_synthesis} />
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
        </>
      ) : (
        <>
          <OpportunityStats opportunities={allOpportunities} />

          <LlmSynthesisPanel text={data?.llm_synthesis} />

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
