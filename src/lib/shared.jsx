import React, { useState, useEffect } from 'react';

export const ToastContext = React.createContext(() => {});

export function navigateTo(href) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) {
    window.location.href = href;
    return;
  }
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event('popstate'));
}

export function Link({ href, className, children, onClick, ...props }) {
  function handleClick(event) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target
    ) return;
    event.preventDefault();
    navigateTo(href);
  }
  return <a href={href} className={className} onClick={handleClick} {...props}>{children}</a>;
}

export async function api(path, options) {
  const response = await fetch(path, { cache: 'no-store', ...options });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data?.error || data || 'Request failed');
  return data;
}

export function usePolling(loader, deps = [], interval = 30000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError('');
      setData(await loader());
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, interval);
    return () => window.clearInterval(timer);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, loading, reload: load };
}
