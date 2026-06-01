import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Settings2 } from 'lucide-react';
import { api } from '../../lib/shared.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';

export default function TrendAlertInbox({ summary }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [payload, setPayload] = useState(null);
  const [settings, setSettings] = useState(null);

  async function load() {
    const [alerts, config] = await Promise.all([api('/api/trends/alerts'), api('/api/trends/settings')]);
    setPayload(alerts);
    setSettings(config);
  }

  useEffect(() => { if (open) load().catch(() => {}); }, [open]);

  async function readAll() {
    await api('/api/trends/alerts/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    await load();
  }

  async function save() {
    await api('/api/trends/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setEditing(false);
  }

  function updateRule(index, patch) {
    const rules = settings.alerts.rules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule);
    setSettings({ ...settings, alerts: { ...settings.alerts, rules } });
  }

  return (
    <Card className="trend-alert-inbox">
      <button className="trend-alert-toggle" onClick={() => setOpen((value) => !value)}>
        <Bell size={17} /><strong>Trend alerts</strong><span>{summary?.unread || payload?.summary?.unread || 0} непрочитаних</span>
      </button>
      {open ? (
        <div className="trend-alert-panel">
          <div className="trend-alert-actions">
            <Button ghost onClick={readAll}><CheckCheck size={14} />Прочитати все</Button>
            <Button ghost onClick={() => setEditing((value) => !value)}><Settings2 size={14} />Правила</Button>
          </div>
          {editing && settings ? (
            <div className="trend-alert-settings">
              <label>VPH threshold<input type="number" value={settings.alerts.vph_threshold} onChange={(event) => setSettings({ ...settings, alerts: { ...settings.alerts, vph_threshold: Number(event.target.value) } })} /></label>
              <label>Outlier threshold<input type="number" step="0.1" value={settings.alerts.competitor_outlier_threshold} onChange={(event) => setSettings({ ...settings, alerts: { ...settings.alerts, competitor_outlier_threshold: Number(event.target.value) } })} /></label>
              <p>{settings.alerts.rules?.length || 0} auto-seeded rules. Keyword, topic, category та competitor правила зберігаються у `research/trend_radar.yaml`.</p>
              <div className="trend-alert-rules">
                {(settings.alerts.rules || []).map((rule, index) => (
                  <label key={rule.id}>
                    <input type="checkbox" checked={rule.enabled} onChange={(event) => updateRule(index, { enabled: event.target.checked })} />
                    <span>{rule.type}</span>
                    <input value={rule.target} onChange={(event) => updateRule(index, { target: event.target.value })} />
                  </label>
                ))}
              </div>
              <Button onClick={save}>Зберегти</Button>
            </div>
          ) : null}
          {(payload?.alerts || []).map((alert) => (
            <div className={`trend-alert-item ${alert.read_at ? '' : 'unread'}`} key={alert.id}>
              <strong>{alert.metrics?.title || alert.target_key}</strong>
              <span>{alert.tier} · VPH {Number(alert.metrics?.vph || 0).toFixed(1)} · {alert.metrics?.metric_source}</span>
            </div>
          ))}
          {payload && !payload.available ? <p className="muted">Inbox стане доступним після DB migration.</p> : null}
          {payload?.available && !payload.alerts?.length ? <p className="muted">Нових alerts немає.</p> : null}
        </div>
      ) : null}
    </Card>
  );
}
