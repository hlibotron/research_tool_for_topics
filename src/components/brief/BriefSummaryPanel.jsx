import React from 'react';
import { Users, TrendingUp, BarChart2, Zap, Clock } from 'lucide-react';

function competitionTone(level) {
  if (level === 'low') return 'green';
  if (level === 'high') return 'red';
  return 'orange';
}

function competitionLabel(level) {
  return { low: 'Низький', medium: 'Середній', high: 'Високий' }[level] || level || '—';
}

function retentionLabel(value) {
  const n = Number(value);
  if (!n) return null;
  if (n >= 60) return 'Високий';
  if (n >= 40) return 'Середній';
  return 'Низький';
}

function retentionTone(value) {
  const n = Number(value);
  if (n >= 60) return 'green';
  if (n >= 40) return 'orange';
  return 'red';
}

export default function BriefSummaryPanel({ brief }) {
  const { targetAudience, retentionPotential, competitionLevel, firstAction, updatedAt } = brief;
  const compLevel = competitionLabel(competitionLevel);
  const compTone = competitionTone(competitionLevel);
  const retLabel = retentionLabel(retentionPotential);
  const retTone = retentionTone(retentionPotential);

  return (
    <div className="brief-summary-panel">
      <h3 className="brief-summary-title">Коротко про цей бріф</h3>

      <div className="brief-summary-item">
        <div className="brief-summary-icon blue"><Users size={15} /></div>
        <div>
          <span className="brief-summary-item-label">Цільова аудиторія</span>
          <span className="brief-summary-item-value">{targetAudience || 'не визначено'}</span>
        </div>
      </div>

      <div className="brief-summary-item">
        <div className={`brief-summary-icon ${retTone || 'neutral'}`}><TrendingUp size={15} /></div>
        <div>
          <span className="brief-summary-item-label">Потенціал утримання</span>
          <span className={`brief-summary-item-value ${retTone || ''}`}>
            {retLabel || 'не визначено'}
          </span>
          {retentionPotential && (
            <span className="brief-summary-item-sub">
              Очікуване утримання {Math.round(Number(retentionPotential))}%
            </span>
          )}
        </div>
      </div>

      <div className="brief-summary-item">
        <div className={`brief-summary-icon ${compTone}`}><BarChart2 size={15} /></div>
        <div>
          <span className="brief-summary-item-label">Рівень конкуренції</span>
          <span className={`brief-summary-item-value ${compTone}`}>
            {competitionLevel ? compLevel : 'не визначено'}
          </span>
          {brief.channelsAnalyzed > 0 && (
            <span className="brief-summary-item-sub">{brief.channelsAnalyzed} каналів знімають цю тему</span>
          )}
        </div>
      </div>

      <div className="brief-summary-item">
        <div className="brief-summary-icon orange"><Zap size={15} /></div>
        <div>
          <span className="brief-summary-item-label">Перша дія</span>
          <span className="brief-summary-item-value">
            {firstAction || (brief.nextActions?.[0]) || 'не визначено'}
          </span>
        </div>
      </div>

      {updatedAt && (
        <div className="brief-summary-item">
          <div className="brief-summary-icon neutral"><Clock size={15} /></div>
          <div>
            <span className="brief-summary-item-label">Оновлено</span>
            <span className="brief-summary-item-value">Бріф оновлено {updatedAt}</span>
            <span className="brief-summary-item-sub">на основі даних YouTube</span>
          </div>
        </div>
      )}
    </div>
  );
}
