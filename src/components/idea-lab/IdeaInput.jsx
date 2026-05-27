import React from 'react';
import { Paperclip, ArrowRight } from 'lucide-react';

const MAX_LEN = 1500;
const MIN_LEN = 10;

export default function IdeaInput({ idea, onChange, onSubmit, loading, error }) {
  const len = idea.length;
  const counterCls = len > MAX_LEN ? 'over' : len > MAX_LEN * 0.85 ? 'near' : '';

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form className="idea-input-card" onSubmit={handleSubmit}>
      <label className="idea-input-label" htmlFor="ideaTextarea">
        Опишіть вашу ідею
      </label>
      <textarea
        id="ideaTextarea"
        className={`idea-input-textarea${error ? ' error' : ''}`}
        value={idea}
        onChange={e => onChange(e.target.value)}
        rows={5}
        maxLength={MAX_LEN + 50}
        placeholder="Наприклад: як зібрати AI-помічника на старому ноутбуці"
      />
      {error && <p className="idea-input-error">{error}</p>}
      <div className="idea-input-footer">
        <span className="idea-input-attach" aria-disabled="true" title="Буде доступно пізніше">
          <Paperclip size={14} />
          Прикріпити нотатки або референси
        </span>
        <div className="idea-input-right">
          <span className={`idea-input-counter${counterCls ? ` ${counterCls}` : ''}`}>
            {len} / {MAX_LEN}
          </span>
          <button
            type="submit"
            className="idea-input-submit"
            disabled={loading || len < MIN_LEN || len > MAX_LEN}
          >
            {loading ? 'Аналізуємо...' : <>Проаналізувати ідею <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </form>
  );
}
