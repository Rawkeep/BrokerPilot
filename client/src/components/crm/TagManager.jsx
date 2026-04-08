import { useState, useRef, useEffect } from 'react';
import { GlassInput } from '../ui/GlassInput.jsx';
import { GlassTag } from '../ui/GlassTag.jsx';
import { de } from '../../i18n/de.js';

const MAX_TAGS = 10;

export function TagManager({ tags = [], onChange, allTags = [] }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const suggestions = input.trim()
    ? allTags.filter(
        (t) =>
          t.toLowerCase().startsWith(input.toLowerCase()) &&
          !tags.includes(t)
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function addTag(tag) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    if (tags.length >= MAX_TAGS) return;
    onChange([...tags, trimmed]);
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
  }

  return (
    <div className="tag-manager" ref={wrapperRef} data-testid="tag-manager">
      <div className="tag-manager__tags">
        {tags.map((tag) => (
          <GlassTag key={tag} label={tag} onRemove={removeTag} />
        ))}
      </div>

      {tags.length < MAX_TAGS ? (
        <div className="tag-manager__input-wrapper">
          <GlassInput
            placeholder={de.crm.tags.add}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            name="tag-input"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="tag-manager__suggestions">
              {suggestions.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="tag-manager__suggestion"
                  onClick={() => addTag(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="tag-manager__max">{de.crm.tags.maxReached}</span>
      )}
    </div>
  );
}
