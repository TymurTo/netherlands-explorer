import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useSession } from './SessionContext.jsx';
import { useNotice } from './NoticeContext.jsx';
import { useNavigation } from './NavigationContext.jsx';
const FavoritesContext = createContext(null);
export function FavoritesProvider({ children }) {
  const { selection } = useNavigation();
  const { user, isAuthReady } = useSession();
  const { setNotice } = useNotice();
  const [saved, setSaved] = useState({ userId: null, ids: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [pendingId, setPendingId] = useState(null);
  useEffect(() => {
    if (selection.panel?.type !== 'auth') setPendingId(null);
  }, [selection.panel?.type]);
  const currentUser = useRef(user?.id);
  const busy = useRef(false);
  const loadVersion = useRef(0);
  currentUser.current = user?.id;
  const favoriteIds = saved.userId === user?.id ? saved.ids : [];
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const version = ++loadVersion.current;
    const controller = new AbortController();
    setLoading(true);
    api('/favorites', { signal: controller.signal })
      .then((ids) => {
        if (!controller.signal.aborted && version === loadVersion.current)
          setSaved({ userId: user.id, ids });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setNotice(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user, revision, setNotice]);
  async function save(attractionId, remove = false, owner = user) {
    if (!owner || busy.current) return;
    busy.current = true;
    setSaving(true);
    ++loadVersion.current;
    try {
      await api(`/favorites/${attractionId}`, { method: remove ? 'DELETE' : 'PUT' });
      if (currentUser.current === owner.id) {
        setSaved((previous) => {
          const ids = previous.userId === owner.id ? previous.ids : [];
          return {
            userId: owner.id,
            ids: remove
              ? ids.filter((id) => id !== attractionId)
              : [...new Set([...ids, attractionId])],
          };
        });
      }
    } finally {
      busy.current = false;
      setSaving(false);
      setRevision((value) => value + 1);
    }
  }
  const value = {
    favoriteIds,
    loading,
    pendingId,
    setPendingId,
    save,
    disabled: loading || saving || !isAuthReady,
    refresh: () => setRevision((value) => value + 1),
  };
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
export const useFavorites = () => useContext(FavoritesContext);
