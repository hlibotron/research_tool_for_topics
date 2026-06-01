import React from 'react';
import { Boxes, Hash, KeyRound, Layers3, PlaySquare, Tags } from 'lucide-react';

const TABS = [
  ['topics', 'Теми', Tags],
  ['hashtags', 'Теги / хештеги', Hash],
  ['keywords', 'Ключові слова', KeyRound],
  ['videos', 'Відео', PlaySquare],
  ['formats', 'Формати', Boxes],
  ['categories', 'Категорії', Layers3],
];

export default function TrendTabs({ activeTab, onChange }) {
  return (
    <nav className="trend-tabs" aria-label="Trend Radar sections">
      {TABS.map(([value, label, Icon]) => (
        <button key={value} className={activeTab === value ? 'active' : ''} onClick={() => onChange(value)}>
          <Icon size={15} />
          {label}
        </button>
      ))}
    </nav>
  );
}
