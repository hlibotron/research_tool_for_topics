import React, { useContext, useEffect, useMemo, useState } from 'react';
import { api, ToastContext, usePolling, navigateTo } from '../lib/shared.jsx';
import BacklogHeader from '../components/backlog/BacklogHeader.jsx';
import BacklogFilters from '../components/backlog/BacklogFilters.jsx';
import BacklogKpiCards from '../components/backlog/BacklogKpiCards.jsx';
import BacklogTrendChart from '../components/backlog/BacklogTrendChart.jsx';
import BacklogIdeasTable from '../components/backlog/BacklogIdeasTable.jsx';
import BacklogReadyStrip from '../components/backlog/BacklogReadyStrip.jsx';
import BacklogDetailsModal from '../components/backlog/BacklogDetailsModal.jsx';
import BacklogImportModal from '../components/backlog/BacklogImportModal.jsx';
import BacklogIdeaFormModal from '../components/backlog/BacklogIdeaFormModal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import '../styles/backlog.css';

const DEFAULT_FILTERS = {
  status: 'all',
  source: 'all',
  score: 'all',
  trend: 'all',
  planned: 'all',
  q: '',
};

function buildQuery(filters, days) {
  const params = new URLSearchParams();
  params.set('days', String(days));
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  return params.toString();
}

export default function BacklogPage() {
  const showToast = useContext(ToastContext);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [days, setDays] = useState(30);
  const [chartTab, setChartTab] = useState('all');
  const [hiddenIds, setHiddenIds] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateReport, setEvaluateReport] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const query = useMemo(() => buildQuery(filters, days), [filters, days]);
  const { data, error, loading, reload } = usePolling(
    () => api(`/api/backlog?${query}`),
    [query],
    30000,
  );

  const ideas = data?.ideas || [];
  const chart = data?.chart || { dates: [], series: [] };
  const readyStrip = data?.ready_strip || [];
  const kpis = data?.kpis || {};

  useEffect(() => {
    if (!chart?.series?.length) return;
    setActiveIds((prev) => {
      if (prev.length) return prev;
      return chart.series.map((s) => s.idea_id);
    });
  }, [chart]);

  const filteredChart = useMemo(() => {
    if (chartTab === 'opportunities') {
      const opportunityIds = new Set(ideas.filter((idea) => idea.source === 'opportunities').map((it) => it.id));
      return {
        dates: chart.dates,
        series: (chart.series || []).filter((s) => opportunityIds.has(s.idea_id)),
      };
    }
    if (chartTab === 'selected' && activeIds.length) {
      return {
        dates: chart.dates,
        series: (chart.series || []).filter((s) => activeIds.includes(s.idea_id)),
      };
    }
    return chart;
  }, [chart, chartTab, activeIds, ideas]);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function applyKpiFilter(patch) {
    setFilters({ ...DEFAULT_FILTERS, ...patch });
  }

  async function handleEvaluate() {
    setEvaluating(true);
    try {
      const res = await api('/api/backlog/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const summary = res.summary || {};
      const evaluated = res.evaluated || 0;
      if (!evaluated) {
        showToast('У backlog поки немає ідей. Додай або імпортуй ідеї.', 'blue');
      } else {
        const parts = [`Оцінено ${evaluated}`];
        if (summary.up) parts.push(`↑ ${summary.up}`);
        if (summary.down) parts.push(`↓ ${summary.down}`);
        if (summary.tags_added) parts.push(`нові хештеги: ${summary.tags_added}`);
        showToast(parts.join(' · '), 'green');
      }
      setEvaluateReport(res);
      reload();
    } catch (err) {
      showToast(err.message || 'Не вдалося запустити оцінку', 'red');
    } finally {
      setEvaluating(false);
    }
  }

  function dismissEvaluateReport() {
    setEvaluateReport(null);
  }

  async function handleCreate(payload) {
    try {
      const res = await api('/api/backlog/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(res.duplicate ? 'Ідея вже існувала і оновлена' : 'Ідею додано', 'green');
        reload();
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося створити ідею', 'red');
    }
  }

  async function handleEditTitle(ideaId, title) {
    try {
      await api('/api/backlog/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ideaId, changes: { title } }),
      });
      reload();
    } catch (err) {
      showToast(err.message || 'Не вдалося оновити', 'red');
    }
  }

  async function handleTogglePlan(idea) {
    if (idea.plan_item_id) {
      if (!window.confirm(`Відв'язати ідею «${idea.title}» від плану контенту? Сама ідея залишиться в backlog.`)) return;
      try {
        await api(`/api/backlog/${encodeURIComponent(idea.id)}/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unlink: true }),
        });
        showToast('Зв\'язок з планом прибрано', 'green');
        reload();
      } catch (err) {
        showToast(err.message || 'Не вдалося оновити', 'red');
      }
      return;
    }
    try {
      const res = await api(`/api/backlog/${encodeURIComponent(idea.id)}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok) {
        showToast(`«${idea.title}» додано в План контенту`, 'green');
        reload();
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося додати в план', 'red');
    }
  }

  async function handlePark(idea) {
    try {
      await api(`/api/backlog/${encodeURIComponent(idea.id)}/park`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      showToast(`«${idea.title}» запарковано`, 'green');
      reload();
    } catch (err) {
      showToast(err.message || 'Не вдалося запаркувати', 'red');
    }
  }

  function openDetails(idea) {
    setDetailsId(idea.id);
    setDetailsOpen(true);
  }

  function handleCreateBrief(idea) {
    navigateTo(`/brief?id=${encodeURIComponent(idea.id)}`);
  }

  function toggleVisibility(ideaId) {
    setHiddenIds((current) => current.includes(ideaId) ? current.filter((id) => id !== ideaId) : [...current, ideaId]);
  }

  function toggleActiveIdea(ideaId) {
    setActiveIds((current) => current.includes(ideaId) ? current.filter((id) => id !== ideaId) : [...current, ideaId]);
  }

  const isEmpty = !loading && !ideas.length && !data?.total;

  return (
    <div className="backlog-page">
      <BacklogHeader
        onAdd={() => setAddOpen(true)}
        onImport={() => setImportOpen(true)}
        onEvaluate={handleEvaluate}
        evaluating={evaluating}
      />

      {error ? <div className="backlog-error">Не вдалося завантажити Backlog: {error} <button type="button" onClick={reload}>Повторити</button></div> : null}

      {evaluateReport ? (
        <EvaluateReport report={evaluateReport} onClose={dismissEvaluateReport} onOpenIdea={(id) => { setDetailsId(id); setDetailsOpen(true); }} />
      ) : null}

      <BacklogFilters
        filters={filters}
        days={days}
        onChange={updateFilters}
        onDaysChange={setDays}
        onMoreFilters={() => showToast('Розширені фільтри незабаром', 'blue')}
      />

      <BacklogKpiCards kpis={kpis} onFilter={applyKpiFilter} />

      {loading && !ideas.length ? (
        <div className="backlog-loading">Завантаження backlog...</div>
      ) : isEmpty ? (
        <EmptyState
          title="Backlog ще порожній"
          text="Додай ідею вручну або імпортуй з Можливостей, Trend Radar чи Summary."
          action={(
            <div className="rowActions">
              <Button onClick={() => setImportOpen(true)}>Імпортувати з Можливостей</Button>
              <Button ghost onClick={() => setAddOpen(true)}>Додати свою ідею</Button>
            </div>
          )}
        />
      ) : (
        <>
          <BacklogTrendChart
            chart={filteredChart}
            ideas={ideas}
            activeIdeaIds={activeIds}
            hiddenIds={hiddenIds}
            onToggleVisibility={toggleVisibility}
            onSelectIdeas={toggleActiveIdea}
            tab={chartTab}
            onTabChange={setChartTab}
            days={days}
            onDaysChange={setDays}
          />
          <BacklogIdeasTable
            ideas={ideas}
            onDetails={openDetails}
            onTogglePlan={handleTogglePlan}
            onEditTitle={handleEditTitle}
            onMore={(idea) => showToast(`Дії для «${idea.title}» — незабаром`, 'blue')}
          />
          <BacklogReadyStrip
            ideas={readyStrip}
            total={readyStrip.length}
            onAddToPlan={(idea) => handleTogglePlan(idea)}
            onPark={handlePark}
            onAddIdea={() => setAddOpen(true)}
            onShowAll={() => setFilters({ ...DEFAULT_FILTERS, status: 'ready_to_plan' })}
          />
          <p className="backlog-footnote">
            LLM використано для пояснень, кластеризації і next action. Score, динаміка і статуси базуються на backend-метриках.
          </p>
        </>
      )}

      <BacklogDetailsModal
        open={detailsOpen}
        ideaId={detailsId}
        onClose={() => setDetailsOpen(false)}
        onAddToPlan={(item) => { setDetailsOpen(false); handleTogglePlan(item); }}
        onPark={(item) => { setDetailsOpen(false); handlePark(item); }}
        onEvaluateOne={() => { setDetailsOpen(false); handleEvaluate(); }}
        onCreateBrief={handleCreateBrief}
      />

      <BacklogImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(count) => {
          showToast(`Імпортовано ${count} ідей у Backlog`, 'green');
          reload();
        }}
      />

      <BacklogIdeaFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

function EvaluateReport({ report, onClose, onOpenIdea }) {
  const summary = report.summary || {};
  const movers = (report.movers || []).filter((m) => Math.abs(m.delta) > 0);
  const signals = summary.signals || {};
  return (
    <section className="backlog-evaluate-report">
      <header>
        <div>
          <strong>Результати «Оцінити сьогодні»</strong>
          <p>
            Перевірено {report.evaluated} ідей. Сигнали: {signals.opportunities || 0} opportunities ·
            {' '}{signals.topics || 0} тем · {signals.outliers || 0} outliers · {signals.hashtags || 0} хештегів.
          </p>
        </div>
        <button type="button" onClick={onClose} className="backlog-evaluate-close" aria-label="Закрити">×</button>
      </header>
      <div className="backlog-evaluate-summary">
        <span className="positive">↑ {summary.up || 0} зросли</span>
        <span className="negative">↓ {summary.down || 0} впали</span>
        <span className="neutral">— {summary.unchanged || 0} без змін</span>
        <span>Δ ср. {summary.avg_delta || 0}</span>
        {summary.tags_added ? <span>Нові хештеги: {summary.tags_added}</span> : null}
      </div>
      {movers.length ? (
        <table className="backlog-evaluate-movers">
          <thead>
            <tr><th>Ідея</th><th>Було</th><th>Стало</th><th>Δ</th><th>Сигнали</th><th></th></tr>
          </thead>
          <tbody>
            {movers.map((m) => {
              const matches = m.matches || {};
              const matchSummary = ['opportunities', 'topics', 'outliers', 'hashtags']
                .map((key) => matches[key] ? `${matches[key]} ${key}` : null)
                .filter(Boolean)
                .join(' · ');
              return (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{m.before}</td>
                  <td>{m.after}</td>
                  <td className={m.delta > 0 ? 'positive' : 'negative'}>{m.delta > 0 ? '+' : ''}{m.delta}</td>
                  <td>{matchSummary || '—'}</td>
                  <td><button type="button" className="backlog-evaluate-link" onClick={() => onOpenIdea(m.id)}>Деталі</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="backlog-evaluate-empty">Score не змінився — поточні сигнали збігаються з минулим запуском.</p>
      )}
    </section>
  );
}
