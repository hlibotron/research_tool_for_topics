import React from 'react';
import { compactNumber, percentValue, confidenceTone } from '../../lib/formatters.js';

function CircularScore({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const r = 26;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  const color = pct >= 70 ? '#36c177' : pct >= 50 ? '#f59e2e' : '#e75d5d';
  return (
    <div className="todayCircularScore">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(27,49,72,0.9)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="todayCircularLabel">
        <strong style={{ color }}>{pct}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function MetricItem({ label, children }) {
  return (
    <div className="todayMetricItem">
      <div className="todayMetricBody">{children}</div>
      <span className="todayMetricLabel">{label}</span>
    </div>
  );
}

function DotValue({ value, tone }) {
  return (
    <div className="todayDotValue">
      <span className={`todayDot todayDot${tone}`} />
      <strong className={`todayMetricValue ${tone}`}>{value}</strong>
    </div>
  );
}

const confidenceLabel = { high: 'High', medium: 'Medium', low: 'Low' };
const competitionLabel = { low: 'Low', medium: 'Medium', high: 'High' };
const competitionTone = { low: 'green', medium: 'orange', high: 'red' };

export default function DecisionMetricStrip({ best, videosAnalyzed, channelsAnalyzed }) {
  if (!best) return null;

  const score = Math.round(Number(best.opportunityScore ?? best.opportunity_score ?? 0));
  const confidence = best.confidence || null;
  const demandGrowth = best.demandGrowth ?? best.demand_growth ?? best.trendGrowth ?? null;
  const competition = best.competitionLevel || best.competition_level || null;
  const avgRetention = best.avgRetention ?? best.average_retention ?? null;

  return (
    <div className="todayMetricStrip">
      <MetricItem label="Opportunity Score">
        <CircularScore score={score} />
      </MetricItem>

      {confidence && (
        <MetricItem label="Впевненість">
          <DotValue
            value={confidenceLabel[confidence] || confidence}
            tone={confidenceTone(confidence)}
          />
        </MetricItem>
      )}

      {demandGrowth != null && (
        <MetricItem label="Попит зростає">
          <div>
            <strong className={`todayMetricValue ${Number(demandGrowth) > 0 ? 'green' : 'red'}`}>
              {percentValue(demandGrowth)}
            </strong>
            <p className="todayMetricSub">за останні 7 днів</p>
          </div>
        </MetricItem>
      )}

      {competition && (
        <MetricItem label="Конкуренція">
          <DotValue
            value={competitionLabel[competition] || competition}
            tone={competitionTone[competition] || 'orange'}
          />
        </MetricItem>
      )}

      {avgRetention != null && (
        <MetricItem label="Сер. утримання">
          <strong className="todayMetricValue neutral">
            {Math.round(Number(avgRetention))}%
          </strong>
        </MetricItem>
      )}

      <MetricItem label="Відео проаналізовано">
        <strong className="todayMetricValue neutral">
          {videosAnalyzed ? compactNumber(videosAnalyzed) : '—'}
        </strong>
      </MetricItem>

      <MetricItem label="Каналів проаналізовано">
        <strong className="todayMetricValue neutral">
          {channelsAnalyzed ? compactNumber(channelsAnalyzed) : '—'}
        </strong>
      </MetricItem>
    </div>
  );
}
