import { describe, expect, it } from 'vitest';
import { groupByColumn, normalizeOpportunity } from './opportunityModel.js';

describe('opportunity board columns', () => {
  it('uses the persisted observe override instead of the automatic classifier', () => {
    const item = normalizeOpportunity({
      id: 'topic-1',
      title: 'Promising topic',
      opportunityScore: 90,
      confidence: 'high',
      evidence: ['one', 'two'],
      boardColumn: 'observe',
    });
    expect(item.column).toBe('observe');
    expect(groupByColumn([item]).observe).toEqual([item]);
  });
});
