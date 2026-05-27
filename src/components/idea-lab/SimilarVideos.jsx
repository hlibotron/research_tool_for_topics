import React from 'react';
import { Play } from 'lucide-react';
import { compactNumber } from '../../lib/formatters.js';

function VideoThumbnail({ url }) {
  if (url) {
    return (
      <div className="similar-video-thumb">
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
      </div>
    );
  }
  return (
    <div className="similar-video-thumb">
      <Play size={16} color="rgba(142,163,184,0.6)" />
    </div>
  );
}

function RetentionBar({ value }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="similar-video-retention">
      <span className="similar-video-stat-value">{pct}%</span>
      <div className="similar-video-retention-bar">
        <div className="similar-video-retention-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SimilarVideos({ result }) {
  const videos = result.similarVideos || result.evidenceVideos || result.videos ||
    result.evidence?.videos || [];

  if (!videos.length) return null;

  return (
    <div className="similar-videos">
      <div className="similar-videos-header">
        <h2>Схожі успішні відео на YouTube</h2>
        <a className="similar-videos-link" href="/trends">Переглянути всі →</a>
      </div>

      <div className="similar-videos-list">
        {videos.slice(0, 3).map((v, i) => {
          const title = v.title || v.video_title || 'Без назви';
          const channel = v.channel || v.channel_title || v.channelTitle || null;
          const views = v.views || v.view_count || v.viewCount || null;
          const published = v.publishedAgo || v.published_at || v.publishedAt || null;
          const retention = v.retention || v.averageRetention || v.average_retention || null;
          const thumb = v.thumbnail || v.thumbnailUrl || v.thumbnail_url || null;

          return (
            <div key={v.id || v.video_id || title + i} className="similar-video-row">
              <div className="similar-video-thumb-title">
                <VideoThumbnail url={thumb} />
                <div className="similar-video-info">
                  <div className="similar-video-title">{title}</div>
                  {channel && <div className="similar-video-channel">{channel}</div>}
                </div>
              </div>

              <div>
                <span className="similar-video-stat-label">Перегляди</span>
                <span className="similar-video-stat-value">
                  {views != null ? compactNumber(views) : '—'}
                </span>
              </div>

              <div>
                <span className="similar-video-stat-label">Опубліковано</span>
                <span className="similar-video-stat-value">{published || '—'}</span>
              </div>

              <div>
                <span className="similar-video-stat-label">Утримання (середнє)</span>
                {retention != null ? <RetentionBar value={retention} /> : <span className="similar-video-stat-value">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
