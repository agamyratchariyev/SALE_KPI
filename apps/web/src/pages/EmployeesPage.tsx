import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  bulkSetEmployeesActive,
  listEmployees,
  type EmployeeListQuery,
  type EmployeeSortField,
} from '../api/employees';
import { listStores } from '../api/stores';
import { AppShell } from '../components/AppShell';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { BulkActionBar, type BulkAction } from '../components/BulkActionBar';
import { EmployeeCardModal } from '../components/EmployeeCardModal';
import { JobStoreMeta } from '../components/JobStoreMeta';
import { RecordInfoButton } from '../components/RecordInfo';
import { Drawer } from '../components/Drawer';
import { SelectCheckbox } from '../components/SelectCheckbox';
import { StatusBadge } from '../components/StatusBadge';
import { StoreLookupField } from '../components/StoreLookupField';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';
import { isBulkBarVisible, type BulkNotice } from '../lib/bulk';
import { useSelection } from '../lib/use-selection';
import { useAuthStore } from '../store/auth-store';
import {
  EMPTY_EMPLOYEE_FILTERS,
  useEmployeeListStore,
  type EmployeeFilters,
} from '../store/employee-list-store';
import type { EmployeeResponse, StoreOption } from '../types/api';
import { confirmAction } from '../store/confirm-store';

/** Checkbox state for one row; `disabledReason` locks the box (the signed-in user's row). */
interface RowSelection {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabledReason?: string | undefined;
}

type BulkStatusAction = 'activate' | 'deactivate';

function initials(employee: EmployeeResponse): string {
  return `${employee.firstname[0] ?? ''}${employee.lastname[0] ?? ''}`.toUpperCase();
}

function AvatarOrInitials({ employee }: { employee: EmployeeResponse }) {
  const fallback = (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {initials(employee)}
    </span>
  );

  if (employee.avatar) {
    return (
      <AuthenticatedImage
        path={employee.avatar.smallImageUrl ?? employee.avatar.contentUrl}
        alt=""
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
        fallback={fallback}
      />
    );
  }

  return fallback;
}

function AvatarButton({
  employee,
  onShowCard,
}: {
  employee: EmployeeResponse;
  onShowCard: (employee: EmployeeResponse) => void;
}) {
  const { t } = useTranslation();
  const employeeName = `${employee.firstname} ${employee.lastname}`;

  return (
    <button
      type="button"
      onClick={(event) => {
        // The avatar sits inside a row link; keep the click from navigating.
        event.preventDefault();
        event.stopPropagation();
        onShowCard(employee);
      }}
      aria-label={t('employees.openCard', { name: employeeName })}
      className="flex-shrink-0 rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
    >
      <AvatarOrInitials employee={employee} />
    </button>
  );
}

function StatusBadges({ employee }: { employee: EmployeeResponse }) {
  const { t } = useTranslation();

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <StatusBadge
        isActive={employee.isActive}
        label={t(employee.isActive ? 'employees.activeBadge' : 'employees.inactiveBadge')}
      />
      {employee.fullAccess ? (
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          {t('employees.managerBadge')}
        </span>
      ) : null}
    </span>
  );
}

function EmployeeCard({
  employee,
  storeName,
  onShowCard,
  canManage,
  selection,
}: {
  employee: EmployeeResponse;
  /** The default store's name (ADR-058); null without one. */
  storeName: string | null;
  onShowCard: (employee: EmployeeResponse) => void;
  canManage: boolean;
  selection: RowSelection | null;
}) {
  const { t } = useTranslation();
  const employeeName = `${employee.firstname} ${employee.lastname}`;
  const bodyClassName = `flex min-w-0 flex-1 items-center gap-3 self-stretch py-2.5 pr-3 ${
    selection ? '' : 'pl-3'
  }`;

  const content = (
    <>
      <AvatarButton employee={employee} onShowCard={onShowCard} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {employee.firstname} {employee.lastname}
          </span>
          <StatusBadges employee={employee} />
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          @{employee.username}
          {employee.email ? ` \u00b7 ${employee.email}` : ''}
        </span>
        <span className="mt-0.5 block">
          <JobStoreMeta jobTitle={employee.jobTitle} storeName={storeName} />
        </span>
      </span>
      {canManage ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 flex-shrink-0 text-slate-400"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );

  return (
    <div
      className={`flex min-h-[64px] items-center overflow-hidden rounded-xl border transition ${
        selection?.checked
          ? 'border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      {selection ? (
        <SelectCheckbox
          checked={selection.checked}
          onChange={selection.onChange}
          disabledReason={selection.disabledReason}
          label={t('common.selectItem', { name: employeeName })}
        />
      ) : null}
      {/* Only admins can open the edit screen, so the body is a plain container otherwise. */}
      {canManage ? (
        <Link
          to={`/employees/${employee.id}`}
          className={`${bodyClassName} transition active:bg-slate-100 dark:active:bg-slate-800`}
        >
          {content}
        </Link>
      ) : (
        <div className={bodyClassName}>{content}</div>
      )}
      <RecordInfoButton tableName="employees" recordId={employee.id} title={employeeName} />
    </div>
  );
}

function EmployeeRow({
  employee,
  storeName,
  onShowCard,
  canManage,
  selection,
}: {
  employee: EmployeeResponse;
  storeName: string | null;
  onShowCard: (employee: EmployeeResponse) => void;
  canManage: boolean;
  selection: RowSelection | null;
}) {
  const { t } = useTranslation();

  return (
    <tr
      className={`border-b border-slate-100 transition last:border-0 dark:border-slate-800/70 ${
        selection?.checked
          ? 'bg-emerald-50 dark:bg-emerald-400/10'
          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
      }`}
    >
      {selection ? (
        <td className="w-12 py-0 pl-2">
          <SelectCheckbox
            checked={selection.checked}
            onChange={selection.onChange}
            disabledReason={selection.disabledReason}
            label={t('common.selectItem', {
              name: `${employee.firstname} ${employee.lastname}`,
            })}
          />
        </td>
      ) : null}
      <td className={`py-2 pr-3 ${selection ? '' : 'pl-4'}`}>
        <div className="flex items-center gap-2.5">
          <AvatarButton employee={employee} onShowCard={onShowCard} />
          {canManage ? (
            <Link
              to={`/employees/${employee.id}`}
              className="truncate text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {employee.firstname}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {employee.firstname}
            </span>
          )}
        </div>
      </td>
      <td className="py-2 pr-3 text-sm text-slate-700 dark:text-slate-300">{employee.lastname}</td>
      <td className="py-2 pr-3 text-sm text-slate-500 dark:text-slate-400">@{employee.username}</td>
      <td className="max-w-[12rem] py-2 pr-3 text-sm text-slate-700 dark:text-slate-300">
        <span className="block truncate" title={employee.jobTitle ?? undefined}>
          {employee.jobTitle ?? '—'}
        </span>
      </td>
      <td className="max-w-[10rem] py-2 pr-3 text-sm text-slate-700 dark:text-slate-300">
        <span className="block truncate" title={storeName ?? undefined}>
          {storeName ?? '—'}
        </span>
      </td>
      {canManage ? (
        <>
          <td className="hidden max-w-[14rem] py-2 pr-3 text-sm text-slate-500 2xl:table-cell dark:text-slate-400">
            <span className="block truncate" title={employee.email ?? undefined}>
              {employee.email ?? '—'}
            </span>
          </td>
          <td className="hidden whitespace-nowrap py-2 pr-3 text-sm text-slate-500 2xl:table-cell dark:text-slate-400">
            {employee.phoneNumber ?? '—'}
          </td>
        </>
      ) : null}
      <td className="py-2 pr-3">
        <StatusBadges employee={employee} />
      </td>
      {canManage ? (
        <td className="py-2 pr-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/employees/${employee.id}`}
              aria-label={t('employees.editEmployee', {
                name: `${employee.firstname} ${employee.lastname}`,
              })}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <RecordInfoButton
              tableName="employees"
              recordId={employee.id}
              title={`${employee.firstname} ${employee.lastname}`}
            />
          </div>
        </td>
      ) : null}
    </tr>
  );
}

function countActiveFilters(filters: EmployeeFilters): number {
  return (
    (filters.status === 'all' ? 0 : 1) +
    (filters.managersOnly ? 1 : 0) +
    (filters.erpLinkedOnly ? 1 : 0) +
    (filters.withAvatarOnly ? 1 : 0) +
    (filters.storeId === null ? 0 : 1)
  );
}

function toQuery(filters: EmployeeFilters): EmployeeListQuery {
  return {
    ...(filters.status === 'all' ? {} : { isActive: filters.status === 'active' }),
    ...(filters.managersOnly ? { fullAccess: true } : {}),
    ...(filters.erpLinkedOnly ? { hasErpLink: true } : {}),
    ...(filters.withAvatarOnly ? { hasAvatar: true } : {}),
    ...(filters.storeId === null ? {} : { defaultStoreId: filters.storeId }),
  };
}

interface SortOption {
  value: string;
  labelKey: TranslationKey;
  sort: EmployeeSortField;
  order: 'asc' | 'desc';
}

const SORT_OPTIONS: [SortOption, ...SortOption[]] = [
  {
    value: 'firstname-asc',
    labelKey: 'employees.sortFirstnameAsc',
    sort: 'firstname',
    order: 'asc',
  },
  {
    value: 'firstname-desc',
    labelKey: 'employees.sortFirstnameDesc',
    sort: 'firstname',
    order: 'desc',
  },
  { value: 'lastname-asc', labelKey: 'employees.sortLastname', sort: 'lastname', order: 'asc' },
  { value: 'username-asc', labelKey: 'employees.sortUsername', sort: 'username', order: 'asc' },
  { value: 'createdAt-desc', labelKey: 'employees.sortNewest', sort: 'createdAt', order: 'desc' },
  { value: 'createdAt-asc', labelKey: 'employees.sortOldest', sort: 'createdAt', order: 'asc' },
];

/** The store's name; its number only when Tiger has no name for it. */
function storeLabel(store: StoreOption): string {
  return store.name ?? String(store.nr);
}

export function EmployeesPage() {
  const { t, locale } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Search, filters and sort outlive the page, so a trip into an employee and back keeps
  // them; a reload starts clean (employee-list-store).
  const searchInput = useEmployeeListStore((state) => state.searchInput);
  const setSearchInput = useEmployeeListStore((state) => state.setSearchInput);
  const appliedFilters = useEmployeeListStore((state) => state.filters);
  const setAppliedFilters = useEmployeeListStore((state) => state.setFilters);
  const sortValue = useEmployeeListStore((state) => state.sortValue);
  const setSortValue = useEmployeeListStore((state) => state.setSortValue);
  // Starts from the kept text, so coming back does not wait for the debounce.
  const [search, setSearch] = useState(() => searchInput.trim());
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<EmployeeFilters>(appliedFilters);
  const [cardEmployee, setCardEmployee] = useState<EmployeeResponse | null>(null);
  const [notice, setNotice] = useState<BulkNotice | null>(null);
  const canManage = useAuthStore((state) => state.employee?.fullAccess ?? false);
  const currentEmployeeId = useAuthStore((state) => state.employee?.id.toLowerCase() ?? null);
  const queryClient = useQueryClient();

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sortOption = SORT_OPTIONS.find((option) => option.value === sortValue) ?? SORT_OPTIONS[0];
  const activeFilterCount = countActiveFilters(appliedFilters);

  const query: EmployeeListQuery = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...toQuery(appliedFilters),
      sort: sortOption.sort,
      order: sortOption.order,
    }),
    [search, appliedFilters, sortOption],
  );

  const employeesQuery = useInfiniteQuery({
    queryKey: ['employees', query],
    queryFn: ({ pageParam }) => listEmployees(pageParam, query),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const employees = useMemo(
    () => employeesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [employeesQuery.data],
  );
  // Default store names (ADR-058); the same cached list the store pickers use.
  const storesQuery = useQuery({ queryKey: ['stores', ''], queryFn: () => listStores('') });
  const storeNames = useMemo(
    () => new Map((storesQuery.data ?? []).map((store) => [store.id, storeLabel(store)])),
    [storesQuery.data],
  );
  const storeNameOf = (employee: EmployeeResponse) =>
    employee.defaultStoreId === null ? null : (storeNames.get(employee.defaultStoreId) ?? null);
  const total = employeesQuery.data?.pages[0]?.total ?? 0;

  // Bulk selection (ADR-035): scoped to the query and limited to loaded rows. The signed-in
  // user's own row is never selectable, so a bulk deactivation cannot lock them out.
  const selection = useSelection(JSON.stringify(query));
  const isSelf = (employee: EmployeeResponse) => employee.id.toLowerCase() === currentEmployeeId;
  const selectableEmployees = employees.filter((employee) => !isSelf(employee));
  const selectedEmployees = selectableEmployees.filter((employee) =>
    selection.selected.has(employee.id),
  );
  const allSelected =
    selectableEmployees.length > 0 && selectedEmployees.length === selectableEmployees.length;
  const dismissNotice = useCallback(() => setNotice(null), []);

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: BulkStatusAction }) =>
      bulkSetEmployeesActive(ids, action === 'activate'),
    onMutate: () => setNotice(null),
    onSuccess: (result, { action }) => {
      selection.clear();
      setNotice({
        tone: 'success',
        text: t(action === 'activate' ? 'employees.bulkActivated' : 'employees.bulkDeactivated', {
          count: formatNumber(result.updated, locale),
        }),
      });
    },
    onError: (error) =>
      setNotice({
        tone: 'error',
        text: localizeApiError(error, t, 'employees.bulkError', {
          409: 'employees.selfSelectHint',
        }),
      }),
    // Partial chunks may have been applied even on error, so always refetch.
    onSettled: async (_result, _error, { action }) => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });

      if (action === 'deactivate') {
        await queryClient.invalidateQueries({ queryKey: ['employee-sessions'] });
      }
    },
  });

  async function runBulkStatus(action: BulkStatusAction, targets: EmployeeResponse[]) {
    if (
      action === 'deactivate' &&
      !(await confirmAction({
        message: t('employees.bulkDeactivateConfirm', {
          count: formatNumber(targets.length, locale),
        }),
        tone: 'danger',
      }))
    ) {
      return;
    }

    bulkMutation.mutate({ action, ids: targets.map((employee) => employee.id) });
  }

  // Only actions that change something are offered; a mixed selection shows per-action counts.
  const toActivate = selectedEmployees.filter((employee) => !employee.isActive);
  const toDeactivate = selectedEmployees.filter((employee) => employee.isActive);
  const withCount = (label: string, count: number) =>
    count === selectedEmployees.length ? label : `${label} (${formatNumber(count, locale)})`;
  const bulkActions: BulkAction[] = [
    ...(toActivate.length > 0
      ? [
          {
            key: 'activate',
            label: withCount(t('employees.bulkActivate'), toActivate.length),
            tone: 'primary' as const,
            onClick: () => void runBulkStatus('activate', toActivate),
          },
        ]
      : []),
    ...(toDeactivate.length > 0
      ? [
          {
            key: 'deactivate',
            label: withCount(t('employees.bulkDeactivate'), toDeactivate.length),
            tone: 'danger' as const,
            onClick: () => void runBulkStatus('deactivate', toDeactivate),
          },
        ]
      : []),
  ];
  const bulkBarVisible = isBulkBarVisible(selectedEmployees.length, notice);

  function rowSelection(employee: EmployeeResponse): RowSelection | null {
    if (!canManage) {
      return null;
    }

    if (isSelf(employee)) {
      return {
        checked: false,
        onChange: () => undefined,
        disabledReason: t('employees.selfSelectHint'),
      };
    }

    return {
      checked: selection.selected.has(employee.id),
      onChange: (checked) => selection.toggle(employee.id, checked),
    };
  }

  const selectAllProps = {
    checked: allSelected,
    indeterminate: selectedEmployees.length > 0 && !allSelected,
    label: t('common.selectAll'),
    onChange: (checked: boolean) =>
      selection.setMany(
        selectableEmployees.map((employee) => employee.id),
        checked,
      ),
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        employeesQuery.hasNextPage &&
        !employeesQuery.isFetchingNextPage
      ) {
        void employeesQuery.fetchNextPage();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [employeesQuery]);

  function openFilters() {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraftFilters(EMPTY_EMPLOYEE_FILTERS);
    setAppliedFilters(EMPTY_EMPLOYEE_FILTERS);
    setFilterOpen(false);
  }

  const hasNoResults = !employeesQuery.isLoading && employees.length === 0;
  const isFiltered = Boolean(search) || activeFilterCount > 0;

  return (
    <AppShell
      title={t('employees.title')}
      fullWidth
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('employees.title') },
      ]}
    >
      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} side="right" variant="overlay">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('employees.filters')}
          </h2>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            aria-label={t('appShell.closeMenu')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('employees.statusColumn')}
            </legend>
            {(
              [
                ['all', t('employees.filterStatusAll')],
                ['active', t('employees.filterOnlyActive')],
                ['inactive', t('employees.filterOnlyInactive')],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
              >
                <input
                  type="radio"
                  name="status"
                  checked={draftFilters.status === value}
                  onChange={() => setDraftFilters((prev) => ({ ...prev, status: value }))}
                  className="h-4 w-4 accent-emerald-400"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('employees.filters')}
            </legend>
            {(
              [
                ['managersOnly', t('employees.filterManagers')],
                ['erpLinkedOnly', t('employees.filterErpLinked')],
                ['withAvatarOnly', t('employees.filterWithAvatar')],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={draftFilters[key]}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, [key]: event.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-emerald-400"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <label htmlFor="employee-filter-store">{t('employees.filterStore')}</label>
            </legend>
            <StoreLookupField
              id="employee-filter-store"
              multiple={false}
              value={draftFilters.storeId === null ? [] : [draftFilters.storeId]}
              onChange={(ids) => setDraftFilters((prev) => ({ ...prev, storeId: ids[0] ?? null }))}
              noneLabel={t('employees.filterStoreAll')}
            />
          </fieldset>
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800">
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 flex-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {t('common.clear')}
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="h-10 flex-1 rounded-lg bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            {t('common.apply')}
          </button>
        </div>
      </Drawer>

      {/* Toolbar: search left, sort + filter right */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('employees.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
            aria-label={t('employees.sortLabel')}
            className="h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openFilters}
            aria-label={t('employees.filters')}
            className={`relative flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
              activeFilterCount > 0
                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">{t('employees.filters')}</span>
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[11px] font-bold text-slate-950">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* How many employees the list holds, always; the filter chips only while filtering. */}
      {employeesQuery.data ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-xs">
          <span aria-live="polite" className="text-slate-500 dark:text-slate-400">
            {t('employees.resultCount', { count: formatNumber(total, locale) })}
          </span>
          {search ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              “{search}”
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label={t('common.clear')}
                className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3 w-3"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ) : null}
          {activeFilterCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300">
              {t('employees.filtersActiveCount', {
                count: formatNumber(activeFilterCount, locale),
              })}
              <button
                type="button"
                onClick={clearFilters}
                aria-label={t('common.clear')}
                className="transition hover:text-emerald-900 dark:hover:text-emerald-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3 w-3"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      {employeesQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('employees.loading')}
        </p>
      ) : null}

      {employeesQuery.isError ? (
        <p className="mx-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">
          {t('employees.errorLoading')}
        </p>
      ) : null}

      {hasNoResults ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {isFiltered ? t('employees.noSearchResults') : t('employees.empty')}
        </p>
      ) : null}

      {employees.length > 0 ? (
        <>
          {canManage && selectableEmployees.length > 0 ? (
            <div className="px-2 pb-1 lg:hidden">
              <SelectCheckbox {...selectAllProps} showLabel />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 px-4 lg:hidden">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                storeName={storeNameOf(employee)}
                onShowCard={setCardEmployee}
                canManage={canManage}
                selection={rowSelection(employee)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                  {canManage ? (
                    <th className="w-12 py-0 pl-2 font-medium">
                      <SelectCheckbox
                        {...selectAllProps}
                        disabledReason={
                          selectableEmployees.length === 0
                            ? t('employees.selfSelectHint')
                            : undefined
                        }
                      />
                    </th>
                  ) : null}
                  <th className={`py-2 pr-3 font-medium ${canManage ? '' : 'pl-4'}`}>
                    {t('employeeForm.firstnameLabel')}
                  </th>
                  <th className="py-2 pr-3 font-medium">{t('employees.columnLastname')}</th>
                  <th className="py-2 pr-3 font-medium">{t('employees.columnUsername')}</th>
                  <th className="py-2 pr-3 font-medium">{t('employeeCard.jobTitle')}</th>
                  <th className="py-2 pr-3 font-medium">{t('employeeCard.defaultStore')}</th>
                  {canManage ? (
                    <>
                      {/* Below 2xl the row does not fit (at 1280 px it scrolled sideways);
                          the employee card has both. */}
                      <th className="hidden py-2 pr-3 font-medium 2xl:table-cell">
                        {t('employeeCard.email')}
                      </th>
                      <th className="hidden py-2 pr-3 font-medium 2xl:table-cell">
                        {t('employees.columnPhone')}
                      </th>
                    </>
                  ) : null}
                  <th className="py-2 pr-3 font-medium">{t('employees.statusColumn')}</th>
                  {canManage ? (
                    <th className="py-2 pr-4 text-right font-medium">
                      {t('employees.columnActions')}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    storeName={storeNameOf(employee)}
                    onShowCard={setCardEmployee}
                    canManage={canManage}
                    selection={rowSelection(employee)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div ref={sentinelRef} className="h-1" />

      {employeesQuery.isFetchingNextPage ? (
        <p className="py-4 text-center text-xs text-slate-500">{t('employees.loading')}</p>
      ) : null}

      {/* Keeps the last rows scrollable above the fixed bulk bar. */}
      {bulkBarVisible ? <div aria-hidden="true" className="h-44 sm:h-32" /> : null}

      <EmployeeCardModal
        employeeId={cardEmployee?.id ?? null}
        onClose={() => setCardEmployee(null)}
      />

      {canManage ? (
        <BulkActionBar
          count={selectedEmployees.length}
          actions={bulkActions}
          onClear={selection.clear}
          pendingKey={bulkMutation.isPending ? bulkMutation.variables.action : null}
          notice={notice}
          onDismissNotice={dismissNotice}
        />
      ) : null}

      {canManage && !bulkBarVisible ? (
        <Link
          to="/employees/new"
          aria-label={t('employees.addEmployee')}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </Link>
      ) : null}
    </AppShell>
  );
}
