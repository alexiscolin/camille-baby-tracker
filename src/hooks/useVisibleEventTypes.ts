import { createContext, useContext } from 'react';
import { EVENT_TYPES } from '../utils/event-config';
import type { EventType } from '../types/events';

/**
 * Which event types the UI should offer and aggregate.
 *
 * A context rather than a prop: the value lives on the baby document, but the
 * components that need it — the day badges, the activity radar, the dashboard
 * and stats charts, the add-event picker — sit several levels below the page
 * that loads the baby and have no other reason to know about it.
 *
 * The default is every type, so a component rendered outside the provider
 * behaves exactly as it did before the setting existed. The provider lives in
 * its own file so that neither exports both a component and a hook.
 */
export const VisibleEventTypesContext = createContext<EventType[]>(EVENT_TYPES);

export function useVisibleEventTypes(): EventType[] {
  return useContext(VisibleEventTypesContext);
}
