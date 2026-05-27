import React from 'react';

export default function Button({ children, ghost = false, className = '', ...props }) {
  return (
    <button className={`button${ghost ? ' ghost' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
