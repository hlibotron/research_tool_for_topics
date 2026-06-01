import React from 'react';
import { Hash, ImageIcon, TrendingUp } from 'lucide-react';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { compactNumber } from '../../lib/formatters.js';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function percent(value) {
  if (!hasNumber(value)) return 'немає даних';
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${Math.round(number)}%`;
}

function videoVelocity(item) {
  const raw = item.raw || {};
  return raw.viewsVelocity ?? raw.velocity ?? raw.views_per_day ?? item.demandGrowth;
}

export default function TrendEvidenceExamples({ data }) {
  const risingVideos = (data.videos || [])
    .filter((item) => item.direction === 'rising' || hasNumber(videoVelocity(item)))
    .sort((a, b) => Number(videoVelocity(b) || 0) - Number(videoVelocity(a) || 0))
    .slice(0, 3);
  const risingHashtags = (data.hashtags || [])
    .filter((item) => item.direction === 'rising')
    .sort((a, b) => Number(b.demandGrowth || 0) - Number(a.demandGrowth || 0))
    .slice(0, 5);

  return (
    <Card className="trend-evidence-examples">
      <h2>Приклади доказів</h2>
      <div className="trend-evidence-grid">
        <section>
          <h3><TrendingUp size={15} />Відео, що зростають</h3>
          <div className="trend-evidence-video-list">
            {risingVideos.map((item) => {
              const raw = item.raw || {};
              const thumbnail = raw.thumbnail || raw.thumbnailUrl || raw.thumbnail_url;
              return (
                <article className="trend-evidence-video" key={`${item.type}-${item.id}`}>
                  <div className="trend-evidence-thumb">{thumbnail ? <a href={raw.url} target="_blank" rel="noreferrer"><img src={thumbnail} alt="" /></a> : <ImageIcon size={18} />}</div>
                  <div>
                    <strong>{raw.url ? <a href={raw.url} target="_blank" rel="noreferrer">{item.label || 'немає даних'}</a> : item.label || 'немає даних'}</strong>
                    <span>{raw.channel || raw.channel_title || item.subtitle || 'немає даних'}</span>
                    <small>{hasNumber(raw.views) ? `${compactNumber(raw.views)} переглядів` : 'перегляди: немає даних'} · {raw.publishedAt || raw.published_at || item.updatedAt || 'немає даних'}</small>
                  </div>
                  <b>{hasNumber(raw.viewsPerHour) ? `${compactNumber(raw.viewsPerHour)}/год` : hasNumber(videoVelocity(item)) ? `${compactNumber(videoVelocity(item))}/день` : percent(item.demandGrowth)}</b>
                </article>
              );
            })}
            {!risingVideos.length ? <EmptyState title="Немає відео-доказів" text="API не повернув rising/evidence videos для цього періоду." /> : null}
          </div>
        </section>
        <section>
          <h3><Hash size={15} />Теги / хештеги, що зростають</h3>
          <div className="trend-evidence-hashtags">
            {risingHashtags.map((item) => (
              <div key={`${item.type}-${item.id}`}>
                <span>{item.label || 'немає даних'}</span>
                <strong>{percent(item.demandGrowth)}</strong>
              </div>
            ))}
            {!risingHashtags.length ? <EmptyState title="Немає rising hashtags" text="API не повернув хештеги зі зростанням." /> : null}
          </div>
        </section>
      </div>
    </Card>
  );
}
