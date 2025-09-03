import { createContext, useContext } from 'react';

export interface DsfrContextType {
  isReady: boolean;
}

export const DsfrContext = createContext<DsfrContextType>({ isReady: false });

export const useDsfr = () => useContext(DsfrContext);
