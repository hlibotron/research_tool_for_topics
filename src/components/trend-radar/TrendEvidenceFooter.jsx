import React from 'react';
import { Clock3 } from 'lucide-react';

const NO_DATA = 'немає даних';

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function exactNumber(data, keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], data);
    if (value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function sumFromItems(items, key) {
  const values = (items || [])
    .map((item) => item?.[key])
    .filter((value) => value !== null && value !== undefined && Number.isFinite(Number(value)))
    .map(Number);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function latestFromItems(items) {
  const values = (items || []).map((item) => item?.updatedAt).filter(Boolean);
  return values[0] || '';
}

export default function TrendEvidenceFooter({ data, items }) {
  const videosAnalyzed = firstPresent(
    exactNumber(data || {}, ['videosAnalyzed', 'videos_analyzed', 'dataHealth.videosAnalyzed', 'data_health.videos_analyzed', 'analytics.videos_analyzed']),
    sumFromItems(items, 'videosAnalyzed'),
  );
  const channelsAnalyzed = firstPresent(
    exactNumber(data || {}, ['channelsAnalyzed', 'channels_analyzed', 'dataHealth.sourcesCount', 'data_health.sources_count', 'analytics.channels_analyzed']),
    sumFromItems(items, 'channelsAnalyzed'),
  );
  const updatedAt = firstPresent(data?.updatedAt, data?.updated_at, data?.generated_at, data?.dataHealth?.lastUpdated, data?.data_health?.last_updated, latestFromItems(items));

  return (
    <footer className="trend-evidence-footer">
      <span>Джерела: YouTube Data API v3, YouTube Analytics / агреговані відкриті дані</span>
      <span>Відео проаналізовано: {videosAnalyzed === null ? NO_DATA : videosAnalyzed.toLocaleString('uk-UA')}</span>
      <span>Каналів проаналізовано: {channelsAnalyzed === null ? NO_DATA : channelsAnalyzed.toLocaleString('uk-UA')}</span>
      <span><Clock3 size={13} />Оновлено: {updatedAt || NO_DATA}</span>
    </footer>
  );
}
