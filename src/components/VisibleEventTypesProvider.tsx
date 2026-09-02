import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { VisibleEventTypesContext } from '../hooks/useVisibleEventTypes';
import { visibleEventTypes } from '../utils/event-config';
import type { EventType } from '../types/events';

interface VisibleEventTypesProviderProps {
  /** Straight off the baby document; see `visibleEventTypes` for the rules. */
  hidden: EventType[] | undefined;
  children: ReactNode;
}

export function VisibleEventTypesProvider({
  hidden,
  children,
}: VisibleEventTypesProviderProps) {
  const value = useMemo(() => visibleEventTypes(hidden), [hidden]);
  return (
    <VisibleEventTypesContext.Provider value={value}>
      {children}
    </VisibleEventTypesContext.Provider>
  );
}
