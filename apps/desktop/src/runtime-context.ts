import { createContext, useContext } from 'react';
import { useRuntime } from './runtime';

type RuntimeValue = ReturnType<typeof useRuntime>;

export const RuntimeContext = createContext<RuntimeValue | null>(null);

/** Live runtime for any surface. In the web preview window.otto is absent → electron:false. */
export function useRuntimeContext(): RuntimeValue {
  const v = useContext(RuntimeContext);
  if (!v) throw new Error('useRuntimeContext must be used within RuntimeProvider');
  return v;
}
