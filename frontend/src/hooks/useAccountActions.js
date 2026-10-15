import { api } from '../api/client.js';
import { useSession } from '../state/SessionContext.jsx';
import { useFavorites } from '../state/FavoritesContext.jsx';
import { useNavigation } from '../state/NavigationContext.jsx';
import { useNotice } from '../state/NoticeContext.jsx';
export default function useAccountActions() {
  const { user, setUser } = useSession();
  const { favoriteIds, pendingId, setPendingId, save } = useFavorites();
  const { openPanel, closePanel } = useNavigation();
  const { setNotice } = useNotice();
  async function toggleFavorite(id) {
    if (!user) {
      setPendingId(id);
      openPanel('auth');
      return;
    }
    const remove = favoriteIds.includes(id);
    try {
      await save(id, remove);
      setNotice(remove ? 'Place removed from favorites.' : 'Place saved to favorites.');
    } catch (error) {
      setNotice(error.message);
      if (error.status === 401) {
        setUser(null);
        setPendingId(id);
        openPanel('auth');
      }
    }
  }
  async function handleSignIn(account) {
    setUser(account);
    closePanel();
    setNotice(`Signed in as ${account.username}.`);
    if (!pendingId) return;
    try {
      await save(pendingId, false, account);
      setNotice('Place saved to favorites.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setPendingId(null);
    }
  }
  async function signOut() {
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      setPendingId(null);
      closePanel();
      setNotice('You have signed out.');
    } catch (error) {
      setNotice(error.message);
    }
  }
  return { toggleFavorite, handleSignIn, signOut };
}
