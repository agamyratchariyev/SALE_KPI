import { create } from 'zustand';

import { useAuthStore } from './auth-store';

interface KpiPlanListState {
  /** What is typed in the search box, before the debounce. */
  searchInput: string;
  /** The month last chosen (`2026-09`); `null`: the newest month. */
  periodLabel: string | null;
  /** The template the list is filtered to; `null`: every template. */
  templateId: string | null;
  setSearchInput: (searchInput: string) => void;
  setPeriodLabel: (periodLabel: string | null) => void;
  setTemplateId: (templateId: string | null) => void;
  reset: () => void;
}

const INITIAL = {
  searchInput: '',
  periodLabel: null,
  templateId: null,
};

/**
 * Search, month and template filter of the KPI plan list (ADR-066). They live in memory, so
 * the menu link, which carries no `?period=`, comes back to the same list. The month and the
 * template are also in the address, which is what survives a reload; the search does not.
 */
export const useKpiPlanListStore = create<KpiPlanListState>((set) => ({
  ...INITIAL,
  setSearchInput: (searchInput) => set({ searchInput }),
  setPeriodLabel: (periodLabel) => set({ periodLabel }),
  setTemplateId: (templateId) => set({ templateId }),
  reset: () => set(INITIAL),
}));

// The next person to sign in on this tab starts with an unfiltered list.
useAuthStore.subscribe((state, previous) => {
  if (previous.isAuthenticated && !state.isAuthenticated) {
    useKpiPlanListStore.getState().reset();
  }
});
