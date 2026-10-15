import { BrowserRouter } from 'react-router-dom';
import { CatalogProvider } from './state/CatalogContext.jsx';
import { NoticeProvider } from './state/NoticeContext.jsx';
import { SessionProvider } from './state/SessionContext.jsx';
import { NavigationProvider } from './state/NavigationContext.jsx';
import { FavoritesProvider } from './state/FavoritesContext.jsx';
import AtlasScreen from './features/AtlasScreen.jsx';
export default function App() {
  return (
    <BrowserRouter>
      <NoticeProvider>
        <CatalogProvider>
          <SessionProvider>
            <NavigationProvider>
              <FavoritesProvider>
                <AtlasScreen />
              </FavoritesProvider>
            </NavigationProvider>
          </SessionProvider>
        </CatalogProvider>
      </NoticeProvider>
    </BrowserRouter>
  );
}
