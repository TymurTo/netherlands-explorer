import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
const CatalogContext = createContext(null);
export function CatalogProvider({ children }) {
  const [state, setState] = useState({ catalog: null, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    api('/catalog', { signal: controller.signal })
      .then((catalog) => setState({ catalog, error: '' }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ catalog: null, error: error.message });
      });
    return () => controller.abort();
  }, []);
  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}
export const useCatalog = () => useContext(CatalogContext);
