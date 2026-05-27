import React, { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { navigateTo } from '../../lib/shared.jsx';

export default function QuickIdeaCheck() {
  const [idea, setIdea] = useState('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!idea.trim()) {
      inputRef.current?.focus();
      return;
    }
    navigateTo(`/idea-lab?idea=${encodeURIComponent(idea.trim())}`);
  }

  return (
    <section className="todayIdeaCheck">
      <div className="todayIdeaCheckIcon">💡</div>
      <h2 className="todaySectionTitle" style={{ margin: 0 }}>Перевірити мою ідею</h2>
      <p className="todayMuted">
        Введи тему або короткий опис — і ми порівняємо її з ринковими сигналами
      </p>
      <form className="todayIdeaForm" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={`todayIdeaInput${touched && !idea.trim() ? ' error' : ''}`}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Наприклад: як зібрати AI-помічника на старому ноутбуці"
          aria-label="Ідея для перевірки"
        />
        <button className="button todayIdeaBtn" type="submit">
          <Search size={16} />Перевірити ідею
        </button>
      </form>
      {touched && !idea.trim() && (
        <p className="todayIdeaError">Введіть ідею для перевірки</p>
      )}
    </section>
  );
}
