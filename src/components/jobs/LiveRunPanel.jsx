import React from 'react';
import { ExternalLink } from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'init',     label: 'Ініціалізація' },
  { key: 'start',    label: 'Процес запущено' },
  { key: 'collect',  label: 'Збір YouTube-даних' },
  { key: 'parse',    label: 'Парсинг метаданих' },
  { key: 'analyze',  label: 'Аналіз і агрегація' },
  { key: 'score',    label: 'Scoring і класифікація' },
  { key: 'done',     label: 'Дані збережено' },
];

function inferCurrentStep(logTail, status) {
  if (status === 'completed') return PIPELINE_STEPS.length;
  if (!logTail) return 1;
  const low = logTail.toLowerCase();
  if (low.includes('saved report') || low.includes('quota report')) return 7;
  if (low.includes('opportunit') || low.includes('scoring') || low.includes('score')) return 5;
  if (low.includes('comment') || low.includes('hashtag') || low.includes('hook') || low.includes('aggreg')) return 4;
  if (low.includes('video') || low.includes('channel') || low.includes('metadata') || low.includes('extract')) return 3;
  if (low.includes('pid') || low.includes('started') || low.includes('command')) return 2;
  return 1;
}

export default function LiveRunPanel({ run }) {
  if (!run) return null;

  const currentStep = inferCurrentStep(run.tail, run.status);
  const logLines = (run.tail || '').split('\n').slice(-6).join('\n');

  return (
    <div className="liveRunPanel">
      <div>
        <div className="liveRunHeader">
          <div className="liveRunDot" />
          <span className="liveRunName">{run.job_name}</span>
          <span className="statusPillDs running" style={{ marginLeft: 4 }}>Виконується</span>
        </div>

        <div className="liveRunMeta">
          Запущено: {run.started_at || run.updated_at}
          {run.note && (
            <span style={{ marginLeft: 12, color: 'var(--orange)' }}>{run.note}</span>
          )}
        </div>

        <div className="pipelineSteps">
          {PIPELINE_STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const state =
              stepNum < currentStep ? 'done' :
              stepNum === currentStep ? 'active' : 'pending';
            return (
              <div key={step.key} className="pipelineStep">
                <div className={`stepDot ${state}`}>
                  {state === 'done' ? '✓' : stepNum}
                </div>
                <span className={`stepLabel ${state === 'pending' ? 'pending' : ''}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {logLines && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
              Останні події
            </div>
            <div className="logPreview">{logLines}</div>
          </div>
        )}

        {run.log_path && (
          <a
            className="logLinkBtn"
            href={`/file?path=${encodeURIComponent(run.log_path)}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={13} />
            Відкрити лог
          </a>
        )}
      </div>
    </div>
  );
}
