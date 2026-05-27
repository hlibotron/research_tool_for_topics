import React from 'react';
import { Youtube, Play, Users, Clock } from 'lucide-react';
import { compactNumber } from '../../lib/formatters.js';

export default function OpportunityEvidenceFooter({ opportunities }) {
  let totalVideos = 0;
  let totalChannels = 0;
  let latestUpdated = null;
  let hasVideoData = false;
  let hasChannelData = false;

  opportunities.forEach(item => {
    const v = item.dataHealth?.videosAnalyzed || item.videosAnalyzed || item.videos_analyzed || 0;
    const c = item.dataHealth?.sourcesCount || item.channelsAnalyzed || item.channels_analyzed || item.sourcesCount || 0;
    const upd = item.dataHealth?.lastUpdated || item.lastUpdated || item.updated_at || null;
    if (v > 0) { totalVideos += v; hasVideoData = true; }
    if (c > 0) { totalChannels = Math.max(totalChannels, c); hasChannelData = true; }
    if (upd && !latestUpdated) latestUpdated = upd;
  });

  return (
    <footer className="opportunity-evidence-footer">
      <span className="opp-footer-title">Джерела даних та докази</span>
      <div className="opp-footer-item">
        <Youtube size={15} color="#ff0000" />
        <span>YouTube API</span>
      </div>
      <div className="opp-footer-item">
        <Play size={14} />
        <span>Відео проаналізовано: <strong>{hasVideoData ? compactNumber(totalVideos) : 'немає даних'}</strong></span>
      </div>
      <div className="opp-footer-item">
        <Users size={14} />
        <span>Каналів проаналізовано: <strong>{hasChannelData ? compactNumber(totalChannels) : 'немає даних'}</strong></span>
      </div>
      {latestUpdated && (
        <div className="opp-footer-item">
          <Clock size={14} />
          <span>Оновлено: <strong>{latestUpdated}</strong></span>
        </div>
      )}
    </footer>
  );
}
