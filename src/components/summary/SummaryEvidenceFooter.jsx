import React from 'react';
import { Clock3, FileCheck2, ShieldCheck, Users } from 'lucide-react';

const NO_DATA = 'немає даних';

function valueOrMissing(value) {
  return value === null || value === undefined || value === '' ? NO_DATA : Number.isFinite(Number(value)) ? Number(value).toLocaleString('uk-UA') : value;
}

export default function SummaryEvidenceFooter({ summary }) {
  return (
    <footer className="summary-evidence-footer">
      <div><FileCheck2 size={18} /><span>Відео проаналізовано</span><strong>{valueOrMissing(summary.totalVideosAnalyzed)}</strong></div>
      <div><Users size={18} /><span>Каналів проаналізовано</span><strong>{valueOrMissing(summary.totalChannelsAnalyzed)}</strong></div>
      <div><ShieldCheck size={18} /><span>Якість доказів</span><strong>{valueOrMissing(summary.evidenceQuality)}</strong></div>
      <div><Clock3 size={18} /><span>Оновлено</span><strong>{valueOrMissing(summary.updatedAt)}</strong></div>
    </footer>
  );
}
