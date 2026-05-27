import React from 'react';
import { Play, Zap } from 'lucide-react';
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

function ScopePill({ scope }) {
  return <span className="goalScopeTag">{SCOPE_LABELS[scope] || scope}</span>;
}

function GroupCard({ group, jobs, running, runningGroup, onRunGroup, onPreview }) {
  const groupJobs = jobs.filter(j => j.execution_group === group.name);
  const dataCollected = Array.from(
    new Set(groupJobs.flatMap(j => j.data_collected || []))
  ).slice(0, 5);
  const isRunning = runningGroup === group.name;
  const isBusy = running !== '' || runningGroup !== '';
  const allBlocked = groupJobs.length > 0 && groupJobs.every(j => !j.guard?.allowed);

  return (
    <div className="goalCard">
      <div>
        <h3 className="goalTitle">{group.title || group.name}</h3>
        <p className="goalTechName">{group.name}</p>
      </div>

      <p className="goalDesc">
        {group.description ||
          `${group.purpose || 'Оновлення даних'} через ${group.source || 'YouTube API'}.`}
      </p>

      <div className="goalCardMeta">
        {dataCollected.length > 0 && (
          <div className="goalMetaRow">
            <span className="goalMetaLabel">Збирає</span>
            <div className="goalTagList">
              {dataCollected.map(item => (
                <span key={item} className="goalTag">{item}</span>
              ))}
            </div>
          </div>
        )}

        {(group.analytics_scope || []).length > 0 && (
          <div className="goalMetaRow">
            <span className="goalMetaLabel">Оновить</span>
            <div className="goalTagList">
              {(group.analytics_scope || []).map(scope => (
                <ScopePill key={scope} scope={scope} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="goalQuota">
        <Zap size={13} />
        {group.quota_estimate
          ? `~${numberFmt.format(group.quota_estimate)} quota`
          : 'Quota невідома'}
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
          {group.enabled}/{group.jobs} jobs
        </span>
      </div>

      <div className="goalCardActions">
        <button
          className="gcBtn run"
          disabled={isBusy || allBlocked}
          onClick={() => onRunGroup(group)}
          title={allBlocked ? 'Guard заблокував запуск' : undefined}
        >
          <Play size={13} />
          {isRunning ? '...' : 'Запустити'}
        </button>
        <button
          className="gcBtn"
          onClick={() => onPreview({ type: 'group', data: group })}
        >
          Деталі
        </button>
      </div>
    </div>
  );
}

function JobCard({ job, running, onRunJob, onPreview }) {
  const isRunning = running === job.name;
  const isBusy = running !== '';
  const blocked = !job.guard?.allowed;
  const dataCollected = (job.data_collected || []).slice(0, 5);
  const scopes = job.analytics_scope || [];

  return (
    <div className="goalCard">
      <div>
        <h3 className="goalTitle">{job.title || job.reason || job.name}</h3>
        <p className="goalTechName">{job.name}</p>
      </div>

      <p className="goalDesc">
        {job.description || job.reason || job.purpose || ''}
      </p>

      <div className="goalCardMeta">
        {dataCollected.length > 0 && (
          <div className="goalMetaRow">
            <span className="goalMetaLabel">Збирає</span>
            <div className="goalTagList">
              {dataCollected.map(item => (
                <span key={item} className="goalTag">{item}</span>
              ))}
            </div>
          </div>
        )}

        {scopes.length > 0 && (
          <div className="goalMetaRow">
            <span className="goalMetaLabel">Оновить</span>
            <div className="goalTagList">
              {scopes.map(scope => (
                <ScopePill key={scope} scope={scope} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="goalQuota">
        <Zap size={13} />
        {job.quota_estimate
          ? `~${numberFmt.format(job.quota_estimate)} quota`
          : job.quota_class || 'Quota невідома'}
        {job.last_output && (
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>
            {job.last_output}
          </span>
        )}
      </div>

      {blocked && job.guard?.reason && (
        <div style={{ fontSize: 11, color: 'var(--red)' }}>
          Guard: {job.guard.reason}
        </div>
      )}

      <div className="goalCardActions">
        <button
          className="gcBtn run"
          disabled={isBusy || blocked}
          onClick={() => onRunJob(job.name)}
          title={blocked ? `Guard: ${job.guard?.reason}` : undefined}
        >
          <Play size={13} />
          {isRunning ? '...' : 'Запустити'}
        </button>
        <button
          className="gcBtn"
          onClick={() => onPreview({ type: 'job', data: job })}
        >
          Деталі
        </button>
      </div>
    </div>
  );
}

export default function JobGoalCatalog({ groups, jobs, running, runningGroup, onRunGroup, onRunJob, onPreview }) {
  const enabledGroups = groups.filter(g => g.enabled > 0);
  const standaloneJobs = enabledGroups.length === 0
    ? jobs.filter(j => j.enabled).slice(0, 6)
    : [];

  if (enabledGroups.length === 0 && standaloneJobs.length === 0) {
    return (
      <div className="goalCatalogSection">
        <div className="sectionHeader">
          <h2>Каталог оновлень</h2>
        </div>
        <div className="dsEmpty">
          <p>Jobs не знайдено.</p>
          <p>Перевірте конфігурацію jobs або підключення до /api/jobs.</p>
        </div>
      </div>
    );
  }

  const count = enabledGroups.length || standaloneJobs.length;

  return (
    <div className="goalCatalogSection">
      <div className="sectionHeader">
        <h2>Каталог оновлень</h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {enabledGroups.length > 0 ? `${count} груп` : `${count} jobs`}
        </span>
      </div>

      <div className="goalGrid">
        {enabledGroups.map(group => (
          <GroupCard
            key={group.name}
            group={group}
            jobs={jobs}
            running={running}
            runningGroup={runningGroup}
            onRunGroup={onRunGroup}
            onPreview={onPreview}
          />
        ))}

        {standaloneJobs.map(job => (
          <JobCard
            key={job.name}
            job={job}
            running={running}
            onRunJob={onRunJob}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}
