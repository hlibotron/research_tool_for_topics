import React from 'react';
import { Youtube, Play, Users, Clock } from 'lucide-react';
import { compactNumber } from '../../lib/formatters.js';

export default function BriefEvidenceFooter({ brief }) {
  const { videosAnalyzed, channelsAnalyzed, updatedAt } = brief;

  return (
    <footer className="brief-evidence-footer">
      <div className="brief-footer-item">
        <Youtube size={14} color="#ff0000" />
        <span>Джерело: <strong>YouTube</strong></span>
      </div>
      <div className="brief-footer-item">
        <Play size={13} />
        <span>Відео проаналізовано: <strong>{videosAnalyzed > 0 ? compactNumber(videosAnalyzed) : 'немає даних'}</strong></span>
      </div>
      <div className="brief-footer-item">
        <Users size={13} />
        <span>Каналів проаналізовано: <strong>{channelsAnalyzed > 0 ? compactNumber(channelsAnalyzed) : 'немає даних'}</strong></span>
      </div>
      {updatedAt && (
        <div className="brief-footer-item">
          <Clock size={13} />
          <span>Оновлено: <strong>{updatedAt}</strong></span>
        </div>
      )}
    </footer>
  );
}
