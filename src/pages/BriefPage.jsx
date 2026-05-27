import React from 'react';
import { Wand2, RefreshCw, AlertTriangle } from 'lucide-react';
import { usePolling, api, Link } from '../lib/shared.jsx';
import { formatLabel } from '../lib/formatters.js';
import BriefHeader from '../components/brief/BriefHeader.jsx';
import BriefActions from '../components/brief/BriefActions.jsx';
import BriefSummaryPanel from '../components/brief/BriefSummaryPanel.jsx';
import BriefSection from '../components/brief/BriefSection.jsx';
import BriefConcept from '../components/brief/BriefConcept.jsx';
import BriefHookLab from '../components/brief/BriefHookLab.jsx';
import BriefStructure from '../components/brief/BriefStructure.jsx';
import BriefBroll from '../components/brief/BriefBroll.jsx';
import BriefTitles from '../components/brief/BriefTitles.jsx';
import BriefHashtags from '../components/brief/BriefHashtags.jsx';
import BriefEvidence from '../components/brief/BriefEvidence.jsx';
import BriefRisks from '../components/brief/BriefRisks.jsx';
import BriefNextActions from '../components/brief/BriefNextActions.jsx';
import BriefEvidenceFooter from '../components/brief/BriefEvidenceFooter.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import '../styles/brief.css';

function useOpportunities(days) {
  return usePolling(() => api(`/api/opportunities?days=${encodeURIComponent(days)}`), [days], 30000);
}

function normalizeBriefData(source) {
  if (!source) return null;
  const hashtagGroups = source.hashtagGroups || {};
  const flatHashtags = source.hashtags?.length
    ? source.hashtags
    : [
        ...(hashtagGroups.primary || []),
        ...(hashtagGroups.secondary || []),
        ...(hashtagGroups.experimental || []),
      ];

  return {
    id: source.id || source.topic_key || source.topic,
    title: source.suggestedTitles?.[0] || source.title || source.topic || 'Без назви',
    verdict: source.suggestedAction || source.recommendedAction || source.verdict || source.status,
    opportunityScore: Number(source.opportunityScore || source.opportunity_score || 0),
    confidence: source.confidence || null,
    recommendedFormat: source.recommendedFormat || source.recommended_format || source.format || null,
    evidenceQuality: source.evidenceQuality || source.evidence_quality || source.confidence || null,
    targetAudience: source.targetAudience || source.target_audience || source.audience || null,
    retentionPotential: source.avgRetention || source.average_retention || source.retentionPotential || null,
    competitionLevel: source.competitionLevel || source.competition_level || source.competition || null,
    firstAction: source.firstAction || source.recommendedAction || null,
    concept: source.concept || source.suggested_angle || source.angle || source.summary || null,
    conceptTags: source.conceptTags || source.tags || source.keywords || [],
    hooks: source.hooks || source.hookOptions || (source.suggestedHook ? [source.suggestedHook] : []),
    recommendedHookIndex: source.recommendedHookIndex ?? 0,
    structure: source.structure || source.videoStructure || source.scriptStructure
      || source.productionPlan?.structure || source.suggestedStructure || [],
    broll: source.broll || source.bRoll || source.inserts || source.shotList || [],
    titles: source.suggestedTitles || source.titles || [],
    thumbnails: source.thumbnailIdeas || source.thumbnails || [],
    hashtags: flatHashtags,
    evidence: Array.isArray(source.evidence) ? source.evidence
      : Array.isArray(source.whyRecommended) ? source.whyRecommended
      : Array.isArray(source.trendEvidence) ? source.trendEvidence
      : [],
    risks: source.risks || source.riskFactors || source.risk_factors || [],
    nextActions: source.nextActions || source.todo || [],
    videosAnalyzed: source.dataHealth?.videosAnalyzed || source.videosAnalyzed || source.videos_analyzed || 0,
    channelsAnalyzed: source.dataHealth?.sourcesCount || source.channelsAnalyzed || source.channels_analyzed || 0,
    updatedAt: source.dataHealth?.lastUpdated || source.updatedAt || source.updated_at || null,
    source,
  };
}

function BriefSkeleton() {
  return (
    <div className="brief-skeleton">
      <SkeletonBlock height={200} radius={16} />
      <SkeletonBlock height={48} radius={8} />
      <div className="brief-content-layout">
        <div className="brief-skeleton-sections">
          {[180, 140, 200, 160, 120].map((h, i) => (
            <SkeletonBlock key={i} height={h} radius={14} />
          ))}
        </div>
        <SkeletonBlock height={320} radius={14} />
      </div>
    </div>
  );
}

function lowEvidenceWarning(brief) {
  const q = brief.evidenceQuality;
  const hasEvidence = brief.evidence?.length > 0 || brief.videosAnalyzed > 0;
  if (q === 'low' || (!hasEvidence && brief.opportunityScore > 0)) {
    return (
      <div className="brief-warning">
        <AlertTriangle size={15} />
        Бріф має недостатньо структурованих доказів. Перед зйомкою перевірте Trend Radar або оновіть збір YouTube-даних.
      </div>
    );
  }
  return null;
}

export default function BriefPage({ route }) {
  const params = new URLSearchParams(route?.search || '');
  const requestedId = params.get('id') || '';
  const ideaParam = params.get('idea') || '';

  const { data, error, loading, reload } = useOpportunities(30);
  const opportunities = data?.opportunities || [];

  let sourceOpportunity = null;
  if (requestedId) {
    sourceOpportunity = opportunities.find(item => {
      const keys = [item.id, item.topic_key, item.title, item.topic].map(v => String(v || ''));
      return keys.includes(requestedId);
    }) || null;
  }
  if (!sourceOpportunity) {
    sourceOpportunity = data?.best || opportunities[0] || null;
  }

  const brief = sourceOpportunity ? normalizeBriefData(sourceOpportunity) : null;

  if (loading) return (
    <div className="brief-page">
      <div>
        <h1 className="brief-page-title"><Wand2 size={20} style={{ color: 'var(--blue)' }} />Готовий бріф</h1>
        <p className="brief-page-subtitle">Фінальний production-бріф, створений на основі реальних даних YouTube.</p>
      </div>
      <BriefSkeleton />
    </div>
  );

  if (error) return (
    <div className="brief-page">
      <h1 className="brief-page-title"><Wand2 size={20} style={{ color: 'var(--blue)' }} />Готовий бріф</h1>
      <div className="brief-warning" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <p style={{ margin: 0, color: 'var(--red)' }}>Не вдалося завантажити бріф: {error}</p>
        <button className="button" onClick={reload}><RefreshCw size={14} />Повторити</button>
      </div>
    </div>
  );

  if (ideaParam && !brief) return (
    <div className="brief-page">
      <h1 className="brief-page-title"><Wand2 size={20} style={{ color: 'var(--blue)' }} />Готовий бріф</h1>
      <EmptyState
        title="Бріф для ідеї ще не створено"
        text="Поверніться в Idea Lab і проаналізуйте ідею — бріф буде сформовано після аналізу."
        action={<Link className="button ghost" href={`/idea-lab?idea=${encodeURIComponent(ideaParam)}`}>Повернутись в Idea Lab</Link>}
      />
    </div>
  );

  if (!brief) return (
    <div className="brief-page">
      <h1 className="brief-page-title"><Wand2 size={20} style={{ color: 'var(--blue)' }} />Готовий бріф</h1>
      <EmptyState
        title="Бріф ще не вибрано"
        text="Оберіть можливість на сторінці 'Можливості' або перевірте ідею в Idea Lab."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="button ghost" href="/opportunities">Перейти до Можливостей</Link>
            <Link className="button ghost" href="/idea-lab">Перевірити ідею</Link>
          </div>
        }
      />
    </div>
  );

  const hasHashtags = brief.hashtags?.length > 0;

  return (
    <div className="brief-page">
      <div>
        <h1 className="brief-page-title">
          <Wand2 size={20} style={{ color: 'var(--blue)' }} />
          Готовий бріф
        </h1>
        <p className="brief-page-subtitle">
          Фінальний production-бріф, створений на основі реальних даних YouTube.
        </p>
      </div>

      <BriefHeader brief={brief} />

      {lowEvidenceWarning(brief)}

      <BriefActions brief={brief} />

      <div className="brief-content-layout">
        <div className="brief-main">
          <BriefSection num={1} title="Концепт відео">
            <BriefConcept brief={brief} />
          </BriefSection>

          <BriefSection num={2} title="Hook Lab">
            <BriefHookLab brief={brief} />
          </BriefSection>

          <BriefSection num={3} title={brief.recommendedFormat ? `Структура відео (${formatLabel(brief.recommendedFormat)})` : 'Структура відео'}>
            <BriefStructure brief={brief} />
          </BriefSection>

          <BriefSection num={4} title="B-roll та вставки">
            <BriefBroll brief={brief} />
          </BriefSection>

          <BriefSection num={5} title="Назви та thumbnail ideas">
            <BriefTitles brief={brief} />
          </BriefSection>

          {hasHashtags && (
            <BriefSection num={6} title="Хештеги">
              <BriefHashtags brief={brief} />
            </BriefSection>
          )}

          <BriefSection num={hasHashtags ? 7 : 6} title="Докази та трендові сигнали">
            <BriefEvidence brief={brief} />
          </BriefSection>

          <BriefSection num={hasHashtags ? 8 : 7} title="Ризики">
            <BriefRisks brief={brief} />
          </BriefSection>

          <BriefSection num={hasHashtags ? 9 : 8} title="Наступні дії">
            <BriefNextActions brief={brief} />
          </BriefSection>

          <BriefEvidenceFooter brief={brief} />
        </div>

        <div className="brief-sidebar">
          <BriefSummaryPanel brief={brief} />
        </div>
      </div>
    </div>
  );
}
