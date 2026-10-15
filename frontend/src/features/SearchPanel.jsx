const RESULT_LABELS = {
  provinces: 'Province',
  cities: 'City',
  attractions: 'Place',
};
export default function SearchPanel({ query, results, onQueryChange, onSelect }) {
  const hasQuery = Boolean(query.trim());
  return (
    <>
      <p className="muted">Provinces, cities and attractions</p>
      <div className="search">
        <label className="sr-only" htmlFor="search">
          Search provinces, cities and attractions
        </label>
        <input
          autoFocus
          id="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onQueryChange('');
          }}
          placeholder="City, province, place…"
          autoComplete="off"
        />
        {query && (
          <button
            className="clear shine-button"
            aria-label="Clear search"
            onClick={() => onQueryChange('')}
          >
            ×
          </button>
        )}
        {hasQuery && (
          <div className="search-results" aria-label="Search results">
            <p className="muted">Results: {results.length}</p>
            {results.map((result) => (
              <button
                key={result.type + result.id}
                onClick={() => onSelect(result)}
                className="shine-button"
              >
                <span>
                  {result.name}
                  <small>{result.native_name}</small>
                </span>
                <small>{RESULT_LABELS[result.type]}</small>
              </button>
            ))}
            {results.length === 0 && <p>Nothing found. Try another name.</p>}
          </div>
        )}
      </div>
      {!hasQuery && <p className="search-hint">For example: Amsterdam, Drenthe or Rijksmuseum.</p>}
    </>
  );
}
