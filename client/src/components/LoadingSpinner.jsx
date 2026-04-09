export function LoadingSpinner({ text = 'Laden...' }) {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner__ring"></div>
      <p className="loading-spinner__text">{text}</p>
    </div>
  );
}
