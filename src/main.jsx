import React, { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  Gauge,
  Hash,
  Home,
  LayoutDashboard,
  Lightbulb,
  Moon,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Square,
  Star,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Youtube,
  Zap,
} from 'lucide-react';
import './styles.css';
import { ToastContext, navigateTo, Link, api, usePolling } from './lib/shared.jsx';
import { compactNumber, percentValue, formatLabel, actionTone, trendTone, confidenceTone, numberFmt } from './lib/formatters.js';
const TodayPage = lazy(() => import('./pages/TodayPage.jsx'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage.jsx'));
const BacklogPage = lazy(() => import('./pages/BacklogPage.jsx'));
const IdeaLabPage = lazy(() => import('./pages/IdeaLabPage.jsx'));
const TrendRadarPage = lazy(() => import('./pages/TrendRadarPage.jsx'));
const SummaryPage = lazy(() => import('./pages/SummaryPage.jsx'));
const BriefPage = lazy(() => import('./pages/BriefPage.jsx'));
const DataSyncPage = lazy(() => import('./pages/DataSyncPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const CompetitorsPage = lazy(() => import('./pages/CompetitorsPage.jsx'));
const ContentPlanPage = lazy(() => import('./pages/ContentPlanPage.jsx'));
import './styles/theme.css';

const reportNumberFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const QuotaContext = React.createContext(null);
const ThemeContext = React.createContext({ theme: 'light', toggleTheme: () => {} });

function getInitialTheme() {
  try {
    const stored = window.localStorage.getItem('dashboard-theme');
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function routeFromWindow() {
  return {
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

function useRoute() {
  const [route, setRoute] = useState(routeFromWindow);
  useEffect(() => {
    const onPopState = () => setRoute(routeFromWindow());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  return route;
}

function useAutoMessage(delay = 6000) {
  const [message, setMessageRaw] = useState(null);
  const setMessage = useCallback((msg) => {
    setMessageRaw(msg);
    if (msg && msg.tone !== 'blue') {
      setTimeout(() => setMessageRaw(null), delay);
    }
  }, [delay]);
  return [message, setMessage];
}

function useDashboard() {
  return usePolling(() => api('/api/dashboard'), [], 30000);
}

function useQuota() {
  return usePolling(() => api('/api/quota'), [], 30000);
}

function useJobs() {
  return usePolling(() => api('/api/jobs'), [], 30000);
}

function useManualRuns() {
  return usePolling(() => api('/api/manual-runs'), [], 5000);
}

function useLlmAnalysis() {
  return usePolling(() => api('/api/llm-analysis'), [], 15000);
}

function useLlmReports() {
  return usePolling(() => api('/api/llm-reports'), [], 30000);
}

function useSummary(days) {
  return usePolling(() => api(`/api/summary?days=${encodeURIComponent(days)}`), [days], 30000);
}

function useOpportunities(days) {
  return usePolling(() => api(`/api/opportunities?days=${encodeURIComponent(days)}`), [days], 30000);
}

function useTrends(days) {
  return usePolling(() => api(`/api/trends?days=${encodeURIComponent(days)}`), [days], 30000);
}

function useDataHealth() {
  return usePolling(() => api('/api/data-health'), [], 30000);
}

async function runIdeaLab(payload) {
  return api('/api/idea-lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function useReports(jobFilter) {
  return usePolling(
    () => api(`/api/reports${jobFilter ? `?job=${encodeURIComponent(jobFilter)}` : ''}`),
    [jobFilter],
    30000,
  );
}

function ToastMessage({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toastMessage ${toast.tone || 'green'}`} role="status" aria-live="polite">
      {toast.text}
    </div>
  );
}

function Shell({ active, children, quota: quotaProp }) {
  const quotaCtx = useContext(QuotaContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const quota = quotaCtx || quotaProp;
  const pct = quota?.quota_pct || 0;
  return (
    <div className="app">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brandIcon brandIconBlue"><Zap size={18} /></span>
          <span>
            <strong>TrendPilot AI</strong>
            <small>AI-відео аналітика</small>
          </span>
        </Link>
        <nav className="nav">
          <Link className={active === 'today' || active === 'dashboard' ? 'active' : ''} href="/"><Home size={18} />Сьогодні</Link>
          <Link className={active === 'opportunities' ? 'active' : ''} href="/opportunities"><Star size={18} />Можливості</Link>
          <Link className={active === 'backlog' ? 'active' : ''} href="/backlog"><LayoutDashboard size={18} />Backlog ідей</Link>
          <Link className={active === 'contentPlan' ? 'active' : ''} href="/content-plan"><ClipboardList size={18} />План контенту</Link>
          <Link className={active === 'ideaLab' ? 'active' : ''} href="/idea-lab"><Lightbulb size={18} />Idea Lab</Link>
          <Link className={active === 'trends' ? 'active' : ''} href="/trends"><TrendingUp size={18} />Trend Radar</Link>
          <Link className={active === 'analytics' || active === 'summary' ? 'active' : ''} href="/summary"><BarChart3 size={18} />Summary</Link>
          <Link className={active === 'competitors' ? 'active' : ''} href="/competitors"><Users size={18} />Конкуренти</Link>
          <Link className={active === 'brief' ? 'active' : ''} href="/brief"><FileText size={18} />Брифи</Link>
          <div className="navDivider" />
          <Link className={active === 'dataHealth' ? 'active' : ''} href="/data-health"><Gauge size={14} style={{ opacity: 0.6 }} />Data Health</Link>
          <Link className={active === 'jobs' ? 'active' : ''} href="/jobs"><ClipboardList size={14} style={{ opacity: 0.6 }} />Оновлення даних</Link>
          <Link className={active === 'reports' ? 'active' : ''} href="/reports"><FileText size={14} style={{ opacity: 0.6 }} />Reports</Link>
          <Link className={active === 'llm' ? 'active' : ''} href="/llm"><Bot size={14} style={{ opacity: 0.6 }} />LLM</Link>
          <Link className={active === 'settings' ? 'active' : ''} href="/settings"><Settings size={14} style={{ opacity: 0.6 }} />Налаштування</Link>
        </nav>
        <div className="sidebarBottom">
          <button className="themeToggle" type="button" onClick={toggleTheme} aria-label="Перемкнути тему">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Світла тема' : 'Темна тема'}</span>
          </button>
          <div className="sidebarAdmin">
            <span className="sidebarAdminAvatar"><User size={14} /></span>
            <span>Admin</span>
            <ChevronDown size={14} />
          </div>
          {pct > 0 && (
            <div className="sidebarQuotaMini">
              <Progress value={pct} />
              <span>{pct}% квоти</span>
            </div>
          )}
        </div>
      </aside>
      <main className="content routeView">{children}</main>
    </div>
  );
}

function Topbar({ now, quotaDay, onRefresh }) {
  return (
    <header className="topbar">
      <div className="topbox">
        <span>Робочий простір</span>
        <strong>AI Media Lab</strong>
      </div>
      <div className="topbox">
        <span>Український час / quota day</span>
        <strong>{now || '-'} / {quotaDay || '-'}</strong>
      </div>
      <button className="iconButton" onClick={onRefresh} title="Оновити">
        <RefreshCw size={18} />
      </button>
    </header>
  );
}

function Progress({ value }) {
  return <div className="progress"><span style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} /></div>;
}

function MetricCard({ icon, label, value, suffix = '', hint, tone = 'blue' }) {
  return (
    <section className="metricCard">
      <div className={`metricIcon ${tone}`}>{icon}</div>
      <div>
        <p>{label}</p>
        <div className="metricNumber">{value}<span>{suffix}</span></div>
        {hint ? <small className={tone}>{hint}</small> : null}
      </div>
    </section>
  );
}

function Pill({ children, tone = 'neutral' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function StatusPill({ status }) {
  const tone = status === 'running' ? 'blue' : status === 'completed' ? 'green' : status === 'failed' ? 'red' : status === 'obsolete_failed' ? 'orange' : status === 'scheduled' ? 'blue' : status === 'stopped' ? 'orange' : 'neutral';
  const label = status === 'running' ? 'В процесі' : status === 'completed' ? 'Завершено' : status === 'failed' ? 'Помилка' : status === 'obsolete_failed' ? 'Стара помилка' : status === 'scheduled' ? 'Заплановано' : status === 'stopped' ? 'Зупинено' : 'Невідомо';
  return <Pill tone={tone}>{label}</Pill>;
}

function DashboardPage() {
  const showToast = useContext(ToastContext);
  const dashboard = useDashboard();
  const opportunitiesState = useOpportunities(30);
  const healthState = useDataHealth();
  const data = dashboard.data || {};
  const cards = data?.cards || {};
  const jobs = data?.jobs || {};
  const opportunities = opportunitiesState.data?.opportunities || [];
  const best = opportunitiesState.data?.best || opportunities[0];
  const health = healthState.data || {};
  const topThree = opportunities.slice(0, 5);

  return (
    <Shell active="dashboard" quota={cards}>
      <Topbar now={jobs.now_ua} quotaDay={data?.quota?.summary?.date} onRefresh={() => { dashboard.reload(); opportunitiesState.reload(); healthState.reload(); }} />
      {dashboard.error || opportunitiesState.error ? <div className="alert">{dashboard.error || opportunitiesState.error}</div> : null}
      {dashboard.loading || opportunitiesState.loading ? <div className="panel">Завантаження...</div> : null}

      <section className="commandHero">
        <div>
          <Pill tone={best?.recommendedAction === 'shoot_now' ? 'green' : 'orange'}>Today’s best opportunity</Pill>
          <h1>{best?.suggestedTitles?.[0] || best?.title || 'No recommendation yet'}</h1>
          <p>{best?.suggestedAction || 'Run the decision engine after fresh YouTube data is collected.'}</p>
          <div className="heroReason">
            <strong>Why</strong>
            <span>{best?.whyRecommended?.[0] || best?.suggested_angle || 'The system needs more evidence before recommending a shoot slot.'}</span>
          </div>
          <div className="rowActions">
            {best ? <Link className="button" href={`/brief?id=${encodeURIComponent(best.id || best.topic_key || best.title)}`}><FileText size={16} />Open Brief</Link> : null}
            <Link className="button ghost" href="/opportunities"><Star size={16} />Opportunity Board</Link>
          </div>
        </div>
        <div className="heroScorePanel">
          <OpportunityScoreBadge opportunity={best} />
          <OpportunityScoreBreakdown opportunity={best} />
          <DataHealthSummary health={health} compact />
        </div>
      </section>

      <section className="decisionGrid">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2>Today’s Content Opportunities</h2>
              <p className="muted">Ranked by demand, trend velocity, competition advantage, content fit and freshness.</p>
            </div>
            <Link className="button ghost" href="/opportunities">View all</Link>
          </div>
          <div className="contentOpportunityGrid">
            {topThree.map((item) => <OpportunityCard key={item.id || item.topic_key || item.title} opportunity={item} />)}
            {!topThree.length ? <EmptyState title="No opportunities found" text="Run the decision engine or expand the period after collecting YouTube research jobs." /> : null}
          </div>
        </section>
        <section className="panel">
          <h2>What changed?</h2>
          <div className="insightList compact">
            <Insight icon={<TrendingUp size={17} />} tone="green" text={best ? `${best.title || best.topic} is the strongest current production candidate.` : 'No confirmed production candidate yet.'} />
            <Insight icon={<Hash size={17} />} tone="blue" text={best?.hashtags?.length ? `${best.hashtags.slice(0, 3).join(', ')} should be tested with this idea.` : 'Hashtag evidence is incomplete for the current top idea.'} />
            <Insight icon={<Play size={17} />} tone="orange" text={best ? `${formatLabel(best.recommendedFormat)} is the recommended format.` : 'Format recommendation needs more data.'} />
            <Insight icon={<Gauge size={17} />} tone={best?.confidence === 'high' ? 'green' : 'orange'} text={best ? `Confidence is ${best.confidence}; evidence comes from ${best.dataHealth?.videosAnalyzed || 0} videos and ${best.dataHealth?.sourcesCount || 0} sources.` : 'Confidence is unavailable until opportunities are generated.'} />
          </div>
        </section>
      </section>

      <section className="panel nextActionWide">
        <div>
          <Pill tone="green">Best Next Action</Pill>
          <h2>{best?.suggestedTitles?.[0] || best?.title || 'Generate the next decision report'}</h2>
          <p>{best?.suggestedAction || 'Start with fresh research jobs, then rerun deterministic opportunity analysis.'}</p>
        </div>
        <div className="rowActions">
          {best ? <Link className="button" href={`/brief?id=${encodeURIComponent(best.id || best.topic_key || best.title)}`}>Open Brief</Link> : null}
          <Link className="button ghost" href="/trends">View Trend Evidence</Link>
          <Link className="button ghost" href="/data-health">Check Data Health</Link>
        </div>
      </section>
    </Shell>
  );
}

function OpportunityScoreBadge({ opportunity }) {
  if (!opportunity) return <div className="opportunityScoreBadge empty">-</div>;
  return (
    <div className={`opportunityScoreBadge ${actionTone(opportunity.recommendedAction)}`}>
      <strong>{Math.round(Number(opportunity.opportunityScore ?? opportunity.opportunity_score ?? 0))}</strong>
      <span>Opportunity Score</span>
      <small>{opportunity.status || opportunity.verdict || 'Watch'}</small>
    </div>
  );
}

function OpportunityScoreBreakdown({ opportunity }) {
  const values = opportunity?.scoreBreakdown || {
    demand: opportunity?.demandScore,
    trendVelocity: opportunity?.trendVelocityScore,
    competitionAdvantage: opportunity?.competitionAdvantageScore,
    contentFit: opportunity?.contentFitScore,
    freshness: opportunity?.freshnessScore,
  };
  const rows = [
    ['Demand', values?.demand, 'Audience demand for this topic.'],
    ['Trend Velocity', values?.trendVelocity, 'How quickly the topic is gaining attention.'],
    ['Competition Advantage', values?.competitionAdvantage, 'How realistic it is to enter the topic.'],
    ['Content Fit', values?.contentFit, 'How well the topic fits the channel and production effort.'],
    ['Freshness', values?.freshness, 'Whether the trend is still fresh.'],
  ];
  if (!opportunity) return <p className="muted">Score breakdown will appear after opportunities are generated.</p>;
  return (
    <div className="scoreBreakdown">
      {rows.map(([label, value, hint]) => (
        <div className="scoreBreakdownRow" key={label}>
          <span title={hint}>{label}</span>
          <div><b style={{ width: `${Math.max(4, Math.min(100, Number(value || 0)))}%` }} /></div>
          <strong>{Math.round(Number(value || 0))}</strong>
        </div>
      ))}
    </div>
  );
}

function TrendStatusBadge({ status }) {
  return <Pill tone={trendTone(status)}>{status || 'stable'}</Pill>;
}

function ConfidenceBadge({ confidence }) {
  return <Pill tone={confidenceTone(confidence)}>{confidence || 'low'} confidence</Pill>;
}

function FormatRecommendationBadge({ format }) {
  return <Pill tone="blue">{formatLabel(format)}</Pill>;
}

function RecommendationReason({ items = [] }) {
  return (
    <div className="reasonList">
      <strong>Why recommended?</strong>
      <ul>
        {items.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
        {!items.length ? <li>Decision engine needs more evidence for a stronger explanation.</li> : null}
      </ul>
    </div>
  );
}

function TrendEvidenceList({ items = [], videos = [] }) {
  const rows = items.length ? items : videos.map((video) => `${compactNumber(video.views)} views, ${compactNumber(video.velocity)}/day: ${video.title}`);
  return (
    <div className="reasonList">
      <strong>Evidence</strong>
      <ul>
        {rows.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
        {!rows.length ? <li>No evidence rows available yet.</li> : null}
      </ul>
    </div>
  );
}

function RiskList({ items = [] }) {
  return (
    <div className="reasonList risk">
      <strong>Risks</strong>
      <ul>
        {items.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
        {!items.length ? <li>No major risk penalty detected, but execution still needs a specific angle.</li> : null}
      </ul>
    </div>
  );
}

function SuggestedAction({ text }) {
  return (
    <div className="suggestedAction">
      <Zap size={17} />
      <div>
        <strong>Suggested action</strong>
        <p>{text || 'Open the brief and define the first recording test.'}</p>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }) {
  const showToast = useContext(ToastContext);
  return (
    <article className="decisionOpportunityCard">
      <div className="decisionOpportunityTop">
        <div>
          <TrendStatusBadge status={opportunity.trendStatus} />
          <ConfidenceBadge confidence={opportunity.confidence} />
          <FormatRecommendationBadge format={opportunity.recommendedFormat} />
        </div>
        <OpportunityScoreBadge opportunity={opportunity} />
      </div>
      <h3>{opportunity.title || opportunity.topic}</h3>
      <p>{opportunity.whyRecommended?.[0] || opportunity.suggested_angle}</p>
      <div className="tagList">
        {(opportunity.hashtags || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
        {!opportunity.hashtags?.length ? <span>No hashtags yet</span> : null}
      </div>
      <OpportunityScoreBreakdown opportunity={opportunity} />
      <div className="rowActions">
        <Link className="button" href={`/brief?id=${encodeURIComponent(opportunity.id || opportunity.topic_key || opportunity.title)}`}>Open Brief</Link>
      </div>
    </article>
  );
}

function DataHealthSummary({ health, compact = false }) {
  return (
    <div className={`dataHealthSummary ${compact ? 'compact' : ''}`}>
      <div>
        <span>Last updated</span>
        <strong>{health?.lastUpdated || '-'}</strong>
      </div>
      <div>
        <span>Videos analyzed</span>
        <strong>{numberFmt.format(health?.videosAnalyzed || 0)}</strong>
      </div>
      <div>
        <span>Failed API calls</span>
        <strong>{numberFmt.format(health?.failedApiCalls || 0)}</strong>
      </div>
      {!compact ? (
        <div>
          <span>Quota remaining</span>
          <strong>{numberFmt.format(health?.apiQuotaRemaining || 0)}</strong>
        </div>
      ) : null}
    </div>
  );
}

function FilterSummaryBar({ count, total, label, onReset }) {
  return (
    <div className="filterSummaryBar">
      <span>{label || `Showing ${numberFmt.format(count || 0)} of ${numberFmt.format(total || 0)} items.`}</span>
      {onReset ? <button className="linkButton" onClick={onReset}>Reset filters</button> : null}
    </div>
  );
}

function JobsPreview({ jobs }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Jobs</h2>
        <Link className="button" href="/jobs">Всі jobs</Link>
      </div>
      <table>
        <thead><tr><th>#</th><th>Назва</th><th>Квота</th><th>Наступний запуск</th><th>Статус</th></tr></thead>
        <tbody>
          {jobs.slice(0, 12).map((job, idx) => (
            <tr key={job.name}>
              <td>{idx + 1}</td>
              <td className="truncate" title={job.reason}>{job.name}</td>
              <td>{numberFmt.format(job.quota_estimate || 0)}</td>
              <td>{job.next_run_ua || '-'}</td>
              <td><Pill tone={job.enabled ? 'green' : 'red'}>{job.enabled ? 'Активний' : 'Вимкнено'}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function QuotaReadable({ quota }) {
  const total = quota.total || {};
  const limit = quota.daily_limit || 10000;
  const used = total.quota_cost || 0;
  const remaining = Math.max(0, limit - used);
  const pct = limit ? Math.round((used / limit) * 1000) / 10 : 0;
  const byJob = quota.by_job || [];
  const byEndpoint = quota.by_endpoint || [];
  const scheduled = quota.scheduled || [];
  const scheduledTotal = scheduled.reduce((sum, item) => sum + (Number(item.quota_estimate) || 0), 0);

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Quota: зрозумілий стан</h2>
        <Pill tone={pct > 85 ? 'red' : pct > 65 ? 'orange' : 'green'}>{pct}%</Pill>
      </div>
      <div className="quotaSummaryGrid">
        <InfoTile label="Використано" value={numberFmt.format(used)} />
        <InfoTile label="Залишилось" value={numberFmt.format(remaining)} />
        <InfoTile label="Запитів" value={numberFmt.format(total.requests || 0)} />
        <InfoTile label="План сьогодні" value={numberFmt.format(scheduledTotal)} />
      </div>
      <Progress value={pct} />
      <div className="miniGrid">
        <MiniTable title="Найбільше витратили jobs" rows={byJob.slice(0, 7)} nameKey="job_name" valueKey="quota_cost" />
        <MiniTable title="Endpoint-и" rows={byEndpoint.slice(0, 7)} nameKey="endpoint" valueKey="quota_cost" />
      </div>
      <h3>Заплановано сьогодні</h3>
      <table className="compactTable">
        <tbody>
          {scheduled.slice(0, 8).map((item) => (
            <tr key={`${item.time}-${item.name}`}>
              <td>{item.time}</td>
              <td className="truncate" title={item.reason}>{item.name}</td>
              <td>{numberFmt.format(item.quota_estimate || 0)}</td>
            </tr>
          ))}
          {!scheduled.length ? <tr><td className="muted">Немає запланованих jobs на quota day</td></tr> : null}
        </tbody>
      </table>
    </section>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="infoTile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniTable({ title, rows, nameKey, valueKey }) {
  return (
    <div>
      <h3>{title}</h3>
      <table className="miniTable">
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row[nameKey]}>
              <td className="truncate">{row[nameKey]}</td>
              <td>{numberFmt.format(row[valueKey] || 0)}</td>
            </tr>
          )) : <tr><td className="muted">Немає даних</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function DecisionPanel({ decisions }) {
  const opportunities = decisions.opportunities || [];
  const warnings = decisions.warnings || [];
  const hasLlm = Boolean(decisions.llm);
  return (
    <section id="llm" className="panel">
      <div className="panelHeader">
        <h2>Decision Summary</h2>
        <Link className="button ghost" href="/llm">LLM сторінка</Link>
      </div>
      <div className="decisionMeta">
        <InfoTile label="Signals" value={numberFmt.format(decisions.signals_analyzed || 0)} />
        <InfoTile label="Кластерів" value={numberFmt.format(decisions.clusters || 0)} />
      </div>
      {!hasLlm ? <div className="warningBox"><Bot size={17} /><div><p>LLM synthesis ще не знайдено. Це детермінований decision report, не LLM-висновок.</p></div></div> : null}
      {warnings.length ? (
        <div className="warningBox">
          <AlertTriangle size={17} />
          <div>{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
        </div>
      ) : null}
      <h3>Що знімати першим</h3>
      <div className="opportunityList">
        {opportunities.slice(0, 5).map((item) => (
          <article className="opportunityCard" key={item.topic_key || item.title}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.suggested_angle}</p>
            </div>
            <div className="scoreBox">
              <span>{item.opportunity_score}</span>
              <Pill tone={item.verdict === 'НЕ ПРІОРИТЕТ' ? 'red' : item.verdict === 'СПОСТЕРІГАТИ' ? 'orange' : 'green'}>{item.verdict}</Pill>
            </div>
          </article>
        ))}
        {!opportunities.length ? <p className="muted">Немає opportunities. Запусти decision engine.</p> : null}
      </div>
      <details className="detailsBlock">
        <summary>Повний markdown summary</summary>
        <MarkdownView text={decisions.summary || 'Немає decision report.'} />
      </details>
    </section>
  );
}

function RecentRuns({ runs }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Останні запуски</h2>
        <Link className="button ghost" href="/jobs">До jobs</Link>
      </div>
      <div className="runList">
        {runs.slice(0, 8).map((run) => (
          <article className="runCard" key={run.log_path}>
            <div>
              <strong>{run.job_name}</strong>
              <p>{run.started_at || run.updated_at}</p>
              {run.note ? <p className="runNote">{run.note}</p> : null}
              {run.tail ? <pre>{run.tail}</pre> : null}
            </div>
            <div className="runActions">
              <StatusPill status={run.status} />
              <a className="button ghost" href={`/file?path=${encodeURIComponent(run.log_path)}`} target="_blank" rel="noreferrer"><Eye size={15} />Log</a>
            </div>
          </article>
        ))}
        {!runs.length ? <p className="muted">Запусків ще немає.</p> : null}
      </div>
    </section>
  );
}

function ReportsList({ reports, onSelect }) {
  return (
    <section id="reports" className="panel">
      <div className="panelHeader">
        <h2>Останні reports</h2>
        <Link className="button" href="/reports">Всі звіти</Link>
      </div>
      <table>
        <tbody>
          {reports.slice(0, 12).map((report) => (
            <tr key={report.path}>
              <td>
                {onSelect ? (
                  <button className="linkButton" onClick={() => onSelect(report)}>{report.name}</button>
                ) : (
                  <Link href={`/reports?report=${encodeURIComponent(report.path)}`}>{report.name}</Link>
                )}
                <small className="muted truncateBlock">{report.path}</small>
              </td>
              <td>{report.updated_at}</td>
            </tr>
          ))}
          {!reports.length ? <tr><td className="muted">Немає reports</td></tr> : null}
        </tbody>
      </table>
    </section>
  );
}

function MarkdownPanel({ id, title, text, compact = false }) {
  return (
    <section id={id} className={`panel markdownPanel ${compact ? 'compactMarkdown' : ''}`}>
      <h2>{title}</h2>
      <MarkdownView text={text} />
    </section>
  );
}

function MarkdownView({ text }) {
  const blocks = useMemo(() => parseMarkdown(text || ''), [text]);
  return (
    <div className="markdownView">
      {blocks.map((block, idx) => {
        if (block.type === 'h1') return <h1 key={idx}>{block.text}</h1>;
        if (block.type === 'h2') return <h2 key={idx}>{block.text}</h2>;
        if (block.type === 'h3') return <h3 key={idx}>{block.text}</h3>;
        if (block.type === 'list') return <ul key={idx}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
        if (block.type === 'table') return <MarkdownTable key={idx} rows={block.rows} />;
        return <p key={idx}>{block.text}</p>;
      })}
    </div>
  );
}

function MarkdownTable({ rows }) {
  const [header, ...body] = rows;
  return (
    <div className="tableScroll">
      <table>
        <thead><tr>{header.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
        <tbody>{body.map((row, idx) => <tr key={idx}>{row.map((cell, cellIdx) => <td key={cellIdx}>{formatReportCell(cell, header[cellIdx])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function formatReportCell(cell, header = '') {
  const text = String(cell ?? '').trim();
  const headerText = String(header || '').toLowerCase();
  if (!text || /^https?:\/\//.test(text)) return text;
  if (!/(views?|перегляд|quota|requests?|signals?|comments?|likes?|score|outlier|channels?|videos?|відео|канал)/.test(headerText)) {
    return text;
  }
  if (!/^-?\d+(\.\d+)?$/.test(text.replace(/,/g, ''))) return text;
  const value = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(value)) return text;
  if (Math.abs(value) < 1000 && !/(views?|перегляд|quota|requests?|comments?|likes?)/.test(headerText)) {
    return text;
  }
  return reportNumberFmt.format(value);
}

function parseMarkdown(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2) });
      i += 1;
      continue;
    }
    if (line.startsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const rows = tableLines
        .filter((row, idx) => idx !== 1 || !/^\|\s*-+/.test(row))
        .map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim().replace(/\\\|/g, '|')));
      if (rows.length) blocks.push({ type: 'table', rows });
      continue;
    }
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    const paragraph = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(#|\||- )/.test(lines[i].trim())) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: paragraph.join(' ') });
  }
  return blocks;
}

function JobsPage() {
  const { data, error, loading, reload } = useJobs();
  const runs = useManualRuns();
  const [query, setQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [quotaFilter, setQuotaFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [selectedJobName, setSelectedJobName] = useState('');
  const [message, setMessage] = useAutoMessage();
  const [running, setRunning] = useState('');
  const [runningGroup, setRunningGroup] = useState('');
  const [jobsView, setJobsView] = useState('table'); // 'table' | 'calendar'

  const jobs = data?.jobs || [];
  const groups = data?.groups || [];
  const aggregates = data?.aggregates || {};
  const quota = data?.quota || {};
  const filteredJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const haystack = `${job.name} ${job.reason} ${job.job_file} ${job.command} ${job.purpose} ${job.source} ${job.execution_group} ${(job.analytics_scope || []).join(' ')}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (purposeFilter !== 'all' && job.purpose !== purposeFilter) return false;
      if (sourceFilter !== 'all' && job.source !== sourceFilter) return false;
      if (quotaFilter !== 'all' && job.quota_class !== quotaFilter) return false;
      if (scopeFilter !== 'all' && !(job.analytics_scope || []).includes(scopeFilter)) return false;
      return true;
    });
  }, [jobs, query, purposeFilter, sourceFilter, quotaFilter, scopeFilter]);
  const selectedJob = jobs.find((job) => job.name === selectedJobName) || filteredJobs[0] || null;

  const latestRunByJob = useMemo(() => {
    const map = new Map();
    for (const run of runs.data?.runs || []) {
      if (!map.has(run.job_name)) map.set(run.job_name, run);
    }
    return map;
  }, [runs.data]);

  const filterOptions = useMemo(() => {
    const values = (key) => Array.from(new Set(jobs.flatMap((job) => Array.isArray(job[key]) ? job[key] : [job[key]]).filter(Boolean))).sort();
    return {
      purpose: values('purpose'),
      source: values('source'),
      quota: values('quota_class'),
      scope: values('analytics_scope'),
    };
  }, [jobs]);

  async function runJob(name) {
    setRunning(name);
    setMessage({ tone: 'blue', text: `Стартую ${name}...` });
    try {
      const result = await api('/api/run-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setMessage({
        tone: 'green',
        text: `Job запущено: ${result.job_name}. PID ${result.pid}. Лог: ${result.log_path}`,
      });
      reload();
      runs.reload();
    } catch (err) {
      setMessage({ tone: 'red', text: `Помилка запуску: ${err.message || String(err)}` });
    } finally {
      setRunning('');
    }
  }

  async function runGroup(group) {
    const enabledCount = group.enabled ?? group.jobs ?? '?';
    const quotaEst = group.quota_estimate ? ` (~${numberFmt.format(group.quota_estimate)} quota units)` : '';
    if (!window.confirm(`Run group "${group.title || group.name}"?\n${enabledCount} enabled jobs${quotaEst}.\n\nThis will launch all jobs immediately.`)) return;
    setRunningGroup(group.name);
    setMessage({ tone: 'blue', text: `Стартую групу ${group.title || group.name}...` });
    try {
      const result = await api('/api/run-job-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: group.name }),
      });
      setMessage({
        tone: result.failed?.length ? 'red' : result.skipped?.length ? 'orange' : 'green',
        text: `Група ${group.name}: launched ${result.launched?.length || 0}, skipped ${result.skipped?.length || 0}, failed ${result.failed?.length || 0}.`,
      });
      reload();
      runs.reload();
    } catch (err) {
      setMessage({ tone: 'red', text: `Помилка запуску групи: ${err.message || String(err)}` });
    } finally {
      setRunningGroup('');
    }
  }

  async function saveJob(name, changes) {
    setMessage({ tone: 'blue', text: `Зберігаю ${name}...` });
    try {
      await api('/api/update-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, changes }),
      });
      setMessage({ tone: 'green', text: `Job оновлено: ${name}` });
      reload();
    } catch (err) {
      setMessage({ tone: 'red', text: `Помилка збереження: ${err.message || String(err)}` });
    }
  }

  return (
    <Shell active="jobs" quota={{ quota_used: quota.used || 0, quota_limit: quota.limit || 10000, quota_pct: quota.pct || 0 }}>
      <header className="jobsTopbar">
        <div>
          <Link href="/" className="backLink">← Дашборд</Link>
          <h1>Job & Quota Manager</h1>
          <p>Керує schedule, quota і запуском тільки predefined jobs/groups із YAML. Shell-команди не редагуються з web.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="jobViewToggle">
            <button className={jobsView === 'table' ? 'active' : ''} onClick={() => setJobsView('table')}>Таблиця</button>
            <button className={jobsView === 'calendar' ? 'active' : ''} onClick={() => setJobsView('calendar')}><CalendarDays size={14} />Календар</button>
          </div>
          <button className="button" onClick={() => { reload(); runs.reload(); }}><RefreshCw size={16} />Оновити</button>
        </div>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <div className="panel">Завантаження...</div> : null}
      <section className="cards">
        <MetricCard icon={<ClipboardList size={24} />} label="Усього jobs" value={data?.total || 0} />
        <MetricCard icon={<Activity size={24} />} label="Активні" value={data?.enabled || 0} tone="green" />
        <MetricCard icon={<Gauge size={24} />} label="Today quota plan" value={numberFmt.format(quota.scheduled_estimate || 0)} hint={`${numberFmt.format(quota.remaining || 0)} left`} />
        <MetricCard icon={<CalendarClock size={24} />} label="Зараз Україна" value={data?.now_ua || '-'} tone="orange" />
      </section>
      {message ? <div className={`notice ${message.tone}`}>{message.text}</div> : null}

      <section className="decisionGrid">
        <section className="panel">
          <div className="panelHeader">
            <h2>Execution groups</h2>
            <Pill tone={data?.schedule_health?.guard_enabled ? 'green' : 'red'}>{data?.schedule_health?.guard_enabled ? 'Quota guard on' : 'Guard off'}</Pill>
          </div>
          <div className="jobGroupGrid">
            {groups.map((group) => (
              <article className="jobGroupCard" key={group.name}>
                <div>
                  <Pill tone={group.heavy_jobs ? 'orange' : 'green'}>{group.purpose}</Pill>
                  <h3>{group.title || group.name}</h3>
                  <p>{group.description || 'Predefined execution group from schedule.yaml.'}</p>
                </div>
                <div className="ideaMetrics">
                  <InfoTile label="Jobs" value={`${group.enabled}/${group.jobs}`} />
                  <InfoTile label="Quota" value={numberFmt.format(group.quota_estimate || 0)} />
                  <InfoTile label="Heavy" value={numberFmt.format(group.heavy_jobs || 0)} />
                  <InfoTile label="Next" value={group.next_run_ua || '-'} />
                </div>
                <div className="tagList">{(group.analytics_scope || []).map((scope) => <span key={`${group.name}-${scope}`}>{scope}</span>)}</div>
                <button className="button" disabled={runningGroup === group.name} onClick={() => runGroup(group)}>
                  {runningGroup === group.name ? 'Старт...' : 'Run group'}
                </button>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Matrix analytics</h2>
          <JobAggregate title="By purpose" rows={aggregates.purpose || []} />
          <JobAggregate title="By source" rows={aggregates.source || []} />
          <JobAggregate title="By quota class" rows={aggregates.quota_class || []} />
        </section>
      </section>

      {jobsView === 'calendar' ? (
        <WeekCalendar
          jobs={filteredJobs}
          onSelect={(job) => setSelectedJobName(job.name)}
          onSave={saveJob}
        />
      ) : null}
      <section className="jobManagerGrid" style={jobsView === 'calendar' ? { display: 'none' } : undefined}>
        <section className="panel">
          <div className="panelHeader">
            <div className="filterBox"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук job, group, source..." /></div>
            <span className="muted">Filtered: {numberFmt.format(filteredJobs.length)} / {numberFmt.format(jobs.length)}</span>
          </div>
          <div className="jobFilters">
            <FilterSelect label="Purpose" value={purposeFilter} onChange={setPurposeFilter} options={filterOptions.purpose} />
            <FilterSelect label="Source" value={sourceFilter} onChange={setSourceFilter} options={filterOptions.source} />
            <FilterSelect label="Quota" value={quotaFilter} onChange={setQuotaFilter} options={filterOptions.quota} />
            <FilterSelect label="Analytics" value={scopeFilter} onChange={setScopeFilter} options={filterOptions.scope} />
          </div>
          <div className="tableScroll">
            <table>
              <thead>
                <tr>
                  <th>Job</th><th>Matrix</th><th>Quota</th><th>Schedule</th><th>Run</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const latest = latestRunByJob.get(job.name) || job.last_run;
                  return (
                    <tr key={job.name} className={selectedJob?.name === job.name ? 'selectedRow' : ''}>
                      <td>
                        <button className="linkButton" onClick={() => setSelectedJobName(job.name)}>{job.name}</button>
                        <small className="muted truncateBlock">{job.explanation}</small>
                      </td>
                      <td>
                        <div className="metadataTags">
                          <span>{job.purpose}</span><span>{job.source}</span><span>{job.execution_group}</span>
                        </div>
                      </td>
                      <td>
                        <Pill tone={job.quota_class === 'heavy' ? 'orange' : job.quota_class === 'free' ? 'green' : 'blue'}>{job.quota_class}</Pill>
                        <small>{numberFmt.format(job.quota_estimate || 0)} units</small>
                      </td>
                      <td>
                        <strong>{job.next_run_ua || '-'}</strong>
                        <small className="muted">{job.last_output ? `Output ${job.last_output}` : 'No output yet'}</small>
                      </td>
                      <td>
                        {latest ? <div className="runStatusCell"><StatusPill status={latest.status} /><small>{latest.updated_at}</small></div> : <span className="muted">No run</span>}
                      </td>
                      <td>
                        <div className="rowActions">
                          <button className="button" disabled={running === job.name || !job.guard?.allowed} onClick={() => runJob(job.name)}>
                            {running === job.name ? 'Старт...' : 'Run'}
                          </button>
                          <button className="button ghost" onClick={() => setSelectedJobName(job.name)}>Edit</button>
                          <Link className="button ghost" href={`/reports?job=${encodeURIComponent(job.name)}`}>Reports</Link>
                        </div>
                        {!job.guard?.allowed ? <small className="runNote">Guard: {job.guard?.reason}</small> : null}
                      </td>
                    </tr>
                  );
                })}
                {!filteredJobs.length ? <tr><td colSpan="6"><EmptyState title="No jobs match filters" text="Clear matrix filters or search by group/source/purpose." /></td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
        <JobEditPanel job={selectedJob} groups={groups} onSave={saveJob} />
      </section>
      <RecentRuns runs={runs.data?.runs || []} />
    </Shell>
  );
}

// ── Week Calendar ────────────────────────────────────────────────────────────

const CAL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CAL_DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const CAL_ROW_H = 28;
const GROUP_COLORS = {
  daily_pulse:         { bg: 'rgba(47,125,246,.22)',  border: '#2f7df6', text: '#7eb2ff' },
  tracked_refresh:     { bg: 'rgba(54,193,119,.18)',  border: '#36c177', text: '#67e39d' },
  ua_market_discovery: { bg: 'rgba(245,158,46,.18)',  border: '#f59e2e', text: '#ffc46f' },
  ukrainian_discovery: { bg: 'rgba(155,108,255,.18)', border: '#9b6cff', text: '#bea3ff' },
  global_discovery:    { bg: 'rgba(47,125,246,.11)',  border: '#5b9af8', text: '#aac8f5' },
  competitor_research: { bg: 'rgba(231,93,93,.16)',   border: '#e75d5d', text: '#ff9b9b' },
  decision_refresh:    { bg: 'rgba(54,193,119,.10)',  border: '#2ea865', text: '#4ecb84' },
  maintenance:         { bg: 'rgba(142,163,184,.10)', border: '#5a7a96', text: '#8ea3b8' },
};
function groupColor(name) {
  return GROUP_COLORS[name] || GROUP_COLORS.maintenance;
}

function timeToSlot(timeStr) {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return Math.min(47, Math.max(0, Math.floor(h * 2 + (m >= 30 ? 1 : 0))));
}
function slotToTime(slot) {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}
function buildCalendarSlots(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const slot = timeToSlot(job.schedule?.time);
    const days = job.schedule?.type === 'weekly'
      ? (job.schedule.days || []).map(d => CAL_DAYS.indexOf(d.toLowerCase())).filter(i => i >= 0)
      : [0, 1, 2, 3, 4, 5, 6];
    for (const dayIdx of days) {
      if (!map.has(dayIdx)) map.set(dayIdx, new Map());
      const col = map.get(dayIdx);
      if (!col.has(slot)) col.set(slot, []);
      col.get(slot).push(job);
    }
  }
  return map;
}

function CalendarJobBlock({ job, slotIndex, collidingCount, collisionIndex, isDragging, onDragStart, onDragEnd, onClick }) {
  const color = groupColor(job.execution_group);
  const wPct = 100 / collidingCount;
  return (
    <div
      className={`calJobBlock${isDragging ? ' dragging' : ''}${!job.enabled ? ' disabled' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      title={`${job.name}\n${job.execution_group} · ${job.schedule?.type} ${job.schedule?.time}${job.schedule?.days ? ' (' + job.schedule.days.join(', ') + ')' : ''}`}
      style={{
        top: `calc(${slotIndex} * var(--cal-row-h))`,
        height: 'calc(var(--cal-row-h) - 2px)',
        left: `${collisionIndex * wPct}%`,
        width: `calc(${wPct}% - 2px)`,
        background: color.bg,
        borderLeftColor: color.border,
        color: color.text,
      }}
    >
      <strong>{job.name}</strong>
    </div>
  );
}

function CalendarDayColumn({ dayIndex, dayLabel, slotData, dragState, onDragStart, onDragOver, onDrop, onDragEnd, onSelect }) {
  const isDragOver = dragState?.hoverDay === dayIndex;
  return (
    <div className={`calDayCol${isDragOver ? ' dragOver' : ''}`}>
      <div className="calDayHeader">{dayLabel}</div>
      <div
        className="calDayBody"
        onDragOver={(e) => onDragOver(e, dayIndex)}
        onDrop={(e) => onDrop(e, dayIndex)}
      >
        {Array.from({ length: 48 }, (_, i) => (
          <div
            key={i}
            className={`calSlotLine${i % 2 === 0 ? ' hour' : ''}${isDragOver && dragState.hoverSlot === i ? ' dropTarget' : ''}`}
            style={{ top: `calc(${i} * var(--cal-row-h))` }}
          />
        ))}
        {Array.from(slotData.entries()).map(([slotIdx, jobsInSlot]) =>
          jobsInSlot.map((job, ci) => (
            <CalendarJobBlock
              key={`${job.name}-${dayIndex}`}
              job={job}
              slotIndex={slotIdx}
              collidingCount={jobsInSlot.length}
              collisionIndex={ci}
              isDragging={dragState?.job?.name === job.name}
              onDragStart={() => onDragStart(job, dayIndex)}
              onDragEnd={onDragEnd}
              onClick={() => onSelect(job)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WeekCalendar({ jobs, onSelect, onSave }) {
  const [dragState, setDragState] = useState(null);
  const slotMap = useMemo(() => buildCalendarSlots(jobs), [jobs]);

  const handleDragStart = useCallback((job, dayIndex) => {
    setDragState({ job, originDay: dayIndex, hoverDay: null, hoverSlot: null });
  }, []);

  const handleDragOver = useCallback((e, dayIndex) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const slotIndex = Math.min(47, Math.max(0, Math.floor((e.clientY - rect.top) / CAL_ROW_H)));
    setDragState(prev => prev ? { ...prev, hoverDay: dayIndex, hoverSlot: slotIndex } : prev);
  }, []);

  const handleDrop = useCallback((e, dayIndex) => {
    e.preventDefault();
    if (!dragState) return;
    const { job, originDay, hoverSlot } = dragState;
    const newTime = slotToTime(hoverSlot ?? timeToSlot(job.schedule?.time));
    let newSchedule;
    if (job.schedule?.type === 'daily') {
      if (dayIndex === originDay) {
        newSchedule = { type: 'daily', time: newTime };
      } else {
        newSchedule = { type: 'weekly', days: [CAL_DAYS[dayIndex]], time: newTime };
      }
    } else {
      const curDays = job.schedule?.days || [];
      const originName = CAL_DAYS[originDay];
      const targetName = CAL_DAYS[dayIndex];
      let newDays;
      if (originDay === dayIndex) {
        newDays = curDays;
      } else if (curDays.includes(targetName)) {
        newDays = curDays.filter(d => d !== originName);
      } else {
        newDays = curDays.filter(d => d !== originName).concat(targetName);
      }
      newSchedule = { type: 'weekly', days: newDays.length ? newDays : curDays, time: newTime };
    }
    onSave(job.name, { schedule: newSchedule });
    setDragState(null);
  }, [dragState, onSave]);

  const handleDragEnd = useCallback(() => setDragState(null), []);

  return (
    <section className="panel" style={{ padding: 0 }}>
      <div className="calWrap">
        <div className="calLegend">
          {Object.entries(GROUP_COLORS).map(([name, c]) => (
            <span key={name} className="calLegendItem" style={{ borderLeftColor: c.border, color: c.text }}>
              {name.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        <div className="calGrid">
          <div className="calTimeAxis">
            <div className="calDayHeader" />
            {Array.from({ length: 48 }, (_, i) => (
              <div key={i} className="calTimeLabel">
                {i % 2 === 0 ? `${String(i / 2).padStart(2, '0')}:00` : ''}
              </div>
            ))}
          </div>
          {CAL_DAY_LABELS.map((label, dayIdx) => (
            <CalendarDayColumn
              key={dayIdx}
              dayIndex={dayIdx}
              dayLabel={label}
              slotData={slotMap.get(dayIdx) || new Map()}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="jobFilterSelect">
      <span>{label}</span>
      <select className="cleanSelect" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All</option>
        {(options || []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function JobAggregate({ title, rows }) {
  return (
    <div className="jobAggregate">
      <h3>{title}</h3>
      {(rows || []).slice(0, 8).map((row) => (
        <div className="jobAggregateRow" key={row.name}>
          <span>{row.name}</span>
          <strong>{numberFmt.format(row.quota_estimate || 0)}</strong>
          <small>{row.enabled}/{row.jobs} jobs</small>
        </div>
      ))}
    </div>
  );
}

function JobEditPanel({ job, groups, onSave }) {
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    if (!job) {
      setDraft(null);
      return;
    }
    setDraft({
      enabled: !!job.enabled,
      quota_estimate: job.quota_estimate || 0,
      reason: job.reason || '',
      purpose: job.purpose || '',
      source: job.source || '',
      quota_class: job.quota_class || '',
      execution_group: job.execution_group || '',
      analytics_scope: (job.analytics_scope || []).join(', '),
      schedule_type: job.schedule?.type || 'daily',
      schedule_time: job.schedule?.time || '09:00',
      schedule_days: (job.schedule?.days || []).join(', '),
    });
  }, [job?.name]);

  if (!job || !draft) {
    return <section className="panel"><h2>Job editor</h2><p className="muted">Select a job to edit safe schedule metadata.</p></section>;
  }

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const save = () => {
    onSave(job.name, {
      enabled: draft.enabled,
      quota_estimate: draft.quota_estimate,
      reason: draft.reason,
      purpose: draft.purpose,
      source: draft.source,
      quota_class: draft.quota_class,
      execution_group: draft.execution_group,
      analytics_scope: draft.analytics_scope,
      schedule: {
        type: draft.schedule_type,
        time: draft.schedule_time,
        days: draft.schedule_days,
      },
    });
  };

  return (
    <aside className="panel jobEditPanel">
      <div className="panelHeader">
        <h2>Job editor</h2>
        <Pill tone={job.guard?.allowed ? 'green' : 'orange'}>{job.guard?.allowed ? 'Runnable' : 'Guarded'}</Pill>
      </div>
      <h3>{job.name}</h3>
      <p className="muted">{job.job_file || job.command}</p>
      <div className="jobGuardrail">
        <strong>Guardrails</strong>
        <p>Web can edit schedule and metadata only. Job file and shell command are locked to prevent arbitrary execution.</p>
      </div>
      <label className="switchRow"><input type="checkbox" checked={draft.enabled} onChange={(event) => update('enabled', event.target.checked)} /> Enabled</label>
      <label>Time<input value={draft.schedule_time} onChange={(event) => update('schedule_time', event.target.value)} placeholder="HH:MM" /></label>
      <label>Schedule type<select value={draft.schedule_type} onChange={(event) => update('schedule_type', event.target.value)}><option value="daily">daily</option><option value="weekly">weekly</option></select></label>
      <label>Weekly days<input value={draft.schedule_days} onChange={(event) => update('schedule_days', event.target.value)} placeholder="monday, wednesday" disabled={draft.schedule_type !== 'weekly'} /></label>
      <label>Quota estimate<input type="number" min="0" value={draft.quota_estimate} onChange={(event) => update('quota_estimate', event.target.value)} /></label>
      <label>Quota class<select value={draft.quota_class} onChange={(event) => update('quota_class', event.target.value)}><option value="free">free</option><option value="cheap">cheap</option><option value="medium">medium</option><option value="heavy">heavy</option></select></label>
      <label>Purpose<input value={draft.purpose} onChange={(event) => update('purpose', event.target.value)} /></label>
      <label>Source<input value={draft.source} onChange={(event) => update('source', event.target.value)} /></label>
      <label>Execution group<select value={draft.execution_group} onChange={(event) => update('execution_group', event.target.value)}>{groups.map((group) => <option key={group.name} value={group.name}>{group.name}</option>)}</select></label>
      <label>Analytics scope<input value={draft.analytics_scope} onChange={(event) => update('analytics_scope', event.target.value)} placeholder="trends, videos" /></label>
      <label>Reason<textarea value={draft.reason} onChange={(event) => update('reason', event.target.value)} rows={3} /></label>
      <button className="button" onClick={save}>Save safe fields</button>
      <div className="jobArtifacts">
        <strong>Artifacts</strong>
        <div className="rowActions">
          {Object.entries(job.artifacts || {}).map(([name, path]) => <a className="button ghost" key={path} href={`/file?path=${encodeURIComponent(path)}`} target="_blank" rel="noreferrer">{name}</a>)}
          {!Object.keys(job.artifacts || {}).length ? <span className="muted">No artifacts yet</span> : null}
        </div>
      </div>
    </aside>
  );
}

function ReportsPage({ route }) {
  const params = new URLSearchParams(route.search);
  const initialJob = params.get('job') || '';
  const initialReport = params.get('report') || '';
  const [jobFilter, setJobFilter] = useState(initialJob);
  const { data, error, loading, reload } = useReports(jobFilter);
  const [selectedPath, setSelectedPath] = useState(initialReport);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');

  useEffect(() => setJobFilter(initialJob), [initialJob]);
  useEffect(() => {
    if (!selectedPath && data?.reports?.length) {
      setSelectedPath(data.reports[0].path);
    }
  }, [data, selectedPath]);
  useEffect(() => {
    if (!selectedPath) return;
    api(`/api/report?path=${encodeURIComponent(selectedPath)}`)
      .then((payload) => {
        setReport(payload);
        setReportError('');
      })
      .catch((err) => setReportError(err.message || String(err)));
  }, [selectedPath]);

  const reports = data?.reports || [];
  const selectedMeta = reports.find((item) => item.path === selectedPath);

  return (
    <Shell active="reports" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="jobsTopbar">
        <div>
          <Link href="/" className="backLink">← Дашборд</Link>
          <h1>Звіти</h1>
          <p>Тут можна переглядати всі reports або відфільтрувати їх під конкретний job.</p>
        </div>
        <button className="button" onClick={reload}><RefreshCw size={16} />Оновити</button>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      <section className="reportsLayout">
        <section className="panel">
          <div className="panelHeader">
            <div className="filterBox"><Search size={17} /><input value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} placeholder="Фільтр за job..." /></div>
            <button className="button ghost" onClick={() => { setJobFilter(''); navigateTo('/reports'); }}>Очистити</button>
          </div>
          {loading ? <p className="muted">Завантаження...</p> : null}
          <div className="reportCards">
            {reports.map((item) => (
              <button key={item.path} className={`reportCard ${selectedPath === item.path ? 'active' : ''}`} onClick={() => setSelectedPath(item.path)}>
                <strong>{item.name}</strong>
                <span>{item.updated_at} · {item.size_kb} KB</span>
                <small>{item.path}</small>
              </button>
            ))}
            {!reports.length ? <p className="muted">Звіти не знайдено для цього фільтра.</p> : null}
          </div>
        </section>
        <section className="panel reportReader">
          <div className="panelHeader">
            <h2>{report?.name || 'Report preview'}</h2>
            <div className="rowActions">
              {report?.path ? <a className="button ghost" href={`/file?path=${encodeURIComponent(report.path)}`} target="_blank" rel="noreferrer"><ExternalLink size={15} />Report</a> : null}
              {selectedMeta?.candidates_path ? <a className="button ghost" href={`/file?path=${encodeURIComponent(selectedMeta.candidates_path)}`} target="_blank" rel="noreferrer">CSV</a> : null}
              {selectedMeta?.signals_path ? <a className="button ghost" href={`/file?path=${encodeURIComponent(selectedMeta.signals_path)}`} target="_blank" rel="noreferrer">Signals</a> : null}
            </div>
          </div>
          {reportError ? <div className="alert">{reportError}</div> : null}
          {report?.content ? <MarkdownView text={report.content} /> : <p className="muted">Вибери report зліва.</p>}
        </section>
      </section>
    </Shell>
  );
}

function formatCounts(counts) {
  if (!counts || typeof counts !== 'object' || !Object.keys(counts).length) return '-';
  return Object.entries(counts).map(([key, value]) => `${key}: ${value}`).join(', ');
}

function LlmTrainingBar({ label, value, target }) {
  const pct = target ? Math.min(100, Math.round(Number(value || 0) / Number(target || 1) * 100)) : 0;
  return (
    <div className="llmTrainingBar">
      <div>
        <span>{label}</span>
        <strong>{numberFmt.format(value || 0)} / {numberFmt.format(target || 0)}</strong>
      </div>
      <Progress value={pct} />
    </div>
  );
}

function LlmPage() {
  const { data, error, loading, reload } = useLlmAnalysis();
  const [launching, setLaunching] = useState('');
  const [stopping, setStopping] = useState('');
  const [message, setMessage] = useAutoMessage();
  const decisions = data?.decisions || {};
  const artifacts = data?.artifacts || {};
  const events = data?.events || [];
  const runs = data?.runs || [];
  const scheduled = data?.scheduled || [];
  const ollama = data?.ollama || {};
  const ollamaModels = ollama.models || [];
  const llmModel = data?.llm_model || {};
  const modelCard = llmModel.model_card || {};
  const trainingData = llmModel.training_data || {};
  const trainingStatus = llmModel.training_status || {};
  const evaluation = llmModel.evaluation || {};
  const improvementPlan = llmModel.improvement_plan || [];
  const [training, setTraining] = useState(false);

  async function runLlmJob(jobName) {
    setLaunching(jobName);
    setMessage({ tone: 'blue', text: `Запускаю ${jobName}...` });
    try {
      const result = await api('/api/run-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: jobName }),
      });
      setMessage({ tone: 'green', text: `Запущено ${result.job_name}. PID ${result.pid}. Лог: ${result.log_path}` });
      reload();
    } catch (err) {
      setMessage({ tone: 'red', text: `Помилка запуску: ${err.message || String(err)}` });
    } finally {
      setLaunching('');
    }
  }

  async function stopLlmRun(run) {
    const key = run?.log_path || 'latest';
    setStopping(key);
    setMessage({ tone: 'blue', text: 'Зупиняю LLM synthesis...' });
    try {
      const result = await api('/api/stop-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_path: run?.log_path || '' }),
      });
      const unloaded = result.ollama?.unloaded?.length ? ` Модель вивантажено: ${result.ollama.unloaded.join(', ')}.` : '';
      setMessage({ tone: 'green', text: `LLM synthesis зупинено.${result.pid ? ` PID ${result.pid}.` : ''}${unloaded}` });
      reload();
    } catch (err) {
      setMessage({ tone: 'red', text: `Не вдалося зупинити LLM: ${err.message || String(err)}` });
    } finally {
      setStopping('');
    }
  }

  async function refreshTrainingReport() {
    setTraining(true);
    setMessage({ tone: 'blue', text: 'Оновлюю LLM training/evaluation report на реальних локальних даних...' });
    try {
      const result = await api('/api/llm-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setMessage({ tone: 'green', text: result.stdout || 'LLM model report оновлено.' });
      reload();
    } catch (err) {
      setMessage({ tone: 'red', text: `Не вдалося оновити LLM training report: ${err.message || String(err)}` });
    } finally {
      setTraining(false);
    }
  }

  const llmJob = scheduled.find((job) => job.name.includes('llm')) || scheduled.find((job) => String(job.command || '').includes('--llm'));
  const deterministicJob = scheduled.find((job) => !job.name.includes('llm') && String(job.command || '').includes('analyze_youtube_opportunities.py'));
  const activeLlmRun = runs.find((run) => run.status === 'running' && (String(run.command || '').includes('--llm') || String(run.job_name || '').includes('llm')));
  const ollamaBusy = ollamaModels.length > 0;

  return (
    <Shell active="llm" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="jobsTopbar">
        <div>
          <Link href="/" className="backLink">← Дашборд</Link>
          <h1>LLM Аналіз</h1>
          <p>Окремий контроль deterministic decision report і справжнього LLM synthesis.</p>
        </div>
        <button className="button" onClick={reload}><RefreshCw size={16} />Оновити</button>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <div className="panel">Завантаження...</div> : null}
      {message ? <div className={`notice ${message.tone}`}>{message.text}</div> : null}

      <section className="cards">
        <MetricCard icon={<FileText size={24} />} label="Decision report" value={data?.deterministic_available ? 'Є' : 'Немає'} hint={artifacts.deterministic?.updated_at || '-'} tone="green" />
        <MetricCard icon={<Bot size={24} />} label="LLM synthesis" value={data?.llm_available ? 'Є' : 'Немає'} hint={data?.llm_available ? artifacts.llm?.updated_at : 'ще не запускався'} tone="orange" />
        <MetricCard icon={<Activity size={24} />} label="Signals" value={numberFmt.format(decisions.signals_analyzed || 0)} hint={`${numberFmt.format(decisions.clusters || 0)} кластерів`} />
        <MetricCard icon={<Gauge size={24} />} label="Training labels" value={numberFmt.format(trainingData.supervised_examples || 0)} hint={`${numberFmt.format(trainingData.decision_examples || 0)} decision examples`} tone={(trainingData.supervised_examples || 0) >= 10 ? 'green' : 'orange'} />
      </section>

      <section className="llmActions">
        {deterministicJob ? (
          <button className="button ghost" disabled={launching === deterministicJob.name} onClick={() => runLlmJob(deterministicJob.name)}>
            <BarChart3 size={16} />{launching === deterministicJob.name ? 'Старт...' : 'Запустити decision report'}
          </button>
        ) : null}
        {llmJob ? (
          <button className="button" disabled={launching === llmJob.name} onClick={() => runLlmJob(llmJob.name)}>
            <Bot size={16} />{launching === llmJob.name ? 'Старт...' : 'Запустити LLM synthesis'}
          </button>
        ) : null}
        <Link className="button ghost" href="/llm/reports"><FileText size={16} />Архів LLM synthesis</Link>
        <Link className="button ghost" href="/summary"><BarChart3 size={16} />Summary</Link>
        <button className="button ghost" disabled={training} onClick={refreshTrainingReport}>
          <Gauge size={16} />{training ? 'Оновлюю...' : 'Оновити training report'}
        </button>
        {activeLlmRun ? (
          <button className="button danger" disabled={stopping === activeLlmRun.log_path} onClick={() => stopLlmRun(activeLlmRun)}>
            <Square size={15} />{stopping === activeLlmRun.log_path ? 'Зупиняю...' : 'Зупинити LLM synthesis'}
          </button>
        ) : null}
        {!activeLlmRun && ollamaBusy ? (
          <button className="button danger" disabled={stopping === 'latest'} onClick={() => stopLlmRun(null)}>
            <Square size={15} />{stopping === 'latest' ? 'Очищаю...' : 'Очистити GPU / Ollama'}
          </button>
        ) : null}
      </section>

      {!data?.llm_available ? (
        <div className="warningBox">
          <AlertTriangle size={17} />
          <div>
            <p>LLM synthesis file `llm_synthesis.md` не знайдено. Поточний блок на дашборді є deterministic decision report, а не LLM-висновок.</p>
          </div>
        </div>
      ) : null}

      <section className="llmModelGrid">
        <section className="panel llmModelPanel">
          <div className="panelHeader">
            <h2>LLM Model</h2>
            <Pill tone={trainingStatus.can_fine_tune_llm ? 'green' : 'orange'}>{modelCard.fine_tune_status || 'unknown'}</Pill>
          </div>
          <div className="llmModelFacts">
            <div><span>Active model</span><strong>{modelCard.active_model || '-'}</strong></div>
            <div><span>Provider</span><strong>{modelCard.llm_provider || '-'}</strong></div>
            <div><span>Prediction model</span><strong>{modelCard.prediction_model_version || '-'}</strong></div>
            <div><span>Ollama / GPU</span><strong>{ollamaBusy ? 'Зайнято' : 'Вільно'}</strong></div>
          </div>
          <p className="muted">{modelCard.role || 'LLM model card ще не згенеровано.'}</p>
        </section>

        <section className="panel llmModelPanel">
          <div className="panelHeader">
            <h2>Training Data</h2>
            <Pill tone={trainingStatus.can_train_supervised ? 'green' : 'orange'}>{trainingStatus.status || 'unknown'}</Pill>
          </div>
          <div className="llmTrainingBars">
            <LlmTrainingBar label="Calibration labels" value={trainingData.supervised_examples || 0} target={trainingData.required_for_calibration || 10} />
            <LlmTrainingBar label="Fine-tune labels" value={trainingData.supervised_examples || 0} target={trainingData.required_for_fine_tune || 100} />
          </div>
          <div className="llmModelFacts compact">
            <div><span>Decision examples</span><strong>{numberFmt.format(trainingData.decision_examples || 0)}</strong></div>
            <div><span>Feedback rows</span><strong>{numberFmt.format(trainingData.feedback_rows || 0)}</strong></div>
            <div><span>LLM reports</span><strong>{numberFmt.format(trainingData.llm_reports || 0)}</strong></div>
            <div><span>Dataset</span><strong>{artifacts.training_dataset?.exists ? 'Є' : 'Немає'}</strong></div>
          </div>
          <p className="muted">{trainingStatus.reason || ''}</p>
        </section>

        <section className="panel llmModelPanel">
          <div className="panelHeader">
            <h2>Evaluation</h2>
            <Pill tone={evaluation.accuracy == null ? 'orange' : evaluation.accuracy >= 60 ? 'green' : 'red'}>
              {evaluation.accuracy == null ? 'need labels' : `${evaluation.accuracy}%`}
            </Pill>
          </div>
          <table>
            <tbody>
              <tr><td>Labeled examples</td><td>{numberFmt.format(evaluation.labeled_examples || 0)}</td></tr>
              <tr><td>Accuracy</td><td>{evaluation.accuracy == null ? 'not enough labels' : `${evaluation.accuracy}%`}</td></tr>
              <tr><td>Median views error</td><td>{evaluation.median_views_error_pct == null ? 'not enough labels' : `${evaluation.median_views_error_pct}%`}</td></tr>
              <tr><td>Predicted labels</td><td>{formatCounts(evaluation.predicted_label_counts)}</td></tr>
              <tr><td>Actual labels</td><td>{formatCounts(evaluation.actual_label_counts)}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="panel llmModelPanel">
          <div className="panelHeader">
            <h2>Improvement Loop</h2>
            <Pill tone="blue">{improvementPlan.length} actions</Pill>
          </div>
          <div className="llmImprovementList">
            {improvementPlan.map((item, idx) => (
              <article key={`${item.title}-${idx}`}>
                <Pill tone={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'}>{item.priority}</Pill>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
            {!improvementPlan.length ? <p className="muted">Improvement plan з'явиться після генерації model report.</p> : null}
          </div>
        </section>
      </section>

      <section className="layout">
        <section className="panel">
          <div className="panelHeader">
            <h2>Графік запусків LLM / Decision</h2>
            <Pill tone="blue">{events.length} подій</Pill>
          </div>
          <LlmTimeline events={events} />
        </section>
        <section className="panel">
          <h2>Артефакти аналізу</h2>
          <ArtifactTable artifacts={artifacts} />
        </section>
        <section className="panel">
          <h2>Останні запуски аналізу</h2>
          <div className="runList">
            {runs.map((run) => (
              <article className="runCard" key={run.log_path}>
                <div>
                  <strong>{run.job_name}</strong>
                  <p>{run.started_at || run.updated_at}</p>
                  {run.note ? <p className="runNote">{run.note}</p> : null}
                  {run.tail ? <pre>{run.tail}</pre> : null}
                </div>
                <div className="runActions">
                  <StatusPill status={run.status} />
                  {run.status === 'running' && (String(run.command || '').includes('--llm') || String(run.job_name || '').includes('llm')) ? (
                    <button className="button danger" disabled={stopping === run.log_path} onClick={() => stopLlmRun(run)}>
                      <Square size={15} />{stopping === run.log_path ? 'Зупиняю...' : 'Зупинити'}
                    </button>
                  ) : null}
                  <a className="button ghost" href={`/file?path=${encodeURIComponent(run.log_path)}`} target="_blank" rel="noreferrer">Log</a>
                </div>
              </article>
            ))}
            {!runs.length ? <p className="muted">Запусків LLM/decision через dashboard ще немає.</p> : null}
          </div>
        </section>
        <MarkdownPanel title={data?.llm_available ? 'LLM Synthesis' : 'Decision Summary'} text={decisions.llm || decisions.summary || 'Немає аналізу.'} />
      </section>
    </Shell>
  );
}

function LlmReportsPage() {
  const { data, error, loading, reload } = useLlmReports();
  const [selectedPath, setSelectedPath] = useState('');
  const [report, setReport] = useState(null);
  const reports = data?.reports || [];
  const runs = data?.runs || [];

  useEffect(() => {
    if (!selectedPath && reports.length) setSelectedPath(reports[0].path);
  }, [reports, selectedPath]);

  useEffect(() => {
    if (!selectedPath) return;
    api(`/api/report?path=${encodeURIComponent(selectedPath)}`)
      .then(setReport)
      .catch((err) => setReport({ content: `Помилка завантаження: ${err.message || String(err)}` }));
  }, [selectedPath]);

  return (
    <Shell active="llm" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="jobsTopbar">
        <div>
          <Link href="/llm" className="backLink">← LLM Аналіз</Link>
          <h1>LLM synthesis reports</h1>
          <p>Архів LLM-висновків: що знімати, що не знімати, ринкові патерни та історія запусків.</p>
        </div>
        <button className="button" onClick={reload}><RefreshCw size={16} />Оновити</button>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <div className="panel">Завантаження...</div> : null}
      <section className="cards">
        <MetricCard icon={<Bot size={24} />} label="LLM reports" value={reports.length} hint="збережені synthesis" tone="orange" />
        <MetricCard icon={<Activity size={24} />} label="LLM runs" value={runs.length} hint="історія запусків" tone="green" />
        <MetricCard icon={<FileText size={24} />} label="Останній report" value={reports[0]?.updated_at || '-'} tone="purple" />
        <MetricCard icon={<CalendarClock size={24} />} label="Поточний вибір" value={report?.name || '-'} />
      </section>
      <section className="reportsLayout">
        <section className="panel">
          <div className="panelHeader">
            <h2>Архів</h2>
            <Pill tone="blue">{reports.length}</Pill>
          </div>
          <div className="reportCards">
            {reports.map((item) => (
              <button key={item.path} className={`reportCard ${selectedPath === item.path ? 'active' : ''}`} onClick={() => setSelectedPath(item.path)}>
                <strong>{item.run_id || item.label}</strong>
                <span>{item.updated_at} · {item.size_kb} KB</span>
                <small>{item.signals_analyzed ? `${numberFmt.format(item.signals_analyzed)} signals · ${numberFmt.format(item.clusters || 0)} clusters` : item.path}</small>
              </button>
            ))}
            {!reports.length ? <p className="muted">LLM synthesis reports ще не збережені.</p> : null}
          </div>
        </section>
        <section className="panel reportReader">
          <div className="panelHeader">
            <h2>{report?.name || 'LLM report'}</h2>
            {selectedPath ? <a className="button ghost" href={`/file?path=${encodeURIComponent(selectedPath)}`} target="_blank" rel="noreferrer"><ExternalLink size={15} />Файл</a> : null}
          </div>
          <MarkdownView text={report?.content || 'Вибери LLM report зліва.'} />
        </section>
      </section>
    </Shell>
  );
}

function LegacyTrendRadarPage() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState('topics');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data, error, loading, reload } = useTrends(days);
  const rows = data?.[tab] || [];
  const filteredRows = rows.filter((item) => {
    const status = item.trendStatus || item.trend || item.status;
    return statusFilter === 'all' || status === statusFilter;
  });
  return (
    <Shell active="trends" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone="green">Trend Radar</Pill>
          <h1>What is gaining attention?</h1>
          <p>Signals only: topics, hashtags, videos, formats and categories. Use Opportunity Board for final shoot decisions.</p>
        </div>
        <div className="analyticsHeaderActions">
          <div className="periodPicker" aria-label="Trend period">
            {[7, 30, 90].map((value) => <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} days</button>)}
          </div>
          <button className="button" onClick={reload}><RefreshCw size={16} />Refresh</button>
        </div>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading ? (
        <>
          <section className="analyticsFilters">
            <div className="compactSegment">
              {[
                ['topics', 'Topics'],
                ['hashtags', 'Hashtags'],
                ['videos', 'Videos'],
                ['formats', 'Formats'],
                ['categories', 'Categories'],
              ].map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
            </div>
            <div className="compactSegment">
              {['all', 'rising', 'stable', 'falling'].map((value) => <button key={value} className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)}>{value}</button>)}
            </div>
          </section>
          <FilterSummaryBar count={filteredRows.length} total={rows.length} label={`Showing ${filteredRows.length} ${tab} from last ${days} days.`} />
          {tab === 'topics' ? <TopicTrendTable rows={filteredRows} /> : null}
          {tab === 'hashtags' ? <HashtagTrendTable rows={filteredRows} /> : null}
          {tab === 'videos' ? <VideoSignalsGrid rows={filteredRows} /> : null}
          {tab === 'formats' ? <FormatTrendTable rows={filteredRows} /> : null}
          {tab === 'categories' ? <CategoryTrendGrid rows={filteredRows} /> : null}
        </>
      ) : null}
    </Shell>
  );
}

function TopicTrendTable({ rows }) {
  return (
    <section className="panel">
      <div className="panelHeader"><h2>Topics</h2><Pill tone="blue">{rows.length}</Pill></div>
      <div className="tableScroll">
        <table className="decisionTable">
          <thead><tr><th>Topic</th><th>Category</th><th>Trend</th><th>Velocity</th><th>Demand</th><th>Competition</th><th>Freshness</th><th>Hashtags</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.name}>
                <td><strong>{row.name}</strong></td>
                <td>{row.category || '-'}</td>
                <td><TrendStatusBadge status={row.trendStatus} /></td>
                <td>{Math.round(Number(row.trendVelocity || 0))}</td>
                <td>{Math.round(Number(row.demandScore || 0))}</td>
                <td>{Math.round(Number(row.competitionScore || 0))}</td>
                <td>{Math.round(Number(row.freshness || 0))}</td>
                <td>{(row.relatedHashtags || []).slice(0, 3).join(', ') || '-'}</td>
                <td>{row.recommendation || 'watch'}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan="9"><EmptyState title="No trending topics found" text="Try expanding the date range, removing status filters, or running current research jobs." /></td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HashtagTrendTable({ rows }) {
  return (
    <section className="panel">
      <div className="panelHeader"><h2>Hashtags</h2><Pill tone="blue">{rows.length}</Pill></div>
      <div className="tableScroll">
        <table className="decisionTable">
          <thead><tr><th>Hashtag</th><th>Usage</th><th>Views growth</th><th>Engagement</th><th>Trend</th><th>Examples</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.hashtag}>
                <td><strong>{row.hashtag}</strong></td>
                <td>{numberFmt.format(row.usageCount || row.video_count || 0)}</td>
                <td><ChangeValue value={row.viewsGrowth ?? row.effective_change} /></td>
                <td>{row.avg_engagement_rate ? `${(Number(row.avg_engagement_rate) * 100).toFixed(2)}%` : '-'}</td>
                <td><TrendStatusBadge status={row.trendStatus} /></td>
                <td className="truncate" title={(row.examples || []).join(' · ')}>{(row.examples || [])[0] || '-'}</td>
                <td>{row.action || row.recommendation || 'watch'}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan="7"><EmptyState title="No trending hashtags found" text="Try increasing the date range to 30 days, removing category filters, or lowering the minimum views threshold." /></td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VideoSignalsGrid({ rows }) {
  return (
    <section className="videoSignalGrid">
      {rows.map((row) => <VideoSignalCard key={row.id || row.title} item={row} />)}
      {!rows.length ? <EmptyState title="No video signals found" text="Run outlier jobs or expand the date range to collect more examples." /> : null}
    </section>
  );
}

function VideoSignalCard({ item }) {
  return (
    <article className="videoSignalCard">
      <FormatRecommendationBadge format={item.format} />
      <h3>{item.title}</h3>
      <p>{item.channel || '-'}</p>
      <div className="quotaSummaryGrid">
        <InfoTile label="Views" value={compactNumber(item.views || 0)} />
        <InfoTile label="Velocity" value={`${compactNumber(item.viewsVelocity || item.velocity || 0)}/day`} />
        <InfoTile label="Published" value={formatShortDate(item.publishedAt)} />
        <InfoTile label="Topic" value={item.topic || '-'} />
      </div>
      <SuggestedAction text={item.whyItMatters || 'Use this as trend evidence, not as a direct copy target.'} />
    </article>
  );
}

function FormatTrendTable({ rows }) {
  return (
    <section className="panel">
      <div className="panelHeader"><h2>Formats</h2><Pill tone="blue">{rows.length}</Pill></div>
      <div className="tableScroll">
        <table className="decisionTable">
          <thead><tr><th>Format</th><th>Average views/day</th><th>Engagement</th><th>Trend</th><th>Difficulty</th><th>Recommendation</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name || row.key}>
                <td><strong>{row.name || row.label || row.key}</strong></td>
                <td>{compactNumber(row.averageViews || row.avg_views_per_day || row.views_per_day || 0)}</td>
                <td>{row.engagement ? `${(Number(row.engagement) * 100).toFixed(2)}%` : '-'}</td>
                <td><TrendStatusBadge status={row.trend} /></td>
                <td>{row.difficulty || '-'}</td>
                <td>{row.recommendation || 'watch'}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan="6"><EmptyState title="No format trends found" text="Run current research jobs so formats can be compared." /></td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoryTrendGrid({ rows }) {
  return (
    <section className="contentOpportunityGrid">
      {rows.map((row) => (
        <article className="decisionOpportunityCard" key={row.key || row.label}>
          <h3>{row.label || row.key}</h3>
          <div className="ideaMetrics">
            <InfoTile label="Videos" value={numberFmt.format(row.videos || 0)} />
            <InfoTile label="Views" value={compactNumber(row.views || 0)} />
            <InfoTile label="Views/day" value={compactNumber(row.views_per_day || 0)} />
            <InfoTile label="Avg/day" value={compactNumber(row.avg_views_per_day || 0)} />
          </div>
        </article>
      ))}
      {!rows.length ? <EmptyState title="No category trends found" text="Try expanding the period or running category-focused jobs." /> : null}
    </section>
  );
}

function LegacyOpportunityBoardPage() {
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [confidence, setConfidence] = useState('all');
  const [format, setFormat] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const { data, error, loading, reload } = useOpportunities(days);
  const opportunities = data?.opportunities || [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return opportunities.filter((item) => {
      const text = `${item.topic || ''} ${item.title || ''} ${item.suggested_angle || ''}`.toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (status !== 'all' && item.recommendedAction !== status) return false;
      if (confidence !== 'all' && item.confidence !== confidence) return false;
      if (format !== 'all' && item.recommendedFormat !== format) return false;
      if (Number(item.opportunityScore || 0) < minScore) return false;
      return true;
    });
  }, [opportunities, query, status, confidence, format, minScore]);

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setConfidence('all');
    setFormat('all');
    setMinScore(0);
    setDays(30);
  }

  return (
    <Shell active="opportunities" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone="green">Decision workspace</Pill>
          <h1>Opportunity Board</h1>
          <p>Ranked content ideas with score breakdown, confidence, evidence, risks and next action.</p>
        </div>
        <div className="analyticsHeaderActions">
          <div className="periodPicker">
            {[7, 30, 90].map((value) => <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} days</button>)}
          </div>
          <button className="button" onClick={reload}><RefreshCw size={16} />Refresh</button>
        </div>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading ? (
        <>
          <section className="analyticsFilters">
            <div className="filterSearch">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topic or angle..." />
            </div>
            <select className="cleanSelect" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="shoot_now">Shoot now</option>
              <option value="research_more">Research more</option>
              <option value="watch">Watch</option>
              <option value="avoid">Avoid</option>
            </select>
            <select className="cleanSelect" value={confidence} onChange={(event) => setConfidence(event.target.value)}>
              <option value="all">All confidence</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="cleanSelect" value={format} onChange={(event) => setFormat(event.target.value)}>
              <option value="all">All formats</option>
              <option value="shorts">Shorts</option>
              <option value="long_video">Long video</option>
              <option value="tutorial">Tutorial</option>
              <option value="comparison">Comparison</option>
              <option value="reaction">Reaction</option>
              <option value="experiment">Experiment</option>
            </select>
            <select className="cleanSelect" value={minScore} onChange={(event) => setMinScore(Number(event.target.value))}>
              <option value={0}>Any score</option>
              <option value={60}>60+</option>
              <option value={75}>75+</option>
              <option value={85}>85+</option>
            </select>
          </section>
          <FilterSummaryBar count={filtered.length} total={opportunities.length} label={`Showing ${filtered.length} opportunities from last ${days} days.`} onReset={resetFilters} />
          <section className="contentOpportunityGrid">
            {filtered.map((item) => <OpportunityCard key={item.id || item.topic_key || item.title} opportunity={item} />)}
            {!filtered.length ? <EmptyState title="No opportunities found" text="Try lowering minimum score, removing format/confidence filters, or expanding the date range." action={<button className="button" onClick={resetFilters}>Reset filters</button>} /> : null}
          </section>
        </>
      ) : null}
    </Shell>
  );
}

function ContentBriefPage({ route }) {
  const params = new URLSearchParams(route.search);
  const requestedId = params.get('id') || '';
  const { data, error, loading, reload } = useOpportunities(90);
  const foundOpportunity = (data?.opportunities || []).find((item) => {
    const keys = [item.id, item.topic_key, item.title, item.topic].map((value) => String(value || ''));
    return keys.includes(requestedId);
  });
  const opportunity = requestedId ? foundOpportunity : (foundOpportunity || data?.opportunities?.[0]);

  return (
    <Shell active="opportunities" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="analyticsHeader">
        <div>
          <Link href="/opportunities" className="backLink">← Opportunity Board</Link>
          <h1>Content Brief</h1>
          <p>Production-ready plan for a specific idea: why, format, hook, titles, hashtags, shots, risks and next action.</p>
        </div>
        <button className="button" onClick={reload}><RefreshCw size={16} />Refresh</button>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading && opportunity ? <ContentBriefPanel opportunity={opportunity} /> : null}
      {!loading && !opportunity ? <EmptyState title="Content brief not found" text="Open a brief from Opportunity Board or rerun the decision engine." /> : null}
    </Shell>
  );
}

function ContentBriefPanel({ opportunity }) {
  const showToast = useContext(ToastContext);
  const groups = opportunity.hashtagGroups || {};

  function copyBrief() {
    const title = opportunity.suggestedTitles?.[0] || opportunity.title || '';
    const angle = opportunity.suggestedAction || '';
    const hook = opportunity.suggestedHook || '';
    const text = [title, angle, hook].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(text).then(
      () => showToast('Brief copied to clipboard'),
      () => showToast('Could not access clipboard', 'red'),
    );
  }
  return (
    <section className="briefLayout">
      <section className="panel briefMain">
        <div className="briefHeader">
          <div>
            <Pill tone={actionTone(opportunity.recommendedAction)}>{opportunity.status}</Pill>
            <h2>{opportunity.suggestedTitles?.[0] || opportunity.title}</h2>
            <p>{opportunity.suggestedAction}</p>
          </div>
          <OpportunityScoreBadge opportunity={opportunity} />
        </div>
        <div className="briefMeta">
          <ConfidenceBadge confidence={opportunity.confidence} />
          <TrendStatusBadge status={opportunity.trendStatus} />
          <FormatRecommendationBadge format={opportunity.recommendedFormat} />
          <Pill tone="orange">{opportunity.difficulty} difficulty</Pill>
        </div>
        <OpportunityScoreBreakdown opportunity={opportunity} />
        <RecommendationReason items={opportunity.whyRecommended} />
        <TrendEvidenceList items={opportunity.evidence} videos={opportunity.sourceVideos} />
        <RiskList items={opportunity.risks} />
      </section>
      <aside className="briefSide">
        <section className="panel">
          <h2>Suggested format</h2>
          <div className="ideaMetrics">
            <InfoTile label="Format" value={formatLabel(opportunity.recommendedFormat)} />
            <InfoTile label="Length" value={opportunity.recommendedFormat === 'shorts' ? '45-60 sec' : '6-12 min'} />
            <InfoTile label="Style" value={opportunity.recommendedFormat === 'shorts' ? 'screen demo + quick voiceover' : 'structured walkthrough'} />
          </div>
        </section>
        <section className="panel">
          <h2>Hook</h2>
          <p className="briefText">{opportunity.suggestedHook}</p>
        </section>
        <section className="panel">
          <h2>Suggested titles</h2>
          <ol className="briefList">{(opportunity.suggestedTitles || []).map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
        <section className="panel">
          <h2>Suggested hashtags</h2>
          <HashtagGroup title="Primary" rows={groups.primary || []} />
          <HashtagGroup title="Secondary" rows={groups.secondary || []} />
          <HashtagGroup title="Experimental" rows={groups.experimental || []} />
        </section>
        <section className="panel">
          <h2>Structure</h2>
          <ol className="briefList">{(opportunity.suggestedStructure || []).map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
        <section className="panel">
          <h2>Shot list</h2>
          <ul className="briefList">{(opportunity.shotList || []).map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="panel">
          <h2>Next action</h2>
          <SuggestedAction text={opportunity.suggestedAction} />
          <div className="rowActions briefActions">
            <button className="button ghost" onClick={copyBrief}>Copy Brief</button>
            <Link className="button ghost" href="/trends">View Trend Evidence</Link>
          </div>
        </section>
      </aside>
    </section>
  );
}

function HashtagGroup({ title, rows }) {
  return (
    <div className="hashtagGroup">
      <strong>{title}</strong>
      <div className="tagList">
        {rows.map((item) => <span key={item}>{item}</span>)}
        {!rows.length ? <span>Not enough tags</span> : null}
      </div>
    </div>
  );
}

const defaultIdeaText = '';

function LegacyIdeaLabPage({ route }) {
  const params = new URLSearchParams(route?.search || '');
  const [idea, setIdea] = useState(params.get('idea') || defaultIdeaText);
  const [days, setDays] = useState(90);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitIdea(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      setResult(await runIdeaLab({ idea, days }));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const score = result?.score || {};
  const brief = result?.brief || {};
  const evidence = result?.evidence || {};
  return (
    <Shell active="ideaLab" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone="blue">My Idea → Evidence → Brief</Pill>
          <h1>Idea Lab</h1>
          <p>Перевір власну ідею через локальні YouTube-сигнали і отримай production brief: hook, b-roll, музика, структура, ризики і перший крок.</p>
        </div>
      </header>

      <section className="ideaLabHero">
        <form className="ideaLabForm panel" onSubmit={submitIdea}>
          <label htmlFor="ideaText">Моя ідея</label>
          <textarea
            id="ideaText"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={5}
            placeholder="Describe your idea: what the video is about, who it's for, what the viewer will see or learn..."
          />
          <div className="ideaLabControls">
            <div className="periodPicker" aria-label="Evidence period">
              {[30, 90, 180].map((value) => (
                <button type="button" key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} днів</button>
              ))}
            </div>
            <button className="button" type="submit" disabled={loading || idea.trim().length < 8}>
              <Search size={16} />{loading ? 'Analyzing...' : 'Build Brief'}
            </button>
          </div>
          <p className="muted">Цей flow не витрачає YouTube quota: він працює поверх уже зібраних snapshots, opportunities і hashtag/video signals.</p>
        </form>
        <section className="panel">
          <div className="panelHeader">
            <h2>Decision answer</h2>
            <Pill tone={score.confidence === 'high' ? 'green' : score.confidence === 'low' ? 'red' : 'orange'}>{score.confidence || 'pending'} confidence</Pill>
          </div>
          {result ? (
            <div className="ideaDecision">
              <OpportunityScoreBadge opportunity={{ opportunityScore: score.finalScore, recommendedAction: score.priority === 'shoot_now' ? 'shoot_now' : 'research_more', status: brief.status || score.priority }} />
              <div>
                <h3>{brief.recommendedVideo}</h3>
                <p>{brief.angle}</p>
                <SuggestedAction text={brief.nextAction} />
              </div>
            </div>
          ) : (
            <EmptyState icon={<Lightbulb size={22} />} title="Idea brief is not generated yet" text="Enter a specific idea and click Build Brief. The best inputs include what you are building, what result viewers will see and what can go wrong." />
          )}
        </section>
      </section>

      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}

      {result ? (
        <>
          <section className="decisionGrid">
            <section className="panel">
              <div className="panelHeader"><h2>Idea Score</h2><Pill tone={score.priority === 'shoot_now' ? 'green' : 'orange'}>{score.priority}</Pill></div>
              <IdeaScoreBreakdown score={score} />
            </section>
            <section className="panel">
              <div className="panelHeader"><h2>Evidence Search</h2><Pill tone="blue">{result.dataHealth?.matchedSignals || 0} matches</Pill></div>
              <div className="insightList compact">
                {(evidence.patterns || []).map((item) => <Insight key={item} icon={<Zap size={17} />} tone="blue" text={item} />)}
                <Insight icon={<Gauge size={17} />} tone={score.confidence === 'low' ? 'orange' : 'green'} text={`Evidence source: ${result.dataHealth?.source}. Direct video signals: ${result.dataHealth?.directVideoSignals || 0}. Hashtags: ${result.dataHealth?.matchedHashtags || 0}.`} />
              </div>
            </section>
          </section>

          <IdeaProductionBrief brief={brief} />

          <section className="technicalGrid">
            <section className="panel">
              <div className="panelHeader"><h2>Related videos</h2><Pill tone="blue">{(evidence.videos || []).length}</Pill></div>
              <div className="videoSignalGrid">
                {(evidence.videos || []).slice(0, 4).map((item) => (
                  <VideoSignalCard
                    key={item.id || item.video_id || item.url || item.title}
                    item={{
                      ...item,
                      id: item.id || item.video_id || item.url || item.title,
                      channel: item.channel || item.channel_title,
                      viewsVelocity: item.viewsVelocity || item.views_per_day,
                      publishedAt: item.publishedAt || item.published_at,
                      format: item.format || item.format_guess,
                      whyItMatters: item.whyItMatters || `Matched idea terms with score ${item.matchScore}.`,
                    }}
                  />
                ))}
                {!(evidence.videos || []).length ? <EmptyState title="No related videos yet" text="Run niche discovery jobs for app dev, OCR, budgeting, AI tools or creator workflow to improve evidence." /> : null}
              </div>
            </section>
            <section className="panel">
              <div className="panelHeader"><h2>Hashtag evidence</h2><Pill tone="blue">{(evidence.hashtags || []).length}</Pill></div>
              <div className="tableScroll">
                <table className="decisionTable">
                  <thead><tr><th>Hashtag</th><th>Usage</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {(evidence.hashtags || []).slice(0, 10).map((row) => (
                      <tr key={row.hashtag || row.tag || row.id}>
                        <td><strong>{row.hashtag || row.tag || row.id}</strong></td>
                        <td>{numberFmt.format(row.usageCount || row.video_count || row.videos || 0)}</td>
                        <td><TrendStatusBadge status={row.trendStatus || row.status} /></td>
                        <td>{row.action || 'watch'}</td>
                      </tr>
                    ))}
                    {!(evidence.hashtags || []).length ? <tr><td colSpan="4"><EmptyState title="No hashtag evidence" text="Use the generated primary/secondary hashtags, then collect fresh data for them." /></td></tr> : null}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </>
      ) : null}
    </Shell>
  );
}

function IdeaScoreBreakdown({ score }) {
  const values = score?.components || {};
  const rows = [
    ['Audience Demand', values.audienceDemand],
    ['Hook Strength', values.hookStrength],
    ['Visual Potential', values.visualPotential],
    ['Experiment Value', values.experimentValue],
    ['Payoff Strength', values.payoffStrength],
    ['Feasibility', values.productionFeasibility],
    ['Originality', values.originality],
    ['Usefulness', values.usefulness],
    ['Boring Risk', values.riskOfBoring],
    ['Failure Risk', values.riskOfFailure],
  ];
  return (
    <div className="scoreBreakdown">
      {rows.map(([label, value]) => (
        <div className="scoreBreakdownRow" key={label}>
          <span>{label}</span>
          <div><b style={{ width: `${Math.max(4, Math.min(100, Number(value || 0)))}%` }} /></div>
          <strong>{Math.round(Number(value || 0))}</strong>
        </div>
      ))}
    </div>
  );
}

function IdeaProductionBrief({ brief }) {
  const hashtagGroups = brief.hashtags || {};
  return (
    <section className="briefLayout">
      <section className="panel briefMain">
        <div className="briefHeader">
          <div>
            <Pill tone="green">{brief.format || 'Production brief'}</Pill>
            <h2>{brief.recommendedVideo}</h2>
            <p className="briefText">{brief.angle}</p>
          </div>
        </div>
        <div className="reasonList">
          <strong>Hooks to test</strong>
          <ul>{(brief.hooks || []).map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="reasonList">
          <strong>Video structure</strong>
          <ul>{(brief.structure || []).map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <SuggestedAction text={brief.nextAction} />
      </section>
      <aside className="briefSide">
        <section className="panel">
          <h2>B-roll plan</h2>
          <div className="brollList">
            {(brief.broll || []).map((item) => (
              <div className="brollItem" key={`${item.moment}-${item.shot}`}>
                <strong>{item.moment}</strong>
                <p>{item.shot}</p>
                <small>{item.how} Purpose: {item.purpose}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Music direction</h2>
          <div className="reasonList">
            <ul>
              <li>Long-form: {brief.music?.longform}</li>
              <li>Shorts: {brief.music?.shorts}</li>
              <li>Avoid: {brief.music?.avoid}</li>
            </ul>
          </div>
        </section>
        <section className="panel">
          <h2>Titles and hashtags</h2>
          <div className="reasonList">
            <strong>Titles</strong>
            <ul>{(brief.titles || []).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          {Object.entries(hashtagGroups).map(([key, rows]) => (
            <div className="hashtagGroup" key={key}>
              <strong>{key}</strong>
              <div className="tagList">{(rows || []).map((tag) => <span key={`${key}-${tag}`}>{tag}</span>)}</div>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Shots, Shorts and risks</h2>
          <div className="reasonList">
            <strong>Shot list</strong>
            <ul>{(brief.shotList || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="reasonList">
            <strong>Shorts candidates</strong>
            <ul>{(brief.shortsCandidates || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <RiskList items={brief.risks || []} />
        </section>
      </aside>
    </section>
  );
}

function IdeasPage() {
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const { data, error, loading, reload } = useSummary(days);
  const opportunities = data?.top_opportunities || [];
  const filteredIdeas = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = opportunities.filter((item) => {
      const text = `${item.title || ''} ${item.suggested_angle || ''} ${item.topic_key || ''}`.toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (formatFilter !== 'all' && !String(item.recommended_format || '').toLowerCase().includes(formatFilter)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sortBy === 'demand') return Number(b.total_views || 0) - Number(a.total_views || 0);
      if (sortBy === 'freshness') return Number(a.median_age_days || 999) - Number(b.median_age_days || 999);
      if (sortBy === 'competition') return Number(a.channels || 0) - Number(b.channels || 0);
      return Number(b.opportunity_score || 0) - Number(a.opportunity_score || 0);
    });
  }, [opportunities, query, formatFilter, sortBy]);
  const shootNow = opportunities.filter((item) => item.verdict === 'ЗНІМАТИ ЗАРАЗ');
  const avgScore = opportunities.length ? opportunities.reduce((sum, item) => sum + Number(item.opportunity_score || 0), 0) / opportunities.length : 0;
  const shortsCount = opportunities.filter((item) => String(item.recommended_format || '').toLowerCase().includes('short')).length;
  const topIdea = filteredIdeas[0] || opportunities[0];

  return (
    <Shell active="ideas" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone="green">Content planning</Pill>
          <h1>Trends / Ideas</h1>
          <p>Find video ideas with demand, competition, difficulty, freshness and a clear next action.</p>
        </div>
        <div className="analyticsHeaderActions">
          <div className="periodPicker" aria-label="Період ідей">
            {[7, 30, 90].map((value) => (
              <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} днів</button>
            ))}
          </div>
          <button className="button" onClick={reload}><RefreshCw size={16} />Оновити</button>
        </div>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading ? (
        <>
          <section className="analyticsKpiRow ideasKpiRow">
            <AnalyticsMetricCard title="Ideas found" value={numberFmt.format(opportunities.length)} tone="blue" explainer="Кількість тем, які decision engine вважає потенційними для відео." />
            <AnalyticsMetricCard title="Shoot now" value={numberFmt.format(shootNow.length)} tone="green" explainer="Теми з достатнім попитом, velocity і прийнятною конкуренцією." />
            <AnalyticsMetricCard title="Average score" value={avgScore.toFixed(1)} tone="orange" explainer="Opportunity score = попит + ріст + конкуренція + складність." />
            <AnalyticsMetricCard title="Shorts potential" value={numberFmt.format(shortsCount)} tone="purple" explainer="Скільки тем мають короткий формат як рекомендований або перспективний." />
          </section>

          <section className="decisionGrid">
            <NextActionPanel opportunity={topIdea} />
            <section className="panel whatChangedPanel">
              <h2>How to read this page</h2>
              <div className="insightList compact">
                <Insight icon={<Zap size={17} />} text="Demand показує загальний обсяг переглядів у кластері теми." tone="blue" />
                <Insight icon={<Gauge size={17} />} text="Competition рахується через кількість каналів у кластері: більше каналів = важче виділитись." tone="orange" />
                <Insight icon={<Activity size={17} />} text="Freshness показує, наскільки тема свіжа за віком відео в evidence." tone="green" />
              </div>
            </section>
          </section>

          <section className="analyticsFilters" aria-label="Фільтри ідей">
            <div className="filterSearch">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук теми або angle..." aria-label="Пошук теми" />
            </div>
            <div className="compactSegment" aria-label="Формат">
              {[
                ['all', 'All'],
                ['short', 'Shorts'],
                ['long', 'Long-form'],
              ].map(([value, label]) => (
                <button key={value} className={formatFilter === value ? 'active' : ''} onClick={() => setFormatFilter(value)}>{label}</button>
              ))}
            </div>
            <select className="cleanSelect" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Сортування ідей">
              <option value="score">Sort: score</option>
              <option value="demand">Sort: demand</option>
              <option value="competition">Sort: low competition</option>
              <option value="freshness">Sort: freshness</option>
            </select>
          </section>

          <section className="ideasGrid">
            {filteredIdeas.map((item) => <TopicIdeaCard key={item.topic_key || item.title} item={item} />)}
            {!filteredIdeas.length ? (
              <EmptyState title="No ideas found" text="Try removing filters, expanding the date range, or running the latest research jobs." />
            ) : null}
          </section>
        </>
      ) : null}
    </Shell>
  );
}

function TopicIdeaCard({ item }) {
  const showToast = useContext(ToastContext);
  const difficulty = ideaDifficulty(item);
  const freshness = ideaFreshness(item);
  const shortsPotential = String(item.recommended_format || '').toLowerCase().includes('short') || Number(item.median_age_days || 999) <= 3;
  return (
    <article className="ideaCard">
      <div className="ideaCardHeader">
        <div>
          <Pill tone={item.verdict === 'ЗНІМАТИ ЗАРАЗ' ? 'green' : item.verdict === 'ТЕСТУВАТИ' ? 'orange' : 'neutral'}>{item.verdict || 'Idea'}</Pill>
          <h2>{item.title}</h2>
        </div>
        <div className="ideaScore">
          <strong>{item.opportunity_score || 0}</strong>
          <span>score</span>
        </div>
      </div>
      <p>{item.suggested_angle}</p>
      <div className="ideaMetrics">
        <InfoTile label="Demand" value={compactNumber(item.total_views || 0)} />
        <InfoTile label="Competition" value={`${numberFmt.format(item.channels || 0)} ch.`} />
        <InfoTile label="Difficulty" value={difficulty} />
        <InfoTile label="Freshness" value={freshness} />
        <InfoTile label="Format" value={item.recommended_format || '-'} />
        <InfoTile label="Shorts" value={shortsPotential ? 'High' : 'Test'} />
      </div>
      <div className="ideaEvidence">
        <strong>Why recommended</strong>
        <ul>
          {(item.reasons || []).slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
          {!item.reasons?.length ? <li>Decision engine знайшов достатній signal у collected YouTube data.</li> : null}
        </ul>
      </div>
      <div className="rowActions">
        <Link className="button" href="/llm">LLM аналіз</Link>
      </div>
    </article>
  );
}

function ideaDifficulty(item) {
  const channels = Number(item.channels || 0);
  if (channels >= 10) return 'High';
  if (channels >= 5) return 'Medium';
  return 'Low';
}

function ideaFreshness(item) {
  const age = Number(item.median_age_days || 0);
  if (!age) return 'Unknown';
  if (age <= 2) return 'Very fresh';
  if (age <= 7) return 'Fresh';
  return `${Math.round(age)}d old`;
}

function DataHealthPage() {
  const { data, error, loading, reload } = useDataHealth();
  const health = data || {};
  const quotaSummary = health.quota?.summary || {};
  const total = quotaSummary.total || {};
  const quotaPct = quotaSummary.daily_limit ? Math.round((Number(total.quota_cost || 0) / Number(quotaSummary.daily_limit || 1)) * 1000) / 10 : 0;
  const observedCoveragePct = Math.round(Number(health.observedVelocityCoverage || 0) * 1000) / 10;
  const snapshotBuckets = health.snapshotBuckets || {};
  const quotaGuardEvents = health.quotaGuardEvents || [];
  const schedulerHealth = health.schedulerHealth || {};
  const rssHealth = health.rssMonitorHealth || {};
  return (
    <Shell active="dataHealth" quota={{ quota_used: health.apiQuotaUsed || 0, quota_limit: quotaSummary.daily_limit || 10000, quota_pct: quotaPct }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone={health.failedApiCalls ? 'orange' : 'green'}>Recommendation trust</Pill>
          <h1>Data Health</h1>
          <p>Shows whether recommendations can be trusted: freshness, coverage, failed calls, quota and confidence rules.</p>
        </div>
        <button className="button" onClick={reload}><RefreshCw size={16} />Refresh</button>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading ? (
        <>
          <section className="analyticsKpiRow technicalKpiRow">
            <AnalyticsMetricCard title="Last updated" value={health.lastUpdated || '-'} tone="blue" explainer="When the latest deterministic decision snapshot was generated." />
            <AnalyticsMetricCard title="Videos analyzed" value={numberFmt.format(health.videosAnalyzed || 0)} tone="green" explainer="Signals used by the recommendation engine." />
            <AnalyticsMetricCard title="Hashtags found" value={numberFmt.format(health.hashtagsFound || 0)} tone="purple" explainer="Tracked hashtags available for trend and content evidence." />
            <AnalyticsMetricCard title="Observed velocity" value={`${observedCoveragePct}%`} tone={observedCoveragePct >= 35 ? 'green' : observedCoveragePct >= 15 ? 'orange' : 'red'} explainer="Share of tracked videos whose velocity comes from repeated snapshots instead of age-based estimates." />
            <AnalyticsMetricCard title="Failed API calls" value={numberFmt.format(health.failedApiCalls || 0)} tone={health.failedApiCalls ? 'red' : 'green'} explainer="Failed YouTube API requests in the current quota report." />
          </section>
          <section className="decisionGrid">
            <section className="panel">
              <h2>Data coverage</h2>
              <DataHealthSummary health={health} />
              <div className="ideaMetrics">
                <InfoTile label="Topics classified" value={numberFmt.format(health.topicsClassified || 0)} />
                <InfoTile label="Sources processed" value={numberFmt.format(health.sourcesProcessed || 0)} />
                <InfoTile label="Incomplete data" value={numberFmt.format(health.incompleteData || 0)} />
                <InfoTile label="Freshness" value={health.dataFreshness || 'unknown'} />
                <InfoTile label="Tracked videos" value={numberFmt.format(health.trackedVideos || 0)} />
              </div>
            </section>
            <section className="panel">
              <h2>Confidence explanation</h2>
              <div className="confidenceRules">
                {Object.entries(health.confidenceExplanation || {}).map(([key, value]) => (
                  <div key={key}>
                    <ConfidenceBadge confidence={key} />
                    <p>{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
          <section className="technicalGrid">
            <section className="panel">
              <div className="panelHeader">
                <h2>Scheduler heartbeat</h2>
                <Pill tone={schedulerHealth.status === 'healthy' ? 'green' : schedulerHealth.status === 'unknown' ? 'orange' : 'red'}>{schedulerHealth.status || 'unknown'}</Pill>
              </div>
              <div className="ideaMetrics">
                <InfoTile label="Last tick" value={schedulerHealth.last_tick_finished_at || '-'} />
                <InfoTile label="Age" value={schedulerHealth.age_minutes == null ? '-' : `${schedulerHealth.age_minutes}m`} />
                <InfoTile label="Launcher" value={schedulerHealth.launcher || '-'} />
                <InfoTile label="Recovery" value={schedulerHealth.recovery_pending ? 'pending' : (schedulerHealth.last_recovery_status || 'idle')} />
              </div>
            </section>
            <section className="panel">
              <div className="panelHeader">
                <h2>Competitor RSS</h2>
                <Pill tone={rssHealth.status === 'healthy' ? 'green' : rssHealth.status === 'unknown' ? 'orange' : 'red'}>{rssHealth.status || 'unknown'}</Pill>
              </div>
              <div className="ideaMetrics">
                <InfoTile label="Checked feeds" value={numberFmt.format(rssHealth.channels || 0)} />
                <InfoTile label="Successful" value={numberFmt.format(rssHealth.successful || 0)} />
                <InfoTile label="Failed" value={numberFmt.format(rssHealth.failed || 0)} />
                <InfoTile label="Error rate" value={rssHealth.error_rate == null ? '-' : `${Math.round(Number(rssHealth.error_rate) * 1000) / 10}%`} />
              </div>
            </section>
            <section className="panel">
              <div className="panelHeader">
                <h2>Observed velocity coverage</h2>
                <Pill tone={observedCoveragePct >= 35 ? 'green' : observedCoveragePct >= 15 ? 'orange' : 'red'}>{observedCoveragePct}% observed</Pill>
              </div>
              <p className="muted">Repeated snapshots make velocity real. Single-snapshot videos are still useful, but recommendations using them are downgraded until more measurements arrive.</p>
              <div className="ideaMetrics">
                <InfoTile label="1 snapshot" value={numberFmt.format(snapshotBuckets.one || 0)} />
                <InfoTile label="2 snapshots" value={numberFmt.format(snapshotBuckets.two || 0)} />
                <InfoTile label="3+ snapshots" value={numberFmt.format(snapshotBuckets.threePlus || 0)} />
                <InfoTile label="Last snapshot" value={health.lastSnapshotAt || '-'} />
                <InfoTile label="Last pulse" value={health.lastPulseAt || '-'} />
              </div>
              {health.snapshotHealthError ? <div className="alert">{health.snapshotHealthError}</div> : null}
            </section>
            <section className="panel">
              <div className="panelHeader">
                <h2>Quota guard skips</h2>
                <Pill tone={quotaGuardEvents.length ? 'orange' : 'green'}>{numberFmt.format(quotaGuardEvents.length)} recent</Pill>
              </div>
              <div className="insightList compact">
                {quotaGuardEvents.slice(0, 6).map((event) => (
                  <Insight
                    key={`${event.name}-${event.scheduled_at}`}
                    icon={<AlertTriangle size={17} />}
                    tone="orange"
                    text={`${event.name}: ${event.reason || 'Skipped to protect quota.'}`}
                  />
                ))}
                {!quotaGuardEvents.length ? <Insight icon={<Activity size={17} />} tone="green" text="No recent jobs were skipped by quota guard." /> : null}
              </div>
            </section>
          </section>
          <section className="technicalGrid">
            <section className="panel">
              <div className="panelHeader"><h2>Quota state</h2><Pill tone={quotaPct > 85 ? 'red' : quotaPct > 65 ? 'orange' : 'green'}>{quotaPct}% used</Pill></div>
              <QuotaReadable quota={quotaSummary} />
            </section>
            <section className="panel">
              <h2>Warnings and incomplete data</h2>
              <div className="insightList compact">
                {(health.warnings || []).map((warning) => <Insight key={warning} icon={<AlertTriangle size={17} />} tone="orange" text={warning} />)}
                {!health.warnings?.length ? <Insight icon={<Activity size={17} />} tone="green" text="No decision warnings in the latest snapshot." /> : null}
                {!health.hashtagAnalyticsAvailable ? <Insight icon={<Hash size={17} />} tone="orange" text={health.hashtagAnalyticsError || 'Hashtag analytics source is unavailable.'} /> : null}
              </div>
            </section>
          </section>
        </>
      ) : null}
    </Shell>
  );
}

function TechnicalPage() {
  const { data, error, loading, reload } = useQuota();
  const quota = data?.summary || {};
  const total = quota.total || {};
  const limit = quota.daily_limit || 10000;
  const used = Number(total.quota_cost || 0);
  const remaining = Math.max(0, limit - used);
  const pct = limit ? Math.round((used / limit) * 1000) / 10 : 0;
  const byJob = quota.by_job || [];
  const byEndpoint = quota.by_endpoint || [];
  const expensiveJob = byJob[0];
  const expensiveEndpoint = byEndpoint[0];
  const scheduledTotal = (quota.scheduled || []).reduce((sum, item) => sum + Number(item.quota_estimate || 0), 0);

  return (
    <Shell active="dataHealth" quota={{ quota_used: used, quota_limit: limit, quota_pct: pct }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone={pct > 85 ? 'red' : pct > 65 ? 'orange' : 'green'}>{pct}% used</Pill>
          <h1>Technical / API Usage</h1>
          <p>Control YouTube API quota, expensive calls, warnings and quota-saving recommendations.</p>
        </div>
        <button className="button" onClick={reload}><RefreshCw size={16} />Оновити</button>
      </header>
      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading ? (
        <>
          <section className="analyticsKpiRow technicalKpiRow">
            <AnalyticsMetricCard title="Daily limit" value={numberFmt.format(limit)} tone="blue" explainer="Денний ліміт YouTube Data API для поточного quota day." />
            <AnalyticsMetricCard title="Used quota" value={numberFmt.format(used)} change={pct} tone={pct > 85 ? 'red' : 'orange'} explainer="Скільки quota units вже використано сьогодні." />
            <AnalyticsMetricCard title="Remaining" value={numberFmt.format(remaining)} tone="green" explainer="Скільки quota units залишилось до reset." />
            <AnalyticsMetricCard title="Scheduled estimate" value={numberFmt.format(scheduledTotal)} tone="neutral" explainer="Сумарна оцінка quota для jobs, запланованих сьогодні." />
          </section>

          <section className="decisionGrid">
            <section className="panel whatChangedPanel">
              <h2>Quota recommendations</h2>
              <div className="insightList compact">
                <Insight icon={<Gauge size={17} />} tone={pct > 85 ? 'red' : 'green'} text={pct > 85 ? 'Quota майже вичерпана: зупини manual search jobs до reset.' : 'Quota у нормі: можна запускати jobs за розкладом.'} />
                <Insight icon={<Zap size={17} />} tone="orange" text={expensiveEndpoint ? `Найдорожчий endpoint: ${expensiveEndpoint.endpoint || expensiveEndpoint.key || '-'} (${numberFmt.format(expensiveEndpoint.quota_cost || 0)} units).` : 'Немає дорогих endpoint за сьогодні.'} />
                <Insight icon={<ClipboardList size={17} />} tone="blue" text={expensiveJob ? `Найдорожчий job: ${expensiveJob.job_name || '-'} (${numberFmt.format(expensiveJob.quota_cost || 0)} units).` : 'Немає quota events по jobs за сьогодні.'} />
              </div>
            </section>
            <QuotaReadable quota={quota} />
          </section>

          <section className="technicalGrid">
            <section className="panel">
              <div className="panelHeader"><h2>Expensive jobs</h2><Pill tone="blue">{byJob.length}</Pill></div>
              <QuotaCostTable rows={byJob} nameKey="job_name" />
            </section>
            <section className="panel">
              <div className="panelHeader"><h2>Expensive API calls</h2><Pill tone="blue">{byEndpoint.length}</Pill></div>
              <QuotaCostTable rows={byEndpoint} nameKey="endpoint" />
            </section>
          </section>

          <MarkdownPanel id="quota-report" title="Readable quota report" text={data?.report || 'Немає quota report.'} compact />
        </>
      ) : null}
    </Shell>
  );
}

function QuotaCostTable({ rows, nameKey }) {
  return (
    <div className="tableScroll">
      <table className="decisionTable">
        <thead><tr><th>Name</th><th>Quota</th><th>Requests</th><th>Errors</th><th>Retries</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[nameKey]}>
              <td className="truncate">{row[nameKey]}</td>
              <td>{numberFmt.format(row.quota_cost || 0)}</td>
              <td>{numberFmt.format(row.requests || 0)}</td>
              <td>{numberFmt.format(row.errors || 0)}</td>
              <td>{numberFmt.format(row.retries || row.retry_attempts || 0)}</td>
            </tr>
          ))}
          {!rows.length ? <tr><td colSpan="5"><EmptyState title="No quota events today" text="Run research jobs first, or check another quota day in generated reports." /></td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function LegacySummaryPage() {
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewsFilter, setViewsFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('momentum_score');
  const [sortDir, setSortDir] = useState('desc');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { data, error, loading, reload } = useSummary(days);
  const opportunities = data?.top_opportunities || [];
  const analytics = data?.analytics || {};
  const hashtagAnalytics = data?.hashtag_analytics || {};
  const dbHashtags = hashtagAnalytics.hashtags || [];
  const hashtagRows = dbHashtags.map((item) => ({
    ...item,
    tag: item.tag || item.hashtag,
    avg_views_per_day: Number(item.avg_views_per_day || 0),
    views_per_day: Number(item.views_per_day || 0),
    avg_engagement_rate: Number(item.avg_engagement_rate || 0),
    momentum: Number(item.momentum || (Number(item.momentum_score || 50) / 50)),
    effective_change: item.change_30d ?? item.change_7d ?? null,
  }));
  const rising = hashtagRows.filter((item) => Number(item.effective_change || 0) > 0).sort((a, b) => Number(b.effective_change || 0) - Number(a.effective_change || 0));
  const cooling = hashtagRows.filter((item) => Number(item.effective_change || 0) < 0).sort((a, b) => Number(a.effective_change || 0) - Number(b.effective_change || 0));
  const categories = analytics.category_mix || [];
  const formats = analytics.format_mix || [];
  const categoryOptions = useMemo(() => {
    const map = new Map();
    hashtagRows.forEach((item) => {
      const key = item.category_id || item.category || 'unknown';
      map.set(key, item.category || key);
    });
    categories.slice(0, 8).forEach((item) => map.set(item.key, item.label));
    return Array.from(map, ([key, label]) => ({ key, label })).slice(0, 14);
  }, [hashtagRows, categories]);
  const filteredHashtagRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = hashtagRows.filter((item) => {
      const haystack = `${item.hashtag || item.tag || ''} ${item.category || ''} ${(item.examples || []).join(' ')}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (typeFilter !== 'all') {
        const format = String(item.format || '').toLowerCase();
        if (typeFilter === 'shorts' && !format.includes('short')) return false;
        if (typeFilter === 'longform' && !format.includes('long')) return false;
        if (typeFilter === 'live' && !format.includes('live')) return false;
      }
      if (categoryFilter !== 'all' && item.category_id !== categoryFilter && item.category !== categoryFilter) return false;
      if (viewsFilter !== 'all' && Number(item.views || 0) < Number(viewsFilter)) return false;
      if (statusFilter === 'growing' && Number(item.effective_change || 0) <= 0) return false;
      if (statusFilter === 'declining' && Number(item.effective_change || 0) >= 0) return false;
      if (statusFilter === 'stable' && !(item.effective_change === null || Math.abs(Number(item.effective_change || 0)) < 5)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      const av = sortValue(a, sortBy);
      const bv = sortValue(b, sortBy);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [hashtagRows, query, typeFilter, categoryFilter, viewsFilter, statusFilter, sortBy, sortDir]);
  const primaryOpportunity = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return opportunities.find((item) => {
      const text = `${item.title || ''} ${item.topic_key || ''} ${item.suggested_angle || ''}`.toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (typeFilter !== 'all') {
        const format = String(item.recommended_format || '').toLowerCase();
        if (typeFilter === 'shorts' && !format.includes('short')) return false;
        if (typeFilter === 'longform' && !format.includes('long')) return false;
      }
      if (categoryFilter !== 'all' && !Object.keys(item.categories || {}).includes(categoryFilter)) return false;
      if (viewsFilter !== 'all' && Number(item.total_views || 0) < Number(viewsFilter)) return false;
      return true;
    }) || opportunities[0];
  }, [opportunities, query, typeFilter, categoryFilter, viewsFilter]);
  const totalViews = hashtagAnalytics.summary?.total_views ?? hashtagRows.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const avgViews = hashtagRows.length ? totalViews / hashtagRows.length : 0;
  const avgEngagement = hashtagRows.length ? hashtagRows.reduce((sum, item) => sum + Number(item.avg_engagement_rate || 0), 0) / hashtagRows.length : 0;
  const bestFormat = hashtagAnalytics.summary?.top_format || analytics.best_format || formats[0]?.label || '-';
  const bestGrowing = rising[0];
  const bestDeclining = cooling[0];
  const strongestTopic = primaryOpportunity?.title || analytics.best_topic || '-';
  const activeFilters = [query, typeFilter !== 'all', categoryFilter !== 'all', viewsFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length;

  function resetFilters() {
    setQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setViewsFilter('all');
    setStatusFilter('all');
    setDays(30);
  }

  function changeSort(nextSort) {
    if (sortBy === nextSort) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
      return;
    }
    setSortBy(nextSort);
    setSortDir('desc');
  }

  return (
    <Shell active="analytics" quota={{ quota_used: 0, quota_limit: 10000, quota_pct: 0 }}>
      <header className="analyticsHeader">
        <div>
          <Pill tone={hashtagAnalytics.available ? 'green' : 'red'}>{hashtagAnalytics.available ? 'PostgreSQL live data' : 'DB unavailable'}</Pill>
          <h1>Summary / Analytics</h1>
          <p>Analyze hashtags, topics, video types and performance trends. Головна ціль: швидко зрозуміти, що знімати далі.</p>
        </div>
        <div className="analyticsHeaderActions">
          <div className="periodPicker" aria-label="Період аналізу">
            {[7, 30, 90].map((value) => (
              <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} днів</button>
            ))}
          </div>
          <a className="button ghost" href="/file?path=data/research/decisions/latest/opportunities.csv" target="_blank" rel="noreferrer">Експорт</a>
          <button className="button" onClick={reload}><RefreshCw size={16} />Оновити</button>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}
      {loading ? <AnalyticsSkeleton /> : null}
      {!loading && !hashtagAnalytics.available ? (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="PostgreSQL недоступний"
          text={hashtagAnalytics.error || 'Перевір DATABASE_URL, docker-compose або чи запущена база. Без DB сторінка не показує real hashtag analytics.'}
          action={<button className="button" onClick={reload}><RefreshCw size={16} />Спробувати ще раз</button>}
        />
      ) : null}

      {!loading ? (
        <>
      <section className="analyticsKpiRow">
        <AnalyticsMetricCard title="Total views" value={compactNumber(totalViews)} change={bestGrowing?.effective_change} tone="blue" explainer="Сума переглядів відео, де знайдено хештеги у вибраному періоді." />
        <AnalyticsMetricCard title="Average views" value={compactNumber(avgViews)} change={bestGrowing?.change_7d} tone="neutral" explainer="Середні перегляди на хештег. Допомагає відокремити широкі теми від вузьких." />
        <AnalyticsMetricCard title="Engagement rate" value={`${(avgEngagement * 100).toFixed(2)}%`} tone="green" explainer="Відношення лайків/коментарів до переглядів. Високе значення означає активнішу аудиторію." />
        <AnalyticsMetricCard title="Top growing hashtag" value={bestGrowing?.tag || '-'} change={bestGrowing?.effective_change} tone="green" explainer="Хештег з найкращим доступним growth cohort: 30д, або 7д якщо 30д baseline ще немає." />
        <AnalyticsMetricCard title="Declining hashtags" value={numberFmt.format(cooling.length)} change={cooling[0]?.effective_change} tone="red" explainer="Кількість тегів, де свіжі відео набирають слабше за старші cohort." />
        <AnalyticsMetricCard title="Best video type" value={bestFormat} tone="orange" explainer="Тип контенту, який зараз найчастіше домінує у сильних сигналах." />
      </section>

      <section className="decisionGrid">
        <WhatChangedPanel
          growing={bestGrowing}
          declining={bestDeclining}
          format={bestFormat}
          topic={strongestTopic}
          count={hashtagRows.length}
        />
        <NextActionPanel opportunity={primaryOpportunity} />
      </section>

      <section className="analyticsFilters" aria-label="Фільтри аналітики">
        <div className="filterSearch">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук хештега або теми..." aria-label="Пошук хештега або теми" />
        </div>
        <div className="compactSegment" aria-label="Тип відео">
          {[
            ['all', 'Усі'],
            ['shorts', 'Shorts'],
            ['longform', 'Long-form'],
            ['live', 'Live'],
          ].map(([value, label]) => (
            <button key={value} className={typeFilter === value ? 'active' : ''} onClick={() => setTypeFilter(value)}>{label}</button>
          ))}
        </div>
        <div className="compactSegment" aria-label="Стан тренду">
          {[
            ['all', 'All'],
            ['growing', 'Growing'],
            ['declining', 'Declining'],
            ['stable', 'Stable'],
          ].map(([value, label]) => (
            <button key={value} className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)}>{label}</button>
          ))}
        </div>
        <button className="button ghost" onClick={() => setAdvancedOpen(!advancedOpen)} aria-expanded={advancedOpen}>
          {advancedOpen ? 'Сховати фільтри' : 'Advanced filters'}
        </button>
        <button className="button ghost" disabled={!activeFilters} onClick={resetFilters}>Скинути</button>
        {advancedOpen ? (
          <div className="advancedFilters">
            <label>
              <span>Категорія</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">Усі категорії</option>
                {categoryOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Перегляди</span>
              <select value={viewsFilter} onChange={(event) => setViewsFilter(event.target.value)}>
                <option value="all">Усі</option>
                <option value="10000">10K+</option>
                <option value="100000">100K+</option>
                <option value="1000000">1M+</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>

      <section className="analyticsMainGrid">
        <section className="panel chartPanel">
          <div className="panelHeader">
            <div>
              <h2>Hashtag growth trend</h2>
              <p className="muted">Порівняння views/day для найсильніших хештегів. Velocity = швидкість набору переглядів після публікації.</p>
            </div>
          </div>
          <TrendLegend rows={hashtagRows.slice(0, 5)} />
          <SummaryTrendChart rows={hashtagRows.slice(0, 5)} days={days} />
        </section>
        <section className="panel comparisonPanel">
          <h2>Format & category performance</h2>
          <p className="muted">Не всі формати однаково корисні: дивись на velocity і обсяг, а не тільки на total views.</p>
          <ComparisonBars title="Video type performance" rows={formats.slice(0, 5)} valueKey="views_per_day" />
          <ComparisonBars title="Top categories" rows={categories.slice(0, 6)} valueKey="views_per_day" />
        </section>
      </section>

      <section className="analyticsTabsGrid">
        <HashtagDecisionTable
          rows={filteredHashtagRows}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={changeSort}
          totalRows={hashtagRows.length}
        />
        <TopicPerformancePanel opportunities={opportunities} />
      </section>
        </>
      ) : null}
    </Shell>
  );
}

function sortValue(row, key) {
  if (key === 'growth') return Number(row.effective_change ?? -999999);
  if (key === 'engagement') return Number(row.avg_engagement_rate || 0);
  if (key === 'views') return Number(row.views || 0);
  if (key === 'usage') return Number(row.video_count || 0);
  return Number(row[key] || 0);
}

function AnalyticsMetricCard({ title, value, change = null, tone = 'neutral', explainer }) {
  const hasChange = change !== null && change !== undefined && Number.isFinite(Number(change));
  const changeTone = !hasChange ? 'neutral' : Number(change) >= 0 ? 'positive' : 'negative';
  return (
    <section className={`analyticsMetricCard ${tone}`}>
      <div className="metricTitleRow">
        <span>{title}</span>
        <button className="metricHelp" title={explainer} aria-label={`Пояснення метрики ${title}`}>?</button>
      </div>
      <strong>{value}</strong>
      <small className={changeTone}>{hasChange ? `${Number(change) >= 0 ? '↑' : '↓'} ${Math.abs(Number(change)).toFixed(1)}%` : 'baseline pending'}</small>
      <p>{explainer}</p>
    </section>
  );
}

function WhatChangedPanel({ growing, declining, format, topic, count }) {
  const items = [
    { tone: 'green', icon: <TrendingUp size={17} />, text: growing ? `${growing.tag} росте найсильніше: ${percentValue(growing.effective_change)} за доступним cohort.` : 'Поки немає достатнього growth baseline. Накопич jobs за 7-30 днів.' },
    { tone: 'red', icon: <TrendingDown size={17} />, text: declining ? `${declining.tag} слабшає: ${percentValue(declining.effective_change)}. Не роби його головним тегом.` : 'Явних падаючих хештегів у поточному зрізі немає.' },
    { tone: 'blue', icon: <Play size={17} />, text: `${format || 'Формат'} зараз виглядає як найсильніший формат у collected signals.` },
    { tone: 'orange', icon: <Star size={17} />, text: `Найсильніша production-ідея: ${topic || 'потрібно більше даних'}.` },
  ];
  return (
    <section className="panel whatChangedPanel">
      <div>
        <h2>What changed?</h2>
        <p className="muted">Короткий executive summary по {numberFmt.format(count || 0)} хештегах. Це перше місце, куди дивитись перед плануванням відео.</p>
      </div>
      <div className="insightList compact">
        {items.map((item) => <Insight key={item.text} icon={item.icon} text={item.text} tone={item.tone} />)}
      </div>
    </section>
  );
}

function NextActionPanel({ opportunity }) {
  const showToast = useContext(ToastContext);
  return (
    <section className="panel nextActionPanel">
      <div>
        <h2>Recommended next action</h2>
        <p className="muted">Opportunity score = попит + ріст + конкуренція + складність теми.</p>
      </div>
      {opportunity ? (
        <article className="nextActionCard">
          <Pill tone={opportunity.verdict === 'ЗНІМАТИ ЗАРАЗ' ? 'green' : 'orange'}>{opportunity.verdict || 'ТЕСТУВАТИ'}</Pill>
          <strong>{opportunity.title}</strong>
          <p>{opportunity.suggested_angle}</p>
          <div className="actionMeta">
            <span>Score <b>{opportunity.opportunity_score}</b></span>
            <span>Demand <b>{compactNumber(opportunity.total_views || 0)}</b></span>
            <span>Format <b>{opportunity.recommended_format || '-'}</b></span>
          </div>
          <div className="rowActions">
            <Link className="button" href="/llm">Відкрити LLM аналіз</Link>
          </div>
        </article>
      ) : (
        <EmptyState title="Немає production recommendation" text="Запусти nightly analysis або розшир період, щоб decision engine мав достатньо сигналів." />
      )}
    </section>
  );
}

function AnalyticsSkeleton() {
  return (
    <section className="analyticsSkeleton" aria-label="Завантаження аналітики">
      {[1, 2, 3, 4].map((item) => <div key={item} className="skeletonBlock" />)}
    </section>
  );
}

function EmptyState({ icon = <FileText size={22} />, title = 'Немає даних', text, action }) {
  return (
    <section className="emptyState">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text || 'No data found. Try changing the date range or removing some filters.'}</p>
        {action ? <div className="emptyAction">{action}</div> : null}
      </div>
    </section>
  );
}

function ComparisonBars({ title, rows, valueKey }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <div className="comparisonBlock">
      <h3>{title}</h3>
      {rows.map((row) => {
        const value = Number(row[valueKey] || 0);
        return (
          <div className="comparisonRow" key={row.key || row.label}>
            <span>{row.label || row.key}</span>
            <div><b style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div>
            <strong>{compactNumber(value)}</strong>
          </div>
        );
      })}
      {!rows.length ? <p className="muted">Немає даних для порівняння.</p> : null}
    </div>
  );
}

function HashtagDecisionTable({ rows, sortBy, sortDir, onSort, totalRows }) {
  const visible = rows.slice(0, 40);
  const sortLabel = (key, label) => (
    <button className="sortButton" onClick={() => onSort(key)} aria-label={`Сортувати за ${label}`}>
      {label} {sortBy === key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </button>
  );
  return (
    <section className="panel dataDecisionPanel">
      <div className="panelHeader">
        <div>
          <h2>Hashtag performance</h2>
          <p className="muted">Decision table: знайди хештеги для тесту, моніторингу або виключення. Growth % може бути 7д, якщо 30д baseline ще не накопичений.</p>
        </div>
        <Pill tone="blue">{numberFmt.format(rows.length)} / {numberFmt.format(totalRows || 0)}</Pill>
      </div>
      <div className="tableScroll">
        <table className="decisionTable">
          <thead>
            <tr>
              <th>{sortLabel('momentum_score', 'Momentum')}</th>
              <th>Hashtag</th>
              <th>Category</th>
              <th>{sortLabel('usage', 'Usage')}</th>
              <th>{sortLabel('views', 'Views')}</th>
              <th>{sortLabel('engagement', 'Engagement')}</th>
              <th>{sortLabel('growth', 'Growth %')}</th>
              <th>Last seen</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.hashtag || row.tag}>
                <td><MomentumCell score={row.momentum_score} values={row.sparkline} falling={Number(row.effective_change || 0) < 0} /></td>
                <td>
                  <strong>{row.hashtag || row.tag}</strong>
                  <small className="muted truncateBlock">{row.examples?.[0] || 'Немає прикладу відео'}</small>
                </td>
                <td><CategoryPill label={row.category || 'unknown'} /></td>
                <td>{numberFmt.format(row.video_count || 0)} videos</td>
                <td>{compactNumber(row.views || 0)}</td>
                <td>{`${(Number(row.avg_engagement_rate || 0) * 100).toFixed(2)}%`}</td>
                <td><ChangeValue value={row.effective_change} /></td>
                <td>{formatShortDate(row.last_seen)}</td>
                <td className="recommendationCell">{row.recommendation || defaultRecommendation(row)}</td>
              </tr>
            ))}
            {!visible.length ? (
              <tr>
                <td colSpan="9">
                  <EmptyState
                    title="No hashtag data found"
                    text="Try changing the date range, removing filters, or running current ua_market_* and ua_uk_* jobs."
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopicPerformancePanel({ opportunities }) {
  const showToast = useContext(ToastContext);
  return (
    <section className="panel topicPerformancePanel">
      <div className="panelHeader">
        <div>
          <h2>Topic performance</h2>
          <p className="muted">Ideas для нових відео: score, demand, competition, difficulty, format.</p>
        </div>
        <Link className="button ghost" href="/llm/reports">LLM reports</Link>
      </div>
      <div className="topicCards">
        {opportunities.slice(0, 8).map((item) => {
          const difficulty = Number(item.channels || 0) > 8 ? 'High' : Number(item.channels || 0) > 4 ? 'Medium' : 'Low';
          return (
            <article className="topicCard" key={item.topic_key || item.title}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.suggested_angle}</p>
              </div>
              <div className="topicMeta">
                <span>Score <b>{item.opportunity_score}</b></span>
                <span>Demand <b>{compactNumber(item.total_views || 0)}</b></span>
                <span>Competition <b>{numberFmt.format(item.channels || 0)} ch.</b></span>
                <span>Difficulty <b>{difficulty}</b></span>
                <span>Format <b>{item.recommended_format || '-'}</b></span>
              </div>
              <div className="rowActions">
                <Link className="button ghost" href={`/brief?id=${encodeURIComponent(item.id || item.topic_key || item.title)}`}>Open Brief</Link>
              </div>
            </article>
          );
        })}
        {!opportunities.length ? <EmptyState title="Немає тем для аналізу" text="Запусти decision analysis після збору YouTube data, щоб отримати ranked topic ideas." /> : null}
      </div>
    </section>
  );
}

function defaultRecommendation(row) {
  const growth = Number(row.effective_change || 0);
  if (growth > 15 && row.competition?.level !== 'high') return 'Test now: використати як основний тег і зняти Shorts/огляд.';
  if (growth < -10) return 'Avoid as primary: тег слабшає, використай лише другорядно.';
  if (row.competition?.level === 'high') return 'Differentiate: потрібен унікальний angle через високу конкуренцію.';
  return 'Monitor: потрібні ще сигнали або ширший період.';
}

function formatShortDate(value) {
  const dt = parseDateSafe(value);
  if (!dt) return '-';
  return dt.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
}

function parseDateSafe(value) {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function SummaryKpiCard({ icon, label, value, hint, tone, series }) {
  return (
    <section className={`summaryKpiCard ${tone}`}>
      <div className={`metricIcon ${tone}`}>{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
      <Sparkline values={series} tone={tone} />
    </section>
  );
}

function HashtagAnalyticsPanel({ available, error, rows, page, setPage, query, setQuery }) {
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <section className="panel hashtagAnalyticsPanel" id="hashtag-analytics">
      <div className="hashtagPanelHeader">
        <div>
          <h2>Аналітика хештегів <span title="Дані з PostgreSQL: video_hashtags, videos, latest_video_snapshots">ⓘ</span></h2>
          <p className="muted">Реальні дані з DB: перегляди, формат, категорія, конкуренція та momentum.</p>
        </div>
        <div className="rowActions">
          <button className="button ghost"><Settings size={15} />Налаштувати колонки</button>
          <button className="iconButton" title="Додаткові дії">⋮</button>
        </div>
      </div>
      <div className="hashtagToolbar">
        <div className="filterBox wide">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук хештегів..." />
        </div>
        <Pill tone={available ? 'green' : 'red'}>{available ? 'PostgreSQL live' : 'DB недоступна'}</Pill>
      </div>
      {!available ? (
        <div className="warningBox">
          <AlertTriangle size={17} />
          <p>Аналітика хештегів не завантажилась з PostgreSQL: {error || 'немає відповіді від DB'}</p>
        </div>
      ) : null}
      <div className="hashtagTableWrap">
        <table className="hashtagAnalyticsTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Хештег</th>
              <th>Категорія</th>
              <th>Тип відео</th>
              <th>Перегляди</th>
              <th>Зміна 7д</th>
              <th>Зміна 30д</th>
              <th>Конкуренція</th>
              <th>Momentum</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.hashtag || row.tag}>
                <td>{(safePage - 1) * pageSize + index + 1}</td>
                <td><strong>{row.hashtag || row.tag}</strong></td>
                <td><CategoryPill label={row.category || 'unknown'} /></td>
                <td><VideoTypeBadge format={row.format} /></td>
                <td>{compactNumber(row.views || 0)}</td>
                <td><ChangeValue value={row.change_7d} /></td>
                <td><ChangeValue value={row.change_30d} /></td>
                <td><CompetitionBadge competition={row.competition} /></td>
                <td><MomentumCell score={row.momentum_score} values={row.sparkline} falling={Number(row.change_30d || 0) < 0} /></td>
              </tr>
            ))}
            {!visible.length ? (
              <tr><td colSpan="9" className="muted">Немає хештегів під поточні фільтри.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="hashtagPagination">
        <span>Показано {rows.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, rows.length)} з {numberFmt.format(rows.length)} хештегів</span>
        <div>
          <button className="iconButton" disabled={safePage <= 1} onClick={() => setPage(Math.max(1, safePage - 1))}>‹</button>
          {[1, 2, 3].filter((item) => item <= pages).map((item) => (
            <button key={item} className={`pageButton ${safePage === item ? 'active' : ''}`} onClick={() => setPage(item)}>{item}</button>
          ))}
          {pages > 4 ? <span className="muted">...</span> : null}
          {pages > 3 ? <button className={`pageButton ${safePage === pages ? 'active' : ''}`} onClick={() => setPage(pages)}>{pages}</button> : null}
          <button className="iconButton" disabled={safePage >= pages} onClick={() => setPage(Math.min(pages, safePage + 1))}>›</button>
        </div>
      </div>
    </section>
  );
}

function CategoryPill({ label }) {
  const key = String(label || 'unknown').toLowerCase();
  const tone = key.includes('tech') || key.includes('science') ? 'tech'
    : key.includes('entertain') || key.includes('розва') ? 'fun'
      : key.includes('news') || key.includes('нов') ? 'news'
        : key.includes('business') || key.includes('біз') ? 'business'
          : key.includes('education') || key.includes('осв') ? 'education'
            : 'neutral';
  return <span className={`categoryPill ${tone}`}>{label}</span>;
}

function VideoTypeBadge({ format }) {
  const text = String(format || 'unknown').toLowerCase();
  const isShort = text.includes('short');
  const isLive = text.includes('live');
  return (
    <span className={`videoTypeBadge ${isShort ? 'shorts' : isLive ? 'live' : 'longform'}`} title={format || 'unknown'}>
      <Play size={12} />
    </span>
  );
}

function ChangeValue({ value }) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return <span className="muted">—</span>;
  }
  const number = Number(value);
  return <span className={number >= 0 ? 'positiveChange' : 'negativeChange'}>{number >= 0 ? '↑' : '↓'} {Math.abs(number).toFixed(1)}%</span>;
}

function CompetitionBadge({ competition }) {
  const data = competition || {};
  return (
    <span className={`competitionBadge ${data.tone || 'orange'}`}>
      <i />{data.label || 'Середня'}
    </span>
  );
}

function MomentumCell({ score = 0, values = [], falling = false }) {
  const tone = Number(score || 0) >= 75 ? 'green' : Number(score || 0) >= 55 ? 'orange' : 'red';
  return (
    <div className="momentumCell">
      <span className={`momentumScore ${tone}`}>{Math.round(Number(score || 0))}</span>
      <Sparkline values={values} tone={falling ? 'red' : 'blue'} />
    </div>
  );
}

function Sparkline({ values = [], tone = 'blue' }) {
  const points = normalizePoints(values.length ? values : [8, 12, 11, 16, 14, 19, 18, 22], 122, 34);
  return (
    <svg className={`sparkline ${tone}`} viewBox="0 0 122 34" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizePoints(values, width, height) {
  const numbers = values.map((value) => Number(value || 0));
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const span = max - min || 1;
  return numbers.map((value, index) => {
    const x = numbers.length === 1 ? width / 2 : (index / (numbers.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function TrendLegend({ rows }) {
  const colors = ['blue', 'green', 'purple', 'orange', 'cyan'];
  return (
    <div className="trendLegend">
      {rows.map((row, index) => (
        <span key={row.tag || row.label}>
          <i className={colors[index % colors.length]} />{row.tag || row.label}
        </span>
      ))}
    </div>
  );
}

function SummaryTrendChart({ rows, days }) {
  const colors = ['#2f7df6', '#4fd078', '#9b6cff', '#f59e2e', '#3fb7d6'];
  const series = rows.map((row, rowIndex) => {
    if (Array.isArray(row.sparkline) && row.sparkline.length > 1) {
      return row.sparkline.map((value) => Number(value || 0));
    }
    const base = Number(row.avg_views_per_day || row.views_per_day || 1);
    const momentum = Math.max(.65, Math.min(2.4, Number(row.momentum || 1)));
    return Array.from({ length: 7 }, (_, index) => base * (0.72 + index * 0.045 * momentum + Math.sin(index + rowIndex) * 0.035));
  });
  const allValues = series.flat();
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1);
  const linePoints = (values) => values.map((value, index) => {
    const x = 44 + (index / Math.max(1, values.length - 1)) * 560;
    const y = 286 - ((value - min) / Math.max(1, max - min)) * 238;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const pointCount = Math.max(2, series[0]?.length || 7);
  const labels = Array.from({ length: pointCount }, (_, index) => `${Math.max(1, Math.round((days / pointCount) * (index + 1)))}д`);

  return (
    <svg className="summaryTrendChart" viewBox="0 0 640 330" role="img" aria-label="Динаміка трендів">
      {[0, 1, 2, 3, 4].map((tick) => {
        const y = 48 + tick * 59.5;
        return <line key={tick} x1="44" x2="604" y1={y} y2={y} />;
      })}
      {series.map((values, index) => (
        <g key={rows[index]?.tag || index}>
          <polyline points={linePoints(values)} fill="none" stroke={colors[index % colors.length]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((value, pointIndex) => {
            const [x, y] = linePoints(values).split(' ')[pointIndex].split(',');
            return <circle key={`${index}-${pointIndex}`} cx={x} cy={y} r="4" fill={colors[index % colors.length]} />;
          })}
        </g>
      ))}
      {[0, 1, 2, 3].map((tick) => {
        const value = max - ((max - min) / 3) * tick;
        return <text key={tick} x="0" y={54 + tick * 79}>{compactNumber(value)}</text>;
      })}
      {labels.map((label, index) => <text key={label} x={38 + index * (560 / Math.max(1, pointCount - 1))} y="318">{label}</text>)}
    </svg>
  );
}

function HashtagSideCard({ title, rows, mode }) {
  return (
    <section className="sideTrendCard">
      <div className="panelHeader">
        <h3>{title}</h3>
        <a href="#all">Переглянути всі</a>
      </div>
      <div className="sideTrendList">
        {rows.slice(0, 5).map((row) => {
          const value = Number(row.effective_change ?? ((Number(row.momentum || 1) - 1) * 100));
          return (
            <div key={row.tag} className={mode}>
              <span>{mode === 'rising' ? '▲' : '↘'} {row.tag}</span>
              <strong>{percentValue(value)}</strong>
            </div>
          );
        })}
        {!rows.length ? <p className="muted">Недостатньо даних.</p> : null}
      </div>
    </section>
  );
}

function QuickHashtagCard({ row }) {
  if (!row) return null;
  const momentum = Number(row.effective_change ?? ((Number(row.momentum || 1) - 1) * 100));
  return (
    <section className="sideTrendCard quickSearchCard">
      <h3>Швидкий пошук хештегу</h3>
      <div className="filterBox wide"><Search size={16} /><input value={row.tag || ''} readOnly /></div>
      <div className="quickStats">
        <div><span>Перегляди</span><strong>{compactNumber(row.views || 0)}</strong></div>
        <div><span>Зміна</span><strong className={momentum >= 0 ? 'greenText' : 'redText'}>{percentValue(momentum)}</strong></div>
        <div><span>Momentum</span><Sparkline values={row.sparkline || [1, row.momentum * 10, row.avg_views_per_day]} tone="blue" /></div>
      </div>
    </section>
  );
}

function DonutChart({ rows }) {
  const total = rows.reduce((sum, row) => sum + Number(row.views_per_day || 0), 0) || 1;
  const colors = ['#2f7df6', '#ef4444', '#62cf74', '#9b6cff'];
  let offset = 25;
  return (
    <div className="donutLayout">
      <svg className="donutChart" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="45" fill="none" stroke="#1a2a3c" strokeWidth="24" />
        {rows.slice(0, 4).map((row, index) => {
          const pct = (Number(row.views_per_day || 0) / total) * 100;
          const currentOffset = offset;
          offset -= pct;
          return <circle key={row.key || row.label} cx="70" cy="70" r="45" fill="none" stroke={colors[index]} strokeWidth="24" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={currentOffset} pathLength="100" />;
        })}
      </svg>
      <div className="donutLegend">
        {rows.slice(0, 4).map((row, index) => {
          const pct = (Number(row.views_per_day || 0) / total) * 100;
          return (
            <div key={row.key || row.label}>
              <i style={{ background: colors[index] }} />
              <strong>{Math.round(pct)}%</strong>
              <span>{row.label}</span>
              <small>{compactNumber(row.views_per_day)} переглядів/день</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBars({ rows }) {
  const max = Math.max(...rows.map((row) => Number(row.views_per_day || 0)), 1);
  return (
    <div className="categoryBars">
      {rows.map((row) => (
        <div key={row.key || row.label}>
          <span>{row.label}</span>
          <div><b style={{ width: `${Math.max(5, (Number(row.views_per_day || 0) / max) * 100)}%` }} /></div>
          <strong>{compactNumber(row.views_per_day)}</strong>
        </div>
      ))}
    </div>
  );
}

function Insight({ icon, text, tone }) {
  return (
    <div className={`insightItem ${tone}`}>
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function ShootCard({ item, index }) {
  const evidence = item.evidence?.[0] || {};
  return (
    <article className="shootCard">
      <div className="rankBadge">{index + 1}</div>
      <div>
        <div className="rowActions">
          <Pill tone={item.verdict === 'ЗНІМАТИ ЗАРАЗ' ? 'green' : 'orange'}>{item.verdict}</Pill>
          <Pill tone="blue">{item.recommended_format}</Pill>
          {item.languages ? <Pill tone="neutral">{Object.keys(item.languages)[0] || 'mixed'}</Pill> : null}
        </div>
        <strong>{item.title}</strong>
        <p>{item.suggested_angle}</p>
        <small className="muted">
          Evidence: {numberFmt.format(item.videos || 0)} videos · {numberFmt.format(item.channels || 0)} channels · {numberFmt.format(item.total_views || 0)} views
          {evidence.channel ? ` · ${evidence.channel}` : ''}
        </small>
      </div>
      <div className="scoreBox">
        <span>{item.opportunity_score}</span>
        <small>{numberFmt.format(Math.round(item.median_views_per_day || 0))}/day</small>
      </div>
    </article>
  );
}

function AvoidCard({ item }) {
  return (
    <article className="shootCard avoid">
      <div>
        <Pill tone="red">avoid {item.avoid_score}</Pill>
        <strong>{item.title}</strong>
        <p>{Array.isArray(item.risks) && item.risks.length ? item.risks.join('; ') : 'Низький пріоритет за поточними сигналами.'}</p>
      </div>
    </article>
  );
}

function BarList({ rows, valueKey, labelKey }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <div className="barList">
      {rows.slice(0, 10).map((row) => {
        const value = Number(row[valueKey] || 0);
        return (
          <div className="barRow" key={row.key || row[labelKey]}>
            <div>
              <strong>{row[labelKey]}</strong>
              <span>{numberFmt.format(row.videos || 0)} videos · {numberFmt.format(Math.round(row.views || 0))} views</span>
            </div>
            <div className="barTrack"><span style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div>
            <b>{numberFmt.format(Math.round(value))}</b>
          </div>
        );
      })}
      {!rows.length ? <p className="muted">Немає даних для цього періоду.</p> : null}
    </div>
  );
}

function HashtagTable({ rows, mode }) {
  return (
    <table className="compactAnalyticsTable">
      <thead><tr><th>Хештег</th><th>Recent</th><th>Older</th><th>{mode === 'rising' ? 'Momentum' : 'Drop'}</th></tr></thead>
      <tbody>
        {rows.slice(0, 10).map((row) => (
          <tr key={row.tag}>
            <td>
              <strong>{row.tag}</strong>
              <small className="muted truncateBlock">{row.examples?.[0] || ''}</small>
            </td>
            <td>{numberFmt.format(Math.round(row.recent_avg_vpd || 0))}/day</td>
            <td>{numberFmt.format(Math.round(row.older_avg_vpd || 0))}/day</td>
            <td><Pill tone={mode === 'rising' ? 'green' : 'orange'}>{mode === 'rising' ? `x${row.momentum}` : 'cooling'}</Pill></td>
          </tr>
        ))}
        {!rows.length ? <tr><td className="muted">Недостатньо даних.</td></tr> : null}
      </tbody>
    </table>
  );
}

function ChannelTable({ rows }) {
  return (
    <table className="compactAnalyticsTable">
      <tbody>
        {rows.slice(0, 10).map((row) => (
          <tr key={row.key}>
            <td>
              <strong>{row.label}</strong>
              <small className="muted truncateBlock">{numberFmt.format(row.videos || 0)} videos</small>
            </td>
            <td>{numberFmt.format(Math.round(row.avg_views_per_day || 0))}/day</td>
            <td>{numberFmt.format(Math.round(row.views || 0))}</td>
          </tr>
        ))}
        {!rows.length ? <tr><td className="muted">Немає даних.</td></tr> : null}
      </tbody>
    </table>
  );
}

function EvidenceCard({ item }) {
  if (!item?.title) return <p className="muted">Немає сильного single-video сигналу для цього періоду.</p>;
  return (
    <article className="evidenceCard">
      <strong>{item.title}</strong>
      <p>{item.channel}</p>
      <div className="quotaSummaryGrid">
        <InfoTile label="Views" value={numberFmt.format(item.views || 0)} />
        <InfoTile label="Views/day" value={numberFmt.format(Math.round(item.views_per_day || 0))} />
        <InfoTile label="Формат" value={item.format || '-'} />
        <InfoTile label="Мова" value={item.language || '-'} />
      </div>
    </article>
  );
}

function CompactHistory({ rows }) {
  return (
    <table>
      <tbody>
        {rows.slice(0, 12).map((item) => (
          <tr key={item.run_id}>
            <td>
              <strong>{item.updated_at}</strong>
              <small className="muted truncateBlock">{item.run_id}</small>
            </td>
            <td>{numberFmt.format(item.signals_analyzed || 0)} signals</td>
            <td>{item.has_llm ? <Pill tone="orange">LLM</Pill> : <Pill tone="green">Decision</Pill>}</td>
          </tr>
        ))}
        {!rows.length ? <tr><td className="muted">Історії ще немає. Наступні запуски будуть архівуватись автоматично.</td></tr> : null}
      </tbody>
    </table>
  );
}

function ArtifactTable({ artifacts }) {
  const rows = [
    ['Decision summary', artifacts.deterministic],
    ['LLM synthesis', artifacts.llm],
    ['LLM model report', artifacts.model_report],
    ['Training dataset', artifacts.training_dataset],
    ['Market brief', artifacts.market],
    ['Snapshot', artifacts.snapshot],
  ];
  return (
    <table>
      <tbody>
        {rows.map(([label, info]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>{info?.exists ? <Pill tone="green">Є</Pill> : <Pill tone="red">Немає</Pill>}</td>
            <td>{info?.updated_at || '-'}</td>
            <td>{info?.exists ? <a href={`/file?path=${encodeURIComponent(info.path)}`} target="_blank" rel="noreferrer">Файл</a> : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LlmTimeline({ events }) {
  const visible = events.slice(-16);
  if (!visible.length) return <p className="muted">Подій ще немає.</p>;
  return (
    <div className="timeline">
      {visible.map((event, idx) => (
        <div className={`timelineItem ${event.is_llm ? 'llm' : ''}`} key={`${event.kind}-${event.label}-${event.time}-${idx}`}>
          <div className="timelineDot" />
          <div>
            <strong>{event.label}</strong>
            <p>{event.time || '-'}</p>
            <StatusPill status={event.status} />
            {event.is_llm ? <Pill tone="orange">LLM</Pill> : <Pill tone="green">Decision</Pill>}
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const route = useRoute();
  const { data: quotaData } = useQuota();
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const showToast = useCallback((text, tone = 'green') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 4000);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);
  const quotaCtxValue = quotaData?.summary
    ? (() => {
        const used = quotaData.summary.total?.quota_cost || 0;
        const limit = quotaData.summary.daily_limit || 10000;
        return {
          quota_used: used,
          quota_limit: limit,
          quota_pct: Math.round((used / limit) * 1000) / 10,
        };
      })()
    : null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem('dashboard-theme', theme);
    } catch {
      // Ignore storage failures; the UI can still switch for this session.
    }
  }, [theme]);

  useEffect(() => {
    if (!route.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.requestAnimationFrame(() => {
      document.querySelector(route.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [route.path, route.hash]);

  let page;
  if (route.path === '/jobs') page = <Shell active="jobs"><DataSyncPage /></Shell>;
  else if (route.path === '/trends') page = <Shell active="trends"><TrendRadarPage /></Shell>;
  else if (route.path === '/idea-lab') page = <Shell active="ideaLab"><IdeaLabPage route={route} /></Shell>;
  else if (route.path === '/opportunities' || route.path === '/ideas') page = <Shell active="opportunities"><OpportunitiesPage /></Shell>;
  else if (route.path === '/brief') page = <Shell active="brief"><BriefPage route={route} /></Shell>;
  else if (route.path === '/analytics' || route.path === '/summary') page = <Shell active="analytics"><SummaryPage /></Shell>;
  else if (route.path === '/data-health') page = <DataHealthPage />;
  else if (route.path === '/technical') page = <TechnicalPage />;
  else if (route.path === '/reports') page = <ReportsPage route={route} />;
  else if (route.path === '/llm/reports') page = <LlmReportsPage />;
  else if (route.path === '/llm') page = <LlmPage />;
  else if (route.path === '/settings') page = <Shell active="settings"><SettingsPage /></Shell>;
  else if (route.path === '/competitors') page = <Shell active="competitors"><CompetitorsPage /></Shell>;
  else if (route.path === '/content-plan') page = <Shell active="contentPlan"><ContentPlanPage /></Shell>;
  else if (route.path === '/backlog') page = <Shell active="backlog"><BacklogPage /></Shell>;
  else if (route.path === '/') page = <Shell active="today"><TodayPage /></Shell>;
  else page = <DashboardPage />;

  return (
    <ToastContext.Provider value={showToast}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <QuotaContext.Provider value={quotaCtxValue}>
          <Suspense fallback={<div className="routeView" style={{ padding: 40, color: 'var(--muted)' }}>Завантаження…</div>}>
            {page}
          </Suspense>
          <ToastMessage toast={toast} />
        </QuotaContext.Provider>
      </ThemeContext.Provider>
    </ToastContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
