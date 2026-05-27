import React from 'react';

export function SkeletonBlock({ height = 80, radius = 8, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, borderRadius: radius }}
    />
  );
}

export default function TodayPageSkeleton() {
  return (
    <div className="todaySkeleton">
      <div className="skeleton todayHeroSkel" />
      <div className="todayMetricStripSkel">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton todayMetricSkel" />
        ))}
      </div>
      <div className="skeleton todaySectionSkel" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="skeleton" style={{ height: 200 }} />
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    </div>
  );
}
