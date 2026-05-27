import React, { useMemo, useState } from 'react';
import { Radar, RefreshCw } from 'lucide-react';
import { api, usePolling } from '../lib/shared.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import TrendSummaryCards from '../components/trend-radar/TrendSummaryCards.jsx';
import TrendTabs from '../components/trend-radar/TrendTabs.jsx';
import TrendFilters from '../components/trend-radar/TrendFilters.jsx';
import TrendTable from '../components/trend-radar/TrendTable.jsx';
import TrendInsights from '../components/trend-radar/TrendInsights.jsx';
import TrendEvidenceExamples from '../components/trend-radar/TrendEvidenceExamples.jsx';
import TrendEvidenceFooter from '../components/trend-radar/TrendEvidenceFooter.jsx';
import '../styles/trend-radar.css';

const TAB_KEYS = ['topics', 'hashtags', 'videos', 'formats', 'categories'];

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeCompetition(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'object') {
    return value.level || value.label || value.value || null;
  }
  if (typeof value === 'number') {
    if (value >= 70) return 'high';
    if (value >= 40) return 'medium';
    return 'low';
  }
  const text = String(value).toLowerCase();
  if (text.includes('вис') || text.includes('high')) return 'high';
  if (text.includes('низ') || text.includes('low')) return 'low';
  if (text.includes('сер') || text.includes('medium')) return 'medium';
  return value;
}

function normalizeEvidenceQuality(value) {
  const number = toNumberOrNull(value);
  if (number !== null) return number;
  const text = String(value || '').toLowerCase();
  if (text === 'high') return 85;
  if (text === 'medium') return 65;
  if (text === 'low') return 40;
  return null;
}

function normalizeDirection(rawDirection, demandGrowth) {
  const text = String(rawDirection || '').toLowerCase();
  if (text === 'cooling') return 'falling';
  if (['rising', 'stable', 'falling'].includes(text)) return text;
  if (demandGrowth !== null && demandGrowth > 0) return 'rising';
  if (demandGrowth !== null && demandGrowth < 0) return 'falling';
  return 'stable';
}

export function getTrendRecommendation(item) {
  const apiValue = item.recommendation || item.rawRecommendation;
  if (apiValue) {
    const key = String(apiValue).toLowerCase();
    if (['shoot_now', 'shoot', 'use', 'знімати'].includes(key)) return { label: 'Знімати', tone: 'green', source: 'api' };
    if (['adapt', 'адаптувати'].includes(key)) return { label: 'Адаптувати', tone: 'orange', source: 'api' };
    if (['watch', 'monitor', 'слідкувати'].includes(key)) return { label: 'Слідкувати', tone: 'blue', source: 'api' };
    if (['avoid', 'skip', 'уникати'].includes(key)) return { label: 'Уникати', tone: 'red', source: 'api' };
    return { label: apiValue, tone: 'blue', source: 'api' };
  }

  const demandGrowth = toNumberOrNull(item.demandGrowth);
  const evidenceQuality = toNumberOrNull(item.evidenceQuality);
  const competitionLevel = String(item.competitionLevel || '').toLowerCase();

  // fallback only; backend recommendation has priority
  if (demandGrowth !== null && evidenceQuality !== null && demandGrowth >= 100 && competitionLevel !== 'high' && evidenceQuality >= 60) {
    return { label: 'Знімати', tone: 'green', source: 'fallback' };
  }
  if (demandGrowth !== null && evidenceQuality !== null && demandGrowth >= 40 && evidenceQuality >= 50) {
    return { label: 'Адаптувати', tone: 'orange', source: 'fallback' };
  }
  if (demandGrowth !== null && demandGrowth >= 0) return { label: 'Слідкувати', tone: 'blue', source: 'fallback' };
  if (demandGrowth !== null && demandGrowth < 0) return { label: 'Уникати', tone: 'red', source: 'fallback' };
  return { label: 'Слідкувати', tone: 'blue', source: 'fallback' };
}

export function normalizeTrendItem(raw, type) {
  const label = firstPresent(raw.label, raw.topic, raw.hashtag, raw.title, raw.name);
  const demandGrowth = toNumberOrNull(firstPresent(raw.demandGrowth, raw.demand_growth, raw.growth, raw.changePercent, raw.viewsGrowth, raw.effective_change, raw.change_30d, raw.change_7d));
  const rawDirection = firstPresent(raw.direction, raw.trendStatus, raw.trend_status, raw.trend, raw.status);
  const competitionValue = firstPresent(raw.competitionLevel, raw.competition_level, raw.competition, raw.competitionScore, raw.competition_score);
  const evidenceValue = firstPresent(raw.evidenceQuality, raw.evidence_quality, raw.confidenceScore, raw.confidence);
  const rawRecommendation = firstPresent(raw.recommendation, raw.action, raw.suggestedAction);
  const item = {
    id: firstPresent(raw.id, raw.video_id, raw.url, label),
    type,
    label,
    subtitle: firstPresent(raw.subtitle, raw.description, raw.category, raw.channel, raw.topic),
    direction: normalizeDirection(rawDirection, demandGrowth),
    demandGrowth,
    competitionLevel: normalizeCompetition(competitionValue),
    videosAnalyzed: toNumberOrNull(firstPresent(raw.videosAnalyzed, raw.videos_analyzed, raw.dataHealth?.videosAnalyzed, raw.video_count, raw.usageCount, raw.videos)),
    channelsAnalyzed: toNumberOrNull(firstPresent(raw.channelsAnalyzed, raw.channels_analyzed, raw.dataHealth?.sourcesCount, raw.channel_count, raw.channels)),
    evidenceQuality: normalizeEvidenceQuality(evidenceValue),
    recommendation: rawRecommendation,
    rawRecommendation,
    category: firstPresent(raw.category, raw.category_id, raw.topicCategory),
    examples: Array.isArray(raw.examples) ? raw.examples : Array.isArray(raw.bestVideoExamples) ? raw.bestVideoExamples : Array.isArray(raw.sourceVideos) ? raw.sourceVideos : [],
    updatedAt: firstPresent(raw.updatedAt, raw.updated_at, raw.dataHealth?.lastUpdated, raw.last_seen, raw.publishedAt, raw.published_at),
    raw,
  };
  item.recommendationMeta = getTrendRecommendation(item);
  return item;
}

function rawArray(data, key) {
  const value = data?.[key];
  return Array.isArray(value) ? value : [];
}

function collectRawData(data) {
  const analytics = data?.analytics || {};
  const hashtagAnalytics = data?.hashtag_analytics || {};
  return {
    topics: rawArray(data, 'topics').length ? rawArray(data, 'topics') : rawArray(data, 'top_opportunities').length ? rawArray(data, 'top_opportunities') : rawArray(data, 'opportunities'),
    hashtags: rawArray(data, 'hashtags').length ? rawArray(data, 'hashtags') : rawArray(hashtagAnalytics, 'hashtags'),
    videos: rawArray(data, 'videos').length ? rawArray(data, 'videos') : rawArray(data, 'risingVideos').length ? rawArray(data, 'risingVideos') : rawArray(data, 'evidenceVideos'),
    formats: rawArray(data, 'formats').length ? rawArray(data, 'formats') : rawArray(analytics, 'format_mix'),
    categories: rawArray(data, 'categories').length ? rawArray(data, 'categories') : rawArray(analytics, 'category_mix'),
  };
}

function normalizeTrendData(data) {
  const raw = collectRawData(data || {});
  return TAB_KEYS.reduce((acc, key) => {
    acc[key] = raw[key].filter(Boolean).map((item) => normalizeTrendItem(item, key));
    return acc;
  }, {});
}

async function loadTrendRadarData(days) {
  try {
    return { ...(await api(`/api/trends?days=${encodeURIComponent(days)}`)), __source: 'trends' };
  } catch (trendError) {
    const summary = await api(`/api/summary?days=${encodeURIComponent(days)}`);
    return { ...summary, __source: 'summary', __fallbackReason: trendError.message || String(trendError) };
  }
}

function useTrendRadar(days) {
  return usePolling(() => loadTrendRadarData(days), [days], 30000);
}

function categoryOptionsFromData(normalizedData) {
  const values = Object.values(normalizedData)
    .flat()
    .map((item) => item.category)
    .filter(Boolean);
  return Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));
}

function applyFilters(items, filters) {
  const needle = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    const haystack = `${item.label || ''} ${item.subtitle || ''} ${item.category || ''}`.toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.direction !== 'all' && item.direction !== filters.direction) return false;
    if (item.evidenceQuality !== null && Number(item.evidenceQuality) < Number(filters.minEvidence)) return false;
    return true;
  });
}

function TrendRadarSkeleton() {
  return (
    <div className="trend-radar-loading">
      <div className="trend-summary-cards">
        {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} height={132} radius={8} />)}
      </div>
      <SkeletonBlock height={46} radius={0} />
      <SkeletonBlock height={56} radius={8} />
      <div className="trend-radar-main-grid">
        <SkeletonBlock height={456} radius={8} />
        <SkeletonBlock height={456} radius={8} />
      </div>
    </div>
  );
}

export default function TrendRadarPage() {
  const [days, setDays] = useState(7);
  const [activeTab, setActiveTab] = useState('topics');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    direction: 'all',
    minEvidence: 0,
  });

  const { data, error, loading, reload } = useTrendRadar(days);
  const normalizedData = useMemo(() => normalizeTrendData(data), [data]);
  const allItems = useMemo(() => Object.values(normalizedData).flat(), [normalizedData]);
  const activeItems = normalizedData[activeTab] || [];
  const filteredItems = useMemo(() => applyFilters(activeItems, filters), [activeItems, filters]);
  const categoryOptions = useMemo(() => categoryOptionsFromData(normalizedData), [normalizedData]);
  const hasAnySignals = allItems.length > 0;
  const hasActiveFilters = filters.search || filters.category !== 'all' || filters.direction !== 'all' || Number(filters.minEvidence) !== 0;

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function resetFilters() {
    setFilters({ search: '', category: 'all', direction: 'all', minEvidence: 0 });
  }

  if (error) {
    return (
      <div className="trend-radar-page">
        <div className="trend-radar-header">
          <div>
            <h1><Radar size={24} />Trend Radar</h1>
            <p>Дослідник доказів: реальні сигнали трендів YouTube з даними та аналітикою.</p>
          </div>
        </div>
        <Card className="trend-radar-error">
          <h2>Не вдалося завантажити Trend Radar</h2>
          <p>{error}</p>
          <Button onClick={reload}><RefreshCw size={16} />Повторити</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="trend-radar-page">
      <div className="trend-radar-header">
        <div>
          <h1><Radar size={24} />Trend Radar</h1>
          <p>Дослідник доказів: реальні сигнали трендів YouTube з даними та аналітикою.</p>
        </div>
        <button className="iconButton" onClick={reload} title="Оновити">
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <TrendRadarSkeleton />
      ) : !hasAnySignals ? (
        <div className="todayEmpty">
          <h2>Поки немає трендових сигналів</h2>
          <p>Запустіть збір YouTube-даних або збільшіть період аналізу.</p>
        </div>
      ) : (
        <>
          <TrendSummaryCards data={normalizedData} />
          <section className="trend-radar-workspace">
            <TrendTabs activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); resetFilters(); }} />
            <TrendFilters
              days={days}
              filters={filters}
              categories={categoryOptions}
              onDaysChange={setDays}
              onChange={updateFilters}
              onReset={resetFilters}
            />
            <div className="trend-radar-main-grid">
              <TrendTable
                tab={activeTab}
                items={filteredItems}
                totalItems={activeItems.length}
                isFiltered={!!hasActiveFilters}
                onResetFilters={resetFilters}
              />
              <TrendInsights items={filteredItems} allItems={allItems} tab={activeTab} />
            </div>
          </section>
          {activeItems.length > 0 && filteredItems.length === 0 ? (
            <EmptyState
              title="Немає результатів за фільтрами"
              text="Змініть пошук, категорію, напрям або мінімальний рівень доказів."
              action={<Button ghost onClick={resetFilters}>Скинути фільтри</Button>}
            />
          ) : null}
          <TrendEvidenceExamples data={normalizedData} />
          <TrendEvidenceFooter data={data} items={allItems} />
        </>
      )}
    </div>
  );
}
