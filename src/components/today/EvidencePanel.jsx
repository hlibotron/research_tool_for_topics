import React from 'react';
import { Monitor, Youtube, Play, Users, Clock } from 'lucide-react';
import { compactNumber, percentValue, formatLabel, confidenceTone } from '../../lib/formatters.js';

function Sparkline({ value }) {
  const up = Number(value) > 0;
  const pts = up
    ? '0,36 14,28 28,22 42,14 56,10 70,5 84,2'
    : '0,2 14,6 28,12 42,18 56,24 70,28 84,36';
  const color = up ? 'var(--green)' : 'var(--red)';
  return (
    <svg width="88" height="40" viewBox="0 0 88 40" fill="none" style={{ flexShrink: 0 }}>
      <polyline points={pts} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="84" cy={up ? 2 : 36} r="3.5" fill={color} />
    </svg>
  );
}

function CompetitionArc({ level }) {
  const angles = { low: 60, medium: 130, high: 200 };
  const colors = { low: 'var(--green)', medium: 'var(--orange)', high: 'var(--red)' };
  const angle = angles[level] ?? 130;
  const color = colors[level] ?? 'var(--orange)';
  const r = 22;
  const cx = 32;
  const cy = 32;
  const toRad = deg => (deg - 90) * Math.PI / 180;
  const x = cx + r * Math.cos(toRad(angle));
  const y = cy + r * Math.sin(toRad(angle));
  const large = angle > 180 ? 1 : 0;
  const startX = cx + r * Math.cos(toRad(-90));
  const startY = cy + r * Math.sin(toRad(-90));
  return (
    <svg width="56" height="36" viewBox="8 10 48 30" fill="none" style={{ flexShrink: 0 }}>
      <path d={`M ${startX} ${startY} A ${r} ${r} 0 0 0 ${cx + r * Math.cos(toRad(270))} ${cy + r * Math.sin(toRad(270))}`}
        stroke="rgba(27,49,72,0.9)" strokeWidth="3.5" strokeLinecap="round" />
      <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${x} ${y}`}
        stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function QualityDonut({ pct, color }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} stroke="rgba(27,49,72,0.9)" strokeWidth="4.5" />
      <circle cx="22" cy="22" r={r} stroke={color} strokeWidth="4.5"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fill={color} fontSize="9" fontWeight="700">{pct}%</text>
    </svg>
  );
}

function EvidenceBlock({ title, children }) {
  return (
    <div className="todayEvidenceBlock">
      <h3 className="todayEvidenceBlockTitle">{title}</h3>
      {children}
    </div>
  );
}

export default function EvidencePanel({ best, videosAnalyzed, channelsAnalyzed, lastUpdated }) {
  if (!best) return null;

  const demandGrowth = best.demandGrowth ?? best.demand_growth ?? best.trendGrowth ?? null;
  const competition = best.competitionLevel || best.competition_level || null;
  const avgRetention = best.avgRetention ?? best.average_retention ?? null;
  const confidence = best.confidence || null;
  const recommendedFormat = best.recommendedFormat || best.recommended_format || null;

  const competitionTone = competition === 'low' ? 'green' : competition === 'high' ? 'red' : 'orange';
  const competitionLabel = { low: 'Low', medium: 'Medium', high: 'High' }[competition] || competition;
  const competitionDesc = { low: 'Низька конкуренція', medium: 'Середня конкуренція', high: 'Висока конкуренція' }[competition] || '';
  const confidenceLabel = { high: 'Висока', medium: 'Середня', low: 'Низька' }[confidence] || confidence;
  const confidenceDesc = {
    high: 'Достатньо даних для надійного прогнозу',
    medium: 'Середня кількість даних для прогнозу',
    low: 'Мало даних, прогноз приблизний',
  }[confidence] || '';

  const evidenceQualityRaw = best.evidenceQuality ?? null;
  const qualityPct = (typeof evidenceQualityRaw === 'number' && !isNaN(evidenceQualityRaw))
    ? Math.round(evidenceQualityRaw)
    : (confidence === 'high' ? 87 : confidence === 'medium' ? 55 : 30);
  const qualityColor = confidence === 'high' ? 'var(--green)' : confidence === 'medium' ? 'var(--orange)' : 'var(--red)';

  return (
    <section className="todayEvidencePanel">
      <h2 className="todaySectionTitle">Чому ми це радимо</h2>
      <div className="todayEvidenceGrid">

        <EvidenceBlock title="Попит у динаміці">
          {demandGrowth != null ? (
            <div className="todayEvidenceChartRow">
              <div>
                <strong className={`todayBigStat ${Number(demandGrowth) > 0 ? 'green' : 'red'}`}>
                  {percentValue(demandGrowth)}
                </strong>
                <p className="todayMuted">за останні 7 днів</p>
              </div>
              <Sparkline value={demandGrowth} />
            </div>
          ) : (
            <p className="todayMuted">Немає даних про динаміку попиту</p>
          )}
        </EvidenceBlock>

        <EvidenceBlock title="Конкуренція">
          {competition ? (
            <div className="todayEvidenceChartRow">
              <div>
                <strong className={`todayBigStat ${competitionTone}`}>{competitionLabel}</strong>
                {competitionDesc && <p className="todayMuted">{competitionDesc}</p>}
                {channelsAnalyzed > 0 && (
                  <p className="todayMuted">{compactNumber(channelsAnalyzed)} каналів знімають цю тему</p>
                )}
              </div>
              <CompetitionArc level={competition} />
            </div>
          ) : (
            <p className="todayMuted">Немає даних про конкуренцію</p>
          )}
        </EvidenceBlock>

        <EvidenceBlock title="Найкращий формат">
          {recommendedFormat ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Monitor size={18} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                <strong className="todayBigStat neutral" style={{ fontSize: 17 }}>{formatLabel(recommendedFormat)}</strong>
              </div>
              {avgRetention != null && (
                <p className="todayMuted">Сер. утримання: {Math.round(Number(avgRetention))}%</p>
              )}
              <p className="todayMuted">Найкращий для цієї теми</p>
            </>
          ) : (
            <p className="todayMuted">Формат не визначено</p>
          )}
        </EvidenceBlock>

        <EvidenceBlock title="Якість доказів">
          {confidence ? (
            <div className="todayEvidenceChartRow">
              <div>
                <strong className={`todayBigStat ${confidenceTone(confidence)}`}>{confidenceLabel}</strong>
                {confidenceDesc && <p className="todayMuted">{confidenceDesc}</p>}
              </div>
              <QualityDonut pct={qualityPct} color={qualityColor} />
            </div>
          ) : (
            <p className="todayMuted">Confidence не визначено</p>
          )}
        </EvidenceBlock>

      </div>

      <div className="todayEvidenceFooterRow">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Youtube size={13} style={{ color: '#ff0000', flexShrink: 0 }} />
          Джерела: YouTube
        </span>
        {videosAnalyzed > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Play size={12} style={{ flexShrink: 0 }} />
            {compactNumber(videosAnalyzed)} відео
          </span>
        )}
        {channelsAnalyzed > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={12} style={{ flexShrink: 0 }} />
            {compactNumber(channelsAnalyzed)} каналів
          </span>
        )}
        {lastUpdated && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={12} style={{ flexShrink: 0 }} />
            Оновлено {lastUpdated}
          </span>
        )}
      </div>
    </section>
  );
}
