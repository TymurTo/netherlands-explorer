import geometry from '../data/map.json';
export default function AtlasMap({ catalog, selected, cityId, onProvince, onCity }) {
  const shape = geometry.find((region) => region.id === selected);
  const viewBox = shape ? shape.box.join(' ') : '-70 -40 1840 2120';
  return (
    <svg
      className={`map ${selected ? 'map-zoom' : ''}`}
      viewBox={viewBox}
      aria-label="Interactive map of the provinces of the Netherlands"
    >
      {geometry.map((region) => {
        const province = catalog.provinces.find((item) => item.id === region.id);
        return (
          <g key={region.id} className={selected && selected !== region.id ? 'dimmed' : ''}>
            <path
              d={region.d}
              fill={province.color}
              className={`province ${selected === region.id ? 'selected' : ''}`}
              tabIndex={selected && selected !== region.id ? -1 : 0}
              role="button"
              aria-label={`Open province ${province.name}`}
              onClick={() => onProvince(region.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onProvince(region.id);
                }
              }}
            />
            {!selected && (
              <text
                className="province-label"
                x={region.label[0]}
                y={region.label[1]}
                textAnchor="middle"
              >
                {province.name}
              </text>
            )}
          </g>
        );
      })}
      {selected &&
        catalog.cities
          .filter((city) => city.province_id === selected)
          .map((city) => (
            <g
              key={city.id}
              className="city-pin"
              tabIndex={0}
              role="button"
              aria-label={`Open city ${city.name}`}
              onClick={() => onCity(city.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCity(city.id);
                }
              }}
            >
              <circle cx={city.x} cy={city.y} r={cityId === city.id ? 13 : 9} />

              <text
                x={city.x + (city.label_dx ?? 20)}
                y={city.y + (city.label_dy ?? 7)}
                textAnchor={city.label_anchor || 'start'}
              >
                {(city.label_lines || [city.name]).map((line, index) => (
                  <tspan key={index} x={city.x + (city.label_dx ?? 20)} dy={index ? '1.1em' : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
    </svg>
  );
}
