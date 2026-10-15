import { createContext, useCallback, useContext, useMemo, useState } from 'react';
const NoticeContext = createContext(null);
export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState('');
  const dismissNotice = useCallback(() => setNotice(''), []);
  const value = useMemo(() => ({ notice, setNotice, dismissNotice }), [notice, dismissNotice]);
  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
}
export const useNotice = () => useContext(NoticeContext);
