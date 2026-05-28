export const COLUMN_KEYS = ['shoot_now', 'adapt', 'priority', 'high_potential', 'park'];

export const COLUMN_LABELS = {
  shoot_now: 'Знімати зараз',
  adapt: 'Адаптувати',
  priority: 'Пріоритетно',
  high_potential: 'Високий потенціал',
  park: 'Паркувати',
};

export const COLUMN_ACCENTS = {
  shoot_now: 'green',
  adapt: 'orange',
  priority: 'blue',
  high_potential: 'purple',
  park: 'gray',
};

export function classifyToColumn(item) {
  const score = Number(item.score) || 0;
  const confidence = Number(item.confidence) || 0;
  const action = item.action || 'watch';
  const trend = Number(item.trendDeltaPercent) || 0;
  const gap = Number(item.gapPercent) || 0;
  const evidenceCount = Number(item.evidenceCount) || 0;

  if (action === 'avoid' || score < 40) return 'park';

  // "Знімати зараз" вимагає хоча б 2 джерела доказів, інакше це не безпечна рекомендація
  if (score >= 75 && confidence >= 50 && action !== 'avoid' && evidenceCount >= 2) return 'shoot_now';
  if (score >= 75 && confidence >= 50 && action !== 'avoid' && evidenceCount < 2) return 'adapt';

  if (score >= 55 && score < 75 && (gap >= 60 || trend >= 30)) return 'priority';

  if (score >= 60 && trend >= 50) return 'high_potential';

  if (action === 'adapt' || (score >= 40 && score < 60)) return 'adapt';

  if (score >= 60) return 'high_potential';

  return 'park';
}
