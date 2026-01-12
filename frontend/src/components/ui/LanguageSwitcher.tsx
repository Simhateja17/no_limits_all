'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      // Set cookie for locale
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      // Reload to apply new locale
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center" style={{ gap: '4px' }}>
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className="transition-all"
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: 'none',
          background: locale === 'en' ? '#003450' : 'transparent',
          color: locale === 'en' ? '#FFFFFF' : '#6B7280',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('de')}
        disabled={isPending}
        className="transition-all"
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: 'none',
          background: locale === 'de' ? '#003450' : 'transparent',
          color: locale === 'de' ? '#FFFFFF' : '#6B7280',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        DE
      </button>
    </div>
  );
}
