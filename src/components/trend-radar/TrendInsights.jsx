import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';
import Card from '../common/Card.jsx';

const SIGNAL_TABS = new Set(['topics', 'hashtags']);

const TAB_LABELS = {
  topics: 'Теми',
  hashtags: 'Хештеги',
  videos: 'Відео',
  formats: 'Формати',
  categories: 'Категорії',
};

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function topRising(items) {
  return [...items]
    .filter((item) => item.direction === 'rising' && hasNumber(item.demandGrowth))
    .sort((a, b) => Number(b.demandGrowth) - Number(a.demandGrowth))[0];
}

function lowRetentionItems(items) {
  return items.filter((item) => {
    const raw = item.raw || {};
    const value = raw.retention ?? raw.avgRetention ?? raw.avg_retention;
    return hasNumber(value) && Number(value) < (Number(value) <= 1 ? 0.35 : 35);
  });
}

export default function TrendInsights({ items, allItems, tab }) {
  // For tabs without rich signal data (videos/formats/categories), analyze topics+hashtags instead
  const signalItems = SIGNAL_TABS.has(tab)
    ? (items.length ? items : allItems.filter((item) => SIGNAL_TABS.has(item.type)))
    : allItems.filter((item) => SIGNAL_TABS.has(item.type));
  const scopeLabel = SIGNAL_TABS.has(tab) && items.length ? TAB_LABELS[tab] : 'Теми + Хештеги';

  const rising = topRising(signalItems);
  const highCompetition = signalItems.filter((item) => String(item.competitionLevel || '').toLowerCase() === 'high');
  const falling = signalItems.filter((item) => item.direction === 'falling');
  const lowRetention = lowRetentionItems(signalItems);
  const shootable = signalItems.filter((item) => ['Знімати', 'Адаптувати'].includes(item.recommendationMeta?.label));
  const hasEvidence = Boolean(rising || highCompetition.length || falling.length || lowRetention.length || shootable.length);

  if (!hasEvidence) {
    return (
      <aside className="trend-insights">
        <Card className="trend-insight-card">
          <h2>Інсайти</h2>
          <p className="muted">Інсайти недоступні: недостатньо структурованих YouTube-даних.</p>
        </Card>
      </aside>
    );
  }

  const whyItems = [];
  if (rising) whyItems.push(`${rising.label}: попит ${Number(rising.demandGrowth) > 0 ? '+' : ''}${Math.round(Number(rising.demandGrowth))}%.`);
  const freshVideos = signalItems.filter((item) => item.raw?.recent_videos || item.raw?.freshVideos || item.raw?.fresh_videos);
  if (freshVideos.length) whyItems.push(`${freshVideos.length} сигналів мають свіжі відео в даних.`);
  const channelGrowth = signalItems.filter((item) => hasNumber(item.raw?.channelsGrowth || item.raw?.channels_growth));
  if (channelGrowth.length) whyItems.push(`${channelGrowth.length} сигналів мають дані про ріст каналів.`);

  const riskItems = [];
  if (highCompetition.length) riskItems.push(`${highCompetition.length} сигналів з високою конкуренцією.`);
  if (falling.length) riskItems.push(`${falling.length} сигналів уже падають.`);
  if (lowRetention.length) riskItems.push(`${lowRetention.length} сигналів мають низький retention.`);
  const newsDependent = signalItems.filter((item) => `${item.label} ${item.category}`.toLowerCase().includes('news') || `${item.label} ${item.category}`.toLowerCase().includes('новин'));
  if (newsDependent.length) riskItems.push(`${newsDependent.length} сигналів залежать від новинного циклу.`);

  const actionItems = [];
  const strongGrowth = shootable.find((item) => Number(item.demandGrowth) > 70);
  if (strongGrowth) actionItems.push(`Першим перевірте "${strongGrowth.label}" — найсильніший сигнал попиту.`);
  const adaptItem = shootable.find((item) => item.recommendationMeta?.label === 'Адаптувати');
  if (adaptItem) actionItems.push(`Для "${adaptItem.label}" потрібен унікальний кут, не копія формату.`);
  const formatItem = allItems.find((item) => item.type === 'formats' && item.recommendationMeta?.label !== 'Уникати');
  if (formatItem) actionItems.push(`Звірте ідею з форматом "${formatItem.label}" перед переходом у Brief.`);
  if (shootable.length) actionItems.push(`Передайте ${shootable.length} перевірених сигналів в Idea Lab або Brief.`);

  return (
    <aside className="trend-insights">
      <Card className="trend-insight-card trend-insight-green">
        <h2><TrendingUp size={16} />Чому росте</h2>
        <p className="trend-insight-scope muted">{scopeLabel}</p>
        <ul>
          {whyItems.slice(0, 4).map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}
          {!whyItems.length ? <li><AlertTriangle size={14} />Немає окремих growth reasons у відповіді API.</li> : null}
        </ul>
      </Card>
      <Card className="trend-insight-card trend-insight-red">
        <h2><ShieldAlert size={16} />Ризики</h2>
        <p className="trend-insight-scope muted">{scopeLabel}</p>
        <ul>
          {riskItems.slice(0, 4).map((item) => <li key={item}><AlertTriangle size={14} />{item}</li>)}
          {!riskItems.length ? <li><CheckCircle2 size={14} />Структурованих ризиків у даних не знайдено.</li> : null}
        </ul>
      </Card>
      <Card className="trend-insight-card trend-insight-blue">
        <h2><CheckCircle2 size={16} />Що робити</h2>
        <p className="trend-insight-scope muted">{scopeLabel}</p>
        <ul>
          {actionItems.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
          {!actionItems.length ? <li>Дочекайтесь сигналів з рекомендацією "Знімати" або "Адаптувати".</li> : null}
        </ul>
      </Card>
    </aside>
  );
}
