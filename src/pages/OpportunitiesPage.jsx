import React, { useState, useMemo } from 'react';
import { RefreshCw, Sparkles, ChevronDown, ChevronUp, Brain, AlertTriangle, BarChart2 } from 'lucide-react';
import { usePolling, api, navigateTo, Link } from '../lib/shared.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import OpportunityFilterBar from '../components/opportunities/OpportunityFilterBar.jsx';
import OpportunityHero from '../components/opportunities/OpportunityHero.jsx';
import OpportunityBoard from '../components/opportunities/OpportunityBoard.jsx';
import OpportunityEvidenceModal from '../components/opportunities/OpportunityEvidenceModal.jsx';
import {
  normalizeOpportunity,
  pickHero,
  groupByColumn,
  applyFilters,
  hasActiveFilters,
  DEFAULT_FILTERS,
} from '../lib/opportunityModel.js';
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

function PageSkeleton() {
  return (
    <>
      <SkeletonBlock height={48} radius={10} />
      <SkeletonBlock height={260} radius={16} />
      <div className="opp-skeleton-board">
        {[0, 1, 2, 3, 4].map(i => <SkeletonBlock key={i} height={420} radius={14} />)}
      </div>
    </>
  );
}

export default function OpportunitiesPage() {
  const [days, setDays] = useState(7);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query] = useState('');
  const [evidenceId, setEvidenceId] = useState(null);

  const { data, error, loading, reload } = useOpportunities(days);

  const normalized = useMemo(() => {
    const items = data?.opportunities || [];
    return items.map(normalizeOpportunity).filter(Boolean);
  }, [data]);

  const marketOptions = useMemo(() => {
    const set = new Set();
    normalized.forEach(it => { if (it.market) set.add(it.market); });
    return Array.from(set).sort();
  }, [normalized]);

  const filtered = useMemo(
    () => applyFilters(normalized, filters, query),
    [normalized, filters, query]
  );

  const hero = useMemo(() => pickHero(filtered), [filtered]);
  const board = useMemo(() => groupByColumn(filtered), [filtered]);

  const evidenceItem = useMemo(() => {
    if (!evidenceId) return null;
    return normalized.find(it => it.id === evidenceId) || null;
  }, [normalized, evidenceId]);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleCreateBrief(id) {
    const briefId = id || hero?.id;
    navigateTo(briefId ? `/brief?id=${encodeURIComponent(briefId)}` : '/brief');
  }

  if (error) {
    return (
      <div className="opportunities-page">
        <div className="opportunities-header">
          <div>
            <h1>Можливості</h1>
            <p className="opportunities-subtitle">Evidence-based вибір наступного відео</p>
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
            Можливості
          </h1>
          <p className="opportunities-subtitle">Evidence-based вибір наступного відео</p>
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
        <PageSkeleton />
      ) : normalized.length === 0 ? (
        <>
          <LlmSynthesisPanel text={data?.llm_synthesis} />
          <EmptyState
            title="Поки немає можливостей для аналізу"
            text="Система не отримала достатньо YouTube-даних для формування рекомендацій."
            action={
              <div className="rowActions">
                <Link className="button ghost" href="/jobs">Перейти до Jobs</Link>
                <Link className="button ghost" href="/data-health">Перевірити Data Health</Link>
              </div>
            }
          />
        </>
      ) : (
        <>
          <OpportunityFilterBar
            days={days}
            filters={filters}
            marketOptions={marketOptions}
            onDaysChange={setDays}
            onFiltersChange={setFilters}
            onReset={resetFilters}
          />

          <LlmSynthesisPanel text={data?.llm_synthesis} />

          {filtered.length === 0 ? (
            <EmptyState
              title="Немає результатів за фільтрами"
              text="Спробуйте змінити фільтри або скинути їх."
              action={hasActiveFilters(filters) ? (
                <button className="button" onClick={resetFilters}>Скинути фільтри</button>
              ) : null}
            />
          ) : (
            <>
              {hero && (
                <OpportunityHero
                  item={hero}
                  onCreateBrief={() => handleCreateBrief(hero.id)}
                  onShowEvidence={() => setEvidenceId(hero.id)}
                />
              )}

              <OpportunityBoard
                board={board}
                total={filtered.length}
                onShowEvidence={setEvidenceId}
                onCreateBrief={handleCreateBrief}
              />
            </>
          )}
        </>
      )}

      {evidenceItem && (
        <OpportunityEvidenceModal
          item={evidenceItem}
          onClose={() => setEvidenceId(null)}
        />
      )}
    </div>
  );
}
