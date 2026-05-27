import React from 'react';
import { Youtube } from 'lucide-react';
import { compactNumber } from '../../lib/formatters.js';

export default function DataEvidenceFooter({ videosAnalyzed, channelsAnalyzed, lastUpdated }) {
  return (
    <div className="todayDataFooter">
      <Youtube size={16} />
      <span>Джерела: YouTube</span>
      {videosAnalyzed > 0 && <span>{compactNumber(videosAnalyzed)} відео</span>}
      {channelsAnalyzed > 0 && <span>{compactNumber(channelsAnalyzed)} каналів</span>}
      {lastUpdated && <span>Оновлено {lastUpdated}</span>}
    </div>
  );
}
