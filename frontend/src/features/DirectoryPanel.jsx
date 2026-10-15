export default function DirectoryPanel({ catalog, onProvinceSelect, onCitySelect }) {
  return (
    <div className="directory">
      {catalog.provinces.map((province) => {
        const cities = catalog.cities.filter((city) => city.province_id === province.id);
        return (
          <section key={province.id}>
            <button className="directory-province" onClick={() => onProvinceSelect(province.id)}>
              <span
                style={{
                  background: province.color,
                }}
              />
              {province.name}
              <small>{province.native_name}</small>
            </button>
            <div>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => onCitySelect(city.id)}
                  className="shine-button"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
