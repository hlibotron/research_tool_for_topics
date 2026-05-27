import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import { Link } from '../../lib/shared.jsx';
import { formatLabel } from '../../lib/formatters.js';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function windowAction(window) {
  const score = window?.score;
  if (!hasNumber(score)) return { title: 'Зачекайте', reason: 'API не повернув достатньо даних для оцінки вікна.', badge: 'Недостатньо даних', tone: 'orange' };
  if (Number(score) >= 8) return { title: 'Дійте зараз', reason: `Вікно можливостей ${score}/10: сигнал достатньо сильний.`, badge: 'Оптимальний час', tone: 'green' };
  if (Number(score) >= 5) return { title: 'Перевірте кут перед зйомкою', reason: `Вікно ${score}/10: потрібна обережність через конкуренцію або evidence.`, badge: 'Обережно', tone: 'orange' };
  return { title: 'Не чіпайте як основну ставку', reason: `Вікно ${score}/10: сигнал слабкий.`, badge: 'Слабке', tone: 'red' };
}

export default function SummaryRecommendations({ summary }) {
  const growing = summary.bestGrowing;
  const bestFormat = summary.bestFormat;
  const action = windowAction(summary.opportunityWindow);
  return (
    <Card className="summary-recommendations">
      <h2>Що це означає для вас</h2>
      <div className="summary-recommendation-grid">
        <article className="summary-recommendation-card">
          <span className="summary-rec-num green">1</span>
          <div>
            <h3>Робіть відео про {growing?.label || 'тему з ростом'}</h3>
            <p>{growing ? `Попит росте: ${growing.effectiveChange > 0 ? '+' : ''}${Math.round(growing.effectiveChange)}%.` : 'Немає підтвердженого rising сигналу.'}</p>
            <Badge tone="green">Високий потенціал</Badge>
          </div>
          <Link className="summary-rec-link" href="/opportunities" aria-label="Перейти до Можливостей"><ArrowRight size={18} /></Link>
        </article>
        <article className="summary-recommendation-card">
          <span className="summary-rec-num blue">2</span>
          <div>
            <h3>Вибирайте {bestFormat ? formatLabel(bestFormat) : 'перевірений'} формат</h3>
            <p>{bestFormat ? 'Цей формат має найкращий доступний performance у summary.' : 'API не повернув best format.'}</p>
            <Badge tone="blue">Найкраща ефективність</Badge>
          </div>
          <Link className="summary-rec-link" href="/idea-lab" aria-label="Перевірити ідею"><PlayCircle size={18} /></Link>
        </article>
        <article className="summary-recommendation-card">
          <span className={`summary-rec-num ${action.tone === 'red' ? 'red' : action.tone === 'green' ? 'green' : 'orange'}`}>3</span>
          <div>
            <h3>{action.title}</h3>
            <p>{action.reason}</p>
            <Badge tone={action.tone}>{action.badge}</Badge>
          </div>
          <Link className="summary-rec-link" href="/trends" aria-label="Відкрити Trend Radar"><Clock3 size={18} /></Link>
        </article>
      </div>
    </Card>
  );
}
