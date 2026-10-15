import AtlasMap from '../components/AtlasMap.jsx';
import AtlasControls from '../components/AtlasControls.jsx';
import { useCatalog } from '../state/CatalogContext.jsx';
import { useNavigation } from '../state/NavigationContext.jsx';
import { useSession } from '../state/SessionContext.jsx';
import { useFavorites } from '../state/FavoritesContext.jsx';
export default function MapView() {
  const { catalog } = useCatalog();
  const {
    selection,
    selectProvince,
    selectCity,
    showWholeMap,
    openPanel,
    showFavorites,
    showAttractions,
  } = useNavigation();
  const { user, isAuthReady } = useSession();
  const { favoriteIds } = useFavorites();
  return (
    <div className="atlas-surface" inert={selection.panel ? true : undefined}>
      <main className="fullscreen-map" aria-label="Map of the Netherlands">
        <AtlasMap
          catalog={catalog}
          selected={selection.province?.id}
          cityId={selection.city?.id}
          onProvince={selectProvince}
          onCity={selectCity}
        />
      </main>
      <AtlasControls
        user={user}
        isAuthReady={isAuthReady}
        favoriteCount={favoriteIds.length}
        province={selection.province}
        place={selection.city || selection.province}
        onHome={showWholeMap}
        onPanelOpen={openPanel}
        onFavoritesOpen={showFavorites}
        onAttractionsOpen={showAttractions}
      />
    </div>
  );
}
