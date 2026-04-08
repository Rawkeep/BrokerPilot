import { useState, useEffect, useRef, useCallback } from 'react';
import { GlassInput } from '../ui/GlassInput.jsx';
import { GlassSelect } from '../ui/GlassSelect.jsx';
import { GlassButton } from '../ui/GlassButton.jsx';
import { GlassTag } from '../ui/GlassTag.jsx';
import { de } from '../../i18n/de.js';

const EMPTY_FILTERS = {
  search: '',
  stage: '',
  priority: '',
  dateFrom: '',
  dateTo: '',
  tags: [],
};

export function LeadFilters({ stages = [], allTags = [], onFilterChange }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debounceRef = useRef(null);

  const emitFilters = useCallback(
    (f) => {
      onFilterChange?.(f);
    },
    [onFilterChange]
  );

  // Emit non-search changes immediately
  function updateFilter(key, value) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      emitFilters(next);
      return next;
    });
  }

  // Debounce search input
  function handleSearchChange(e) {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => {
        emitFilters({ ...prev, search: value });
        return prev;
      });
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function toggleTag(tag) {
    setFilters((prev) => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      const next = { ...prev, tags };
      emitFilters(next);
      return next;
    });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    emitFilters(EMPTY_FILTERS);
  }

  const hasActiveFilters =
    filters.search ||
    filters.stage ||
    filters.priority ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.tags.length > 0;

  const stageOptions = [
    { value: '', label: de.crm.filters.allStages },
    ...stages.map((s) => ({ value: s.id, label: s.label })),
  ];

  const priorityOptions = [
    { value: '', label: de.crm.filters.allPriorities },
    { value: 'low', label: de.crm.priorities.low },
    { value: 'medium', label: de.crm.priorities.medium },
    { value: 'high', label: de.crm.priorities.high },
  ];

  return (
    <div className="lead-filters" data-testid="lead-filters">
      <div className="lead-filters__search">
        <GlassInput
          placeholder={de.crm.filters.search}
          value={filters.search}
          onChange={handleSearchChange}
          name="lead-search"
        />
      </div>

      <div className="lead-filters__select">
        <GlassSelect
          name="stage-filter"
          value={filters.stage}
          onChange={(e) => updateFilter('stage', e.target.value)}
          options={stageOptions}
        />
      </div>

      <div className="lead-filters__select">
        <GlassSelect
          name="priority-filter"
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          options={priorityOptions}
        />
      </div>

      <div className="lead-filters__dates">
        <GlassInput
          type="date"
          name="date-from"
          placeholder={de.crm.filters.dateFrom}
          value={filters.dateFrom}
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
        />
        <GlassInput
          type="date"
          name="date-to"
          placeholder={de.crm.filters.dateTo}
          value={filters.dateTo}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
        />
      </div>

      {allTags.length > 0 && (
        <div className="lead-filters__tags">
          {allTags.map((tag) => (
            <GlassTag
              key={tag}
              label={tag}
              className={filters.tags.includes(tag) ? 'glass-tag--active' : ''}
              onRemove={filters.tags.includes(tag) ? () => toggleTag(tag) : undefined}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <div className="lead-filters__clear">
          <GlassButton onClick={handleReset}>
            {de.crm.filters.reset}
          </GlassButton>
        </div>
      )}
    </div>
  );
}
