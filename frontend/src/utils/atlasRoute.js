export const PANEL_TYPES = new Set([
  'search',
  'directory',
  'story',
  'sights',
  'favorites',
  'auth',
  'account',
  'attraction',
]);
export function resolveAtlasRoute(params, catalog) {
  const provinceId = params.get('province');
  const cityId = params.get('city');
  const attractionId = params.get('attraction');
  const panelType = params.get('panel');
  const province = catalog?.provinces.find((item) => item.id === provinceId);
  const city = catalog?.cities.find((item) => item.id === cityId);
  const attraction = catalog?.attractions.find((item) => item.id === attractionId);
  const invalid =
    catalog &&
    ((provinceId && !province) ||
      (cityId && !city) ||
      (attractionId && !attraction) ||
      (panelType && !PANEL_TYPES.has(panelType)) ||
      (city && province && city.province_id !== province.id) ||
      (attraction && city && attraction.city_id !== city.id) ||
      (attraction && province && attraction.province_id !== province.id) ||
      (panelType === 'attraction' && !attraction));
  if (invalid) return { error: 'This link contains an unknown or mismatched place.', panel: null };
  const selectedCity = city || catalog?.cities.find((item) => item.id === attraction?.city_id);
  const selectedProvince =
    province ||
    catalog?.provinces.find(
      (item) => item.id === (selectedCity?.province_id || attraction?.province_id),
    );
  const type = panelType || (attraction ? 'attraction' : null);
  return {
    error: '',
    province: selectedProvince,
    city: selectedCity,
    attraction,
    panel: type ? { type, id: type === 'attraction' ? attraction?.id : undefined } : null,
  };
}
