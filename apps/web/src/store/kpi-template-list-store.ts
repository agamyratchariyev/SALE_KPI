import { create } from 'zustand';

import { useAuthStore } from './auth-store';

export type KpiTemplateStatusFilter = 'all' | 'active' | 'inactive';

interface KpiTemplateListState {
  /** What is typed in the search box, before the debounce. */
  searchInput: string;
  status: KpiTemplateStatusFilter;
  setSearchInput: (searchInput: string) => void;
  setStatus: (status: KpiTemplateStatusFilter) => void;
  reset: () => void;
}

const INITIAL = {
  searchInput: '',
  // The list opens on the templates in use; the filter shows the others on request.
  status: 'active' as KpiTemplateStatusFilter,
};

/**
 * Search and status filter of the KPI template list. Like the employee list (ADR-066) they
 * live in memory, so leaving the screen and coming back keeps them; a reload starts clean.
 */
export const useKpiTemplateListStore = create<KpiTemplateListState>((set) => ({
  ...INITIAL,
  setSearchInput: (searchInput) => set({ searchInput }),
  setStatus: (status) => set({ status }),
  reset: () => set(INITIAL),
}));

// The next person to sign in on this tab starts with the default list.
useAuthStore.subscribe((state, previous) => {
  if (previous.isAuthenticated && !state.isAuthenticated) {
    useKpiTemplateListStore.getState().reset();
  }
});
