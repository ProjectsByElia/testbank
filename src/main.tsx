import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isSafeLocalMode } from './lib/safeLocalMode.ts'

if (isSafeLocalMode) {
  const allowUrl = (value: string) => {
    try {
      const url = new URL(value, window.location.origin);
      return url.origin === window.location.origin || ['data:', 'blob:'].includes(url.protocol);
    } catch {
      return true;
    }
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!allowUrl(url)) {
      return Promise.reject(new Error(`Blocked outbound request in safe local mode: ${url}`));
    }
    return originalFetch(input, init);
  };

  const OriginalXHR = window.XMLHttpRequest;
  class SafeLocalXHR extends OriginalXHR {
    open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      const resolved = typeof url === 'string' ? url : url.toString();
      if (!allowUrl(resolved)) {
        throw new Error(`Blocked outbound XHR in safe local mode: ${resolved}`);
      }
      super.open(method, resolved, async ?? true, username ?? undefined, password ?? undefined);
    }
  }
  window.XMLHttpRequest = SafeLocalXHR as typeof XMLHttpRequest;

  const OriginalWebSocket = window.WebSocket;
  class SafeLocalWebSocket extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const resolved = typeof url === 'string' ? url : url.toString();
      if (!allowUrl(resolved)) {
        throw new Error(`Blocked outbound WebSocket in safe local mode: ${resolved}`);
      }
      super(resolved, protocols);
    }
  }
  window.WebSocket = SafeLocalWebSocket as typeof WebSocket;

  const originalOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (url && !allowUrl(typeof url === 'string' ? url : url.toString())) {
      console.warn('Blocked external window.open in safe local mode:', url);
      return null;
    }
    return originalOpen(url, target, features);
  }) as typeof window.open;
}

createRoot(document.getElementById("root")!).render(<App />);
