import React from 'react';
import { X, Play, Shield } from 'lucide-react';
import { numberFmt } from '../../lib/formatters.js';

const SCOPE_LABELS = {
  today: 'Сьогодні',
  opportunities: 'Можливості',
  idea_lab: 'Idea Lab',
  ideaLab: 'Idea Lab',
  trends: 'Trend Radar',
  trend_radar: 'Trend Radar',
  summary: 'Summary',
  briefs: 'Бріфи',
  reports: 'Reports',
};

export default function RunPreviewDrawer({ target, jobs, quota, running, runningGroup, onRun, onClose }) {
  if (!target) return null;

  const isGroup = target.type === 'group';
  const data = target.data;
  const isRunning = isGroup ? runningGroup === data.name : running === data.name;
  const isBusy = running !== '' || runningGroup !== '';

  const groupJobs = isGroup
    ? Array.from(
        new Map(
          jobs.filter(j => j.execution_group === data.name).map(j => [j.name, j])
        ).values()
      )
    : [data];

  const dataCollected = Array.from(
    new Set(groupJobs.flatMap(j => j.data_collected || []))
  );
  const scopes = data.analytics_scope || [];
  const quotaEst = data.quota_estimate;

  const guardAllowed = isGroup
    ? groupJobs.some(j => j.guard?.allowed !== false)
    : (data.guard?.allowed !== false);
  const guardReason = isGroup
    ? groupJobs.find(j => j.guard && !j.guard.allowed)?.guard?.reason
    : data.guard?.reason;

  const quotaUsed = quota?.used || 0;
  const quotaLimit = quota?.limit || 10000;
  const quotaRemaining = quota?.remaining ?? (quotaLimit - quotaUsed);

  const artifacts = isGroup ? {} : (data.artifacts || {});

  return (
    <div
      className="runPreviewOverlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="runPreviewDrawer">
        {/* Header */}
        <div className="drawerHeader">
          <div>
            <div className="drawerSuper">Перед запуском</div>
            <h2>{isGroup ? (data.title || data.name) : (data.title || data.reason || data.name)}</h2>
            <p className="drawerSub">{isGroup ? data.name : (data.job_file || data.name)}</p>
          </div>
          <button className="closeBtn" onClick={onClose} aria-label="Закрити">
            <X size={14} />
          </button>
        </div>

        {/* What runs */}
        <div className="drawerSection">
          <h3>Що буде запущено</h3>
          <div className="drawerRow">
            <span className="drawerRowLabel">Тип</span>
            <span className="drawerRowValue">{isGroup ? 'Група jobs' : 'Одиночний job'}</span>
          </div>
          {isGroup && (
            <div className="drawerRow">
              <span className="drawerRowLabel">Jobs</span>
              <span className="drawerRowValue">{data.enabled} активних / {data.jobs} всього</span>
            </div>
          )}
          {data.source && (
            <div className="drawerRow">
              <span className="drawerRowLabel">Source</span>
              <span className="drawerRowValue">{data.source}</span>
            </div>
          )}
          {data.purpose && (
            <div className="drawerRow">
              <span className="drawerRowLabel">Purpose</span>
              <span className="drawerRowValue">{data.purpose}</span>
            </div>
          )}
          {(data.description || data.explanation) && (
            <div className="drawerRow">
              <span className="drawerRowLabel">Опис</span>
              <span className="drawerRowValue">{data.description || data.explanation}</span>
            </div>
          )}
          <div className="drawerRow" style={{ marginTop: 4 }}>
            <span className="drawerRowLabel">Guard</span>
            <span className="drawerRowValue">
              <span className={`guardBadge ${guardAllowed ? 'allowed' : 'blocked'}`}>
                <Shield size={11} />
                {guardAllowed ? 'Дозволено' : 'Заблоковано'}
              </span>
            </span>
          </div>
          {!guardAllowed && guardReason && (
            <div className="guardBlockReason">Причина: {guardReason}</div>
          )}
        </div>

        {/* Jobs in group */}
        {isGroup && groupJobs.length > 0 && (
          <>
            <div className="drawerDivider" />
            <div className="drawerSection">
              <h3>Jobs у групі ({groupJobs.length})</h3>
              <div className="drawerJobList">
                {groupJobs.map(job => (
                  <div key={job.name} className={`drawerJobItem${job.enabled ? '' : ' drawerJobDisabled'}`}>
                    <div className="drawerJobMain">
                      <div className="drawerJobName">
                        <span>{job.title || job.reason || job.name}</span>
                        {!job.enabled && (
                          <span className="drawerJobBadge muted">вимкнено</span>
                        )}
                        {job.enabled && !job.guard?.allowed && (
                          <span className="drawerJobBadge blocked">guard</span>
                        )}
                      </div>
                      <div className="drawerJobTech">{job.name}</div>
                      {(job.description || job.reason) && (
                        <div className="drawerJobDesc">{job.description || job.reason}</div>
                      )}
                      {(job.data_collected || []).length > 0 && (
                        <div className="drawerJobTags">
                          {job.data_collected.map(item => (
                            <span key={item} className="drawerJobTag">{item}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="drawerJobQuota">
                      {job.quota_estimate ? `~${numberFmt.format(job.quota_estimate)}` : job.quota_class || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="drawerDivider" />

        {/* Cost */}
        <div className="drawerSection">
          <h3>Вартість</h3>
          <div className="costRow">
            <div className="costTile">
              <div className="ctLabel">Орієнтовна quota</div>
              <div className="ctValue">
                {quotaEst ? `~${numberFmt.format(quotaEst)}` : '—'}
              </div>
            </div>
            <div className="costTile">
              <div className="ctLabel">Залишиться після</div>
              <div className="ctValue">
                {quotaEst && quotaRemaining > 0
                  ? `~${numberFmt.format(Math.max(0, quotaRemaining - quotaEst))}`
                  : '—'}
              </div>
            </div>
          </div>
          {quotaUsed > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Використано сьогодні: {numberFmt.format(quotaUsed)} / {numberFmt.format(quotaLimit)}
            </div>
          )}
        </div>

        {/* Data collected */}
        {dataCollected.length > 0 && (
          <>
            <div className="drawerDivider" />
            <div className="drawerSection">
              <h3>Що буде зібрано</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {dataCollected.map(item => (
                  <span key={item} style={{
                    background: 'var(--subtle-bg)',
                    color: 'var(--muted)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 12,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Affected pages */}
        {scopes.length > 0 && (
          <>
            <div className="drawerDivider" />
            <div className="drawerSection">
              <h3>Оновить сторінки</h3>
              <div className="affectedPages">
                {scopes.map(scope => (
                  <span key={scope} className="affectedPagePill">
                    {SCOPE_LABELS[scope] || scope}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Artifacts */}
        {Object.keys(artifacts).length > 0 && (
          <>
            <div className="drawerDivider" />
            <div className="drawerSection">
              <h3>Artifacts</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(artifacts).map(([name, path]) => (
                  <a
                    key={path}
                    className="logLinkBtn"
                    href={`/file?path=${encodeURIComponent(path)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions — pushed to bottom */}
        <div style={{ flex: 1 }} />
        <div className="drawerActions">
          <button
            className="dsBtn primary"
            disabled={!guardAllowed || isBusy}
            onClick={onRun}
          >
            <Play size={15} />
            {isRunning
              ? 'Запускається...'
              : isGroup ? 'Запустити групу' : 'Запустити job'}
          </button>
          {!guardAllowed && (
            <div className="drawerBlockNote">Запуск заблоковано guard</div>
          )}
          <button className="dsBtn secondary" onClick={onClose}>
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
