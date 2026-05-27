import React from 'react';
import { FileText } from 'lucide-react';

export default function EmptyState({ icon, title = 'Немає даних', text, action }) {
  return (
    <section className="emptyState">
      <span>{icon || <FileText size={22} />}</span>
      <div>
        <strong>{title}</strong>
        {text && <p>{text}</p>}
        {action && <div className="emptyAction">{action}</div>}
      </div>
    </section>
  );
}
