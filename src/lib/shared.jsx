import React, { useState, useEffect, useRef } from 'react';

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
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  async function load() {
    // Cancel any in-flight request before starting a new one — prevents stale
    // responses from late requests overwriting fresh state when deps change fast.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      setError('');
      const result = await loader(controller.signal);
      if (controller.signal.aborted || !mountedRef.current) return;
      setData(result);
    } catch (err) {
      if (err?.name === 'AbortError' || controller.signal.aborted) return;
      if (mountedRef.current) setError(err.message || String(err));
    } finally {
      if (!controller.signal.aborted && mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    load();
    const timer = window.setInterval(load, interval);
    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, loading, reload: load };
}
