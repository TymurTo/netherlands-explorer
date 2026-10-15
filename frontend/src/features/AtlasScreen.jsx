import { useCatalog } from '../state/CatalogContext.jsx';
import { useNotice } from '../state/NoticeContext.jsx';
import { useNavigation } from '../state/NavigationContext.jsx';
import MapView from './MapView.jsx';
import AtlasDrawer from './AtlasDrawer.jsx';
export default function AtlasScreen() {
  const { catalog, error } = useCatalog();
  const { notice, dismissNotice } = useNotice();
  const { selection, showWholeMap } = useNavigation();
  if (!catalog)
    return (
      <main className="loading">
        <p className="eyebrow">ATLAS / NEDERLAND</p>
        <h1>{error ? 'Unable to load the atlas' : 'Opening the Netherlands…'}</h1>
        {error && (
          <>
            <p role="alert">{error}</p>
            <p>Check that the Python server is running.</p>
            <button className="shine-button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </>
        )}
      </main>
    );
  return (
    <div className="app-shell fullscreen-atlas">
      <MapView />
      {selection.error && (
        <div className="notice floating-notice" role="alert">
          <span>{selection.error}</span>
          <button className="shine-button" onClick={showWholeMap}>
            Open full map
          </button>
        </div>
      )}
      {!selection.error && notice && (
        <div className="notice floating-notice" role="status">
          <span>{notice}</span>
          <button
            className="shine-button"
            aria-label="Dismiss notification"
            onClick={dismissNotice}
          >
            ×
          </button>
        </div>
      )}
      <AtlasDrawer />
    </div>
  );
}
