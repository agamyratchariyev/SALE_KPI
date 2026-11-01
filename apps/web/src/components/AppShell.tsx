import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { logout as logoutRequest } from '../api/auth';
import { useTranslation } from '../i18n/locale-store';
import { useAuthStore } from '../store/auth-store';
import type { RecordInfoTarget } from '../store/record-info-store';
import { BRAND_NAME, BrandMark } from './BrandLogo';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import { Drawer } from './Drawer';
import { EmployeeCardModal } from './EmployeeCardModal';
import { ProfileAvatar } from './ProfileAvatar';
import { RecordInfoButton } from './RecordInfo';

interface AppShellProps {
  title: string;
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  fullWidth?: boolean;
  /** Record shown on this screen; puts the record info button at the end of the title line. */
  recordInfo?: RecordInfoTarget | undefined;
}

interface NavItem {
  to: string;
  label: string;
  icon?: string;
}

export function AppShell({
  title,
  children,
  breadcrumbs,
  fullWidth = false,
  recordInfo,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const employee = useAuthStore((state) => state.employee);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  // The store dashboard, employee directory, KPI templates and KPI plans are admin-only
  // screens, hidden from everyone else; employees see their own plan under "My KPI".
  const navItems: NavItem[] = [
    { to: '/leaderboard', label: t('appShell.navLeaderboard') },
    { to: '/my-kpi', label: t('appShell.navMyKpi') },
    ...(employee?.fullAccess
      ? [
          { to: '/store-dashboard', label: t('appShell.navStoreDashboard') },
          { to: '/employees', label: t('appShell.navEmployees') },
        ]
      : []),
    ...(employee?.fullAccess
      ? [
          { to: '/kpi-templates', label: t('appShell.navKpiTemplates') },
          { to: '/kpi-plans', label: t('appShell.navKpiPlans') },
        ]
      : []),
    // Whoever enters the daily visitor counts, plus administrators (ADR-043).
    ...(employee?.canEnterVisitorCounts || employee?.fullAccess
      ? [{ to: '/visitor-counts', label: t('appShell.navVisitorCounts') }]
      : []),
    { to: '/sessions', label: t('appShell.navSessions') },
  ];

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Even if the network call fails, clear the local session so the user isn't stuck.
    } finally {
      clearSession();
      void navigate('/login', { replace: true });
    }
  }

  return (
    // On desktop the shell owns the viewport and only <main> scrolls; mobile keeps normal page scroll.
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex lg:h-screen lg:min-h-0 lg:overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="border-b border-slate-200 px-4 py-5 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {BRAND_NAME}
            </span>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="border-t border-slate-200 p-3 space-y-2 dark:border-slate-800">
          <Link
            to="/settings"
            className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
              location.pathname.startsWith('/settings')
                ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.6 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('appShell.navSettings')}
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('appShell.logout')}
          </button>
        </div>

        {/* Profile */}
        {employee ? (
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="flex min-h-[56px] items-center gap-3">
              <button
                type="button"
                onClick={() => setCardOpen(true)}
                aria-label={t('employeeCard.title')}
                className="flex-shrink-0 rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
              >
                <ProfileAvatar employee={employee} className="h-10 w-10" />
              </button>
              <Link to="/settings" className="min-w-0 flex-1 rounded-lg text-left">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {employee.firstname}
                </p>
                <p className="truncate text-xs text-slate-500">@{employee.username}</p>
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile Drawer - Hidden on desktop */}
      <div className="lg:hidden">
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <span className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {BRAND_NAME}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={t('appShell.closeMenu')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-100 lg:hidden"
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

          <div className="flex-1 overflow-y-auto px-2 py-3">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-[48px] items-center rounded-xl px-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 space-y-2">
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-[48px] w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008.6 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t('appShell.navSettings')}
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex min-h-[48px] w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t('appShell.logout')}
            </button>
          </div>

          {employee ? (
            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setCardOpen(true);
                  }}
                  aria-label={t('employeeCard.title')}
                  className="flex-shrink-0 rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
                >
                  <ProfileAvatar employee={employee} className="h-10 w-10" />
                </button>
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {employee.firstname} {employee.lastname}
                  </p>
                  <p className="truncate text-xs text-slate-500">@{employee.username}</p>
                </Link>
              </div>
            </div>
          ) : null}
        </Drawer>
      </div>

      {/* Main Content: the page's scroll area on desktop; an open modal stops it (useScrollLock).
          `relative` keeps absolute children (sr-only labels deep in a long list) inside it;
          without it they hang off <body> and give the document a second scrollbar. */}
      <div
        data-page-scroll
        className="min-w-0 flex-1 lg:relative lg:h-screen lg:overflow-y-auto lg:[scrollbar-gutter:stable]"
      >
        <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('appShell.openMenu')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="truncate pl-2 text-base font-semibold">{title}</h1>
        </header>

        <main className={`w-full pb-24 ${fullWidth ? 'px-0' : 'mx-auto max-w-4xl px-4'} pt-4`}>
          {breadcrumbs || recordInfo ? (
            <div className={`mb-4 flex items-start gap-2 ${fullWidth ? 'px-4' : ''}`}>
              <div className="min-w-0 flex-1">
                {breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : null}
              </div>
              {recordInfo ? (
                // -mt-3 centres the 44px button on the breadcrumb text line without making it taller.
                <div className="-mt-3 flex-shrink-0">
                  <RecordInfoButton {...recordInfo} />
                </div>
              ) : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <EmployeeCardModal
        employeeId={cardOpen && employee ? employee.id : null}
        onClose={() => setCardOpen(false)}
      />
    </div>
  );
}
