import React from 'react';

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`pill ${tone} ${className}`}>{children}</span>;
}
