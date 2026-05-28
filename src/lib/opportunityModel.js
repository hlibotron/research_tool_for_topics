import { classifyToColumn } from './opportunityClassifier.js';

const CONFIDENCE_NUMERIC = { high: 90, medium: 65, low: 35 };

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function confidenceToNumber(value) {
  if (value == null) return 65;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }
  return CONFIDENCE_NUMERIC[String(value).toLowerCase()] ?? 65;
}

function difficultyFromScore(item) {
  const raw = item.difficulty || item.difficulty_level;
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
  const s = toNumber(item.difficultyScore ?? item.difficulty_score, NaN);
  if (Number.isFinite(s)) {
    if (s <= 2) return 'low';
    if (s <= 3) return 'medium';
    return 'high';
  }
  return undefined;
}

function difficultyLabel(level, score) {
  const s = toNumber(score, NaN);
  const num = Number.isFinite(s) ? `${Math.round(s)}/5` : null;
  const txt = level === 'low' ? 'Легка' : level === 'high' ? 'Складна' : level === 'medium' ? 'Середня' : null;
  if (num && txt) return `${num} ${txt}`;
  return txt || num || '—';
}

function channelFitLevel(item) {
  const raw = item.channelFit || item.channel_fit || item.channelFitLevel;
  if (typeof raw === 'string') {
    const v = raw.toLowerCase();
    if (['excellent', 'good', 'fair', 'poor'].includes(v)) return v;
  }
  const score = toNumber(item.channelFitScore ?? item.channel_fit_score, NaN);
  if (Number.isFinite(score)) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }
  return undefined;
}

function channelFitLabel(level) {
  return ({ excellent: 'Відмінно', good: 'Добре', fair: 'Прийнятно', poor: 'Слабко' })[level] || '—';
}

function deriveWhyShort(item, reasons) {
  if (item.whyShort) return String(item.whyShort);
  if (Array.isArray(reasons) && reasons[0]) return String(reasons[0]).slice(0, 140);
  return '';
}

function deriveEvidenceHighlights(item, reasons) {
  if (Array.isArray(item.evidenceHighlights) && item.evidenceHighlights.length) {
    return item.evidenceHighlights.slice(0, 3);
  }
  if (Array.isArray(item.evidence) && item.evidence.length) {
    return item.evidence.slice(0, 3).map(String);
  }
  if (Array.isArray(reasons) && reasons.length) return reasons.slice(0, 3).map(String);
  return [];
}

function countEvidence(item) {
  if (Array.isArray(item.sourceVideos)) return item.sourceVideos.length;
  if (Array.isArray(item.evidence)) return item.evidence.length;
  if (typeof item.videos === 'number') return item.videos;
  return 0;
}

function deriveScoreBreakdown(item) {
  const src = item.scoreBreakdown || item.score_breakdown || {};
  const finalScore = toNumber(item.opportunityScore || item.opportunity_score, 0);
  const demand = toNumber(item.demandGrowth ?? item.demand_growth ?? item.trendGrowth, 0);
  const compLevel = item.competitionLevel || item.competition_level || item.competition || 'medium';
  const compScore = compLevel === 'low' ? 90 : compLevel === 'high' ? 35 : 60;
  const confidence = confidenceToNumber(item.confidence);
  const channelFitScore = toNumber(item.channelFitScore ?? item.channel_fit_score, 65);

  return {
    velocity: Math.round(toNumber(src.velocity, Math.min(100, Math.max(0, 50 + demand / 4)))),
    outlier: Math.round(toNumber(src.outlier, Math.min(100, Math.max(0, finalScore + 5)))),
    evidence: Math.round(toNumber(src.evidence, confidence)),
    engagement: Math.round(toNumber(src.engagement, Math.max(0, finalScore - 4))),
    freshness: Math.round(toNumber(src.freshness, Math.max(0, finalScore - 10))),
    channelFit: Math.round(toNumber(src.channelFit ?? src.channel_fit, channelFitScore)),
    feasibility: Math.round(toNumber(src.feasibility, compScore)),
  };
}

function deriveGapPercent(item) {
  if (item.gapPercent != null) return toNumber(item.gapPercent, 0);
  if (item.competitorGap?.gapPercent != null) return toNumber(item.competitorGap.gapPercent, 0);
  if (item.gap_percent != null) return toNumber(item.gap_percent, 0);
  const comp = item.competitionLevel || item.competition_level || item.competition;
  if (comp === 'low') return 70;
  if (comp === 'high') return 30;
  return 50;
}

function deriveNoPurchase(item) {
  if (typeof item.noPurchase === 'boolean') return item.noPurchase;
  if (typeof item.no_purchase === 'boolean') return item.no_purchase;
  const assets = item.requiredAssets || item.required_assets || item.assets || [];
  const text = Array.isArray(assets) ? assets.join(' ').toLowerCase() : '';
  if (/купити|purchase|buy/.test(text)) return false;
  return true;
}

function deriveTrendDelta(item) {
  if (item.trendDeltaPercent != null) return toNumber(item.trendDeltaPercent, 0);
  return toNumber(item.demandGrowth ?? item.demand_growth ?? item.trendGrowth ?? item.trend_growth, 0);
}

function deriveDeadlineHours(item) {
  if (item.deadlineHours != null) return toNumber(item.deadlineHours, 48);
  if (item.deadline_hours != null) return toNumber(item.deadline_hours, 48);
  const action = item.recommendedAction || item.suggestedAction || item.status || item.verdict;
  if (action === 'shoot_now') return 48;
  if (action === 'adapt') return 96;
  return 168;
}

export function normalizeOpportunity(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw.topic_key || raw.topic || raw.title || Math.random().toString(36).slice(2));
  const title = raw.suggestedTitles?.[0] || raw.title || raw.topic || 'Без назви';
  const reasons = raw.whyRecommended || raw.why_recommended || raw.reasons || [];
  const format = raw.recommendedFormat || raw.recommended_format || raw.format || null;
  const action = raw.recommendedAction || raw.suggestedAction || raw.status || raw.verdict || 'watch';
  const score = Math.round(toNumber(raw.opportunityScore || raw.opportunity_score, 0));
  const confidenceNum = confidenceToNumber(raw.confidence);
  const difficulty = difficultyFromScore(raw);
  const difficultyScore = raw.difficultyScore ?? raw.difficulty_score ?? null;
  const channelFit = channelFitLevel(raw);
  const gapPercent = Math.round(deriveGapPercent(raw));
  const trendDeltaPercent = Math.round(deriveTrendDelta(raw));
  const deadlineHours = deriveDeadlineHours(raw);

  const normalized = {
    id,
    title,
    shortTitle: raw.shortTitle || title,
    format,
    score,
    confidence: confidenceNum,
    confidenceLabel: raw.confidence || 'medium',
    action,
    deadlineHours,
    difficulty,
    difficultyScore: difficultyScore != null ? `${Math.round(toNumber(difficultyScore, 3))}/5` : (difficulty === 'low' ? '2/5' : difficulty === 'high' ? '4/5' : '3/5'),
    difficultyLabel: difficultyLabel(difficulty, difficultyScore),
    channelFit,
    channelFitLabel: channelFitLabel(channelFit),
    market: raw.market || raw.niche || raw.cluster_label || null,
    gapPercent,
    noPurchase: deriveNoPurchase(raw),
    whyShort: deriveWhyShort(raw, reasons),
    evidenceHighlights: deriveEvidenceHighlights(raw, reasons),
    thumbnailUrl: raw.thumbnailUrl || raw.thumbnail_url || raw.thumbnail || null,
    trendDeltaPercent,
    scoreBreakdown: deriveScoreBreakdown(raw),
    evidenceCount: countEvidence(raw),
    raw,
  };

  normalized.column = classifyToColumn(normalized);
  return normalized;
}

export function pickHero(items) {
  if (!items || !items.length) return null;
  const withEvidence = items.filter(it => (it.evidenceCount || 0) > 0 && (it.evidenceHighlights || []).length > 0);
  const pool = withEvidence.length ? withEvidence : items;
  const ordered = [...pool].sort((a, b) => {
    const colRank = { shoot_now: 0, priority: 1, high_potential: 2, adapt: 3, park: 4 };
    const rA = colRank[a.column] ?? 5;
    const rB = colRank[b.column] ?? 5;
    if (rA !== rB) return rA - rB;
    if (b.score !== a.score) return b.score - a.score;
    return (b.confidence || 0) - (a.confidence || 0);
  });
  return ordered[0] || null;
}

export function groupByColumn(items) {
  const groups = { shoot_now: [], adapt: [], priority: [], high_potential: [], park: [] };
  for (const it of items) {
    const key = groups[it.column] ? it.column : 'park';
    groups[key].push(it);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.confidence || 0) !== (a.confidence || 0)) return (b.confidence || 0) - (a.confidence || 0);
      return (b.trendDeltaPercent || 0) - (a.trendDeltaPercent || 0);
    });
  }
  return groups;
}

export function applyFilters(items, filters, query) {
  const needle = (query || '').trim().toLowerCase();
  return items.filter(item => {
    if (needle) {
      const hay = `${item.title} ${item.whyShort || ''} ${item.market || ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (filters.format !== 'all' && item.format !== filters.format) return false;
    if (filters.market !== 'all' && (item.market || '') !== filters.market) return false;
    if (filters.channelFit !== 'all' && item.channelFit !== filters.channelFit) return false;
    if (filters.difficulty !== 'all' && item.difficulty !== filters.difficulty) return false;
    if (filters.noPurchase && !item.noPurchase) return false;
    if (filters.highEvidence && item.confidence < 75) return false;
    if (filters.hideLowConfidence && item.confidence < 50) return false;
    return true;
  });
}

export const DEFAULT_FILTERS = {
  format: 'all',
  market: 'all',
  channelFit: 'all',
  difficulty: 'all',
  noPurchase: false,
  highEvidence: false,
  hideLowConfidence: false,
};

export function hasActiveFilters(filters) {
  return (
    filters.format !== 'all' ||
    filters.market !== 'all' ||
    filters.channelFit !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.noPurchase ||
    filters.highEvidence ||
    filters.hideLowConfidence
  );
}
