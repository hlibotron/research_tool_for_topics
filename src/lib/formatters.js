export const numberFmt = new Intl.NumberFormat('uk-UA');

export function compactNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  if (Math.abs(number) >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return numberFmt.format(Math.round(number));
}

export function percentValue(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0%';
  return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`;
}

export function formatLabel(value) {
  return {
    shorts: 'Shorts',
    long_video: 'Long video',
    'long-form': 'Long-form',
    long_form: 'Long-form',
    stream: 'Stream',
    tutorial: 'Tutorial',
    comparison: 'Comparison',
    reaction: 'Reaction',
    experiment: 'Experiment',
  }[value] || value || '-';
}

export function actionTone(action) {
  if (action === 'shoot_now') return 'green';
  if (action === 'avoid') return 'red';
  if (action === 'watch') return 'orange';
  return 'blue';
}

export function trendTone(status) {
  if (status === 'rising') return 'green';
  if (status === 'falling') return 'red';
  return 'orange';
}

export function confidenceTone(confidence) {
  if (confidence === 'high') return 'green';
  if (confidence === 'low') return 'red';
  return 'orange';
}
