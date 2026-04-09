import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BrokerPilot Error:', error, errorInfo);
    // Could send to error tracking service in the future
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">Etwas ist schiefgelaufen</h2>
            <p className="error-boundary__message">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
            {this.state.error?.message && (
              <details className="error-boundary__details">
                <summary>Technische Details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <div className="error-boundary__actions">
              <button className="error-boundary__btn error-boundary__btn--primary" onClick={this.handleReset}>
                Erneut versuchen
              </button>
              <button className="error-boundary__btn error-boundary__btn--secondary" onClick={() => window.location.href = '/'}>
                Zur Startseite
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
