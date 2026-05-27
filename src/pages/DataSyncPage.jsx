import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, usePolling } from '../lib/shared.jsx';
import DataReadinessCards from '../components/jobs/DataReadinessCards.jsx';
import RecommendedRunCard from '../components/jobs/RecommendedRunCard.jsx';
import JobGoalCatalog from '../components/jobs/JobGoalCatalog.jsx';
import RunPreviewDrawer from '../components/jobs/RunPreviewDrawer.jsx';
import LiveRunPanel from '../components/jobs/LiveRunPanel.jsx';
import JobScheduleCalendar from '../components/jobs/JobScheduleCalendar.jsx';
import JobsScheduleTable from '../components/jobs/JobsScheduleTable.jsx';
import LastRunsTable from '../components/jobs/LastRunsTable.jsx';
import '../styles/datasync.css';

function useJobsData() {
  return usePolling(() => api('/api/jobs'), [], 30000);
}

function useRunsData() {
  return usePolling(() => api('/api/manual-runs'), [], 5000);
}

function parseKyivTimestamp(str) {
  if (!str) return null;
  const [datePart, timePart] = (str || '').split(' ');
  if (!datePart) return null;
  const parts = datePart.split('.');
  if (parts.length < 3) return null;
  const [day, month, year] = parts;
  const [hour = '0', minute = '0'] = (timePart || '').split(':');
  const ts = Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10) - 3,
    parseInt(minute, 10),
  );
  return isNaN(ts) ? null : new Date(ts);
}

function findRecommendedGroup(groups, jobs) {
  const enabled = groups.filter(g => g.enabled > 0);
  if (!enabled.length) return null;
  return enabled
    .map(group => {
      const groupJobs = jobs.filter(j => j.execution_group === group.name);
      const dates = groupJobs
        .map(j => parseKyivTimestamp(j.last_output))
        .filter(Boolean);
      const newest = dates.length
        ? new Date(Math.max(...dates.map(d => d.getTime())))
        : null;
      const hoursAgo = newest
        ? (Date.now() - newest.getTime()) / 3600000
        : Infinity;
      return { group, hoursAgo };
    })
    .sort((a, b) => b.hoursAgo - a.hoursAgo)[0]?.group ?? enabled[0];
}

export default function DataSyncPage() {
  const jobsState = useJobsData();
  const runsState = useRunsData();

  const [previewTarget, setPreviewTarget] = useState(null);
  const [running, setRunning] = useState('');
  const [runningGroup, setRunningGroup] = useState('');
  const [message, setMessage] = useState(null);

  const jobs = jobsState.data?.jobs || [];
  const groups = jobsState.data?.groups || [];
  const quota = jobsState.data?.quota || {};
  const scheduleHealth = jobsState.data?.schedule_health || {};
  const runs = runsState.data?.runs || [];

  const recommendedGroup = useMemo(
    () => findRecommendedGroup(groups, jobs),
    [groups, jobs],
  );

  const activeRun = useMemo(
    () => runs.find(r => r.status === 'running') || null,
    [runs],
  );

  function showMessage(tone, text) {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 7000);
  }

  async function handleRunJob(name) {
    setRunning(name);
    showMessage('blue', `Стартую ${name}…`);
    try {
      const result = await api('/api/run-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      showMessage('green', `Job запущено: ${result.job_name}. PID ${result.pid}.`);
      jobsState.reload();
      runsState.reload();
    } catch (err) {
      showMessage('red', `Помилка запуску: ${err.message || String(err)}`);
    } finally {
      setRunning('');
    }
  }

  async function handleRunGroup(group) {
    setRunningGroup(group.name);
    showMessage('blue', `Стартую групу ${group.title || group.name}…`);
    try {
      const result = await api('/api/run-job-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: group.name }),
      });
      const tone =
        result.failed?.length  ? 'red' :
        result.skipped?.length ? 'orange' : 'green';
      showMessage(
        tone,
        `${group.title || group.name}: запущено ${result.launched?.length || 0}, ` +
        `пропущено ${result.skipped?.length || 0}, помилок ${result.failed?.length || 0}.`,
      );
      jobsState.reload();
      runsState.reload();
    } catch (err) {
      showMessage('red', `Помилка запуску: ${err.message || String(err)}`);
    } finally {
      setRunningGroup('');
    }
  }

  function handlePreviewRun() {
    if (!previewTarget) return;
    if (previewTarget.type === 'group') handleRunGroup(previewTarget.data);
    else handleRunJob(previewTarget.data.name);
    setPreviewTarget(null);
  }

  const isLoading = jobsState.loading && !jobsState.data;

  return (
    <div className="dataSyncPage">
      {/* Page header */}
      <div className="dataSyncHeader">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1>Оновлення даних</h1>
            <p>
              Запускайте збір YouTube-даних і одразу бачте, що саме отримаєте:
              відео, канали, хештеги, заголовки, описи, hooks і нові opportunities.
            </p>
          </div>
          <button
            className="button ghost"
            onClick={() => { jobsState.reload(); runsState.reload(); }}
            style={{ flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} />
            Оновити
          </button>
        </div>
      </div>

      {/* Notices */}
      {message && (
        <div className={`dsNotice ${message.tone}`}>{message.text}</div>
      )}
      {(jobsState.error || runsState.error) && (
        <div className="dsNotice red">
          {jobsState.error || runsState.error}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: 32, color: 'var(--muted)', fontSize: 14 }}>Завантаження…</div>
      ) : (
        <>
          {/* Section 1 — Readiness */}
          <DataReadinessCards
            jobs={jobs}
            quota={quota}
            runs={runs}
            scheduleHealth={scheduleHealth}
          />

          {/* Active run panel (only when running) */}
          {activeRun && <LiveRunPanel run={activeRun} />}

          {/* Section 2 — Recommended run */}
          <RecommendedRunCard
            recommendedGroup={recommendedGroup}
            running={running}
            runningGroup={runningGroup}
            onRun={handleRunGroup}
            onPreview={setPreviewTarget}
          />

          {/* Section 3 — Catalog */}
          <JobGoalCatalog
            groups={groups}
            jobs={jobs}
            running={running}
            runningGroup={runningGroup}
            onRunGroup={handleRunGroup}
            onRunJob={handleRunJob}
            onPreview={setPreviewTarget}
          />

          {/* Section 4 — Weekly schedule */}
          <JobScheduleCalendar jobs={jobs} quota={quota} onRefresh={jobsState.reload} />

          <JobsScheduleTable
            jobs={jobs}
            groups={groups}
            onRefresh={jobsState.reload}
            onPreview={setPreviewTarget}
          />

          {/* Section 5 — History */}
          <LastRunsTable runs={runs} jobs={jobs} />
        </>
      )}

      {/* Run preview drawer (overlay) */}
      {previewTarget && (
        <RunPreviewDrawer
          target={previewTarget}
          jobs={jobs}
          quota={quota}
          running={running}
          runningGroup={runningGroup}
          onRun={handlePreviewRun}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </div>
  );
}
