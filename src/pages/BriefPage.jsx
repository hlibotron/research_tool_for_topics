import React, { useState } from 'react';
import { Wand2, RefreshCw, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
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
import BriefThumbnail from '../components/brief/BriefThumbnail.jsx';
import BriefHashtags from '../components/brief/BriefHashtags.jsx';
import BriefEvidence from '../components/brief/BriefEvidence.jsx';
import BriefRisks from '../components/brief/BriefRisks.jsx';
import BriefNextActions from '../components/brief/BriefNextActions.jsx';
import BriefEvidenceFooter from '../components/brief/BriefEvidenceFooter.jsx';
import { SkeletonBlock } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import '../styles/brief.css';

// Resolve the brief id through the backend resolver (§8.5): opportunity →
// backlog → saved IdeaLab → content-plan link. A missing id returns a
// not-found sentinel; we never silently open the top opportunity.
function useBrief(id) {
  return usePolling(async () => {
    if (!id) return null;
    try {
      return await api(`/api/brief?id=${encodeURIComponent(id)}`);
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes('not found')) return { ok: false, notFound: true, error: msg };
      throw err;
    }
  }, [id], 60000);
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

  // Normalize hooks: support both string[] (legacy) and object[] with {type, text}
  const rawHooks = source.hooks || source.hookOptions || [];
  const hooks = rawHooks.length > 0
    ? rawHooks.map(h => typeof h === 'string' ? { type: 'default', text: h } : h)
    : source.suggestedHook
      ? [{ type: 'default', text: source.suggestedHook }]
      : [];

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
    hooks,
    recommendedHookIndex: source.recommendedHookIndex ?? 0,
    scriptOutline: source.scriptOutline || source.script_outline || [],
    structure: source.structure || source.videoStructure || source.scriptStructure
      || source.productionPlan?.structure || source.suggestedStructure || [],
    broll: source.broll || source.bRoll || source.inserts || source.shotList || [],
    titles: source.suggestedTitles || source.titles || [],
    thumbnails: source.thumbnailIdeas || source.thumbnails || [],
    thumbnailConcepts: source.thumbnailConcepts || source.thumbnail_concepts || [],
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
    channelFitVerdict: source.channelFitVerdict || source.channel_fit_verdict || '',
    channelFitReason: source.channelFitReason || source.channel_fit_reason || '',
    productionNotes: source.productionNotes || source.production_notes || '',
    // Deep-review (shared validation engine) fields.
    recommendedTopic: source.recommendedTopic || source.recommended_topic || '',
    viewerPromise: source.viewerPromise || source.viewer_promise || source.one_sentence_promise || '',
    viewerQuestion: source.viewerQuestion || source.viewer_question || '',
    mainConflict: source.mainConflict || source.main_conflict || '',
    measurablePayoff: source.measurablePayoff || source.measurable_payoff || '',
    mustShowMoments: source.mustShowMoments || source.must_show_moments || [],
    cheapTest: source.cheapTest || source.cheap_test || null,
    introConsistency: source.introConsistency || source.intro_consistency || '',
    shortsFragments: source.shortsFragments || source.shorts_fragments || [],
    deepReviewStatus: source.deepReviewStatus || source.deep_review_status || null,
    editorialScore: source.editorialScore ?? source.editorial_score ?? null,
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

const MOMENT_LABELS = {
  promise: 'Обіцянка', problem: 'Проблема', first_test: 'Перший тест',
  failure_or_limit: 'Провал / межа', comparison: 'Порівняння',
  final_payoff: 'Фінальний payoff', verdict: 'Вердикт',
};

function MustShowMoments({ moments }) {
  return (
    <div className="brief-moments">
      {moments.map((m, i) => (
        <div key={i} className="brief-moment-row" style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border, #eee)' }}>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontWeight: 600 }}>{MOMENT_LABELS[m.type] || m.type}</div>
            {m.placement && <div style={{ fontSize: 12, color: 'var(--muted, #888)' }}>{m.placement}</div>}
          </div>
          <div style={{ flex: 1 }}>
            {m.shot && <div><strong>Кадр:</strong> {m.shot}</div>}
            {m.proof && <div><strong>Доказ:</strong> {m.proof}</div>}
            {m.retention_reason && <div style={{ color: 'var(--muted, #888)' }}>{m.retention_reason}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CheapTest({ test }) {
  return (
    <div className="brief-cheap-test">
      {test.hypothesis && <p><strong>Гіпотеза:</strong> {test.hypothesis}</p>}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted, #888)' }}>
        {test.format && <span>Формат: {formatLabel(test.format)}</span>}
        {test.max_effort_hours != null && <span>Зусилля: ≤ {test.max_effort_hours} год</span>}
      </div>
      {test.required_assets?.length > 0 && (
        <p><strong>Потрібно:</strong> {test.required_assets.join(', ')}</p>
      )}
      {test.script?.length > 0 && (
        <ol style={{ margin: '8px 0', paddingLeft: 20 }}>
          {test.script.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      {test.success_signal && <p><strong>Сигнал успіху:</strong> {test.success_signal}</p>}
    </div>
  );
}

export default function BriefPage({ route }) {
  const params = new URLSearchParams(route?.search || '');
  const requestedId = params.get('id') || '';
  const ideaParam = params.get('idea') || '';

  const { data, error, loading, reload } = useBrief(requestedId);
  const notFound = Boolean(requestedId && data && data.ok === false);
  const sourceBrief = data && data.ok !== false ? (data.brief || null) : null;

  const [briefOverride, setBriefOverride] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const mergedSource = briefOverride
    ? { ...sourceBrief, ...briefOverride }
    : sourceBrief;

  const brief = mergedSource ? normalizeBriefData(mergedSource) : null;

  const hasRichBrief = brief && (
    brief.hooks?.length > 1 || brief.scriptOutline?.length > 0
    || brief.mustShowMoments?.length > 0 || Boolean(brief.recommendedTopic)
  );

  async function handleGenerate() {
    if (!brief?.id) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await api('/api/brief/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: brief.id }),
      });
      if (res.ok) {
        setBriefOverride(res.brief);
      } else {
        setGenerateError(res.error || 'Помилка генерації бріфу');
      }
    } catch (err) {
      setGenerateError(String(err));
    } finally {
      setGenerating(false);
    }
  }

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

  if (notFound) return (
    <div className="brief-page">
      <h1 className="brief-page-title"><Wand2 size={20} style={{ color: 'var(--blue)' }} />Готовий бріф</h1>
      <EmptyState
        title="Бріф за цим посиланням не знайдено"
        text="Можливість, ідея або елемент плану з таким id не існує. Бріф не відкривається «навмання» — оберіть конкретну тему."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="button ghost" href="/opportunities">Перейти до Можливостей</Link>
            <Link className="button ghost" href="/backlog">Відкрити Backlog</Link>
          </div>
        }
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
  const hasThumbnailConcepts = brief.thumbnailConcepts?.length > 0;
  let sectionNum = 1;

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

      {!hasRichBrief && (
        <div className="brief-generate-bar">
          <div className="brief-generate-bar-text">
            <Sparkles size={15} />
            Бріф містить лише базові шаблони. Згенеруй персоналізований AI-бріф зі сценарієм, гачками та thumbnail-концептами.
          </div>
          <button
            className="button"
            onClick={handleGenerate}
            disabled={generating}
            style={{ whiteSpace: 'nowrap' }}
          >
            {generating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {generating ? 'Генерую...' : 'Згенерувати AI бріф'}
          </button>
        </div>
      )}

      {generateError && (
        <div className="brief-warning">
          <AlertTriangle size={15} />
          {generateError}
        </div>
      )}

      {hasRichBrief && briefOverride && (
        <div className="brief-generate-bar" style={{ '--bar-bg': 'var(--green-bg, #f0fdf4)', '--bar-border': 'var(--green, #22c55e)' }}>
          <div className="brief-generate-bar-text" style={{ color: 'var(--green, #16a34a)' }}>
            <Sparkles size={15} />
            AI бріф згенеровано успішно. Сценарій, гачки та thumbnail-концепти доступні нижче.
          </div>
          <button className="button ghost" onClick={handleGenerate} disabled={generating} style={{ whiteSpace: 'nowrap' }}>
            {generating ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            Перегенерувати
          </button>
        </div>
      )}

      <BriefActions brief={brief} />

      <div className="brief-content-layout">
        <div className="brief-main">
          <BriefSection num={sectionNum++} title="Концепт відео">
            <BriefConcept brief={brief} />
          </BriefSection>

          <BriefSection num={sectionNum++} title="Hook Lab">
            <BriefHookLab brief={brief} />
          </BriefSection>

          <BriefSection num={sectionNum++} title={brief.recommendedFormat ? `Структура та сценарій (${formatLabel(brief.recommendedFormat)})` : 'Структура та сценарій'}>
            <BriefStructure brief={brief} />
          </BriefSection>

          {brief.mustShowMoments?.length > 0 && (
            <BriefSection num={sectionNum++} title="Ключові моменти відео">
              <MustShowMoments moments={brief.mustShowMoments} />
            </BriefSection>
          )}

          {brief.cheapTest && (
            <BriefSection num={sectionNum++} title="Дешевий тест">
              <CheapTest test={brief.cheapTest} />
            </BriefSection>
          )}

          <BriefSection num={sectionNum++} title="B-roll та вставки">
            <BriefBroll brief={brief} />
          </BriefSection>

          <BriefSection num={sectionNum++} title="Назви відео">
            <BriefTitles brief={brief} />
          </BriefSection>

          {hasThumbnailConcepts && (
            <BriefSection num={sectionNum++} title="Thumbnail концепти">
              <BriefThumbnail brief={brief} />
            </BriefSection>
          )}

          {hasHashtags && (
            <BriefSection num={sectionNum++} title="Хештеги">
              <BriefHashtags brief={brief} />
            </BriefSection>
          )}

          <BriefSection num={sectionNum++} title="Докази та трендові сигнали">
            <BriefEvidence brief={brief} />
          </BriefSection>

          <BriefSection num={sectionNum++} title="Ризики">
            <BriefRisks brief={brief} />
          </BriefSection>

          <BriefSection num={sectionNum++} title="Наступні дії">
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
