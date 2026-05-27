import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <section className={`panel ${className}`} {...props}>
      {children}
    </section>
  );
}
