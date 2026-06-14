import { createContext, useContext, type ReactNode } from 'react';
import { useRuntime } from './runtime';

// One app-wide Letta runtime: a single session init, consumed live by Chat, the Sidebar, and
// Settings. Surfaces read the SAME runtime status, so readiness is truthful and consistent across
// the app (the Sidebar can never say "not connected" while Chat says "connected").
type RuntimeValue = ReturnType<typeof useRuntime>;

const RuntimeContext = createContext<RuntimeValue | null>(null);

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const value = useRuntime();
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

/** Live runtime for any surface. In the web preview window.otto is absent → electron:false. */
export function useRuntimeContext(): RuntimeValue {
  const v = useContext(RuntimeContext);
  if (!v) throw new Error('useRuntimeContext must be used within RuntimeProvider');
  return v;
}
