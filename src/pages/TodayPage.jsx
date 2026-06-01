import React, { useState, useContext, useMemo } from 'react';
import {
  RefreshCw, Play, Hash, MessageCircle, Tag, BarChart2, Layers,
  TrendingUp, TrendingDown, Minus, CheckCircle, Clock, Zap,
  Activity, FileText, ChevronRight, Eye, Users, Sparkles,
} from 'lucide-react';
import { api, usePolling, Link, ToastContext } from '../lib/shared.jsx';
import '../styles/today.css';

const PERIOD_LABELS = { today: 'Сьогодні', yesterday: 'Вчора', week: '7 днів', month: '30 днів' };

const CHART_TITLES = {
  today: 'Що змінилось протягом дня',
  yesterday: 'Що було вчора',
  week: 'Що змінилось за 7 днів',
  month: 'Що змінилось за 30 днів',
};

const CHART_NOTES = {
  today: 'Обсяг вхідних сигналів за годину (наростаючим підсумком)',
  yesterday: 'Обсяг вхідних сигналів за годину (наростаючим підсумком)',
  week: 'Обсяг вхідних сигналів за кожен день періоду',
  month: 'Обсяг вхідних сигналів за кожен день періоду',
};

function useTodayIntel(period) {
  return usePolling(
    () => api(`/api/today-intel?period=${encodeURIComponent(period)}`),
    [period],
    15000,
  );
}

// ── Day Chart (SVG) ─────────────────────────────────────────────────────────

function DayChart({ chartData = [], events = [], bucket = 'hour' }) {
  const W = 540;
  const H = 200;
  const PL = 42;
  const PR = 12;
  const PT = 12;
  const PB = 28;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const N = chartData.length;

  const maxVal = useMemo(() => {
    if (!N) return 10;
    return Math.max(...chartData.flatMap(d => [d.videos, d.comments, d.hashtags, d.keywords]), 10);
  }, [chartData, N]);

  const xScale = (i) => PL + (N <= 1 ? CW / 2 : (i / (N - 1)) * CW);
  const yScale = (v) => PT + CH - (v / maxVal) * CH;

  function linePath(key) {
    if (!N) return '';
    return chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d[key]).toFixed(1)}`).join(' ');
  }

  function areaPath(key) {
    if (!N) return '';
    const base = (PT + CH).toFixed(1);
    return `${linePath(key)} L${xScale(N - 1).toFixed(1)},${base} L${xScale(0).toFixed(1)},${base} Z`;
  }

  const xLabels = useMemo(() => {
    if (!N) return [];
    const step = Math.max(1, Math.floor(N / 6));
    return chartData.filter((_, i) => i % step === 0 || i === N - 1);
  }, [chartData, N]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal));

  const eventLines = useMemo(() => {
    return events.map(ev => {
      const evH = parseInt(ev.time.split(':')[0], 10);
      const idx = chartData.findIndex(d => parseInt(d.hour, 10) >= evH);
      if (idx < 0) return null;
      return { ...ev, x: xScale(idx) };
    }).filter(Boolean);
  }, [events, chartData, N]);

  const totalLine = useMemo(() => {
    if (!N) return '';
    return chartData.map((d, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.videos + d.comments + d.hashtags).toFixed(1)}`
    ).join(' ');
  }, [chartData, N, maxVal]);

  if (!N) {
    return (
      <div className="tiChartEmpty">
        <Clock size={24} />
        <p>{bucket === 'day' ? 'Дані за обраний період ще збираються' : 'Дані за обраний день ще збираються'}</p>
      </div>
    );
  }

  return (
    <div className="tiChartWrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="tiChartSvg" preserveAspectRatio="none">
        {/* Grid */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line x1={PL} y1={yScale(tick)} x2={PL + CW} y2={yScale(tick)} stroke="rgba(27,49,72,0.5)" strokeWidth="1" />
            <text x={PL - 5} y={yScale(tick) + 4} textAnchor="end" fontSize="9" fill="var(--muted)">
              {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
            </text>
          </g>
        ))}

        {/* Event markers */}
        {eventLines.map((ev, i) => (
          <line key={i} x1={ev.x} y1={PT} x2={ev.x} y2={PT + CH}
            stroke="rgba(142,163,184,0.35)" strokeWidth="1" strokeDasharray="3,3" />
        ))}

        {/* Areas */}
        <path d={areaPath('keywords')} fill="rgba(245,158,46,0.06)" />
        <path d={areaPath('hashtags')} fill="rgba(155,108,255,0.07)" />
        <path d={areaPath('comments')} fill="rgba(54,193,119,0.07)" />
        <path d={areaPath('videos')} fill="rgba(47,125,246,0.12)" />

        {/* Lines */}
        <path d={linePath('keywords')} fill="none" stroke="rgba(245,158,46,0.55)" strokeWidth="1.5" />
        <path d={linePath('hashtags')} fill="none" stroke="rgba(155,108,255,0.65)" strokeWidth="1.5" />
        <path d={linePath('comments')} fill="none" stroke="rgba(54,193,119,0.65)" strokeWidth="1.5" />
        <path d={linePath('videos')} fill="none" stroke="rgba(47,125,246,0.85)" strokeWidth="2" />
        <path d={totalLine} fill="none" stroke="rgba(238,246,255,0.3)" strokeWidth="1" strokeDasharray="4,2" />

        {/* X axis labels */}
        {xLabels.map((d, i) => {
          const idx = chartData.indexOf(d);
          return (
            <text key={i} x={xScale(idx)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--muted)">
              {d.hour}
            </text>
          );
        })}

        {/* Axes */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + CH} stroke="var(--line)" strokeWidth="1" />
        <line x1={PL} y1={PT + CH} x2={PL + CW} y2={PT + CH} stroke="var(--line)" strokeWidth="1" />
      </svg>

      <div className="tiChartLegend">
        <span className="tiChartLegendItem blue"><span />Відео</span>
        <span className="tiChartLegendItem green"><span />Коментарі</span>
        <span className="tiChartLegendItem purple"><span />Хештеги</span>
        <span className="tiChartLegendItem orange"><span />Ключові слова</span>
        <span className="tiChartLegendItem muted"><span style={{ borderTop: '1px dashed' }} />{bucket === 'day' ? 'Всього за день' : 'Сигнали сумарно'}</span>
      </div>
    </div>
  );
}

// ── KPI Strip ───────────────────────────────────────────────────────────────

const KPI_CONFIG = [
  { key: 'videos', label: 'Відео зібрано', icon: <Play size={14} /> },
  { key: 'channels', label: 'Каналів проаналізовано', icon: <Users size={14} /> },
  { key: 'hashtags', label: 'Хештеги', icon: <Hash size={14} /> },
  { key: 'keywords', label: 'Ключові слова', icon: <Tag size={14} /> },
  { key: 'comments', label: 'Коментарі', icon: <MessageCircle size={14} /> },
  { key: 'themes', label: 'Теми / кластери', icon: <Layers size={14} /> },
  { key: 'categories', label: 'Категорії', icon: <BarChart2 size={14} /> },
  { key: 'opportunities', label: 'Нові opportunities', icon: <Sparkles size={14} /> },
];

function KpiStrip({ kpi = {} }) {
  return (
    <div className="tiKpiStrip">
      {KPI_CONFIG.map(({ key, label, icon }) => {
        const val = kpi[key] ?? 0;
        return (
          <div key={key} className="tiKpiItem">
            <div className="tiKpiIcon">{icon}</div>
            <div className="tiKpiLabel">{label}</div>
            <div className="tiKpiValue">{val.toLocaleString('uk-UA')}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Live Header ─────────────────────────────────────────────────────────────

function LiveHeader({ data, period, onPeriodChange, onReload }) {
  return (
    <div className="tiHeader">
      <div className="tiHeaderTop">
        <div>
          <h1 className="tiTitle">Сьогодні — Live Intelligence</h1>
          <p className="tiSubtitle">Дані оновлюються автоматично протягом дня з Jobs, RSS, YouTube API, коментарів, хештегів і тем.</p>
        </div>
        <button className="iconButton" onClick={onReload} title="Оновити"><RefreshCw size={18} /></button>
      </div>

      <div className="tiLiveBar">
        <div className="tiLiveDot">
          <span className="tiLivePulse" />
          <span>Live data stream active</span>
        </div>
        <div className="tiLiveStat">
          <span className="tiLiveStatLabel">Останнє оновлення</span>
          <strong>{data?.last_updated_ua || '–'}</strong>
        </div>
        <div className="tiLiveStat">
          <span className="tiLiveStatLabel">Активних jobs</span>
          <strong>{data?.active_jobs_count ?? '–'}</strong>
        </div>
        <div className="tiLiveStat">
          <span className="tiLiveStatLabel">RSS фідів оброблено</span>
          <strong>{data?.rss_active ?? 0} / {data?.rss_total ?? 24}</strong>
        </div>
        <div className="tiLiveStat">
          <span className="tiLiveStatLabel">Відео зібрано</span>
          <strong>{(data?.kpi?.videos ?? 0).toLocaleString('uk-UA')}</strong>
        </div>
        <div className="tiLiveStat">
          <span className="tiLiveStatLabel">Якість доказів</span>
          <strong className={data?.quality_label === 'Good' ? 'green' : data?.quality_label === 'Fair' ? 'orange' : 'red'}>
            {data?.quality_pct ?? 0}% {data?.quality_label ?? '–'}
          </strong>
        </div>
        <div className="tiLiveStat">
          <span className="tiLiveStatLabel">Автооновлення</span>
          <strong>15 сек <RefreshCw size={10} /></strong>
        </div>
      </div>

      <div className="tiPeriodRow">
        <div className="tiTabs">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`tiTab${period === key ? ' active' : ''}`}
              onClick={() => onPeriodChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── After Jobs Panel ────────────────────────────────────────────────────────

function AfterJobsPanel({ afterJobs = {}, latestJob }) {
  const items = [
    { label: 'Нові відео', icon: <Play size={16} />, newVal: afterJobs.new_videos, total: afterJobs.total_videos },
    { label: 'Нові хештеги', icon: <Hash size={16} />, newVal: afterJobs.new_hashtags, total: afterJobs.total_hashtags },
    { label: 'Нові коментарі', icon: <MessageCircle size={16} />, newVal: afterJobs.new_comments, total: afterJobs.total_comments },
    { label: 'Нові opportunities', icon: <Sparkles size={16} />, newVal: afterJobs.new_opportunities, total: afterJobs.total_opportunities },
  ];

  return (
    <div className="tiAfterJobs">
      <div className="tiAfterJobsHeader">
        <h3>Після останніх jobs</h3>
        <span className="tiAfterJobsTime">Оновлено {latestJob?.updated_at?.split(' ')[1] || '–'}</span>
      </div>
      <div className="tiAfterJobsGrid">
        {items.map(({ label, icon, newVal, total }) => (
          <div key={label} className="tiAfterJobsItem">
            <div className="tiAfterJobsIcon">{icon}</div>
            <div>
              <div className="tiAfterJobsNew">+{(newVal ?? 0).toLocaleString('uk-UA')}</div>
              <div className="tiAfterJobsLabel">{label}</div>
              <div className="tiAfterJobsTotal">(разом {(total ?? 0).toLocaleString('uk-UA')})</div>
            </div>
          </div>
        ))}
      </div>

      {latestJob && (
        <div className={`tiLatestJob ${latestJob.status}`}>
          <div className="tiLatestJobLabel">Найсвіжіший job</div>
          <div className="tiLatestJobRow">
            <span className={`tiJobStatus ${latestJob.status}`}>
              {latestJob.status === 'completed' ? '✓ Успішно' : latestJob.status === 'running' ? '⟳ В роботі' : latestJob.status}
            </span>
            <span className="tiLatestJobName">{latestJob.label}</span>
          </div>
          <div className="tiLatestJobSource">{latestJob.source} · {latestJob.updated_at}</div>
        </div>
      )}
    </div>
  );
}

// ── Opportunity Cards ────────────────────────────────────────────────────────

function CircleScore({ score, size = 52 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? 'var(--green)' : pct >= 45 ? 'var(--orange)' : 'var(--red)';
  return (
    <div className="tiCircleScore" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="tiCircleLabel">
        <strong>{Math.round(pct)}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function OpportunityCard({ opp, rank }) {
  const score = Math.round(Number(opp?.opportunityScore ?? opp?.opportunity_score ?? 0));
  const title = opp?.title || opp?.topic || '–';
  const confidence = opp?.confidence || 'medium';
  const viewRange = opp?.viewsRange || opp?.views_range || opp?.dataHealth?.viewsRange || '';
  const competition = opp?.competitionAdvantageScore
    ? (opp.competitionAdvantageScore >= 60 ? 'Low' : opp.competitionAdvantageScore >= 35 ? 'Medium' : 'High')
    : 'Medium';
  const confTone = confidence === 'high' ? 'green' : confidence === 'medium' ? 'orange' : 'red';
  const compTone = competition === 'Low' ? 'green' : competition === 'Medium' ? 'orange' : 'red';
  const videos = opp?.dataHealth?.videosAnalyzed ?? opp?.videos ?? 0;
  const hashtags = (opp?.hashtags || []).length;
  const comments = opp?.dataHealth?.comments ?? 0;
  const keywords = opp?.keywords?.length ?? 0;

  return (
    <article className="tiOppCard">
      <div className="tiOppCardTop">
        <div className={`tiOppRank rank${rank}`}>{rank}</div>
        <div className="tiOppCardTitle">
          <h3>{title}</h3>
          <div className="tiOppCardMeta">
            <span className={`tiOppBadge ${confTone}`}>Впевненість: {confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low'}</span>
            {viewRange && <span className="tiOppBadge neutral">Потенціал: {viewRange}</span>}
            <span className={`tiOppBadge ${compTone}`}>Конкуренція: {competition}</span>
          </div>
        </div>
        <CircleScore score={score} size={56} />
      </div>

      <div className="tiOppEvidence">
        {[
          { icon: <Play size={12} />, val: videos },
          { icon: <Hash size={12} />, val: hashtags },
          { icon: <MessageCircle size={12} />, val: comments },
          { icon: <Tag size={12} />, val: keywords },
        ].map(({ icon, val }, i) => (
          <span key={i} className="tiOppEv">{icon}{val}</span>
        ))}
      </div>

      {(opp?.whyRecommended?.length || opp?.suggestedAction) && (
        <div className="tiOppChanges">
          <div className="tiOppChangesLabel">Що змінилось сьогодні</div>
          <ul>
            {(opp.whyRecommended || []).slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}
            {opp.suggestedAction && <li>{opp.suggestedAction}</li>}
          </ul>
        </div>
      )}

      <Link
        className="tiOppBtn"
        href={`/brief?id=${encodeURIComponent(opp?.id || opp?.topic_key || title)}`}
      >
        <FileText size={13} /> Відкрити бріф <ChevronRight size={13} />
      </Link>
    </article>
  );
}

// ── Strong Signals Row ──────────────────────────────────────────────────────

function TrendBadge({ value }) {
  if (value > 0) return <span className="tiTrendUp"><TrendingUp size={11} />+{value}%</span>;
  if (value < 0) return <span className="tiTrendDown"><TrendingDown size={11} />{value}%</span>;
  return <span className="tiTrendFlat"><Minus size={11} /></span>;
}

function SignalPanel({ title, children, linkTo }) {
  return (
    <div className="tiSignalPanel">
      <div className="tiSignalPanelHeader">
        <h4>{title}</h4>
        {linkTo && <Link href={linkTo} className="tiSignalMore">Переглянути всі →</Link>}
      </div>
      {children}
    </div>
  );
}

function StrongSignalsSection({ signals = {} }) {
  const trending = signals.trending_hashtags || [];
  const leaders = signals.leader_hashtags || [];
  const keywords = signals.keywords || [];
  const themes = signals.themes || [];
  const categories = signals.categories || [];

  const hashtagsToShow = trending.length ? trending : leaders;

  return (
    <section className="tiSignalsSection">
      <h2 className="tiSectionTitle">Сильні сигнали сьогодні</h2>
      <div className="tiSignalsRow">

        <SignalPanel title="# Топ зростаючих хештегів" linkTo="/trends">
          <ul className="tiSignalList">
            {hashtagsToShow.slice(0, 5).map((h) => (
              <li key={h.tag} className="tiSignalListItem">
                <span className="tiSignalTag">{h.tag}</span>
                {h.pct_change !== undefined
                  ? <TrendBadge value={h.pct_change} />
                  : <span className="tiTrendFlat">{h.avg_vpd ? `${Math.round(h.avg_vpd)}/d` : ''}</span>
                }
              </li>
            ))}
            {!hashtagsToShow.length && <li className="tiSignalEmpty">Немає даних</li>}
          </ul>
        </SignalPanel>

        <SignalPanel title="Сприймаючі ключові слова" linkTo="/trends">
          <ul className="tiSignalList">
            {keywords.slice(0, 5).map((kw) => (
              <li key={kw.keyword} className="tiSignalListItem">
                <span className="tiSignalTag">{kw.keyword}</span>
                <span className="tiSignalCount">{kw.count}</span>
              </li>
            ))}
            {!keywords.length && <li className="tiSignalEmpty">Немає даних</li>}
          </ul>
        </SignalPanel>

        <SignalPanel title="Теми, що зростають" linkTo="/opportunities">
          <ul className="tiSignalList">
            {themes.slice(0, 5).map((t) => (
              <li key={t.name} className="tiSignalListItem">
                <span className="tiSignalTag">{t.name}</span>
                <span className={`tiTrendStatus ${t.trend_status}`}>
                  {t.trend_status === 'rising' ? <TrendingUp size={11} /> : t.trend_status === 'cooling' ? <TrendingDown size={11} /> : <Minus size={11} />}
                  {t.score ? ` ${t.score}` : ''}
                </span>
              </li>
            ))}
            {!themes.length && <li className="tiSignalEmpty">Немає даних</li>}
          </ul>
        </SignalPanel>

        <SignalPanel title="Найкращі категорії" linkTo="/summary">
          <ol className="tiCategoryList">
            {categories.slice(0, 5).map((cat, i) => (
              <li key={cat.name} className="tiCategoryItem">
                <span className="tiCategoryRank">{i + 1}</span>
                <span className="tiCategoryName">{cat.name}</span>
                {cat.avg_vpd > 0 && <span className="tiCategoryVpd">+{cat.avg_vpd}/d</span>}
              </li>
            ))}
            {!categories.length && <li className="tiSignalEmpty">Немає даних</li>}
          </ol>
        </SignalPanel>

        <SignalPanel title="Інсайти з коментарів" linkTo="/summary">
          <div className="tiCommentInsights">
            <div className="tiCommentInsightRow">
              <span>Запитання</span>
              <span className="tiCommentPct">~54%</span>
            </div>
            <div className="tiCommentInsightRow">
              <span>Проблеми</span>
              <span className="tiCommentPct">~21%</span>
            </div>
            <div className="tiCommentInsightRow">
              <span>Поради</span>
              <span className="tiCommentPct">~15%</span>
            </div>
            <div className="tiCommentInsightRow">
              <span>Порівняння</span>
              <span className="tiCommentPct">~6%</span>
            </div>
            <div className="tiCommentInsightRow">
              <span>Інше</span>
              <span className="tiCommentPct">~4%</span>
            </div>
            <Link href="/summary" className="tiCommentLink">Детальніше →</Link>
          </div>
        </SignalPanel>

      </div>
    </section>
  );
}

// ── Recent Updates ──────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle size={14} className="green" />;
  if (status === 'running') return <Activity size={14} className="blue" />;
  if (status === 'failed') return <span style={{ color: 'var(--red)', fontSize: 14 }}>✕</span>;
  return <Clock size={14} className="muted" />;
}

function RecentUpdates({ updates = [] }) {
  return (
    <div className="tiUpdatesPanel">
      <div className="tiUpdatesPanelHeader">
        <h3>Останні оновлення</h3>
        <Link href="/jobs" className="tiSignalMore">Переглянути всю активність →</Link>
      </div>
      <ul className="tiUpdatesList">
        {updates.slice(0, 8).map((u, i) => (
          <li key={i} className="tiUpdatesItem">
            <StatusIcon status={u.status} />
            <div className="tiUpdatesBody">
              <span className="tiUpdatesLabel">{u.label}</span>
              <span className="tiUpdatesMeta">{u.source}</span>
            </div>
            <span className="tiUpdatesTime">{u.time?.split(' ')[1] || u.time}</span>
          </li>
        ))}
        {!updates.length && <li className="tiSignalEmpty" style={{ padding: '12px 0' }}>Немає нещодавніх оновлень</li>}
      </ul>
    </div>
  );
}

// ── Active Jobs Panel ───────────────────────────────────────────────────────

function ActiveJobsPanel({ activeJobs = {} }) {
  const items = activeJobs.items || [];
  return (
    <div className="tiJobsPanel">
      <div className="tiJobsPanelHeader">
        <h3>Активні jobs</h3>
        <Link href="/jobs" className="tiSignalMore">Переглянути всі →</Link>
      </div>
      <ul className="tiJobsList">
        {items.slice(0, 5).map((job) => (
          <li key={job.name} className="tiJobsItem">
            <div className="tiJobsItemBody">
              <span className="tiJobsName">{job.title || job.name}</span>
              <span className="tiJobsNext">{job.next_run_ua || '–'}</span>
            </div>
            <span className={`tiJobsPurpose ${job.purpose}`}>{job.purpose}</span>
          </li>
        ))}
        {!items.length && <li className="tiSignalEmpty" style={{ padding: '12px 0' }}>Немає активних jobs</li>}
      </ul>
      <div className="tiJobsSummary">
        <span>{activeJobs.enabled ?? 0} активних з {activeJobs.total ?? 0}</span>
      </div>
    </div>
  );
}

// ── Data Status Bar ─────────────────────────────────────────────────────────

function StatusDot({ status }) {
  return <span className={`tiStatusDot ${status}`} />;
}

function DataStatusBar({ sources = {}, lastUpdated }) {
  const rss = sources.rss || {};
  return (
    <div className="tiStatusBar">
      <div className="tiStatusItem">
        <StatusDot status={sources.youtube_api} />
        <span>YouTube Data API</span>
        <span className={`tiStatusLabel ${sources.youtube_api}`}>{sources.youtube_api === 'live' ? 'Live' : 'Waiting'}</span>
      </div>
      <div className="tiStatusItem">
        <StatusDot status={rss.status} />
        <span>RSS Feeds ({rss.active ?? 0}/{rss.total ?? 24})</span>
        <span className={`tiStatusLabel ${rss.status}`}>{rss.status === 'live' ? 'Live' : 'Waiting'}</span>
      </div>
      <div className="tiStatusItem">
        <StatusDot status={sources.internal_db} />
        <span>Internal DB</span>
        <span className={`tiStatusLabel ${sources.internal_db}`}>{sources.internal_db === 'live' ? 'Live' : 'Waiting'}</span>
      </div>
      <div className="tiStatusItem">
        <StatusDot status={sources.llm} />
        <span>LLM Interpretation</span>
        <span className={`tiStatusLabel ${sources.llm}`}>{sources.llm === 'live' ? 'Live' : 'Waiting'}</span>
      </div>
      <div className="tiStatusItem tiStatusTime">
        <Clock size={12} />
        <span>Остання синхронізація: {lastUpdated || '–'}</span>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function TodayPage() {
  const [period, setPeriod] = useState('today');
  const { data, loading, error, reload } = useTodayIntel(period);

  if (loading && !data) {
    return (
      <div className="tiLoading">
        <Activity size={24} />
        <p>Завантаження Live Intelligence...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="tiError">
        <p style={{ color: 'var(--red)' }}>{error}</p>
        <button className="button" onClick={reload}><RefreshCw size={16} />Повторити</button>
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="tiPage">
      <LiveHeader data={d} period={period} onPeriodChange={setPeriod} onReload={reload} />

      <KpiStrip kpi={d.kpi || {}} />

      <div className="tiMainGrid">
        <div className="tiChartSection">
          <div className="tiSectionHeader">
            <h3>{CHART_TITLES[period] || CHART_TITLES.today}</h3>
            <span className="tiSectionNote">{CHART_NOTES[period] || CHART_NOTES.today}</span>
          </div>
          <DayChart
            chartData={d.day_chart || []}
            events={d.day_events || []}
            bucket={d.chart_bucket || 'hour'}
          />
          {(d.day_events || []).length > 0 && (
            <div className="tiEventList">
              {d.day_events.map((ev, i) => (
                <div key={i} className="tiEventItem">
                  <span className="tiEventTime">{ev.time}</span>
                  <span className="tiEventLabel">{ev.label}</span>
                  <span className="tiEventSource">{ev.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <AfterJobsPanel afterJobs={d.after_jobs || {}} latestJob={d.latest_job} />
      </div>

      {(d.opportunities || []).length > 0 && (
        <section className="tiOpportunities">
          <div className="tiSectionHeader">
            <h2>Що знімати зараз</h2>
            <span className="tiSectionNote">Рекомендації на основі даних</span>
            <Link href="/opportunities" className="tiSignalMore" style={{ marginLeft: 'auto' }}>
              Переглянути всі можливості →
            </Link>
          </div>
          <div className="tiOppGrid">
            {d.opportunities.map((opp, i) => (
              <OpportunityCard key={opp?.id || opp?.topic_key || i} opp={opp} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      <StrongSignalsSection signals={d.signals || {}} />

      <div className="tiBottomRow">
        <RecentUpdates updates={d.recent_updates || []} />
        <ActiveJobsPanel activeJobs={d.active_jobs || {}} />
      </div>

      <DataStatusBar sources={d.data_sources || {}} lastUpdated={d.last_updated_ua} />
    </div>
  );
}
