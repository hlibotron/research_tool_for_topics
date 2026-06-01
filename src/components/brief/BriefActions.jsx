import React, { useContext } from 'react';
import { api } from '../../lib/shared.jsx';
import { Copy, Download, CalendarPlus } from 'lucide-react';
import { ToastContext } from '../../lib/shared.jsx';

function buildBriefMarkdown(brief) {
  const lines = [];
  lines.push(`# ${brief.title || 'Бріф'}`);
  lines.push('');
  lines.push('## Рішення');
  if (brief.opportunityScore) lines.push(`- Opportunity Score: ${brief.opportunityScore}/100`);
  if (brief.confidence) lines.push(`- Впевненість: ${brief.confidence}`);
  if (brief.recommendedFormat) lines.push(`- Формат: ${brief.recommendedFormat}`);
  if (brief.evidenceQuality) lines.push(`- Якість доказів: ${brief.evidenceQuality}`);
  lines.push('');
  if (brief.concept) { lines.push('## Концепт'); lines.push(brief.concept); lines.push(''); }
  if (brief.hooks?.length) {
    lines.push('## Хуки');
    brief.hooks.forEach((h, i) => lines.push(`${i + 1}. ${h}`));
    lines.push('');
  }
  if (brief.structure?.length) {
    lines.push('## Структура');
    brief.structure.forEach(s => {
      if (typeof s === 'string') lines.push(`- ${s}`);
      else if (s?.time && s?.title) lines.push(`- **${s.time}** ${s.title}`);
    });
    lines.push('');
  }
  if (brief.broll?.length) { lines.push('## B-roll'); brief.broll.forEach(b => lines.push(`- ${b}`)); lines.push(''); }
  if (brief.titles?.length) {
    lines.push('## Назви');
    brief.titles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push('');
  }
  if (brief.hashtags?.length) {
    lines.push('## Хештеги');
    lines.push(brief.hashtags.map(h => `#${String(h).replace(/^#/, '')}`).join(' '));
    lines.push('');
  }
  if (brief.evidence?.length) {
    lines.push('## Докази');
    (Array.isArray(brief.evidence) ? brief.evidence : []).forEach(e =>
      lines.push(`- ${typeof e === 'string' ? e : JSON.stringify(e)}`)
    );
    lines.push('');
  }
  if (brief.risks?.length) { lines.push('## Ризики'); brief.risks.forEach(r => lines.push(`- ${r}`)); lines.push(''); }
  if (brief.nextActions?.length) {
    lines.push('## Наступні дії');
    brief.nextActions.forEach(a => lines.push(`- [ ] ${a}`));
    lines.push('');
  }
  lines.push('## Джерело даних');
  if (brief.videosAnalyzed) lines.push(`- Відео проаналізовано: ${brief.videosAnalyzed}`);
  if (brief.channelsAnalyzed) lines.push(`- Каналів проаналізовано: ${brief.channelsAnalyzed}`);
  if (brief.updatedAt) lines.push(`- Оновлено: ${brief.updatedAt}`);
  return lines.join('\n');
}

function safeTitle(title) {
  return (title || 'brief').replace(/[^a-zA-Z0-9а-яА-ЯіїєюьшщчцгІЇЄЮ\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'brief';
}

export default function BriefActions({ brief }) {
  const showToast = useContext(ToastContext);

  function copyBrief() {
    const md = buildBriefMarkdown(brief);
    if (!navigator.clipboard) { showToast('Clipboard недоступний', 'red'); return; }
    navigator.clipboard.writeText(md).then(
      () => showToast('Бріф скопійовано в буфер обміну', 'green'),
      () => showToast('Не вдалося отримати доступ до буфера обміну', 'red'),
    );
  }

  function exportMarkdown() {
    const md = buildBriefMarkdown(brief);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `brief-${safeTitle(brief.title)}-${date}.md`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const addToContentPlan = async () => {
    const notify = (msg, tone) => {
      if (typeof showToast === 'function') showToast(msg, tone);
      else window.alert(msg);
    };
    if (!brief || !brief.title) { notify('Бріф ще не готовий — нема чого додавати', 'red'); return; }
    const score = Number(brief.opportunityScore || 0);
    const payload = {
      title: brief.title,
      format: brief.recommendedFormat || 'long',
      priority: score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low',
      source: 'opportunities',
      status: 'brief_ready',
      brief_status: 'ready',
      note: brief.concept || '',
      opportunity_id: brief.id || '',
      effort_hours: 5,
      requires_purchase: false,
    };
    try {
      const res = await api('/api/content-plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res && res.ok === false) { notify('Не вдалося додати: ' + (res.error || 'помилка'), 'red'); return; }
      notify('Бріф додано в план контенту', 'green');
    } catch (e) {
      notify('Не вдалося додати бріф у план: ' + ((e && e.message) || e), 'red');
    }
  }

  return (
    <div className="brief-actions-bar">
      <button className="brief-btn-primary" onClick={copyBrief}>
        <Copy size={15} />
        Скопіювати бріф
      </button>
      <button className="brief-btn-ghost" onClick={exportMarkdown}>
        <Download size={15} />
        Експорт Markdown
      </button>
      <button className="brief-btn-ghost" onClick={addToContentPlan}>
        <CalendarPlus size={15} />
        Додати в контент-план
      </button>
    </div>
  );
}
