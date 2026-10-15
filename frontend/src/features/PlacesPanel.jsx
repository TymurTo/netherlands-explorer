function AttractionRow({
  attraction,
  city,
  isSaved,
  isFavoriteDisabled,
  onOpen,
  onCitySelect,
  onFavoriteToggle,
}) {
  const favoriteAction = isSaved ? 'Remove from favorites' : 'Add to favorites';
  return (
    <tr>
      <td>
        <button className="place-title" onClick={() => onOpen(attraction.id)}>
          {attraction.name}
          <small>{attraction.native_name}</small>
        </button>
      </td>
      <td>
        <img
          className="place-image"
          src={attraction.image}
          alt={attraction.image_is_placeholder ? 'Placeholder illustration' : attraction.name}
        />
        {attraction.image_is_placeholder && <small className="muted">Illustration</small>}
      </td>
      <td>
        <button className="city-link" onClick={() => onCitySelect(city.id)}>
          {city.name}
        </button>
        <p>{attraction.description}</p>
        <button className="text-button" onClick={() => onOpen(attraction.id)}>
          Details and comments
        </button>
      </td>
      <td>
        <button
          disabled={isFavoriteDisabled}
          className={`${`star ${isSaved ? 'saved' : ''}`} shine-button`}
          aria-label={`${favoriteAction}: ${attraction.name}`}
          aria-pressed={isSaved}
          onClick={() => onFavoriteToggle(attraction.id)}
        >
          {isSaved ? '★' : '☆'}
        </button>
      </td>
    </tr>
  );
}
export default function PlacesPanel({
  attractions,
  cities,
  favoriteIds,
  isFavorites,
  isLoading,
  isFavoriteDisabled,
  province,
  city,
  onClose,
  onRefresh,
  onShowAll,
  onOpen,
  onCitySelect,
  onFavoriteToggle,
}) {
  const title = isFavorites ? 'Favorites' : 'Attractions';
  const location = [province?.name, city?.name].filter(Boolean).join(' · ');
  const subtitle = isFavorites
    ? 'Places you want to return to.'
    : location || 'All places in the starter catalog';
  const showLoading = isFavorites && isLoading;
  const showEmpty = !showLoading && attractions.length === 0;
  const showTable = !showLoading && attractions.length > 0;
  return (
    <section className="places">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR COLLECTION OF DISCOVERIES</p>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <button onClick={onClose} className="shine-button">
          Back to map
        </button>
      </div>
      {isFavorites && (
        <button onClick={onRefresh} disabled={isLoading} className="shine-button">
          Refresh list
        </button>
      )}
      {showLoading && <p role="status">Loading favorites…</p>}
      {showTable && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Place</th>
                <th>Image</th>
                <th>Description and city</th>
                <th>
                  <span className="sr-only">Favorites</span>☆
                </th>
              </tr>
            </thead>
            <tbody>
              {attractions.map((attraction) => (
                <AttractionRow
                  key={attraction.id}
                  attraction={attraction}
                  city={cities.find((item) => item.id === attraction.city_id)}
                  isSaved={favoriteIds.includes(attraction.id)}
                  isFavoriteDisabled={isFavoriteDisabled}
                  onOpen={onOpen}
                  onCitySelect={onCitySelect}
                  onFavoriteToggle={onFavoriteToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showEmpty && (
        <div className="empty">
          <h2>{isFavorites ? 'Your favorite places will appear here' : 'No places added yet'}</h2>
          <p>Click ☆ next to an attraction to save it.</p>
          <button onClick={onShowAll} className="shine-button">
            View all places
          </button>
        </div>
      )}
    </section>
  );
}
