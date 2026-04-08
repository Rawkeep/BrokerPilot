import { useState } from 'react';
import { GlassInput } from '../ui/GlassInput.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { de } from '../../i18n/de.js';

const SYMBOL_REGEX = /^[A-Za-z0-9.]{1,10}$/;

/**
 * Stock symbol search input with validation.
 *
 * @param {object} props
 * @param {Function} props.onSearch - Called with validated symbol string
 */
export function StockSearch({ onSearch }) {
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState('');
  const t = de.pages.markt.search;

  const handleSubmit = () => {
    const trimmed = symbol.trim();
    if (!trimmed) return;

    if (!SYMBOL_REGEX.test(trimmed)) {
      setError('Nur Buchstaben, Zahlen und Punkte erlaubt (max. 10 Zeichen)');
      return;
    }

    setError('');
    onSearch(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    // Allow only valid characters, max 10
    if (val === '' || /^[A-Za-z0-9.]{0,10}$/.test(val)) {
      setSymbol(val);
      if (error) setError('');
    }
  };

  return (
    <div className="stock-search">
      <div className="stock-search__row">
        <GlassInput
          value={symbol}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          error={error}
          aria-label={t.hint}
        />
        <GlassButton variant="primary" onClick={handleSubmit}>
          {t.button}
        </GlassButton>
      </div>
      <p className="stock-search__hint">{t.hint}</p>
    </div>
  );
}
