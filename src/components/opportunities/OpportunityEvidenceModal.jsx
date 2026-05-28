import React, { useEffect, useState, useMemo } from 'react';
import { X, MessageSquare, TrendingUp, Target, FileText, Clock, AlertTriangle, Info, Play } from 'lucide-react';
import { compactNumber } from '../../lib/formatters.js';

const TABS = [
  { id: 'evidence', label: 'Докази' },
  { id: 'intent', label: 'Intent коментарів' },
  { id: 'gap', label: 'Конкурентний gap' },
  { id: 'plan', label: 'План дій' },
];

function parseEvidenceLine(line) {
  const str = String(line || '');
  // Pattern: "7,417,453 views, 209,181.5/day: Kunali Ki New Bike TUT GAYI 😭"
  const m = str.match(/^([\d,]+)\s*views?,\s*([\d,.]+)\s*\/\s*day:\s*(.+)$/i);
  if (!m) return { title: str, views: 0, viewsPerDay: 0 };
  return {
    title: m[3].trim(),
    views: Number(m[1].replace(/,/g, '')) || 0,
    viewsPerDay: Number(m[2].replace(/,/g, '')) || 0,
  };
}

function relativeDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return 'сьогодні';
  if (days === 1) return '1 день тому';
  return `${days} дн тому`;
}

function buildEvidenceFromItem(item) {
  if (!item) return null;
  const raw = item.raw || {};

  // 1. Evidence rows: prefer rich sourceVideos objects, fallback to evidence string lines
  const sourceVideos = Array.isArray(raw.sourceVideos) ? raw.sourceVideos : [];
  const evidenceStrings = Array.isArray(raw.evidence) ? raw.evidence : [];
  const reasons = item.evidenceHighlights || [];

  let evidenceRows = [];
  if (sourceVideos.length > 0) {
    evidenceRows = sourceVideos.map((v, i) => ({
      sourceTitle: v.title || 'Без назви',
      channel: v.channel || '—',
      publishedAt: relativeDate(v.publishedAt || v.published_at),
      url: v.url || null,
      viewsPerDay: Number(v.velocity || v.views_per_day || v.viewsPerDay || 0),
      views: Number(v.views || 0),
      outlierRatio: Number(v.outlierRatio || v.outlier_ratio || 0),
      whyItMatters: reasons[i] || '',
    }));
  } else if (evidenceStrings.length > 0) {
    evidenceRows = evidenceStrings.map((line, i) => {
      const parsed = parseEvidenceLine(line);
      return {
        sourceTitle: parsed.title,
        channel: '—',
        publishedAt: '—',
        url: null,
        viewsPerDay: parsed.viewsPerDay,
        views: parsed.views,
        outlierRatio: 0,
        whyItMatters: reasons[i] || '',
      };
    });
  }

  // 2. Comment intent: real field is comment_intent_examples (array of strings)
  const intentExamples = Array.isArray(raw.comment_intent_examples) ? raw.comment_intent_examples : [];
  const commentIntentScore = Number(raw.score_breakdown?.comment_intent || 0);
  const commentIntentMax = Number(raw.score_weights?.comment_intent || 8);
  const intentPercent = commentIntentMax > 0
    ? Math.round((commentIntentScore / commentIntentMax) * 100)
    : 0;

  // 3. Competitor gap: derived from videos/channels counts + competition advantage score
  const channels = Number(raw.channels || 0);
  const videos = Number(raw.videos || 0);
  const competitionAdvantage = Number(raw.competitionAdvantageScore || 0);
  const gapPercent = item.gapPercent || competitionAdvantage;
  const gapSummary = videos > 0 && channels > 0
    ? `Тема покривається ${videos} відео на ${channels} каналах. ${
        competitionAdvantage >= 70 ? 'Конкуренція слабка — є простір зайти з якіснішим форматом.'
          : competitionAdvantage >= 40 ? 'Конкуренція помірна — потрібен сильний angle або hook.'
          : 'Конкуренція сильна — заходити лише з унікальною подачею.'
      }`
    : '';

  // 4. Action plan: assembled from real API fields
  const hookText = raw.suggestedHook || (Array.isArray(raw.hooks) && raw.hooks[0]?.text) || '';
  const angle = raw.suggested_angle || raw.suggestedAngle || '';
  const productionNotes = raw.productionNotes || '';
  const shotList = Array.isArray(raw.shotList) ? raw.shotList : [];
  const scriptOutline = Array.isArray(raw.scriptOutline) ? raw.scriptOutline : [];
  const suggestedAction = raw.suggestedAction || raw.recommendedAction || '';
  const risks = Array.isArray(raw.risks) ? raw.risks : [];
  const riskLevel = item.difficulty === 'high' ? 'high' : item.difficulty === 'low' ? 'low' : 'medium';

  // Next steps: scriptOutline if present, else from suggestedAction
  let nextSteps = scriptOutline.length > 0 ? scriptOutline : [];
  if (nextSteps.length === 0 && suggestedAction) nextSteps = [suggestedAction];

  return {
    opportunityId: item.id,
    evidenceRows,
    commentIntent: {
      percent: intentPercent,
      bullets: intentExamples,
    },
    competitorGap: {
      gapPercent,
      summary: gapSummary,
      channels,
      videos,
    },
    actionPlan: {
      angle,
      hook: hookText,
      productionNotes,
      productionTime: item.difficulty === 'low' ? '2 год.' : item.difficulty === 'high' ? '8 год.' : '4 год.',
      difficulty: item.difficultyLabel,
      risk: riskLevel,
      assets: shotList,
      nextSteps,
      risks,
    },
    llmDisclosure: {
      usedFor: ['кластеризації тем', 'intent коментарів', 'angle / hook'],
      notUsedFor: ['final score', 'ранжування можливостей'],
    },
    trendDeltaPercent: item.trendDeltaPercent,
  };
}

function EvidenceTab({ data, onSwitchTab }) {
  const rows = data.evidenceRows || [];
  return (
    <div className="opp-modal-section">
      <h4 className="opp-modal-section-title">Докази (топ сигнали)</h4>
      {rows.length === 0 ? (
        <p className="opp-modal-empty">Деталі ще не зібрано. Запустіть оновлення даних, щоб отримати приклади відео.</p>
      ) : (
        <div className="opp-modal-table-wrap">
          <table className="opp-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Відео</th>
                <th>Канал</th>
                <th>Опубліковано</th>
                <th>Перегляди/день</th>
                <th>Усього</th>
                <th>Чому це важливо</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, i) => (
                <tr key={i}>
                  <td className="opp-modal-table-num">{i + 1}</td>
                  <td className="opp-modal-table-title">
                    <Play size={11} className="opp-modal-table-play" />
                    {row.url
                      ? <a href={row.url} target="_blank" rel="noreferrer">{row.sourceTitle}</a>
                      : <span>{row.sourceTitle}</span>}
                  </td>
                  <td>{row.channel}</td>
                  <td>{row.publishedAt}</td>
                  <td><strong>{compactNumber(row.viewsPerDay)}</strong></td>
                  <td>{compactNumber(row.views)}</td>
                  <td className="opp-modal-table-why">{row.whyItMatters || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="opp-modal-teasers">
        <button type="button" className="opp-modal-teaser" onClick={() => onSwitchTab('intent')}>
          <MessageSquare size={14} />
          <div>
            <strong>{Math.round(data.commentIntent.percent || 0)}% інтенту</strong>
            <span>{data.commentIntent.bullets.length} прикладів</span>
          </div>
        </button>
        <button type="button" className="opp-modal-teaser" onClick={() => onSwitchTab('gap')}>
          <Target size={14} />
          <div>
            <strong>Gap: {Math.round(data.competitorGap.gapPercent || 0)}%</strong>
            <span>{data.competitorGap.channels} каналів / {data.competitorGap.videos} відео</span>
          </div>
        </button>
        <button type="button" className="opp-modal-teaser" onClick={() => onSwitchTab('plan')}>
          <TrendingUp size={14} />
          <div>
            <strong>{data.trendDeltaPercent >= 0 ? '+' : ''}{Math.round(data.trendDeltaPercent || 0)}%</strong>
            <span>тренд за період</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function IntentTab({ data }) {
  const intent = data.commentIntent;
  const hasData = intent.bullets.length > 0 || intent.percent > 0;
  return (
    <div className="opp-modal-section">
      <div className="opp-modal-bignum">
        <strong>{Math.round(intent.percent || 0)}%</strong>
        <span>сигнал намірів у коментарях</span>
      </div>
      {intent.bullets.length === 0 ? (
        <p className="opp-modal-empty">
          {hasData
            ? 'Конкретні приклади коментарів ще не зібрано. Запустіть збір коментарів для цієї теми.'
            : 'Для цієї теми поки немає сигналу з коментарів — основа рекомендації лежить у переглядах та outlier-сигналах, а не в коментарях.'}
        </p>
      ) : (
        <>
          <span className="opp-modal-block-label">Приклади коментарів</span>
          <ul className="opp-modal-bullets">
            {intent.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function GapTab({ data }) {
  const gap = data.competitorGap;
  return (
    <div className="opp-modal-section">
      <div className="opp-modal-bignum">
        <strong>Gap: {Math.round(gap.gapPercent || 0)}%</strong>
        <span>конкурентний розрив</span>
      </div>
      {gap.summary ? (
        <p className="opp-modal-text">{gap.summary}</p>
      ) : (
        <p className="opp-modal-empty">Конкурентного розрізу для цієї теми ще не побудовано.</p>
      )}
      {(gap.channels > 0 || gap.videos > 0) && (
        <div className="opp-modal-action-grid">
          <div className="opp-modal-action-cell">
            <Target size={13} />
            <span className="opp-modal-action-label">Відео у кластері</span>
            <strong>{gap.videos}</strong>
          </div>
          <div className="opp-modal-action-cell">
            <Target size={13} />
            <span className="opp-modal-action-label">Каналів</span>
            <strong>{gap.channels}</strong>
          </div>
          <div className="opp-modal-action-cell">
            <Target size={13} />
            <span className="opp-modal-action-label">Competition advantage</span>
            <strong>{Math.round(gap.gapPercent || 0)}/100</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionPlanTab({ data }) {
  const plan = data.actionPlan;
  const hasAnyPlan = plan.angle || plan.hook || plan.productionNotes || (plan.assets && plan.assets.length) || (plan.nextSteps && plan.nextSteps.length) || (plan.risks && plan.risks.length);

  if (!hasAnyPlan) {
    return (
      <div className="opp-modal-section">
        <p className="opp-modal-empty">План дій ще не сформовано для цієї теми. Створіть бриф — і LLM згенерує angle, hook, shot list та production notes.</p>
      </div>
    );
  }

  const riskTone = plan.risk === 'low' ? 'green' : plan.risk === 'high' ? 'red' : 'orange';
  const riskLabel = plan.risk === 'low' ? 'Низький' : plan.risk === 'high' ? 'Високий' : 'Середній';

  return (
    <div className="opp-modal-section">
      {plan.angle && (
        <div className="opp-modal-block">
          <span className="opp-modal-block-label">Рекомендований angle</span>
          <p>{plan.angle}</p>
        </div>
      )}
      {plan.hook && (
        <div className="opp-modal-block">
          <span className="opp-modal-block-label">Hook</span>
          <p>{plan.hook}</p>
        </div>
      )}
      {plan.productionNotes && (
        <div className="opp-modal-block">
          <span className="opp-modal-block-label">Production notes</span>
          <p>{plan.productionNotes}</p>
        </div>
      )}

      <div className="opp-modal-action-grid">
        <div className="opp-modal-action-cell">
          <Clock size={13} />
          <span className="opp-modal-action-label">Зусилля</span>
          <strong>{plan.productionTime || '—'}</strong>
        </div>
        <div className="opp-modal-action-cell">
          <Target size={13} />
          <span className="opp-modal-action-label">Складність</span>
          <strong>{plan.difficulty || '—'}</strong>
        </div>
        <div className="opp-modal-action-cell">
          <AlertTriangle size={13} />
          <span className="opp-modal-action-label">Ризик</span>
          <strong className={`opp-modal-risk-${riskTone}`}>{riskLabel}</strong>
        </div>
      </div>

      {plan.assets?.length > 0 && (
        <div className="opp-modal-block">
          <span className="opp-modal-block-label">Shot list / потрібні активи</span>
          <ul className="opp-modal-bullets">
            {plan.assets.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {plan.nextSteps?.length > 0 && (
        <div className="opp-modal-block">
          <span className="opp-modal-block-label">Наступні кроки</span>
          <ul className="opp-modal-bullets">
            {plan.nextSteps.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {plan.risks?.length > 0 && (
        <div className="opp-modal-block">
          <span className="opp-modal-block-label">Ризики</span>
          <ul className="opp-modal-bullets">
            {plan.risks.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function OpportunityEvidenceModal({ item, onClose }) {
  const [tab, setTab] = useState('evidence');
  const data = useMemo(() => buildEvidenceFromItem(item), [item]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => { setTab('evidence'); }, [item?.id]);

  if (!item || !data) return null;

  return (
    <div className="opp-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="opp-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="opp-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <header className="opp-modal-header">
          <h3 id="opp-modal-title">
            <FileText size={16} />
            <span>Докази: {item.title}</span>
          </h3>
          <button type="button" className="opp-modal-close" onClick={onClose} aria-label="Закрити">
            <X size={18} />
          </button>
        </header>

        <nav className="opp-modal-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`opp-modal-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="opp-modal-body">
          {tab === 'evidence' && <EvidenceTab data={data} onSwitchTab={setTab} />}
          {tab === 'intent' && <IntentTab data={data} />}
          {tab === 'gap' && <GapTab data={data} />}
          {tab === 'plan' && <ActionPlanTab data={data} />}
        </div>

        <footer className="opp-modal-disclosure">
          <Info size={13} />
          <span>
            LLM використано лише для: <strong>{data.llmDisclosure.usedFor.join(', ')}</strong>.
            Не використано для <strong>{data.llmDisclosure.notUsedFor.join(', ')}</strong>.
          </span>
        </footer>
      </div>
    </div>
  );
}
