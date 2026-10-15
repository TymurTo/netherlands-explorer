import { useMemo } from 'react';
import { useCatalog } from '../state/CatalogContext.jsx';
import { useNavigation } from '../state/NavigationContext.jsx';
import { useSession } from '../state/SessionContext.jsx';
import { useFavorites } from '../state/FavoritesContext.jsx';
import useAccountActions from '../hooks/useAccountActions.js';
import { searchCatalog } from '../utils/search.js';
import SearchPanel from './SearchPanel.jsx';
import DirectoryPanel from './DirectoryPanel.jsx';
import StoryPanel from './StoryPanel.jsx';
import PlacesPanel from './PlacesPanel.jsx';
import AuthForm from '../components/AuthForm.jsx';
import AttractionDetail from './AttractionDetail.jsx';
export function SearchView() {
  const { catalog } = useCatalog();
  const { query, setQuery, selectProvince, selectCity, openPanel } = useNavigation();
  const results = useMemo(() => searchCatalog(catalog, query), [catalog, query]);
  function select(result) {
    if (result.type === 'provinces') selectProvince(result.id);
    else if (result.type === 'cities') selectCity(result.id);
    else openPanel('attraction', result.id);
  }
  return <SearchPanel query={query} results={results} onQueryChange={setQuery} onSelect={select} />;
}
export function DirectoryView() {
  const { catalog } = useCatalog();
  const { selectProvince, selectCity } = useNavigation();
  return (
    <DirectoryPanel catalog={catalog} onProvinceSelect={selectProvince} onCitySelect={selectCity} />
  );
}
export function StoryView() {
  const { catalog } = useCatalog();
  const { selection, selectCity, showAttractions } = useNavigation();
  return (
    <StoryPanel
      catalog={catalog}
      province={selection.province}
      city={selection.city}
      onCitySelect={selectCity}
      onAttractionsOpen={showAttractions}
    />
  );
}
export function PlacesView() {
  const { catalog } = useCatalog();
  const { user, isAuthReady } = useSession();
  const { selection, closePanel, showAllAttractions, openPanel, selectCity } = useNavigation();
  const { favoriteIds, loading, disabled, refresh } = useFavorites();
  const { toggleFavorite } = useAccountActions();
  const isFavorites = selection.panel?.type === 'favorites';
  const attractions = catalog.attractions.filter((item) =>
    isFavorites
      ? favoriteIds.includes(item.id)
      : (!selection.province || item.province_id === selection.province.id) &&
        (!selection.city || item.city_id === selection.city.id),
  );
  if (isFavorites && !isAuthReady) return <p role="status">Loading account…</p>;
  if (isFavorites && !user)
    return (
      <button className="shine-button" onClick={() => openPanel('auth')}>
        Sign in to view favorites
      </button>
    );
  return (
    <PlacesPanel
      attractions={attractions}
      cities={catalog.cities}
      favoriteIds={favoriteIds}
      isFavorites={isFavorites}
      isLoading={loading}
      isFavoriteDisabled={disabled}
      province={selection.province}
      city={selection.city}
      onClose={closePanel}
      onRefresh={refresh}
      onShowAll={showAllAttractions}
      onOpen={(id) => openPanel('attraction', id)}
      onCitySelect={selectCity}
      onFavoriteToggle={toggleFavorite}
    />
  );
}
export function AuthView() {
  const { handleSignIn } = useAccountActions();
  return <AuthForm onSuccess={handleSignIn} />;
}
export function AccountView() {
  const { user, isAuthReady } = useSession();
  const { openPanel, showFavorites } = useNavigation();
  const { signOut } = useAccountActions();
  if (!isAuthReady) return <p role="status">Loading account…</p>;
  if (!user)
    return (
      <button className="shine-button" onClick={() => openPanel('auth')}>
        Sign in
      </button>
    );
  return (
    <div className="stack">
      <p>
        Signed in as <strong>{user.username}</strong>.
      </p>
      <button className="primary shine-button" onClick={showFavorites}>
        Open favorites
      </button>
      <button className="shine-button" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
export function AttractionView() {
  const { catalog } = useCatalog();
  const { selection, openPanel } = useNavigation();
  const { user } = useSession();
  const { favoriteIds, disabled } = useFavorites();
  const { toggleFavorite } = useAccountActions();
  const item = selection.attraction;
  if (!item) return null;
  return (
    <AttractionDetail
      key={item.id}
      item={item}
      city={catalog.cities.find((city) => city.id === item.city_id)}
      user={user}
      saved={favoriteIds.includes(item.id)}
      onFavorite={toggleFavorite}
      favoriteBusy={disabled}
      onLogin={() => openPanel('auth')}
    />
  );
}
