import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { percentValue } from '../../lib/formatters.js';

function NicheCard({ title, icon, items, tone, linkLabel, linkHref }) {
  return (
    <div className={`todayNicheCard todayNiche${tone}`}>
      <div className="todayNicheCardHeader">
        {icon}
        <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
      </div>
      {items.length ? (
        <div className="todayNicheList">
          {items.map((item, i) => {
            const tag = item.tag || item.label || item.topic || item.name || String(i);
            const rawChange = item.change ?? item.effective_change ?? ((Number(item.momentum || 1) - 1) * 100);
            return (
              <div key={tag} className="todayNicheItem">
                <span className="todayNicheTag">#{tag}</span>
                <strong className={`todayNicheChange ${tone}`}>{percentValue(rawChange)}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="todayMuted">Немає даних</p>
      )}
      <a className="todayNicheLink" href={linkHref}>{linkLabel} →</a>
    </div>
  );
}

export default function NicheChanges({ dashboardData }) {
  const rising =
    dashboardData?.risingHashtags ||
    dashboardData?.rising_hashtags ||
    dashboardData?.cards?.risingHashtags ||
    dashboardData?.cards?.rising_hashtags ||
    dashboardData?.trending?.rising ||
    [];

  const falling =
    dashboardData?.fallingHashtags ||
    dashboardData?.falling_hashtags ||
    dashboardData?.cards?.fallingHashtags ||
    dashboardData?.cards?.falling_hashtags ||
    dashboardData?.trending?.falling ||
    [];

  if (!rising.length && !falling.length) {
    return (
      <section className="todayNicheSection">
        <h2 className="todaySectionTitle">Що змінюється в ніші</h2>
        <p className="todayMuted">
          Недостатньо trend data. Запустіть збір YouTube-даних.
        </p>
      </section>
    );
  }

  return (
    <section className="todayNicheSection">
      <h2 className="todaySectionTitle">Що змінюється в ніші</h2>
      <div className="todayNicheGrid">
        <NicheCard
          title="Зростає"
          icon={<TrendingUp size={18} />}
          items={rising.slice(0, 3)}
          tone="green"
          linkLabel="Переглянути всі зростаючі теми"
          linkHref="/trends"
        />
        <NicheCard
          title="Падає"
          icon={<TrendingDown size={18} />}
          items={falling.slice(0, 3)}
          tone="red"
          linkLabel="Переглянути всі теми, що падають"
          linkHref="/trends"
        />
      </div>
    </section>
  );
}
