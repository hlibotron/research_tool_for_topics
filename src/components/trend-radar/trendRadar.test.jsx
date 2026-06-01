import { describe, expect, it } from 'vitest';
import { applyFilters, normalizeTrendItem } from '../../pages/TrendRadarPage.jsx';
import { backlogCandidateFromTopic } from './TrendTopicDrawer.jsx';
import { trendTimeseriesQuery } from './TrendDynamicsChart.jsx';

const DEFAULT_FILTERS = {
  search: '',
  category: 'all',
  direction: 'all',
  minEvidence: 0,
  lane: 'all',
  format: 'any',
  language: 'any',
  source: 'any',
  minVph: 0,
  minOutlier: 0,
};

describe('Trend Radar normalization', () => {
  it('keeps metadata tag origins visible without inventing a hashtag', () => {
    const item = normalizeTrendItem({ term: 'Ollama tutorial', label: 'Ollama tutorial', origins: ['metadata_tag'] }, 'hashtags');
    expect(item.label).toBe('Ollama tutorial');
    expect(item.raw.origins).toEqual(['metadata_tag']);
  });

  it('excludes missing evidence when a minimum evidence filter is active', () => {
    const items = [
      normalizeTrendItem({ id: 'missing', name: 'Missing' }, 'topics'),
      normalizeTrendItem({ id: 'strong', name: 'Strong', confidence: 85 }, 'topics'),
    ];
    expect(applyFilters(items, { ...DEFAULT_FILTERS, minEvidence: 60 }).map((item) => item.id)).toEqual(['strong']);
  });

  it('filters VPH and context lane with the same model consumed by the chart query', () => {
    const items = [
      normalizeTrendItem({ id: 'core', title: 'Core', lane: 'core', viewsPerHour: 80 }, 'videos'),
      normalizeTrendItem({ id: 'context', title: 'Context', lane: 'context', viewsPerHour: 10 }, 'videos'),
    ];
    expect(applyFilters(items, { ...DEFAULT_FILTERS, lane: 'core', minVph: 25 }).map((item) => item.id)).toEqual(['core']);
  });
});

describe('Trend Radar chart filters', () => {
  it('combines chart filters with metric and dimension in the timeseries query', () => {
    const query = new URLSearchParams(trendTimeseriesQuery({
      ...DEFAULT_FILTERS,
      days: 30,
      category: 'Science & Technology',
      direction: 'rising',
      minEvidence: 60,
      minVph: 25,
    }, 'velocity', 'channels'));
    expect(query.get('metric')).toBe('velocity');
    expect(query.get('dimension')).toBe('channels');
    expect(query.get('category')).toBe('Science & Technology');
    expect(query.get('direction')).toBe('rising');
    expect(query.get('minEvidence')).toBe('60');
    expect(query.get('minVph')).toBe('25');
  });
});

describe('Trend Radar topic drawer', () => {
  it('creates a Backlog import candidate with evidence', () => {
    const evidence = [{ video_id: 'abc', url: 'https://www.youtube.com/watch?v=abc' }];
    expect(backlogCandidateFromTopic({ id: 'topic-1', name: 'Ollama на ноутбуці', trendVelocity: 72 }, evidence)).toMatchObject({
      source: 'trend_radar',
      source_id: 'topic-1',
      title: 'Ollama на ноутбуці',
      score: 72,
      evidence,
    });
  });
});
