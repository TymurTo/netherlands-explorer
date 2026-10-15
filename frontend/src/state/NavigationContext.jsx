import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog } from './CatalogContext.jsx';
import { resolveAtlasRoute } from '../utils/atlasRoute.js';
const NavigationContext = createContext(null);
export function NavigationProvider({ children }) {
  const { catalog } = useCatalog();
  const [params, setParams] = useSearchParams();
  const selection = useMemo(() => resolveAtlasRoute(params, catalog), [params, catalog]);
  const patch = useCallback(
    (changes, replace = false) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value == null || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );
  const closePanel = useCallback(() => patch({ panel: null, attraction: null, q: null }), [patch]);
  const showWholeMap = useCallback(() => setParams({}), [setParams]);
  const openPanel = useCallback(
    (type, id) => {
      if (type === 'attraction') {
        const item = catalog?.attractions.find((place) => place.id === id);
        if (!item) return;
        patch({
          province: item.province_id,
          city: item.city_id,
          attraction: item.id,
          panel: type,
          q: null,
        });
      } else patch({ panel: type, attraction: null, q: null });
    },
    [catalog, patch],
  );
  const selectProvince = useCallback(
    (id) => {
      if (catalog?.provinces.some((item) => item.id === id)) {
        setParams({ province: id, panel: 'story' });
      }
    },
    [catalog, setParams],
  );
  const selectCity = useCallback(
    (id) => {
      const city = catalog?.cities.find((item) => item.id === id);
      if (city) setParams({ province: city.province_id, city: id, panel: 'story' });
    },
    [catalog, setParams],
  );
  const value = {
    selection,
    query: params.get('q') || '',
    closePanel,
    openPanel,
    selectProvince,
    selectCity,
    showWholeMap,
    showAttractions: () => openPanel('sights'),
    showAllAttractions: () => setParams({ panel: 'sights' }),
    showFavorites: () => openPanel('favorites'),
    setQuery: (query) => patch({ q: query }, true),
  };
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
export const useNavigation = () => useContext(NavigationContext);
