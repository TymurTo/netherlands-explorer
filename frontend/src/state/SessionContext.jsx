import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useNotice } from './NoticeContext.jsx';
const SessionContext = createContext(null);
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { setNotice } = useNotice();
  useEffect(() => {
    const controller = new AbortController();
    api('/auth/me', { signal: controller.signal })
      .then(setUser)
      .catch((error) => {
        if (!controller.signal.aborted && error.status !== 401) setNotice(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsAuthReady(true);
      });
    return () => controller.abort();
  }, [setNotice]);
  const value = useMemo(() => ({ user, setUser, isAuthReady }), [user, isAuthReady]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export const useSession = () => useContext(SessionContext);
