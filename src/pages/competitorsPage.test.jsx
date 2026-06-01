import { describe, it, expect } from 'vitest';
import {
  nextVideoSort,
  formatReach,
  formatEngagement,
  formatOutlier,
  vphBadgeLabel,
  kpiPrimaryValue,
  shouldShowDataHealthBanner,
  returnToAllState,
  resetVideoPaging,
} from './CompetitorsPage.jsx';

describe('CompetitorsPage pure helpers', () => {
  // 1. Resetting from a focused growth leader returns competitor_id to "all".
  it('returnToAllState resets competitor_id to all', () => {
    const next = returnToAllState({ competitor_id: 'UCabc', video_offset: 80, days: 7 });
    expect(next.competitor_id).toBe('all');
    expect(next.days).toBe(7); // other filters preserved
  });

  // 2. Choosing "Всі конкуренти" also resets pagination (and the page clears chart focus).
  it('returnToAllState resets pagination offset', () => {
    const next = returnToAllState({ competitor_id: 'UCabc', video_offset: 120 });
    expect(next.video_offset).toBe(0);
    expect(next.video_limit).toBe(40);
  });

  // 3. A sort header toggles DESC -> ASC on re-click (and never resets to none).
  it('nextVideoSort toggles desc to asc and back', () => {
    expect(nextVideoSort('published_at', 'desc', 'views')).toEqual({ video_sort: 'views', video_order: 'desc' });
    expect(nextVideoSort('views', 'desc', 'views')).toEqual({ video_sort: 'views', video_order: 'asc' });
    expect(nextVideoSort('views', 'asc', 'views')).toEqual({ video_sort: 'views', video_order: 'desc' });
  });

  // 4. A missing Reach x renders as an em dash, not 0.
  it('formatReach shows em dash for null', () => {
    expect(formatReach(null)).toBe('—');
    expect(formatReach(undefined)).toBe('—');
    expect(formatReach(10)).toBe('10.0x');
    expect(formatOutlier(null)).toBe('—');
    expect(formatEngagement(null)).toBe('—');
    expect(formatEngagement(0.0458)).toBe('4.6%');
  });

  // 5. The VPH badge distinguishes observed from estimated velocity.
  it('vphBadgeLabel distinguishes observed and estimated', () => {
    expect(vphBadgeLabel('observed')).toBe('observed');
    expect(vphBadgeLabel('estimated')).toBe('estimated');
    expect(vphBadgeLabel(undefined)).toBe('estimated');
  });

  // 6. The primary KPI uses the configured competitor count, not the active count.
  it('kpiPrimaryValue uses configured competitor count', () => {
    const summary = { configured_competitors: 42, active_publishers: 7 };
    expect(kpiPrimaryValue(summary)).toBe(42);
    expect(kpiPrimaryValue({})).toBe(0);
  });

  // 7. The degraded banner shows only in fallback mode.
  it('shouldShowDataHealthBanner only in degraded mode', () => {
    expect(shouldShowDataHealthBanner({ degraded: true })).toBe(true);
    expect(shouldShowDataHealthBanner({ degraded: false })).toBe(false);
    expect(shouldShowDataHealthBanner(null)).toBe(false);
  });

  // 8. Filter and sort changes return an expanded video list to its first chunk.
  it('resetVideoPaging resets cumulative video loading', () => {
    const next = resetVideoPaging({ video_limit: 240, video_offset: 80, region: 'all' }, { region: 'usa' });
    expect(next.video_limit).toBe(40);
    expect(next.video_offset).toBe(0);
    expect(next.region).toBe('usa');
  });
});
