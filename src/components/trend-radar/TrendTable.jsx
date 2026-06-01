import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ImageIcon } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { compactNumber, formatLabel, numberFmt } from '../../lib/formatters.js';

const NO_DATA = 'немає даних';
const PAGE_SIZE = 8;

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function textOrMissing(value) {
  return value === null || value === undefined || value === '' ? NO_DATA : value;
}

function numberOrMissing(value) {
  return hasNumber(value) ? numberFmt.format(Number(value)) : NO_DATA;
}

function compactOrMissing(value) {
  return hasNumber(value) ? compactNumber(value) : NO_DATA;
}

function percentOrMissing(value) {
  if (!hasNumber(value)) return NO_DATA;
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${Math.round(number)}%`;
}

function retentionOrMissing(value) {
  if (!hasNumber(value)) return NO_DATA;
  const number = Number(value);
  return number <= 1 ? `${Math.round(number * 100)}%` : `${Math.round(number)}%`;
}

function directionMeta(direction) {
  if (direction === 'rising') return { label: 'Зростає', tone: 'green', icon: <ArrowUp size={14} /> };
  if (direction === 'falling') return { label: 'Падає', tone: 'red', icon: <ArrowDown size={14} /> };
  return { label: 'Стабільно', tone: 'blue', icon: <ArrowRight size={14} /> };
}

function competitionMeta(level) {
  const text = String(level || '').toLowerCase();
  if (text === 'high') return { label: 'Високий', tone: 'red' };
  if (text === 'medium') return { label: 'Середній', tone: 'orange' };
  if (text === 'low') return { label: 'Низький', tone: 'green' };
  return { label: textOrMissing(level), tone: 'neutral' };
}

function EvidenceBadge({ value }) {
  if (!hasNumber(value)) return <span className="muted">{NO_DATA}</span>;
  const number = Math.max(0, Math.min(100, Math.round(Number(value))));
  const tone = number >= 80 ? 'green' : number >= 60 ? 'orange' : 'red';
  return <span className={`trend-evidence-badge ${tone}`} style={{ '--evidence': `${number}%` }}>{number}%</span>;
}

function RecommendationBadge({ item }) {
  const meta = item.recommendationMeta || { label: NO_DATA, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function TrendDirectionBadge({ direction }) {
  const meta = directionMeta(direction);
  return <Badge tone={meta.tone} className="trend-direction-badge">{meta.icon}{meta.label}</Badge>;
}

function TableEmpty({ tab, isFiltered, onResetFilters }) {
  return (
    <EmptyState
      title={isFiltered ? 'Немає результатів за фільтрами' : 'Немає даних для цього розділу'}
      text={isFiltered ? 'Скиньте фільтри або зменшіть мінімальний рівень доказів.' : `Дані для вкладки ${tab} відсутні в API.`}
      action={isFiltered ? <Button ghost onClick={onResetFilters}>Скинути фільтри</Button> : null}
    />
  );
}

function StandardTrendRows({ items, onOpenTopic }) {
  return items.map((item) => {
    const competition = competitionMeta(item.competitionLevel);
    const subtitleText = item.subtitle && item.label && String(item.subtitle).trim() !== String(item.label).trim()
      ? item.subtitle
      : '';
    const subtitlePrefix = item.type === 'topics' && subtitleText ? 'напр.: ' : '';
    return (
      <tr key={`${item.type}-${item.id}`} className={item.type === 'topics' ? 'trend-topic-clickable' : ''} onClick={item.type === 'topics' ? () => onOpenTopic?.(item) : undefined}>
        <td>
          <strong>{textOrMissing(item.label)}</strong>
          {subtitleText ? <small>{subtitlePrefix}{subtitleText}</small> : null}
          {item.type === 'hashtags' && item.raw?.origins?.length ? <small>{item.raw.origins.map((origin) => <Badge key={origin} tone={origin === 'metadata_tag' ? 'blue' : 'green'}>{origin === 'metadata_tag' ? 'metadata tag' : 'visible hashtag'}</Badge>)}</small> : null}
        </td>
        <td><TrendDirectionBadge direction={item.direction} /></td>
        <td className={Number(item.demandGrowth) < 0 ? 'trend-negative' : Number(item.demandGrowth) > 0 ? 'trend-positive' : ''}>{percentOrMissing(item.demandGrowth)}</td>
        <td><Badge tone={competition.tone}>{competition.label}</Badge></td>
        <td>{numberOrMissing(item.videosAnalyzed)}</td>
        <td>{numberOrMissing(item.channelsAnalyzed)}</td>
        <td><EvidenceBadge value={item.evidenceQuality} /></td>
        <td><RecommendationBadge item={item} /></td>
      </tr>
    );
  });
}

function TopicHashtagTable({ tab, items, filteredTotal, totalItems, isFiltered, onResetFilters, onOpenTopic }) {
  return (
    <Card className="trend-table">
      <div className="trend-table-header">
        <h2>{tab === 'topics' ? 'Теми' : 'Теги / хештеги'}</h2>
        <span>{numberFmt.format(filteredTotal)} / {numberFmt.format(totalItems)}</span>
      </div>
      {!items.length ? <TableEmpty tab={tab} isFiltered={isFiltered} onResetFilters={onResetFilters} /> : (
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                <th>Назва</th>
                <th>Напрям</th>
                <th>Зростання попиту</th>
                <th>Рівень конкуренції</th>
                <th>Відео проаналізовано</th>
                <th>Каналів проаналізовано</th>
                <th>Якість доказів</th>
                <th>Рекомендація</th>
              </tr>
            </thead>
            <tbody><StandardTrendRows items={items} onOpenTopic={onOpenTopic} /></tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const LANG_LABELS = { uk: '🇺🇦 UK', en: 'EN', ru: 'RU', unknown: null };

function LangBadge({ lang }) {
  const label = LANG_LABELS[lang] ?? (lang || null);
  if (!label) return null;
  return <span className={`trend-lang-badge trend-lang-${lang}`}>{label}</span>;
}

function VideoRows({ items, isFiltered, onResetFilters }) {
  if (!items.length) return <Card className="trend-table"><TableEmpty tab="videos" isFiltered={isFiltered} onResetFilters={onResetFilters} /></Card>;
  return (
    <section className="trend-table trend-video-list">
      {items.map((item) => {
        const raw = item.raw || {};
        const thumbnail = raw.thumbnail || raw.thumbnailUrl || raw.thumbnail_url;
        const lang = raw.language || raw.language_guess;
        return (
          <article className="trend-video-row" key={`${item.type}-${item.id}`}>
            <div className="trend-video-thumb">
              {thumbnail ? <a href={raw.url} target="_blank" rel="noreferrer"><img src={thumbnail} alt="" /></a> : <ImageIcon size={20} />}
            </div>
            <div className="trend-video-main">
              <strong>{raw.url ? <a href={raw.url} target="_blank" rel="noreferrer">{textOrMissing(item.label)}</a> : textOrMissing(item.label)}</strong>
              <span>{textOrMissing(raw.channel || raw.channel_title || item.subtitle)}</span>
            </div>
            <div><span>Перегляди</span><strong>{compactOrMissing(raw.views)}</strong></div>
            <div><span>Опубліковано</span><strong>{textOrMissing(raw.publishedAt || raw.published_at || item.updatedAt)}</strong></div>
            <div><span>VPH</span><strong>{hasNumber(raw.viewsPerHour) ? `${compactNumber(raw.viewsPerHour)}/год` : NO_DATA}</strong><small>{raw.metricSource || 'estimated'}</small></div>
            <div><span>Outlier</span><strong>{hasNumber(raw.outlierRatio) ? `${Number(raw.outlierRatio).toFixed(1)}x` : NO_DATA}</strong></div>
            <div><span>Мова</span><strong>{lang && lang !== 'unknown' ? <LangBadge lang={lang} /> : NO_DATA}</strong></div>
            <RecommendationBadge item={item} />
          </article>
        );
      })}
    </section>
  );
}

function KeywordRows({ items, isFiltered, onResetFilters }) {
  return (
    <Card className="trend-table">
      <div className="trend-table-header"><h2>Ключові слова · UA proxy</h2><span>{numberFmt.format(items.length)}</span></div>
      {!items.length ? <TableEmpty tab="keywords" isFiltered={isFiltered} onResetFilters={onResetFilters} /> : (
        <div className="tableScroll">
          <table>
            <thead><tr><th>Ключове слово</th><th>UA opportunity proxy</th><th>VPH</th><th>Відео</th><th>Канали</th><th>Складові</th><th>Статус</th></tr></thead>
            <tbody>{items.map((item) => {
              const raw = item.raw || {};
              const breakdown = raw.proxyBreakdown || {};
              return (
                <tr key={`${item.type}-${item.id}`}>
                  <td><strong>{item.label}</strong>{raw.proxyIncomplete ? <small>incomplete data · це proxy, не search volume</small> : null}</td>
                  <td><strong>{hasNumber(raw.opportunityProxy) ? `${Math.round(raw.opportunityProxy)}/100` : NO_DATA}</strong></td>
                  <td>{hasNumber(raw.viewsVelocity) ? `${compactNumber(raw.viewsVelocity)}/год` : NO_DATA}</td>
                  <td>{numberOrMissing(raw.usageCount)}</td>
                  <td>{numberOrMissing(raw.channelsAnalyzed)}</td>
                  <td><small>D {breakdown.demand ?? '—'} · M {breakdown.momentum ?? '—'} · C {breakdown.competition_advantage ?? '—'} · UA {breakdown.local_fit ?? '—'} · intent {breakdown.comment_intent ?? '—'}</small></td>
                  <td><TrendDirectionBadge direction={item.direction} /></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function FormatRows({ items, isFiltered, onResetFilters }) {
  return (
    <Card className="trend-table">
      <div className="trend-table-header"><h2>Формати</h2><span>{numberFmt.format(items.length)}</span></div>
      {!items.length ? <TableEmpty tab="formats" isFiltered={isFiltered} onResetFilters={onResetFilters} /> : (
        <div className="tableScroll">
          <table>
            <thead><tr><th>Формат</th><th>Ретенція</th><th>Зростання попиту</th><th>Конкуренція</th><th>Кращий кейс</th><th>Рекомендація</th></tr></thead>
            <tbody>
              {items.map((item) => {
                const raw = item.raw || {};
                const competition = competitionMeta(item.competitionLevel);
                return (
                  <tr key={`${item.type}-${item.id}`}>
                    <td><strong>{formatLabel(item.label)}</strong><small>{textOrMissing(item.subtitle)}</small></td>
                    <td>{retentionOrMissing(raw.avgRetention || raw.avg_retention || raw.retention)}</td>
                    <td className={Number(item.demandGrowth) < 0 ? 'trend-negative' : Number(item.demandGrowth) > 0 ? 'trend-positive' : ''}>{percentOrMissing(item.demandGrowth)}</td>
                    <td><Badge tone={competition.tone}>{competition.label}</Badge></td>
                    <td>{textOrMissing(raw.bestUseCase || raw.best_use_case || raw.use_case)}</td>
                    <td><RecommendationBadge item={item} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function CategoryRows({ items, isFiltered, onResetFilters }) {
  return (
    <Card className="trend-table">
      <div className="trend-table-header"><h2>Категорії</h2><span>{numberFmt.format(items.length)}</span></div>
      {!items.length ? <TableEmpty tab="categories" isFiltered={isFiltered} onResetFilters={onResetFilters} /> : (
        <div className="tableScroll">
          <table>
            <thead><tr><th>Категорія</th><th>Зростаючих тем</th><th>Падаючих тем</th><th>Рівень можливості</th><th>Конкуренція</th><th>Рекомендація</th></tr></thead>
            <tbody>
              {items.map((item) => {
                const raw = item.raw || {};
                const competition = competitionMeta(item.competitionLevel);
                return (
                  <tr key={`${item.type}-${item.id}`}>
                    <td><strong>{textOrMissing(item.label)}</strong></td>
                    <td>{numberOrMissing(raw.risingTopics || raw.rising_topics)}</td>
                    <td>{numberOrMissing(raw.fallingTopics || raw.falling_topics)}</td>
                    <td>{textOrMissing(raw.opportunityLevel || raw.opportunity_level)}</td>
                    <td><Badge tone={competition.tone}>{competition.label}</Badge></td>
                    <td><RecommendationBadge item={item} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function TrendTable({ tab, items, totalItems, isFiltered, onResetFilters, onOpenTopic }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => setVisibleCount(PAGE_SIZE), [tab, totalItems, isFiltered]);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  let content;
  if (tab === 'videos') content = <VideoRows items={visibleItems} isFiltered={isFiltered} onResetFilters={onResetFilters} />;
  else if (tab === 'keywords') content = <KeywordRows items={visibleItems} isFiltered={isFiltered} onResetFilters={onResetFilters} />;
  else if (tab === 'formats') content = <FormatRows items={visibleItems} isFiltered={isFiltered} onResetFilters={onResetFilters} />;
  else if (tab === 'categories') content = <CategoryRows items={visibleItems} isFiltered={isFiltered} onResetFilters={onResetFilters} />;
  else content = <TopicHashtagTable tab={tab} items={visibleItems} filteredTotal={items.length} totalItems={totalItems} isFiltered={isFiltered} onResetFilters={onResetFilters} onOpenTopic={onOpenTopic} />;

  return (
    <div className="trend-table-wrap">
      {content}
      {items.length ? (
        <div className="trend-table-pagination">
          <span>Показано {numberFmt.format(Math.min(visibleItems.length, items.length))} з {numberFmt.format(items.length)}</span>
          {hasMore ? <Button ghost onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Показати ще</Button> : null}
        </div>
      ) : null}
    </div>
  );
}
