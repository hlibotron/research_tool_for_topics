import { describe, it, expect } from 'vitest';
import { marketDisplay, conceptDisplay, evidenceSummary, laneInfo } from './validationView.js';

// Frontend assertions from TZ §12.

describe('validationView — Market and Concept are separate (§9.1)', () => {
  it('market and concept are independent values', () => {
    const validation = {
      market: { score: 72, status: 'SUFFICIENT_EVIDENCE' },
      deep_review_status: 'fresh',
      deep_review: { editorial_score: 80 },
    };
    expect(marketDisplay(validation).value).toBe(72);
    expect(conceptDisplay(validation).value).toBe(80);
  });

  it('missing editorial score renders as a dash', () => {
    const c = conceptDisplay({ deep_review_status: 'missing', deep_review: {} });
    expect(c.isDash).toBe(true);
    expect(c.value).toBe('—');
  });

  it('insufficient market data renders as a dash, not a fake number', () => {
    const m = marketDisplay({ market: { status: 'insufficient_data', score: null } }, null);
    expect(m.isDash).toBe(true);
    expect(m.value).toBe('—');
  });

  it('market falls back to legacy score only when no validation block exists', () => {
    const m = marketDisplay(undefined, 55);
    expect(m.value).toBe(55);
    expect(m.isDash).toBe(false);
  });
});

describe('validationView — evidence + lane (§9.1)', () => {
  it('evidence summary shows videos · channels · families', () => {
    const summary = evidenceSummary({
      market: { counts: { relevant_video_count: 2, unique_channel_count: 2, positive_family_count: 1 } },
    });
    expect(summary).toBe('2 відео · 2 канали · 1/2 джерела');
  });

  it('lane exposes failed gates for the tooltip', () => {
    const info = laneInfo({
      readiness: { lane: 'cheap_test', ready: false, failed_gates: ['market_score < 75', 'deep_review not fresh'] },
    });
    expect(info.label).toBe('Дешевий тест');
    expect(info.tone).toBe('green');
    expect(info.failedGates).toContain('deep_review not fresh');
    expect(info.ready).toBe(false);
  });

  it('stale deep review surfaces a stale flag', () => {
    const info = laneInfo({ readiness: { lane: 'watching' }, deep_review_status: 'stale' });
    expect(info.stale).toBe(true);
    expect(conceptDisplay({ deep_review_status: 'stale', deep_review: { editorial_score: 70 } }).stale).toBe(true);
  });
});
