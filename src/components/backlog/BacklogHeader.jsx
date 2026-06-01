import React from 'react';
import { Plus, Upload, Sparkles } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function BacklogHeader({ onAdd, onImport, onEvaluate, evaluating }) {
  return (
    <header className="backlog-header">
      <div>
        <h1>Backlog ідей</h1>
        <p>Збереження, аналіз і щоденна оцінка перспективності тем.</p>
      </div>
      <div className="backlog-header-actions">
        <Button onClick={onAdd}><Plus size={16} />Додати ідею</Button>
        <Button ghost onClick={onImport}><Upload size={16} />Імпортувати</Button>
        <Button className="backlog-action-orange" onClick={onEvaluate} disabled={evaluating}>
          <Sparkles size={16} />{evaluating ? 'Оцінюю...' : 'Оцінити сьогодні'}
        </Button>
      </div>
    </header>
  );
}
