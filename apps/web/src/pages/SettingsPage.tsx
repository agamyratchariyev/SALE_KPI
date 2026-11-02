import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { changePassword } from '../api/auth';
import { updateOwnProfile } from '../api/employees';
import { uploadFile } from '../api/files';
import { AppShell } from '../components/AppShell';
import { ImageCropper } from '../components/ImageCropper';
import { Modal } from '../components/Modal';
import { PasswordInput } from '../components/PasswordInput';
import { EmployeeCardModal } from '../components/EmployeeCardModal';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Spinner } from '../components/Spinner';
import { localizeApiError } from '../i18n/api-errors';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../i18n/translations';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore, type ThemePreference } from '../theme/theme-store';

const THEME_OPTIONS: { value: ThemePreference; icon: string; labelKey: TranslationKey }[] = [
  { value: 'light', icon: '☀', labelKey: 'settings.themeLight' },
  { value: 'dark', icon: '☾', labelKey: 'settings.themeDark' },
  { value: 'system', icon: '⚙', labelKey: 'settings.themeSystem' },
];

export function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const employee = useAuthStore((state) => state.employee);
  const setEmployee = useAuthStore((state) => state.setEmployee);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrorKey, setPasswordErrorKey] = useState<TranslationKey | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [avatarErrorKey, setAvatarErrorKey] = useState<TranslationKey | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrorKey(null);
      setPasswordSuccess(true);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const file = await uploadFile(blob);
      return updateOwnProfile({ avatarId: file.id });
    },
    onSuccess: (updatedEmployee) => {
      setEmployee(updatedEmployee);
      setSelectedImage(null);
      setAvatarErrorKey(null);
    },
  });

  function handleChangePassword() {
    setPasswordErrorKey(null);
    setPasswordSuccess(false);
    changePasswordMutation.reset();
    if (newPassword !== confirmPassword) {
      setPasswordErrorKey('settings.passwordMismatch');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorKey('settings.passwordTooShort');
      return;
    }
    changePasswordMutation.mutate();
  }

  const passwordError = passwordErrorKey
    ? t(passwordErrorKey)
    : changePasswordMutation.isError
      ? localizeApiError(changePasswordMutation.error, t, 'settings.passwordChangeError', {
          401: 'settings.currentPasswordIncorrect',
        })
      : null;
  const avatarError = avatarErrorKey
    ? t(avatarErrorKey)
    : avatarMutation.isError
      ? localizeApiError(avatarMutation.error, t, 'settings.photoError', {
          400: 'settings.photoError',
        })
      : null;

  return (
    <AppShell
      title={t('appShell.navSettings')}
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('appShell.navSettings') },
      ]}
    >
      <div className="flex flex-col gap-6">
        {/* Profile Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('settings.profilePhoto')}
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCardOpen(true)}
              aria-label={t('employeeCard.title')}
              className="rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
            >
              <ProfileAvatar employee={employee} className="h-16 w-16" />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {employee?.firstname} {employee?.lastname}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 text-xs text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {t('settings.changePhoto')}
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label={t('settings.changePhoto')}
            className="hidden"
            onChange={(e) => {
              setAvatarErrorKey(null);
              avatarMutation.reset();
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (typeof event.target?.result === 'string') {
                    setSelectedImage(event.target.result);
                  } else {
                    setAvatarErrorKey('settings.photoReadError');
                  }
                };
                reader.onerror = () => setAvatarErrorKey('settings.photoReadError');
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
          {avatarError ? (
            <p role="alert" className="mt-3 text-xs text-red-500">
              {avatarError}
            </p>
          ) : null}
        </section>

        {/* Password Change Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('settings.changePassword')}
          </h2>
          <div className="flex flex-col gap-3 max-w-sm">
            <div>
              <label
                htmlFor="current-pwd"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {t('settings.currentPassword')}
              </label>
              <PasswordInput
                id="current-pwd"
                value={currentPassword}
                onChange={setCurrentPassword}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="new-pwd"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {t('settings.newPassword')}
              </label>
              <PasswordInput
                id="new-pwd"
                value={newPassword}
                onChange={setNewPassword}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-pwd"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {t('settings.confirmPassword')}
              </label>
              <PasswordInput
                id="confirm-pwd"
                value={confirmPassword}
                onChange={setConfirmPassword}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            {passwordError ? (
              <p role="alert" className="text-xs text-red-500">
                {passwordError}
              </p>
            ) : null}
            {passwordSuccess ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t('settings.passwordUpdated')}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="h-9 rounded-lg bg-emerald-400 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {changePasswordMutation.isPending ? <Spinner /> : null}
                {changePasswordMutation.isPending
                  ? t('settings.saving')
                  : t('settings.submitPassword')}
              </span>
            </button>
          </div>
        </section>

        {/* Language Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('appShell.language')}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:max-w-xl">
            {SUPPORTED_LOCALES.map((code) => {
              const isActive = code === locale;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  aria-pressed={isActive}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-9 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold uppercase ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {code}
                    </span>
                    <span className="font-medium">{LOCALE_LABELS[code]}</span>
                  </span>
                  {isActive ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 flex-shrink-0"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Theme Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('settings.theme')}
          </h2>
          <div className="flex gap-2 max-w-sm">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreference(option.value)}
                aria-pressed={preference === option.value}
                aria-label={t(option.labelKey)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm transition ${
                  preference === option.value
                    ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="hidden sm:inline">{t(option.labelKey)}</span>
              </button>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {t('settings.version', { version: __APP_VERSION__ })}
        </p>
      </div>

      <EmployeeCardModal
        employeeId={cardOpen && employee ? employee.id : null}
        onClose={() => setCardOpen(false)}
      />

      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={t('settings.cropPhoto')}
      >
        {selectedImage ? (
          <ImageCropper
            imageSrc={selectedImage}
            onCancel={() => setSelectedImage(null)}
            onCropped={(blob) => avatarMutation.mutate(blob)}
            pending={avatarMutation.isPending}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}
