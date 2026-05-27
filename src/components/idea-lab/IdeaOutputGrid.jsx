import React, { useState } from 'react';
import { Monitor, Zap, Film, Type, AlertTriangle, CheckSquare, ArrowRight, Bookmark } from 'lucide-react';
import { formatLabel } from '../../lib/formatters.js';
import { navigateTo } from '../../lib/shared.jsx';

function OutputCard({ icon, iconColor, title, children, footer }) {
  return (
    <div className="idea-output-card">
      <div className="idea-output-card-header">
        <div className={`idea-output-card-icon ${iconColor}`}>{icon}</div>
        <span className="idea-output-card-title">{title}</span>
      </div>
      {children}
      {footer}
    </div>
  );
}

function FormatCard({ result }) {
  const format = result.recommendedFormat || result.recommended_format || result.productionPlan?.format || null;
  const duration = result.duration || result.productionPlan?.duration || null;
  const target = result.targetAudience || result.target_audience || null;
  const structure = result.productionPlan?.structure || result.structure || [];
  const structureItems = Array.isArray(structure) ? structure : [];

  return (
    <OutputCard
      icon={<Monitor size={16} />}
      iconColor="blue"
      title="Рекомендований формат"
      footer={
        duration && (
          <span className="idea-output-card-meta">
            Середня тривалість: <strong>{duration}</strong>
          </span>
        )
      }
    >
      {format && <div className="idea-output-card-meta"><strong>{formatLabel(format)}</strong></div>}
      {structureItems.length > 0 && (
        <ul className="idea-output-list">
          {structureItems.slice(0, 4).map((s, i) => (
            <li key={i} className="idea-output-list-item">
              <CheckSquare size={13} className="idea-output-check" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
      {target && <span className="idea-output-card-meta">{target}</span>}
    </OutputCard>
  );
}

function HooksCard({ result }) {
  const hooks = result.hooks || result.hookOptions || [];
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? hooks : hooks.slice(0, 3);

  return (
    <OutputCard icon={<Zap size={16} />} iconColor="orange" title="3 варіанти хука">
      {hooks.length > 0 ? (
        <>
          <ul className="idea-output-list">
            {shown.map((h, i) => (
              <li key={i} className="idea-output-list-item">
                <span className="idea-output-num">{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
          {hooks.length > 3 && !showAll && (
            <button className="idea-output-card-link" onClick={() => setShowAll(true)}>
              Показати ще {hooks.length - 3}
            </button>
          )}
        </>
      ) : (
        <p className="idea-output-card-meta">Hooks не визначено</p>
      )}
    </OutputCard>
  );
}

function BrollCard({ result }) {
  const broll = result.broll || result.bRoll || result.inserts || result.shotList || [];

  return (
    <OutputCard
      icon={<Film size={16} />}
      iconColor="purple"
      title="B-roll та вставки"
      footer={<button className="idea-output-card-link">Показати шаблони</button>}
    >
      {broll.length > 0 ? (
        <ul className="idea-output-list">
          {broll.slice(0, 5).map((item, i) => (
            <li key={i} className="idea-output-list-item">
              <CheckSquare size={13} className="idea-output-check" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="idea-output-card-meta">B-roll не визначено</p>
      )}
    </OutputCard>
  );
}

function TitlesCard({ result }) {
  const titles = result.titles || result.suggestedTitles || [];
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? titles : titles.slice(0, 3);

  return (
    <OutputCard icon={<Type size={16} />} iconColor="blue" title="Назви відео">
      {titles.length > 0 ? (
        <>
          <ul className="idea-output-list">
            {shown.map((t, i) => (
              <li key={i} className="idea-output-list-item">
                <span className="idea-output-num">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          {titles.length > 3 && !showAll && (
            <button className="idea-output-card-link" onClick={() => setShowAll(true)}>
              Показати ще {titles.length - 3}
            </button>
          )}
        </>
      ) : (
        <p className="idea-output-card-meta">Назви не визначено</p>
      )}
    </OutputCard>
  );
}

function RisksCard({ result }) {
  const risks = result.risks || result.riskFactors || result.risk_factors || [];

  function riskIcon(text) {
    const t = String(text || '').toLowerCase();
    if (/низьк|low/i.test(t)) return <CheckSquare size={13} className="idea-output-check" />;
    if (/висок|high/i.test(t)) return <AlertTriangle size={13} className="idea-output-x" />;
    return <AlertTriangle size={13} className="idea-output-warn" />;
  }

  return (
    <OutputCard
      icon={<AlertTriangle size={16} />}
      iconColor="red"
      title="Ризики"
      footer={<button className="idea-output-card-link">Як знизити ризики</button>}
    >
      {risks.length > 0 ? (
        <ul className="idea-output-list">
          {risks.slice(0, 3).map((r, i) => (
            <li key={i} className="idea-output-list-item">
              {riskIcon(r)}
              <span>{r}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="idea-output-card-meta">Ризик не визначено</p>
      )}
    </OutputCard>
  );
}

function NextStepCard({ result, idea }) {
  const nextAction = result.nextAction || result.suggestedActionText || null;
  const briefText = nextAction || 'Створіть бріф на основі цієї ідеї, щоб отримати структуру, таймкоди та план зйомки.';

  function openBrief() {
    if (result.id) {
      navigateTo(`/brief?id=${encodeURIComponent(result.id)}`);
    } else {
      navigateTo(`/brief?idea=${encodeURIComponent(idea)}`);
    }
  }

  return (
    <OutputCard icon={<CheckSquare size={16} />} iconColor="green" title="Наступний крок">
      <p className="idea-next-step-text">{briefText}</p>
      <div className="idea-next-step-actions">
        <button className="idea-btn-brief" onClick={openBrief}>
          Створити бріф <ArrowRight size={15} />
        </button>
        <button className="idea-btn-save">
          <Bookmark size={14} />
          Зберегти ідею
        </button>
      </div>
    </OutputCard>
  );
}

export default function IdeaOutputGrid({ result, idea }) {
  return (
    <div className="idea-output-grid">
      <FormatCard result={result} />
      <HooksCard result={result} />
      <BrollCard result={result} />
      <TitlesCard result={result} />
      <RisksCard result={result} />
      <NextStepCard result={result} idea={idea} />
    </div>
  );
}
