export default function StoryPanel({ catalog, province, city, onCitySelect, onAttractionsOpen }) {
  const place = city || province;
  const cities = catalog.cities.filter((item) => item.province_id === province?.id);
  let category = 'SMALL COUNTRY. MORE TO DISCOVER.';
  if (province) category = 'PROVINCE OF THE NETHERLANDS';
  if (city) category = province.name;
  return (
    <aside className="story">
      <p className="eyebrow">{category}</p>
      <h1>
        {place ? (
          place.name
        ) : (
          <>
            Your
            <br />
            Netherlands<span>.</span>
          </>
        )}
      </h1>
      <p className="native-name">{place?.native_name || 'Nederland — closer than you think'}</p>
      <p className="intro">
        {place?.description ||
          'From canals and historic squares to dunes and quiet northern towns. Find the place that will become your next story.'}
      </p>
      {place ? (
        <div className="history">
          <h2>A little history</h2>
          <p>{place.history}</p>
        </div>
      ) : (
        <div className="stats">
          <div>
            <strong>{catalog.provinces.length}</strong>
            <span>provinces</span>
          </div>
          <div>
            <strong>{catalog.cities.length}</strong>
            <span>cities in the catalog</span>
          </div>
          <div>
            <strong>{catalog.attractions.length}</strong>
            <span>places to discover</span>
          </div>
        </div>
      )}
      <button className="primary explore-button shine-button" onClick={onAttractionsOpen}>
        Attractions
      </button>
      {province && (
        <div className="city-list">
          <h2>Cities in this province</h2>
          {cities.map((item) => (
            <button
              key={item.id}
              className={`${city?.id === item.id ? 'active' : ''} shine-button`}
              onClick={() => onCitySelect(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      {!province && <p className="small muted">Start with the map, search or the “•••” menu.</p>}
    </aside>
  );
}
