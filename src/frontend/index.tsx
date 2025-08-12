import React from 'react';
// Optional Sentry (renderer)
if (import.meta.env.VITE_SENTRY_DSN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BrowserTracing } = require('@sentry/tracing');
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: import.meta.env.VITE_APP_ENV || 'production',
    });
  } catch {}
}
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { App } from './App';
import './utils/cn.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
