export default function AtlasControls({
  user,
  isAuthReady,
  favoriteCount,
  province,
  place,
  onHome,
  onPanelOpen,
  onFavoritesOpen,
  onAttractionsOpen,
}) {
  let accountLabel = '…';
  if (isAuthReady) accountLabel = user ? user.username : 'Sign in';
  return (
    <>
      <header className="floating-toolbar">
        <nav className="floating-actions" aria-label="Map tools">
          <button
            onClick={() => onPanelOpen('search')}
            aria-haspopup="dialog"
            className="shine-button"
          >
            ⌕ <span>Search</span>
          </button>
          <button
            className="icon shine-button"
            aria-label="Open provinces and cities"
            aria-haspopup="dialog"
            onClick={() => onPanelOpen('directory')}
          >
            •••
          </button>
          {user && (
            <button aria-label="Open favorites" onClick={onFavoritesOpen} className="shine-button">
              ☆ <span>Favorites</span> {favoriteCount}
            </button>
          )}
          <button
            className="login-button shine-button"
            disabled={!isAuthReady}
            onClick={() => onPanelOpen(user ? 'account' : 'auth')}
          >
            {accountLabel}
          </button>
        </nav>
      </header>
      <div className="map-navigation">
        {province && (
          <button onClick={onHome} className="shine-button">
            Full map
          </button>
        )}
        <button
          aria-haspopup="dialog"
          onClick={() => onPanelOpen('story')}
          className="shine-button"
        >
          {place ? `${place.name} · About this place` : 'Discover the Netherlands'}
        </button>
        <button aria-haspopup="dialog" onClick={onAttractionsOpen} className="shine-button">
          Attractions
        </button>
      </div>
    </>
  );
}
