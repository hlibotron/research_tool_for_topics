import React from 'react';
import { PlayCircle, FileText, Sparkles, Zap, TrendingUp, Check, AlertTriangle } from 'lucide-react';
import { formatLabel } from '../../lib/formatters.js';
import ScoreBreakdown from './ScoreBreakdown.jsx';

function HeroMedia({ item }) {
  const trend = Math.round(Number(item.trendDeltaPercent) || 0);
  return (
    <div className="opp-hero-media">
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt="" className="opp-hero-thumb" />
      ) : (
        <div className="opp-hero-thumb opp-hero-thumb-placeholder">
          <PlayCircle size={40} />
        </div>
      )}
      {Number.isFinite(trend) && trend !== 0 && (
        <div className={`opp-hero-trend${trend >= 0 ? '' : ' is-down'}`}>
          <TrendingUp size={14} />
          <span>{trend >= 0 ? `+${trend}%` : `${trend}%`}</span>
          <small>Попит {trend >= 0 ? 'зростає' : 'падає'}</small>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value, sub }) {
  return (
    <div className="opp-hero-summary-cell">
      <span className="opp-hero-summary-label">{label}</span>
      <span className="opp-hero-summary-value">{value}</span>
      {sub ? <span className="opp-hero-summary-sub">{sub}</span> : null}
    </div>
  );
}

export default function OpportunityHero({ item, onCreateBrief, onShowEvidence }) {
  if (!item) return null;

  const confidencePct = Math.round(Number(item.confidence) || 0);
  const deadlineLabel = item.deadlineHours ? `${item.deadlineHours} год.` : '—';
  const channelFitTone = item.channelFit === 'excellent' ? 'green'
    : item.channelFit === 'good' ? 'blue'
    : item.channelFit === 'fair' ? 'orange'
    : item.channelFit === 'poor' ? 'red' : 'neutral';

  return (
    <section className="opp-hero">
      <div className="opp-hero-left">
        <HeroMedia item={item} />
      </div>

      <div className="opp-hero-main">
        <div className="opp-hero-badge">
          <Sparkles size={14} />
          <span>Найкраща можливість зараз</span>
          <Zap size={13} className="opp-hero-badge-zap" />
        </div>

        <h2 className="opp-hero-title">{item.title}</h2>

        <button type="button" className="opp-hero-status" onClick={onCreateBrief} aria-label="Знімати зараз">
          <PlayCircle size={16} />
          <span>Знімати зараз</span>
        </button>

        <div className="opp-hero-summary">
          <SummaryCell label="Загальний бал" value={<>{item.score}<small>/100</small></>} />
          <SummaryCell label="Впевненість" value={`${confidencePct}%`} />
          <SummaryCell label="Дедлайн" value={deadlineLabel} />
          <SummaryCell label="Складність" value={item.difficultyScore || '—'} sub={item.difficulty === 'low' ? 'Легка' : item.difficulty === 'high' ? 'Складна' : 'Середня'} />
          <SummaryCell label="Формат" value={<span className="opp-hero-format-chip">{formatLabel(item.format)}</span>} />
          <SummaryCell label="Channel fit" value={<span className={`opp-hero-fit-chip opp-hero-fit-${channelFitTone}`}>{item.channelFitLabel || '—'}</span>} />
        </div>

        {item.evidenceHighlights?.length > 0 ? (
          <div className="opp-hero-evidence">
            <span className="opp-hero-evidence-label">Ключові докази</span>
            <ul>
              {item.evidenceHighlights.slice(0, 3).map((line, i) => (
                <li key={i}>
                  <Check size={14} className="opp-hero-evidence-check" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="opp-hero-evidence-warn">
            <AlertTriangle size={14} />
            <span>Для цієї теми ще не зібрано конкретних доказів — рекомендація базується лише на агрегованих метриках. Запустіть оновлення даних або відкрийте «Показати докази».</span>
          </div>
        )}

        <div className="opp-hero-actions">
          <button type="button" className="opp-hero-btn-primary" onClick={onCreateBrief}>
            <FileText size={15} />
            <span>Створити бриф</span>
          </button>
          <button type="button" className="opp-hero-btn-secondary" onClick={onShowEvidence}>
            <FileText size={15} />
            <span>Показати докази</span>
          </button>
        </div>
      </div>

      <div className="opp-hero-right">
        <ScoreBreakdown values={item.scoreBreakdown} finalScore={item.score} />
      </div>
    </section>
  );
}
