import React, { useContext, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { api, Link, ToastContext, usePolling } from '../lib/shared.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import SummaryKpiCards from '../components/summary/SummaryKpiCards.jsx';
import SummaryFilters from '../components/summary/SummaryFilters.jsx';
import SummaryInsightPanels from '../components/summary/SummaryInsightPanels.jsx';
import SummaryTrendChart from '../components/summary/SummaryTrendChart.jsx';
import SummaryRankings from '../components/summary/SummaryRankings.jsx';
import SummaryRecommendations from '../components/summary/SummaryRecommendations.jsx';
import SummaryEvidenceFooter from '../components/summary/SummaryEvidenceFooter.jsx';
import '../styles/summary.css';

const NO_DATA = 'немає даних';

function useSummary(days) {
  return usePolling(() => api(`/api/summary?days=${encodeURIComponent(days)}`), [days], 30000);
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function effectiveChange(item) {
  return toNumberOrNull(firstPresent(item.change_7d, item.change_30d, item.momentum));
}

function normalizeHashtag(item) {
  const change = effectiveChange(item);
  return {
    ...item,
    id: item.id || item.hashtag || item.tag,
    label: item.hashtag || item.tag || item.label || NO_DATA,
    effectiveChange: change,
    status: change === null ? 'stable' : change > 0 ? 'growing' : change < 0 ? 'declining' : 'stable',
    format: item.format || item.format_guess || item.video_type || '',
    category: item.category || item.category_id || '',
    demand: firstPresent(item.views_per_day, item.avg_views_per_day, item.views, item.video_count),
  };
}

function normalizeTopic(item) {
  const change = toNumberOrNull(firstPresent(item.demandGrowth, item.demand_growth, item.growth, item.changePercent, item.trendVelocityScore, item.trendVelocity));
  const statusText = String(firstPresent(item.status, item.trendStatus, item.trend_status, '')).toLowerCase();
  const status = statusText.includes('fall') || statusText.includes('cool') || change < 0
    ? 'declining'
    : statusText.includes('stable') || change === 0
      ? 'stable'
      : change === null ? 'stable' : 'growing';
  return {
    ...item,
    id: item.id || item.topic_key || item.title || item.topic,
    label: item.title || item.topic || item.name || item.label || NO_DATA,
    effectiveChange: change,
    status,
    format: item.recommended_format || item.recommendedFormat || item.format || '',
    category: firstPresent(item.category, Object.keys(item.categories || {})[0], ''),
    demand: firstPresent(item.total_views, item.views, item.demandScore, item.demand_score),
  };
}

function normalizeFormat(item) {
  return {
    ...item,
    id: item.key || item.label || item.name,
    label: item.label || item.name || item.key || NO_DATA,
    format: item.key || item.label || item.name || '',
    category: item.category || '',
    retention: toNumberOrNull(firstPresent(item.avg_retention, item.avgRetention, item.retention)),
    performance: toNumberOrNull(firstPresent(item.strength, item.avg_views_per_day, item.views_per_day, item.performance)),
  };
}

function evidenceQuality(data, hashtags) {
  const apiValue = firstPresent(data?.evidence_quality, data?.hashtag_analytics?.summary?.evidence_quality);
  if (apiValue) return apiValue;
  if (data?.hashtag_analytics?.available === true && hashtags.length > 20) return 'Висока';
  if (hashtags.length > 5) return 'Середня';
  return 'Низька';
}

function competitionPenalty(items) {
  const levels = items.map((item) => String(item.competition?.level || item.competitionLevel || '').toLowerCase()).filter(Boolean);
  if (!levels.length) return 1.5;
  const highRatio = levels.filter((level) => level === 'high').length / levels.length;
  const mediumRatio = levels.filter((level) => level === 'medium').length / levels.length;
  return Math.max(0, 2 - highRatio * 2 - mediumRatio);
}

function computeOpportunityWindow(data, risingHashtags, allHashtags, quality) {
  const apiScore = toNumberOrNull(firstPresent(
    data?.opportunityWindow,
    data?.opportunity_window,
    data?.opportunity_window_score,
    data?.analytics?.opportunity_window,
    data?.hashtag_analytics?.summary?.opportunity_window,
  ));
  if (apiScore !== null) return { score: Math.max(0, Math.min(10, apiScore)), source: 'api' };

  const topGrowth = toNumberOrNull(risingHashtags[0]?.effectiveChange);
  const growthScore = topGrowth === null ? 1 : Math.min(5, Math.max(0, topGrowth / 60));
  const evidenceScore = quality === 'Висока' ? 2.5 : quality === 'Середня' ? 1.5 : 0.5;
  // UI fallback only; backend opportunity window has priority.
  const score = Math.max(0, Math.min(10, growthScore + evidenceScore + competitionPenalty(allHashtags)));
  return { score: Math.round(score * 10) / 10, source: 'fallback' };
}

function sumMetric(items, keys) {
  const values = items.map((item) => firstPresent(...keys.map((key) => item[key]))).filter((value) => value !== undefined && value !== null && Number.isFinite(Number(value))).map(Number);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

export function normalizeSummaryData(data) {
  const analytics = data?.analytics || {};
  const hashtagAnalytics = data?.hashtag_analytics || {};
  const hashtags = (hashtagAnalytics.hashtags || []).filter(Boolean).map(normalizeHashtag);
  const topics = (data?.top_opportunities || analytics.topics || []).filter(Boolean).map(normalizeTopic);
  const formats = (analytics.format_mix || []).filter(Boolean).map(normalizeFormat);
  const risingHashtags = hashtags.filter((item) => item.effectiveChange !== null && item.effectiveChange > 0).sort((a, b) => Number(b.effectiveChange) - Number(a.effectiveChange));
  const fallingHashtags = hashtags.filter((item) => item.effectiveChange !== null && item.effectiveChange < 0).sort((a, b) => Number(a.effectiveChange) - Number(b.effectiveChange));
  const risingTopics = topics.filter((item) => item.status === 'growing').sort((a, b) => Number(b.effectiveChange || 0) - Number(a.effectiveChange || 0));
  const fallingTopics = topics.filter((item) => item.status === 'declining').sort((a, b) => Number(a.effectiveChange || 0) - Number(b.effectiveChange || 0));
  const quality = evidenceQuality(data, hashtags);

  return {
    hashtags,
    topics,
    formats,
    risingHashtags,
    fallingHashtags,
    risingTopics,
    fallingTopics,
    bestFormat: firstPresent(hashtagAnalytics.summary?.top_format, analytics.best_format, formats[0]?.label),
    bestGrowing: risingHashtags[0] || risingTopics[0] || null,
    bestDeclining: fallingHashtags[0] || fallingTopics[0] || null,
    opportunityWindow: computeOpportunityWindow(data, risingHashtags, hashtags, quality),
    totalVideosAnalyzed: firstPresent(toNumberOrNull(hashtagAnalytics.summary?.videos_analyzed), sumMetric(hashtags, ['video_count', 'videos'])),
    totalChannelsAnalyzed: toNumberOrNull(hashtagAnalytics.summary?.channels_analyzed),
    evidenceQuality: quality,
    updatedAt: firstPresent(data?.updated_at, hashtagAnalytics.summary?.updated_at, data?.generated_at),
    timeSeries: firstPresent(data?.time_series, analytics.time_series, hashtagAnalytics.time_series, null),
  };
}

function matchesFormat(item, format) {
  if (format === 'all') return true;
  const value = String(item.format || item.recommended_format || '').toLowerCase();
  if (format === 'long-form') return value.includes('long');
  if (format === 'mid-form') return value.includes('mid') || value.includes('5') || value.includes('10');
  return value.includes(format);
}

function applySummaryFilters(summary, filters) {
  const needle = filters.search.trim().toLowerCase();
  const filterItem = (item) => {
    const haystack = `${item.label || ''} ${item.hashtag || ''} ${item.tag || ''} ${item.title || ''} ${item.category || ''}`.toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
    if (!matchesFormat(item, filters.format)) return false;
    if (filters.category !== 'all' && String(item.category || '') !== String(filters.category)) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    return true;
  };
  const hashtags = summary.hashtags.filter(filterItem);
  const topics = summary.topics.filter(filterItem);
  const formats = summary.formats.filter((item) => matchesFormat(item, filters.format));
  return {
    ...summary,
    hashtags,
    topics,
    formats,
    risingHashtags: hashtags.filter((item) => item.status === 'growing').sort((a, b) => Number(b.effectiveChange || 0) - Number(a.effectiveChange || 0)),
    fallingHashtags: hashtags.filter((item) => item.status === 'declining').sort((a, b) => Number(a.effectiveChange || 0) - Number(b.effectiveChange || 0)),
    risingTopics: topics.filter((item) => item.status === 'growing').sort((a, b) => Number(b.effectiveChange || 0) - Number(a.effectiveChange || 0)),
    fallingTopics: topics.filter((item) => item.status === 'declining').sort((a, b) => Number(a.effectiveChange || 0) - Number(b.effectiveChange || 0)),
  };
}

function SummarySkeleton() {
  return (
    <div className="summary-loading">
      <div className="summary-kpi-grid">{[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} height={142} radius={8} />)}</div>
      <SkeletonBlock height={64} radius={8} />
      <div className="summary-insight-panels">{[0, 1, 2].map((item) => <SkeletonBlock key={item} height={280} radius={8} />)}</div>
      <div className="summary-main-grid">
        <SkeletonBlock height={320} radius={8} />
        <SkeletonBlock height={320} radius={8} />
      </div>
    </div>
  );
}

function categoriesFrom(summary, rawData) {
  const map = new Map();
  summary.hashtags.forEach((item) => {
    if (item.category) map.set(String(item.category), String(item.category));
  });
  (rawData?.analytics?.category_mix || []).forEach((item) => {
    if (item.key || item.label) map.set(String(item.label || item.key), String(item.label || item.key));
  });
  return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

export default function SummaryPage() {
  const showToast = useContext(ToastContext);
  const [days, setDays] = useState(7);
  const [filters, setFilters] = useState({ format: 'all', category: 'all', search: '', status: 'all' });
  const { data, error, loading, reload } = useSummary(days);

  const summary = useMemo(() => normalizeSummaryData(data || {}), [data]);
  const filteredSummary = useMemo(() => applySummaryFilters(summary, filters), [summary, filters]);
  const categoryOptions = useMemo(() => categoriesFrom(summary, data), [summary, data]);
  const hasAnyData = summary.hashtags.length || summary.topics.length || summary.formats.length;
  const hasFilteredData = filteredSummary.hashtags.length || filteredSummary.topics.length || filteredSummary.formats.length;
  const isFiltered = filters.format !== 'all' || filters.category !== 'all' || filters.search || filters.status !== 'all';

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function resetFilters() {
    setFilters({ format: 'all', category: 'all', search: '', status: 'all' });
  }

  if (error) {
    return (
      <div className="summary-page">
        <header className="summary-header">
          <div><h1>Summary</h1><p>Стислий огляд ніші на основі реальної аналітики YouTube.</p></div>
        </header>
        <Card className="summary-error">
          <h2>Не вдалося завантажити Summary</h2>
          <p>{error}</p>
          <Button onClick={reload}><RefreshCw size={16} />Повторити</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="summary-page">
      <header className="summary-header">
        <div>
          <h1>Summary</h1>
          <p>Стислий огляд ніші на основі реальної аналітики YouTube.</p>
        </div>
        <div className="summary-header-actions">
          <Button ghost onClick={() => showToast('Експорт буде підключено окремо', 'blue')}>
            <Download size={16} />Експорт звіту
          </Button>
          <button className="iconButton" onClick={reload} title="Оновити">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {loading ? (
        <SummarySkeleton />
      ) : !hasAnyData ? (
        <EmptyState
          title="Поки немає summary-аналітики"
          text="Система не отримала достатньо YouTube-даних для стислого огляду ніші."
          action={(
            <div className="rowActions">
              <Link className="button ghost" href="/jobs">Перейти до Jobs</Link>
              <Link className="button ghost" href="/data-health">Перейти до Data Health</Link>
            </div>
          )}
        />
      ) : (
        <>
          <SummaryKpiCards summary={filteredSummary} days={days} />
          <SummaryFilters
            days={days}
            filters={filters}
            categories={categoryOptions}
            onDaysChange={setDays}
            onChange={updateFilters}
            onReset={resetFilters}
          />
          {!hasFilteredData ? (
            <EmptyState
              title="Немає результатів за фільтрами"
              text="Спробуйте інший формат, категорію, статус тренду або пошуковий запит."
              action={<Button ghost onClick={resetFilters}>Скинути фільтри</Button>}
            />
          ) : (
            <>
              <SummaryInsightPanels summary={filteredSummary} />
              <section className="summary-main-grid">
                <SummaryTrendChart summary={filteredSummary} />
                <SummaryRankings summary={filteredSummary} />
              </section>
              <SummaryRecommendations summary={filteredSummary} />
            </>
          )}
          <SummaryEvidenceFooter summary={summary} />
        </>
      )}
    </div>
  );
}
