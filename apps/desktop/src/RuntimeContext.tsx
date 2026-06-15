import type { ReactNode } from 'react';
import { useRuntime } from './runtime';
import { RuntimeContext } from './runtime-context';

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const value = useRuntime();
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}
