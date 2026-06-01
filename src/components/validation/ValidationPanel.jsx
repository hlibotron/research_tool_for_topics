import React from 'react';
import {
  TrendingUp, ShieldCheck, AlertTriangle, Lightbulb, Image, Film,
  FlaskConical, ClipboardCheck, Sparkles, Loader2, Save, CheckCircle2,
} from 'lucide-react';
import '../../styles/validation.css';
import { LANE_LABEL, LANE_TONE } from '../../lib/validationView.js';

// Shared renderer for the idea-validation engine block. Used by both
// BacklogDetailsModal and IdeaLab so the two screens stay identical (§9.3).
export { LANE_LABEL, LANE_TONE };

const COMPONENT_LABEL = {
  demand: 'Попит',
  velocity: 'Швидкість',
  evidence_quality: 'Якість доказів',
  channel_fit: 'Відповідність каналу',
  freshness: 'Свіжість',
  competition_advantage: 'Перевага в конкуренції',
  engagement: 'Залученість',
};

const MARKET_STATUS_LABEL = {
  insufficient_data: 'Недостатньо даних',
  INSUFFICIENT_DATA: 'Недостатньо даних',
  PARTIAL_EVIDENCE: 'Часткові докази',
  SUFFICIENT_EVIDENCE: 'Достатньо доказів',
};

const MOMENT_LABEL = {
  promise: 'Обіцянка', problem: 'Проблема', first_test: 'Перший тест',
  failure_or_limit: 'Провал / межа', comparison: 'Порівняння',
  final_payoff: 'Фінальний payoff', verdict: 'Вердикт',
};

// Humanize the backend's machine gate strings.
const GATE_PHRASES = [
  [/relevant_video_count < (\d+)/, (m) => `Замало релевантних відео (треба ≥ ${m[1]})`],
  [/unique_channel_count < (\d+)/, (m) => `Замало унікальних каналів (треба ≥ ${m[1]})`],
  [/positive_family_count < (\d+)/, (m) => `Замало типів джерел (треба ≥ ${m[1]})`],
  [/no UA source family/, () => 'Немає українського джерела (UA-family)'],
  [/data_health not in/, () => 'Дані застарілі або неповні'],
  [/market_score < (\d+)/, (m) => `Market score нижче ${m[1]}`],
  [/score_coverage < ([\d.]+)/, (m) => `Покриття метрик нижче ${Math.round(Number(m[1]) * 100)}%`],
  [/editorial_score < (\d+)/, (m) => `Editorial score нижче ${m[1]} (або немає deep review)`],
  [/deep_review not fresh/, () => 'Deep review відсутній або застарілий'],
];

function humanizeGate(gate) {
  for (const [re, fn] of GATE_PHRASES) {
    const m = String(gate).match(re);
    if (m) return fn(m);
  }
  return String(gate);
}

function Bar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="validation-bar"><span style={{ width: `${v}%` }} /></div>
  );
}

function Section({ icon, title, children, badge }) {
  return (
    <div className="backlog-panel validation-section">
      <h3>{icon}{title}{badge}</h3>
      {children}
    </div>
  );
}

export default function ValidationPanel({ validation, onDeepReview, onSave, deepReviewLoading, saveLoading, saved }) {
  if (!validation) return null;
  const market = validation.market || {};
  const counts = market.counts || {};
  const components = market.components || {};
  const readiness = validation.readiness || {};
  const drStatus = validation.deep_review_status || (validation.deep_review || {}).status || 'missing';
  const review = validation.deep_review || {};
  const content = review.content || {};
  const tc = content.topic_contract || {};
  const pk = content.packaging || {};
  const moments = content.must_show_moments || [];
  const cheap = content.cheap_test || null;
  const editorial = drStatus === 'fresh' ? review.editorial_score : null;
  const lane = readiness.lane || 'watching';
  const hasFreshReview = drStatus === 'fresh';

  const marketScore = market.score;
  const marketLabel = (marketScore === null || marketScore === undefined) ? '—' : marketScore;

  return (
    <div className="validation-panel">
      {/* Scores header: market + concept shown separately, never merged. */}
      <div className="validation-scores">
        <div className="validation-score-card">
          <span>Market score</span>
          <strong className={`tone-${marketScore >= 75 ? 'blue' : marketScore >= 45 ? 'orange' : 'red'}`}>
            {marketLabel}{marketScore != null && <small>/100</small>}
          </strong>
          <em>{MARKET_STATUS_LABEL[market.status] || market.status || ''} · покриття {Math.round((market.coverage || 0) * 100)}%</em>
        </div>
        <div className="validation-score-card">
          <span>Concept (editorial)</span>
          <strong className={editorial != null ? `tone-${editorial >= 65 ? 'green' : 'orange'}` : 'tone-neutral'}>
            {editorial != null ? <>{editorial}<small>/100</small></> : '—'}
          </strong>
          <em>
            {drStatus === 'fresh' && 'Актуальний deep review'}
            {drStatus === 'stale' && 'Deep review застарів'}
            {drStatus === 'missing' && 'Deep review ще не виконано'}
            {drStatus === 'failed' && 'Deep review не вдався'}
          </em>
        </div>
        <div className="validation-score-card">
          <span>Lane</span>
          <span className={`backlog-status-pill tone-${LANE_TONE[lane] || 'neutral'}`} title={(readiness.failed_gates || []).join('\n')}>
            {LANE_LABEL[lane] || lane}
          </span>
        </div>
        <div className="validation-actions">
          {onDeepReview && (
            <button type="button" className="backlog-action-orange" onClick={onDeepReview} disabled={deepReviewLoading}>
              {deepReviewLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
              {hasFreshReview ? 'Перегенерувати' : 'Глибоко перевірити'}
            </button>
          )}
          {onSave && (
            <button type="button" className="backlog-action-primary" onClick={onSave} disabled={saveLoading || saved}>
              {saveLoading ? <Loader2 size={14} className="spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saved ? 'Збережено' : 'Зберегти у Backlog'}
            </button>
          )}
        </div>
      </div>

      <div className="validation-grid">
        <Section icon={<TrendingUp size={14} />} title="Потенціал ринку">
          {Object.entries(components).map(([key, value]) => (
            <div key={key} className="validation-component-row">
              <span>{COMPONENT_LABEL[key] || key}</span>
              {value === null || value === undefined
                ? <em className="muted">немає даних</em>
                : <><Bar value={value} /><strong>{Math.round(value)}</strong></>}
            </div>
          ))}
          {market.risk_penalty ? <p className="muted">Штраф за ризик: −{market.risk_penalty}</p> : null}
        </Section>

        <Section icon={<ShieldCheck size={14} />} title="Якість доказів">
          <p className="validation-evidence-summary">
            <strong>{counts.relevant_video_count || 0}</strong> відео ·{' '}
            <strong>{counts.unique_channel_count || 0}</strong> канали ·{' '}
            <strong>{counts.positive_family_count || 0}/2</strong> джерела
          </p>
          <div className="validation-component-row">
            <span>Evidence quality</span>
            <Bar value={components.evidence_quality} /><strong>{Math.round(components.evidence_quality || 0)}</strong>
          </div>
          <ul className="validation-evidence-list">
            {(validation.evidence || []).slice(0, 5).map((e, i) => (
              <li key={i}><span className="validation-family">{e.family}</span> {e.title || e.url || '—'}</li>
            ))}
            {!(validation.evidence || []).length && <li className="muted">Поки немає підтверджених доказів.</li>}
          </ul>
        </Section>

        <Section
          icon={readiness.ready ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          title={readiness.ready ? 'Готова до планування' : 'Чому ще не Ready'}
        >
          {readiness.ready ? (
            <p className="muted">Усі production-гейти виконані.</p>
          ) : (
            <ul className="validation-gates">
              {(readiness.failed_gates || []).map((g, i) => <li key={i}>{humanizeGate(g)}</li>)}
              {!(readiness.failed_gates || []).length && <li className="muted">—</li>}
            </ul>
          )}
        </Section>

        <Section icon={<Lightbulb size={14} />} title="Краще формулювання теми">
          {hasFreshReview && tc.recommended_topic ? (
            <div className="validation-topic">
              <p className="validation-topic-main">{tc.recommended_topic}</p>
              {tc.viewer_question && <p><strong>Питання глядача:</strong> {tc.viewer_question}</p>}
              {tc.one_sentence_promise && <p><strong>Обіцянка:</strong> {tc.one_sentence_promise}</p>}
              {tc.target_viewer && <p><strong>Для кого:</strong> {tc.target_viewer}</p>}
              {tc.main_conflict && <p><strong>Конфлікт:</strong> {tc.main_conflict}</p>}
              {tc.measurable_payoff && <p><strong>Payoff:</strong> {tc.measurable_payoff}</p>}
            </div>
          ) : (
            <p className="muted">Запустіть «Глибоко перевірити», щоб отримати редакційне формулювання теми.</p>
          )}
        </Section>

        {hasFreshReview && (pk.titles?.length || pk.thumbnails?.length || pk.hooks?.length) ? (
          <Section icon={<Image size={14} />} title="Title, Thumbnail, Intro">
            {pk.titles?.length ? (
              <div className="validation-pack-block">
                <h4>Назви</h4>
                <ul>{pk.titles.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            ) : null}
            {pk.thumbnails?.length ? (
              <div className="validation-pack-block">
                <h4>Thumbnail-концепти</h4>
                <ul>{pk.thumbnails.map((t, i) => (
                  <li key={i}>{typeof t === 'string' ? t : `${t.concept || ''}${t.visual ? ` — ${t.visual}` : ''}${t.text_overlay ? ` («${t.text_overlay}»)` : ''}`}</li>
                ))}</ul>
              </div>
            ) : null}
            {pk.hooks?.length ? (
              <div className="validation-pack-block">
                <h4>Хуки</h4>
                <ul>{pk.hooks.map((h, i) => <li key={i}>{h}{pk.recommended_hook === h ? ' ⭐' : ''}</li>)}</ul>
              </div>
            ) : null}
            {pk.intro_consistency && <p className="muted"><strong>Узгодженість intro:</strong> {pk.intro_consistency}</p>}
          </Section>
        ) : null}

        {hasFreshReview && moments.length ? (
          <Section icon={<Film size={14} />} title="Ключові моменти відео">
            <div className="validation-moments">
              {moments.map((m, i) => (
                <div key={i} className="validation-moment">
                  <div className="validation-moment-head">
                    <strong>{MOMENT_LABEL[m.type] || m.type}</strong>
                    {m.placement && <span>{m.placement}</span>}
                  </div>
                  {m.shot && <p><strong>Кадр:</strong> {m.shot}</p>}
                  {m.proof && <p><strong>Доказ:</strong> {m.proof}</p>}
                  {m.retention_reason && <p className="muted">{m.retention_reason}</p>}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {hasFreshReview && cheap ? (
          <Section icon={<FlaskConical size={14} />} title="Дешевий тест">
            {cheap.hypothesis && <p><strong>Гіпотеза:</strong> {cheap.hypothesis}</p>}
            <p className="muted">
              {cheap.format && <>Формат: {cheap.format} · </>}
              {cheap.max_effort_hours != null && <>≤ {cheap.max_effort_hours} год</>}
            </p>
            {cheap.required_assets?.length ? <p><strong>Потрібно:</strong> {cheap.required_assets.join(', ')}</p> : null}
            {cheap.script?.length ? <ol className="validation-script">{cheap.script.map((s, i) => <li key={i}>{s}</li>)}</ol> : null}
            {cheap.success_signal && <p><strong>Сигнал успіху:</strong> {cheap.success_signal}</p>}
          </Section>
        ) : null}

        <Section icon={<AlertTriangle size={14} />} title="Ризики">
          <ul>
            {(content.risks || []).slice(0, 5).map((r, i) => <li key={i}>{r}</li>)}
            {!(content.risks || []).length && <li className="muted">Запустіть deep review для оцінки ризиків.</li>}
          </ul>
        </Section>

        <Section icon={<ClipboardCheck size={14} />} title="Рекомендована дія">
          <p>{content.recommended_action || 'Зберіть більше доказів або запустіть глибоку перевірку.'}</p>
        </Section>
      </div>

      <p className="validation-footer-note">
        <Sparkles size={12} /> Market score базується на даних; editorial review — це LLM-synthesis.
        Прогноз CTR / утримання / переглядів не показується — <strong>немає каліброваного прогнозу</strong>.
      </p>
    </div>
  );
}
