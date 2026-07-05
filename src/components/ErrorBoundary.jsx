import { Component } from 'react';

// Catches render/lifecycle errors in the child tree and shows a friendly
// card instead of a blank screen. Reset it by changing `resetKey`
// (we key it on the route path so navigating away clears the error).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="container" style={{ paddingTop: 130, minHeight: '60vh' }}>
        <div className="card" style={{ padding: 32, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '2.6rem', color: 'var(--fire)' }}><i className="fa-solid fa-face-dizzy" /></div>
          <h2 className="section-title" style={{ fontSize: '1.6rem' }}>Something went wrong</h2>
          <p className="text-muted">This page hit an unexpected error. You can retry or head home.</p>
          {import.meta.env.DEV && (
            <pre
              style={{
                textAlign: 'left',
                background: 'var(--surface-2)',
                border: '1px solid var(--glass-bdr)',
                borderRadius: 'var(--r)',
                padding: 14,
                marginTop: 16,
                color: '#fca5a5',
                fontSize: '0.75rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {String(error?.stack || error?.message || error)}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => this.setState({ error: null })}>
              <i className="fa-solid fa-arrows-rotate" /> Try again
            </button>
            <a className="btn btn-primary" href="/">
              <i className="fa-solid fa-house" /> Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
