import React, { useEffect, useState } from 'react';
import { ExternalLink, ListPlus, X } from 'lucide-react';
import { api } from '../../lib/shared.jsx';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

export function backlogCandidateFromTopic(topic, evidence = []) {
  return {
    source: 'trend_radar',
    source_id: topic.id,
    title: topic.name || topic.label,
    subtitle: topic.subtitle || topic.suggestedAngle || '',
    score: topic.trendVelocity || 50,
    evidence,
  };
}

export default function TrendTopicDrawer({ topic, onClose }) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    api(`/api/trends/topics/${encodeURIComponent(topic.id)}`)
      .then((payload) => { if (active) setDetail(payload); })
      .catch(() => { if (active) setDetail({ topic: topic.raw, evidence: topic.examples || [] }); });
    return () => { active = false; };
  }, [topic]);

  const raw = detail?.topic || topic.raw || {};
  const evidence = detail?.evidence || raw.bestVideoExamples || topic.examples || [];
  const reasons = Array.isArray(raw.whyPopular) ? raw.whyPopular : raw.whyPopular ? [raw.whyPopular] : [];
  const risks = Array.isArray(raw.risks) ? raw.risks : raw.risks ? [raw.risks] : [];

  async function addToBacklog() {
    setStatus('Додаю...');
    try {
      const result = await api('/api/backlog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: [backlogCandidateFromTopic({ ...raw, id: raw.id || topic.id, label: topic.label }, evidence)] }),
      });
      setStatus(result.added?.length ? 'Додано у Backlog' : 'Вже є у Backlog');
    } catch (error) {
      setStatus(error.message || String(error));
    }
  }

  return (
    <div className="trend-drawer-backdrop" onMouseDown={onClose}>
      <aside className="trend-topic-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="trend-drawer-header">
          <div>
            <Badge tone={raw.lane === 'context' ? 'orange' : 'green'}>{raw.lane || 'core'}</Badge>
            <h2>{raw.name || topic.label}</h2>
            <p>{raw.subtitle || raw.suggestedAngle || 'Деталі теми та докази популярності.'}</p>
          </div>
          <button className="iconButton" onClick={onClose} aria-label="Закрити"><X size={18} /></button>
        </div>
        <section>
          <h3>Чому тема популярна</h3>
          {reasons.length ? <ul>{reasons.map((reason) => <li key={String(reason)}>{String(reason)}</li>)}</ul> : <p className="muted">Пояснення формується з velocity, evidence та source provenance.</p>}
          <div className="trend-topic-metrics">
            <span>Velocity <b>{raw.trendVelocity ?? '—'}</b></span>
            <span>Evidence videos <b>{raw.videosAnalyzed ?? evidence.length}</b></span>
            <span>Channels <b>{raw.channelsAnalyzed ?? '—'}</b></span>
            <span>Competition <b>{raw.competition_level ?? '—'}</b></span>
          </div>
        </section>
        <section>
          <h3>Відео-докази</h3>
          <div className="trend-drawer-evidence">
            {evidence.map((video, index) => (
              <a href={video.url} target="_blank" rel="noreferrer" key={video.video_id || video.url || index}>
                {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" /> : null}
                <span><strong>{video.title || video.label || 'Відео'}</strong><small>{video.channel || video.channel_title || ''} · VPH {video.viewsPerHour ?? '—'}</small></span>
                <ExternalLink size={14} />
              </a>
            ))}
            {!evidence.length ? <p className="muted">Для теми поки немає конкретних відео-доказів.</p> : null}
          </div>
        </section>
        {risks.length ? <section><h3>Ризики</h3><ul>{risks.map((risk) => <li key={String(risk)}>{String(risk)}</li>)}</ul></section> : null}
        <div className="trend-drawer-actions">
          <Button onClick={addToBacklog}><ListPlus size={15} />У Backlog</Button>
          {status ? <span>{status}</span> : null}
        </div>
      </aside>
    </div>
  );
}
