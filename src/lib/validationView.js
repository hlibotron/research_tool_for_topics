// Pure view-helpers for the idea-validation engine block. Kept framework-free so
// they can be unit-tested (vitest) the same way the rest of the dashboard logic is.

export const LANE_LABEL = {
  ready_to_plan: 'Готова в план',
  cheap_test: 'Дешевий тест',
  global_adaptation: 'Глобальна адаптація',
  watching: 'Спостерігаємо',
  parked: 'Пасуємо',
  planned: 'В плані',
  growing: 'Ріст',
  needs_review: 'Потребує перевірки',
};

export const LANE_TONE = {
  ready_to_plan: 'blue',
  cheap_test: 'green',
  global_adaptation: 'purple',
  watching: 'neutral',
  parked: 'red',
  planned: 'purple',
  growing: 'green',
  needs_review: 'orange',
};

function scoreTone(value) {
  if (value >= 75) return 'green';
  if (value >= 60) return 'blue';
  if (value >= 45) return 'orange';
  return 'red';
}

// Market score — deterministic, never merged with editorial. Dash when there is
// no data / insufficient coverage.
export function marketDisplay(validation, fallbackScore) {
  const market = validation?.market || {};
  const score = market.score;
  const noData = market.status === 'insufficient_data' || score === null || score === undefined;
  if (noData && (fallbackScore === null || fallbackScore === undefined)) {
    return { value: '—', isDash: true, tone: 'neutral' };
  }
  const v = score ?? fallbackScore ?? 0;
  return { value: Math.round(v), isDash: false, tone: scoreTone(v) };
}

// Concept (editorial) — only shown when a fresh deep review exists; "—" otherwise.
export function conceptDisplay(validation) {
  const status = validation?.deep_review_status;
  const editorial = (validation?.deep_review || {}).editorial_score;
  if (status === 'fresh' && editorial != null) {
    return { value: Math.round(editorial), isDash: false, stale: false, tone: editorial >= 65 ? 'green' : 'orange' };
  }
  if (status === 'stale' && editorial != null) {
    return { value: Math.round(editorial), isDash: false, stale: true, tone: 'neutral' };
  }
  return { value: '—', isDash: true, stale: false, tone: 'neutral' };
}

export function evidenceSummary(validation) {
  const counts = validation?.market?.counts;
  if (!counts) return null;
  return `${counts.relevant_video_count || 0} відео · ${counts.unique_channel_count || 0} канали · ${counts.positive_family_count || 0}/2 джерела`;
}

export function laneInfo(validation, fallbackStatus) {
  const readiness = validation?.readiness || {};
  const lane = readiness.lane || fallbackStatus || 'watching';
  return {
    lane,
    label: LANE_LABEL[lane] || lane,
    tone: LANE_TONE[lane] || 'neutral',
    failedGates: readiness.failed_gates || [],
    ready: Boolean(readiness.ready),
    stale: validation?.deep_review_status === 'stale',
  };
}
