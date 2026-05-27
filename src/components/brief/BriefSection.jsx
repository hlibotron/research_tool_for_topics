import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function BriefSection({ num, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="brief-section">
      <div className="brief-section-header" onClick={() => setOpen(o => !o)}>
        <span className="brief-section-num">{num}</span>
        <span className="brief-section-title">{title}</span>
        <ChevronDown size={16} className={`brief-section-chevron${open ? ' open' : ''}`} />
      </div>
      {open && <div className="brief-section-body">{children}</div>}
    </div>
  );
}
